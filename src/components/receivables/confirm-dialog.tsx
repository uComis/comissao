'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedTotal: number
  receivedAtDate: string
  onDateChange: (date: string) => void
  onConfirm: () => void
  loading: boolean
  formatCurrency: (value: number) => string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedTotal,
  receivedAtDate,
  onDateChange,
  onConfirm,
  loading,
  formatCurrency,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            Confirme a data em que {selectedCount === 1 ? 'esta parcela foi paga' : `estas ${selectedCount} parcelas foram pagas`}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="receive_date">Data do Recebimento</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="receive_date"
                type="date"
                className="pl-9"
                value={receivedAtDate}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas</span>
              <span className="font-medium">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border/50 pt-2">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-bold">{formatCurrency(selectedTotal)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Processando...' : 'Dar Baixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
