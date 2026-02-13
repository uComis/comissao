'use client'

import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from './ai-chat-context'

export function AiChatButton() {
  const { isOpen, toggle } = useAiChat()

  return (
    <div className="fixed bottom-20 right-6 z-50 md:bottom-8 md:right-8">
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110"
        onClick={toggle}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
