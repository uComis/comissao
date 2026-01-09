import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { TrialBanner } from '@/components/billing/trial-banner'
import { BillingNotificationProvider } from '@/components/billing/billing-notification-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AiChatButton } from '@/components/ai-assistant'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <BillingNotificationProvider>
            <TrialBanner />
            <Header />
            <main className="flex-1 p-6 pb-32 md:pb-6">
              <div className="max-w-[1500px] mx-auto">{children}</div>
            </main>
          </BillingNotificationProvider>
        </SidebarInset>
      </SidebarProvider>
      <BottomNav />
      <AiChatButton />
    </>
  )
}
