'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getBrandColor, BRAND_COLORS } from '@/lib/constants'
import { Calendar, Package } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts'

export function PorFechaDashboard() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/por-fecha')
      .then((r: any) => r?.json?.())
      .then((d: any) => setData(d?.data ?? []))
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if ((data?.length ?? 0) === 0) {
    return <Card><CardContent className="p-12 text-center"><Package className="mx-auto text-muted-foreground mb-4" size={48} /><h3 className="text-lg font-semibold">Sin datos</h3></CardContent></Card>
  }

  // Aggregate by fecha
  const fechaMap = new Map<string, any>()
  for (const row of data ?? []) {
    const fecha = row?.fecha ?? 'N/A'
    if (!fechaMap.has(fecha)) {
      fechaMap.set(fecha, { fecha, unidades: 0, pickeadas: 0, separadas: 0, pedidos: 0 })
    }
    const entry = fechaMap.get(fecha)!
    entry.unidades += row?.unidades ?? 0
    entry.pickeadas += row?.pickeadas ?? 0
    entry.separadas += row?.separadas ?? 0
    entry.pedidos += row?.pedidos ?? 0
  }
  const fechaData = Array.from(fechaMap.values()).sort((a: any, b: any) => (a?.fecha ?? '').localeCompare(b?.fecha ?? ''))

  // By fecha + seller for stacked chart
  const sellers = [...new Set((data ?? []).map((d: any) => d?.seller ?? ''))]
  const stackedData = fechaData.map((fd: any) => {
    const obj: any = { fecha: fd?.fecha }
    for (const s of sellers) {
      const match = (data ?? []).filter((d: any) => d?.fecha === fd?.fecha && d?.seller === s)
      obj[s] = match.reduce((sum: number, m: any) => sum + (m?.unidades ?? 0), 0)
    }
    return obj
  })

  const columns = [
    { key: 'fecha', label: 'Fecha', render: (v: any) => <span className="font-mono text-sm">{v ?? ''}</span> },
    { key: 'seller', label: 'Marca', render: (v: any) => (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBrandColor(v) }} />
        <span className="font-semibold">{v ?? ''}</span>
      </div>
    )},
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
  ]

  return (
    <div className="space-y-6">
      {/* Line chart - totals by date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar size={20} className="text-primary" />
            Tendencia de Unidades por Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fechaData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="fecha" tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="unidades" stroke="#60B5FF" name="Unidades" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pickeadas" stroke="#2DA882" name="Pickeadas" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="separadas" stroke="#A19AD3" name="Separadas" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stacked bar by seller */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unidades por Marca y Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="fecha" tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                {sellers.map((s: string) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={getBrandColor(s)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  )
}
