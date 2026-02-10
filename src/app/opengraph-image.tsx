import { ImageResponse } from 'next/og'

export const alt = 'uComis — Controle de Comissões para Vendedores'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6321ff 0%, #209efe 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              fontWeight: 800,
              color: 'white',
            }}
          >
            u
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            uComis
          </div>
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
          }}
        >
          Controle de Comissões para Vendedores
        </div>
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '16px',
            textAlign: 'center',
          }}
        >
          Saiba exatamente quanto e quando vai receber
        </div>
      </div>
    ),
    { ...size }
  )
}
