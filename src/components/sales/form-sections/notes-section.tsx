import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type NotesSectionProps = {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
  const [open, setOpen] = useState(!!notes)

  return (
    <div>
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        !open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            + Observação
          </button>
        </div>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Anotações sobre a venda..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
