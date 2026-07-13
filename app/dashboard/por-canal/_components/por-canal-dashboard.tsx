'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getCanalColor, getBrandColor } from '@/lib/constants'
import { Users, Package } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

export function PorCanalDashboard() {
  const [resumen, setResumen] = useState<any[]>([])
  const [detalle, setDetalle] = useState<any[]>([])
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/por-canal')
      .then((r: any) => r?.json?.())
      .then((d: any) => {
        setResumen(d?.resumen ?? [])
        setDetalle(d?.detalle ?? [])
      })
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if ((resumen?.length ?? 0) === 0) {
    return <Card><CardContent className="p-12 text-center"><Package className="mx-auto text-muted-foreground mb-4" size={48} /><h3 className="text-lg font-semibold">Sin datos</h3></CardContent></Card>
  }

  const pieData = (resumen ?? []).map((c: any) => ({
    name: c?.canal ?? 'SIN CANAL',
    value: c?.unidades ?? 0,
  }))
  const pieColors = ['#60B5FF', '#FF9149', '#FF90BB', '#2DA882', '#A19AD3', '#94a3b8']

  const barData = (resumen ?? []).map((c: any) => ({
    name: c?.canal ?? 'SIN CANAL',
    Unidades: c?.unidades ?? 0,
    Pickeadas: c?.pickeadas ?? 0,
    Separadas: c?.separadas ?? 0,
  }))

  const canalDetalle = selectedCanal
    ? (detalle ?? []).filter((d: any) => d?.canal === selectedCanal)
    : []

  const columns = [
    { key: 'canal', label: 'Canal', render: (v: any) => (
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCanalColor(v) }} /><span className="font-semibold">{v ?? 'SIN CANAL'}</span></div>
    )},
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pendientePicking', label: 'Pend. Pick.', align: 'right' as const, render: (v: any) => <span className="text-amber-600">{formatNumber(v)}</span> },
    { key: 'pendienteSeparacion', label: 'Pend. Sep.', align: 'right' as const, render: (v: any) => <span className="text-red-500">{formatNumber(v)}</span> },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
  ]

  const detalleColumns = [
    { key: 'seller', label: 'Marca', render: (v: any) => (
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBrandColor(v) }} /><span className="font-semibold">{v ?? ''}</span></div>
    )},
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users size={20} className="text-primary" />
              Distribución por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value"
                    label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100)?.toFixed?.(0) ?? 0}%`}
                    labelLine={false}
                  >
                    {(pieData ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparativa por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Unidades" fill="#60B5FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pickeadas" fill="#2DA882" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Separadas" fill="#A19AD3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canal table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Canal</CardTitle>
          <p className="text-sm text-muted-foreground">Haz click para ver las marcas de cada canal</p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={resumen}
            onRowClick={(row: any) => setSelectedCanal(row?.canal === selectedCanal ? null : row?.canal)}
            activeRow={selectedCanal ?? undefined}
            activeKey="canal"
          />
        </CardContent>
      </Card>

      {selectedCanal && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Marcas en canal <span className="text-primary">{selectedCanal}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={detalleColumns} data={canalDetalle} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
