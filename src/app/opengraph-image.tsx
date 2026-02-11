import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const alt = 'uComis — Controle de Comissões para Vendedores'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const svgContent = readFileSync(
    join(process.cwd(), 'src/app/icon.svg'),
    'utf-8'
  )
  const svgBase64 = Buffer.from(svgContent).toString('base64')
  const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svgDataUri}
            width={72}
            height={72}
            alt=""
          />
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
