import net from 'net';

const NEXT_PORT = 4001;
const GATEWAY_PORT = 4000;

const server = net.createServer((socket) => {
  socket.once('data', (buffer) => {
    // TLS handshake always starts with 0x16
    if (buffer[0] === 0x16) {
      // HTTPS → proxy to Next.js
      const proxy = net.connect(NEXT_PORT, () => {
        proxy.write(buffer);
        socket.pipe(proxy).pipe(socket);
      });
      proxy.on('error', () => socket.destroy());
      socket.on('error', () => proxy.destroy());
    } else {
      // HTTP → redirect to https://localhost:4000
      const data = buffer.toString();
      const match = data.match(/^[A-Z]+ (.+?) HTTP/);
      const path = match ? match[1] : '/';

      socket.end(
        `HTTP/1.1 301 Moved Permanently\r\nLocation: https://localhost:${GATEWAY_PORT}${path}\r\nConnection: close\r\n\r\n`
      );
    }
  });
});

server.listen(GATEWAY_PORT, () => {
  console.log(`\x1b[36m→ Gateway :${GATEWAY_PORT} ativo (HTTP redireciona, HTTPS faz proxy pro Next.js)\x1b[0m`);
});
