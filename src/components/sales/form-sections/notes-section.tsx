import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type NotesSectionProps = {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
  return (
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
  )
}
