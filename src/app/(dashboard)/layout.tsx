import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AiChatProvider } from '@/components/ai-assistant'
import BillingBanners from '@/components/billing/billing-banners'
import { BillingNotificationProvider } from '@/components/billing/billing-notification-provider'
import { CurrentUserProvider } from '@/contexts/current-user-context'
import { getCurrentUser } from '@/app/actions/user'
import { PageHeaderProvider, LayoutPageHeader } from '@/components/layout'
import { RoutePageHeader } from './route-page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { cookies } from 'next/headers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Task 3: Chamada única no servidor
  const currentUser = await getCurrentUser()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <CurrentUserProvider initialData={currentUser}>
      <AiChatProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <PageHeaderProvider>
              <RoutePageHeader />
              <BillingNotificationProvider>
                {/* Mobile: unified header (logo on home, title on internal pages) */}
                <div className="sticky top-0 z-30 w-full bg-background md:hidden">
                  <BillingBanners />
                  <Header />
                </div>
                {/* Desktop: billing banners + page header (trigger inside) */}
                <div className="sticky top-0 z-30 w-full bg-background hidden md:block">
                  <BillingBanners />
                  <LayoutPageHeader />
                </div>
              </BillingNotificationProvider>
              <main className="flex-1 pb-32 md:pb-6">
                <div className="max-w-[1500px] mx-auto px-6 pt-6">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </div>
              </main>
              <BottomNav />
            </PageHeaderProvider>
          </SidebarInset>
        </SidebarProvider>
      </AiChatProvider>
    </CurrentUserProvider>
  )
}
