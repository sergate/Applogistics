'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getBrandColor } from '@/lib/constants'
import { Layers, Package } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

const CAT_COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#2DA882', '#A19AD3', '#72BF78', '#94a3b8', '#f59e0b', '#6366f1', '#ec4899']

export function PorCategoriaDashboard() {
  const [resumen, setResumen] = useState<any[]>([])
  const [detalle, setDetalle] = useState<any[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/por-categoria')
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

  const top10 = (resumen ?? []).slice(0, 10)
  const barData = top10.map((c: any) => ({
    name: c?.grupo ?? 'N/A',
    Unidades: c?.unidades ?? 0,
    Pickeadas: c?.pickeadas ?? 0,
    Separadas: c?.separadas ?? 0,
  }))

  const grupoDetalle = selectedGrupo
    ? (detalle ?? []).filter((d: any) => d?.grupo === selectedGrupo)
    : []

  const columns = [
    { key: 'grupo', label: 'Categoría', render: (v: any) => <span className="font-semibold">{v ?? ''}</span> },
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pendientePicking', label: 'Pend. Pick.', align: 'right' as const, render: (v: any) => <span className="text-amber-600">{formatNumber(v)}</span> },
    { key: 'pendienteSeparacion', label: 'Pend. Sep.', align: 'right' as const, render: (v: any) => <span className="text-red-500">{formatNumber(v)}</span> },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'pedidos', label: 'Registros', align: 'right' as const, render: (v: any) => formatNumber(v) },
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
      {/* Top 10 categories chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers size={20} className="text-primary" />
            Top 10 Categorías por Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
                <XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tickLine={false} tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Unidades" fill="#60B5FF" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Pickeadas" fill="#2DA882" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Separadas" fill="#A19AD3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todas las Categorías</CardTitle>
          <p className="text-sm text-muted-foreground">Haz click para ver las marcas de cada categoría</p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={resumen}
            onRowClick={(row: any) => setSelectedGrupo(row?.grupo === selectedGrupo ? null : row?.grupo)}
            activeRow={selectedGrupo ?? undefined}
            activeKey="grupo"
          />
        </CardContent>
      </Card>

      {selectedGrupo && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Marcas en <span className="text-primary">{selectedGrupo}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={detalleColumns} data={grupoDetalle} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
