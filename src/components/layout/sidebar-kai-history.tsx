'use client'

import { useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ChevronDown, MessageSquare, MessageSquarePlus, Sparkles } from 'lucide-react'
import { useAiChat } from '@/components/ai-assistant/ai-chat-context'

export function SidebarKaiHistory() {
  const {
    conversations,
    conversationId,
    loadConversation,
    startNewConversation,
    refreshConversations,
    toggle,
    isOpen,
  } = useAiChat()

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  function handleNewConversation() {
    startNewConversation()
    if (!isOpen) toggle()
  }

  return (
    <Collapsible defaultOpen>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild className="h-8 mb-1 text-[9px]">
          <CollapsibleTrigger className="flex items-center gap-1 cursor-pointer">
            <Sparkles className="h-3 w-3" />
            Kai
            <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNewConversation}
                  className="text-xs border border-dashed border-sidebar-border justify-center text-muted-foreground"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
                  <span>Nova conversa</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {conversations.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    onClick={() => loadConversation(conv.id)}
                    className="text-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
