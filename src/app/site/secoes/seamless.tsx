import Image from 'next/image'
import { ImageIcon, Video, Box, Music, Globe, Sparkles } from 'lucide-react'

const features = [
  { icon: ImageIcon, label: 'Images' },
  { icon: Video, label: 'Video' },
  { icon: Box, label: '3D Models' },
  { icon: Music, label: 'Audio' },
  { icon: Globe, label: 'Interactive Models' },
  { icon: Sparkles, label: 'AR Models' },
]

export function Seamless() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* iPhone mockup */}
          <div className="flex-1 flex justify-center">
            <div className="bg-[#f5f5f7] rounded-[40px] rounded-b-none pt-4 sm:pt-6 px-8 sm:px-12 pb-0 overflow-hidden h-[500px] sm:h-[580px]">
              <div className="relative w-[340px] sm:w-[400px]">
                <Image
                  src="/images/landing/iphone-dark-vertical.png"
                  alt="Phone"
                  width={450}
                  height={920}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            <p className="text-[#C9A227] font-medium">Seamless</p>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              The best way to<br />experience NFTs.
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              View NFTs in their ideal intended format. Full rich media support no matter the type, from video and audio, to images and interactive.
            </p>

            {/* Features grid */}
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 pt-2">
              {features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5 text-[#C9A227]" />
                  <span className="text-[#C9A227] font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            {/* Demo card */}
            <button className="flex items-center gap-4 mt-6 group">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/landing/iphone-dark-vertical.png"
                  alt="Manage your collectibles"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-900">Manage your collectibles</h5>
                <p className="text-gray-500 text-sm">Watch the demo</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
