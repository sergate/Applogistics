'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getCanalColor } from '@/lib/constants'
import { Users } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { PedidosPanel } from './pedidos-panel'

interface CanalData {
  canal: string
  unidades: number
  pickeadas: number
  separadas: number
  pendientePicking: number
  pendienteSeparacion: number
  eficienciaPicking: number
  eficienciaSeparacion: number
  pedidos: number
}

export function CanalPanel({ seller }: { seller: string }) {
  const [canales, setCanales] = useState<CanalData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setSelectedCanal(null)
    fetch(`/api/dashboard/marca-canales?seller=${encodeURIComponent(seller)}`)
      .then((r: any) => r?.json?.())
      .then((data: any) => setCanales(data?.canales ?? []))
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [seller])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  const pieData = (canales ?? []).map((c: any) => ({
    name: c?.canal ?? 'SIN CANAL',
    value: c?.unidades ?? 0,
  }))

  const COLORS = ['#60B5FF', '#FF9149', '#FF90BB', '#2DA882', '#A19AD3', '#94a3b8']

  const columns = [
    {
      key: 'canal',
      label: 'Canal',
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCanalColor(val) }} />
          <span className="font-semibold">{val ?? 'SIN CANAL'}</span>
        </div>
      ),
    },
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pendientePicking', label: 'Pend. Pick.', align: 'right' as const, render: (v: any) => <span className="text-amber-600">{formatNumber(v)}</span> },
    { key: 'pendienteSeparacion', label: 'Pend. Sep.', align: 'right' as const, render: (v: any) => <span className="text-red-500">{formatNumber(v)}</span> },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users size={20} className="text-primary" />
            Canales de <span className="text-primary">{seller ?? ''}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Haz click en un canal para ver el detalle de pedidos</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100)?.toFixed?.(0) ?? 0}%`}
                      labelLine={false}
                    >
                      {(pieData ?? []).map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="md:col-span-2">
              <DataTable
                columns={columns}
                data={canales}
                onRowClick={(row: any) => setSelectedCanal(row?.canal === selectedCanal ? null : row?.canal)}
                activeRow={selectedCanal ?? undefined}
                activeKey="canal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos panel - third level drill-down */}
      {selectedCanal && (
        <PedidosPanel seller={seller} canal={selectedCanal} />
      )}
    </div>
  )
}
