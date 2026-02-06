import { PhoneMockup } from '@/components/ui/phone-mockup'

const images = [
  '/images/landing/mobile-1.png',
  '/images/landing/mobile-2.png',
]

export default function TesteMockup() {
  return (
    <div className="min-h-screen bg-neutral-100 p-10 space-y-20">
      <h1 className="text-2xl font-bold text-center">Teste PhoneMockup</h1>

      <div className="flex items-start justify-center gap-16 flex-wrap">
        {/* Light mode (padrão) */}
        <div className="text-center space-y-4">
          <p className="font-medium">light (padrão)</p>
          <PhoneMockup images={images} interval={3} className="w-[280px]" />
        </div>

        {/* Dark mode com cor de fundo */}
        <div className="text-center space-y-4">
          <p className="font-medium">dark + statusBarColor</p>
          <PhoneMockup
            images={images}
            interval={3}
            statusBarMode="dark"
            statusBarColor="#1a1a2e"
            className="w-[280px]"
          />
        </div>

        {/* 75% top, dark */}
        <div className="text-center space-y-4">
          <p className="font-medium">75% top, dark</p>
          <PhoneMockup
            images={images}
            interval={3}
            visiblePercent={75}
            anchor="top"
            statusBarMode="dark"
            statusBarColor="#1a1a2e"
            className="w-[280px]"
          />
        </div>

        {/* 55% bottom */}
        <div className="text-center space-y-4">
          <p className="font-medium">55% bottom</p>
          <PhoneMockup
            images={images}
            interval={3}
            visiblePercent={55}
            anchor="bottom"
            className="w-[280px]"
          />
        </div>
      </div>
    </div>
  )
}
