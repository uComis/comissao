"use client"

import * as React from "react"
import { format, isToday, isYesterday, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: React.ComponentProps<typeof DayPicker>["disabled"]
}

function getRelativeDateLabel(date: Date): string | null {
  if (isToday(date)) return "hoje"
  if (isYesterday(date)) return "ontem"
  if (isTomorrow(date)) return "amanhã"
  return null
}

function formatDateDisplay(date: Date): string {
  const formattedDate = format(date, "dd MMM yyyy", { locale: ptBR })
  const relativeLabel = getRelativeDateLabel(date)
  
  if (relativeLabel) {
    return `${formattedDate} (${relativeLabel})`
  }
  
  return formattedDate
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-12 w-full justify-start text-left font-medium shadow-sm border-2 hover:bg-background",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            formatDateDisplay(date)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate)
            setOpen(false)
          }}
          locale={ptBR}
          initialFocus
          captionLayout="dropdown"
          fromYear={1900}
          toYear={2100}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
