'use client'

import { useEffect, useState } from 'react'
import { Package, CheckCircle2, Clock, TrendingUp, BarChart3, AlertTriangle, Layers } from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent, getBrandColor } from '@/lib/constants'
import { MarcaBarChart } from './marca-bar-chart'
import { CanalPanel } from './canal-panel'

interface KpiData {
  totalUnidades: number
  totalPickeadas: number
  totalSeparadas: number
  pendientePicking: number
  pendienteSeparacion: number
  eficienciaPicking: number
  eficienciaSeparacion: number
  totalRegistros: number
}

interface MarcaData {
  seller: string
  unidades: number
  pickeadas: number
  separadas: number
  pendientePicking: number
  pendienteSeparacion: number
  eficienciaPicking: number
  eficienciaSeparacion: number
  pedidos: number
}

export function ResumenDashboard() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [marcas, setMarcas] = useState<MarcaData[]>([])
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/resumen')
      .then((r: any) => r?.json?.())
      .then((data: any) => {
        setKpis(data?.kpis ?? null)
        setMarcas(data?.marcas ?? [])
      })
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!kpis) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-lg font-semibold">Sin datos disponibles</h3>
          <p className="text-muted-foreground mt-2">Importa los archivos para comenzar el análisis.</p>
        </CardContent>
      </Card>
    )
  }

  const kpiCards = [
    { title: 'Total Unidades', value: kpis?.totalUnidades ?? 0, icon: Package, color: '#60B5FF' },
    { title: 'Unidades Pickeadas', value: kpis?.totalPickeadas ?? 0, icon: CheckCircle2, color: '#2DA882' },
    { title: 'Unidades Separadas', value: kpis?.totalSeparadas ?? 0, icon: Layers, color: '#A19AD3' },
    { title: 'Pendiente Picking', value: kpis?.pendientePicking ?? 0, icon: Clock, color: '#FF9149' },
    { title: 'Pendiente Separación', value: kpis?.pendienteSeparacion ?? 0, icon: AlertTriangle, color: '#FF6363' },
    { title: 'Efic. Picking', value: kpis?.eficienciaPicking ?? 0, icon: TrendingUp, color: '#2DA882', isPercent: true },
    { title: 'Efic. Separación', value: kpis?.eficienciaSeparacion ?? 0, icon: BarChart3, color: '#A19AD3', isPercent: true },
    { title: 'Total Registros', value: kpis?.totalRegistros ?? 0, icon: Package, color: '#60B5FF' },
  ]

  const columns = [
    {
      key: 'seller',
      label: 'Marca',
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBrandColor(val) }} />
          <span className="font-semibold">{val ?? ''}</span>
        </div>
      ),
    },
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pendientePicking', label: 'Pend. Picking', align: 'right' as const, render: (v: any) => <span className="text-amber-600 font-medium">{formatNumber(v)}</span> },
    { key: 'pendienteSeparacion', label: 'Pend. Sep.', align: 'right' as const, render: (v: any) => <span className="text-red-500 font-medium">{formatNumber(v)}</span> },
    { key: 'eficienciaPicking', label: 'Efic. Pick.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'eficienciaSeparacion', label: 'Efic. Sep.', align: 'right' as const, render: (v: any) => formatPercent(v) },
    { key: 'pedidos', label: 'Registros', align: 'right' as const, render: (v: any) => formatNumber(v) },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k: any, i: number) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Comparativa por Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarcaBarChart data={marcas} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Marca</CardTitle>
          <p className="text-sm text-muted-foreground">Haz click en una marca para ver el desglose por canal</p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={marcas}
            onRowClick={(row: any) => setSelectedMarca(row?.seller === selectedMarca ? null : row?.seller)}
            activeRow={selectedMarca ?? undefined}
            activeKey="seller"
          />
        </CardContent>
      </Card>

      {/* Canal panel */}
      {selectedMarca && (
        <CanalPanel seller={selectedMarca} />
      )}
    </div>
  )
}
