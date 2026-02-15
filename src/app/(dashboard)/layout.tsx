import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AiChatProvider } from '@/components/ai-assistant'
import { KaiPanel } from '@/components/ai-assistant/kai-panel'
import { KaiContentPush } from '@/components/ai-assistant/kai-content-push'
import { KaiPanelOffset } from '@/components/ai-assistant/kai-panel-offset'
import BillingBanners from '@/components/billing/billing-banners'
import { BillingNotificationProvider } from '@/components/billing/billing-notification-provider'
import { CurrentUserProvider } from '@/contexts/current-user-context'
import { getCurrentUser } from '@/app/actions/user'
import { PageHeaderProvider, LayoutPageHeader } from '@/components/layout'
import { RoutePageHeader } from './route-page-header'
import { PageTransition } from '@/components/layout/page-transition'
import { inter } from '@/lib/fonts'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Task 3: Chamada única no servidor
  const currentUser = await getCurrentUser()

  return (
    <div className={`${inter.variable} h-full`}>
    <CurrentUserProvider initialData={currentUser}>
      <AiChatProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <PageHeaderProvider>
              <RoutePageHeader />
              <BillingNotificationProvider>
                {/* Mobile: unified header (logo on home, title on internal pages) */}
                <div className="sticky top-0 z-30 w-full bg-background md:hidden pointer-events-none">
                  <div className="pointer-events-auto">
                    <BillingBanners />
                    <Header />
                  </div>
                </div>
                {/* Desktop: billing banners + page header — KaiPanelOffset measures
                    height and sets --kai-panel-top so the Kai panel aligns below */}
                <KaiPanelOffset>
                  <BillingBanners />
                  <LayoutPageHeader />
                </KaiPanelOffset>
              </BillingNotificationProvider>
              <KaiContentPush className="flex-1 pb-32 md:pb-6">
                <div className="max-w-[1500px] mx-auto px-6 pt-6">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </div>
              </KaiContentPush>
              <BottomNav />
            </PageHeaderProvider>
          </SidebarInset>
        </SidebarProvider>
        <KaiPanel />
      </AiChatProvider>
    </CurrentUserProvider>
    </div>
  )
}
