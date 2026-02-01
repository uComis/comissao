import { useRef, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type NotesSectionProps = {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
  const [open, setOpen] = useState(!!notes)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1 group"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Observações</h3>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Anotações sobre a venda..."
            rows={3}
            className="rounded-xl focus-visible:ring-0 focus-visible:border-primary/50"
          />
        </div>
      </div>
    </div>
  )
}
