'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RankingDataItem = {
  name: string
  value: number
  fill?: string
}

type RankedRow = {
  key: string
  name: string
  value: number
  fill?: string
  isPlaceholder?: boolean
}

type RankingCardProps = {
  title: string
  value: string | number
  subtitle?: string
  data: RankingDataItem[]
  topN?: number
  othersLabel?: string
}

function clampPercent(n: number) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export function RankingCard({
  title,
  value,
  subtitle,
  data,
  topN = 5,
  othersLabel = 'Outros',
}: RankingCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const normalize = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const isOthers = (name: string) => normalize(name).startsWith('outro')

  const othersCandidates = data.filter((d) => isOthers(d.name))
  const rankingCandidates = data.filter((d) => !isOthers(d.name))

  const sortedCandidates = [...rankingCandidates].sort((a, b) => b.value - a.value)
  const topItems = sortedCandidates.slice(0, topN)

  const remainderSum =
    sortedCandidates.slice(topN).reduce((sum, item) => sum + item.value, 0) +
    othersCandidates.reduce((sum, item) => sum + item.value, 0)

  const othersFill = othersCandidates[0]?.fill ?? '#94a3b8'
  const placeholderFill = '#cbd5e1'
  const rows: RankedRow[] = topItems.map((item, idx) => ({
    key: `${item.name}-${idx}`,
    name: item.name,
    value: item.value,
    fill: item.fill,
  }))

  while (rows.length < topN) {
    rows.push({
      key: `__placeholder_${rows.length}`,
      name: '—',
      value: 0,
      fill: placeholderFill,
      isPlaceholder: true,
    })
  }

  rows.push({
    key: '__others__',
    name: othersLabel,
    value: remainderSum,
    fill: othersFill,
  })

  return (
    <Card className="border-none shadow-sm h-full overflow-hidden flex flex-col py-3 md:py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 md:pb-2 px-3 md:px-6">
        <div className="min-w-0">
          <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {subtitle ? (
            <div className="text-[10px] md:text-xs text-muted-foreground/80 mt-1 truncate">
              {subtitle}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="px-3 md:px-6 flex-1 flex flex-col pt-0 md:pt-0">
        <div className="text-[2rem] md:text-4xl font-bold truncate leading-none md:leading-tight">
          {value}
        </div>

        <div className="mt-4 flex-1 flex flex-col gap-2.5">
          {rows.map((item, idx) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0
            const pctRounded = Math.round(pct)
            const barW = clampPercent(pct)

            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-6 text-[10px] text-muted-foreground font-medium tabular-nums">
                  {idx + 1}.
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill ?? '#94a3b8' }}
                      />
                      <div
                        className={[
                          'text-xs font-medium truncate',
                          item.isPlaceholder ? 'text-muted-foreground' : '',
                        ].join(' ')}
                      >
                        {item.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-xs font-bold tabular-nums">{pctRounded}%</div>
                    </div>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barW}%`,
                        backgroundColor: item.fill ?? '#94a3b8',
                      }}
                      aria-label={`${item.name}: ${pctRounded}%`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


