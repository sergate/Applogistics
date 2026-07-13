'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getBrandColor, BRAND_COLORS, ESTADO_COLORS } from '@/lib/constants'
import { Tag, Package } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

export function PorMarcaDashboard() {
  const [marcas, setMarcas] = useState<any[]>([])
  const [detalle, setDetalle] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/por-marca')
      .then((r: any) => r?.json?.())
      .then((d: any) => {
        setMarcas(d?.marcas ?? [])
        setDetalle(d?.detalle ?? [])
        setEstados(d?.estados ?? [])
      })
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  if ((marcas?.length ?? 0) === 0) {
    return <Card><CardContent className="p-12 text-center"><Package className="mx-auto text-muted-foreground mb-4" size={48} /><h3 className="text-lg font-semibold">Sin datos</h3></CardContent></Card>
  }

  // Efficiency comparison chart
  const efData = (marcas ?? []).map((m: any) => ({
    name: m?.seller ?? 'N/A',
    'Efic. Picking': m?.eficienciaPicking ?? 0,
    'Efic. Separación': m?.eficienciaSeparacion ?? 0,
  }))

  // Estado pie for selected seller
  const sellerEstados = (estados ?? []).filter((e: any) => e?.seller === selectedSeller)
  const pieColors = ['#FF9149', '#60B5FF', '#2DA882', '#FF90BB', '#A19AD3']

  const sellerDetalle = selectedSeller
    ? (detalle ?? []).filter((d: any) => d?.seller === selectedSeller)
    : []

  const marcaColumns = [
    { key: 'seller', label: 'Marca', render: (v: any) => (
      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBrandColor(v) }} /><span className="font-semibold">{v ?? ''}</span></div>
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
    { key: 'grupo', label: 'Categoría' },
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
  ]

  return (
    <div className="space-y-6">
      {/* Efficiency chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag size={20} className="text-primary" />
            Eficiencia por Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Efic. Picking" fill="#2DA882" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Efic. Separación" fill="#A19AD3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Marca table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Marca</CardTitle>
          <p className="text-sm text-muted-foreground">Haz click para ver categorías y estados</p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={marcaColumns}
            data={marcas}
            onRowClick={(row: any) => setSelectedSeller(row?.seller === selectedSeller ? null : row?.seller)}
            activeRow={selectedSeller ?? undefined}
            activeKey="seller"
          />
        </CardContent>
      </Card>

      {/* Selected seller details */}
      {selectedSeller && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Categorías de {selectedSeller}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={detalleColumns} data={sellerDetalle} />
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Estados de {selectedSeller}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(sellerEstados ?? []).map((e: any) => ({ name: e?.estado ?? '', value: e?.unidades ?? 0 }))}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={90} paddingAngle={3} dataKey="value"
                    >
                      {(sellerEstados ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
