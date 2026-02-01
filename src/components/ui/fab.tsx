'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type FabProps = {
  label?: string
} & (
  | { onClick: () => void; href?: never }
  | { href: string; onClick?: never }
)

const fabClass = cn(
  'fixed z-30 md:hidden',
  'right-5 bottom-20',
  'flex h-14 w-14 items-center justify-center rounded-full',
  'bg-[#409eff] text-white shadow-lg shadow-[#409eff]/30',
  'active:scale-90 transition-transform',
  'animate-in zoom-in-50 duration-200'
)

export function Fab({ onClick, href, label = 'Adicionar' }: FabProps) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={fabClass}>
        <Plus className="h-6 w-6" />
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={fabClass}>
      <Plus className="h-6 w-6" />
    </button>
  )
}
