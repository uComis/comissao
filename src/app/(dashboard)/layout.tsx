import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AiChatButton } from '@/components/ai-assistant'
import BillingBanners from '@/components/billing/billing-banners'
import { CurrentUserProvider } from '@/contexts/current-user-context'
import { getCurrentUser } from '@/app/actions/user'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Task 3: Chamada única no servidor
  const currentUser = await getCurrentUser()

  return (
    <CurrentUserProvider initialData={currentUser}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <div className="sticky top-0 z-30 w-full bg-background">
            <BillingBanners />
            <Header />
          </div>
          <main className="flex-1 p-6 pb-32 md:pb-6">
            <div className="max-w-[1500px] mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <BottomNav />
      <AiChatButton />
    </CurrentUserProvider>
  )
}
