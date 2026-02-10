import { inter } from '@/lib/fonts'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>
}
