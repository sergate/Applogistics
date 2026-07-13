'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { formatNumber, formatPercent } from '@/lib/constants'
import { FileText, ChevronRight, Search, X } from 'lucide-react'

interface ClienteData {
  nombreCliente: string
  codigoTienda: string
  unidades: number
  pickeadas: number
  separadas: number
  pendientePicking: number
  pendienteSeparacion: number
  eficienciaPicking: number
  eficienciaSeparacion: number
  pedidos: number
}

export function PedidosPanel({ seller, canal }: { seller: string; canal: string }) {
  const [clientes, setClientes] = useState<ClienteData[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setLoading(true)
    setBusqueda('')
    fetch(`/api/dashboard/canal-pedidos?seller=${encodeURIComponent(seller)}&canal=${encodeURIComponent(canal)}`)
      .then((r: any) => r?.json?.())
      .then((data: any) => setClientes(data?.pedidos ?? []))
      .catch((e: any) => console.error(e))
      .finally(() => setLoading(false))
  }, [seller, canal])

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes
    const term = busqueda.toLowerCase().trim()
    return (clientes ?? []).filter((c: ClienteData) => {
      const nombre = (c?.nombreCliente ?? '').toLowerCase()
      const codigo = (c?.codigoTienda ?? '').toLowerCase()
      return nombre.includes(term) || codigo.includes(term)
    })
  }, [clientes, busqueda])

  if (loading) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  // Calculate totals from filtered results
  const totales = (clientesFiltrados ?? []).reduce(
    (acc: any, p: ClienteData) => ({
      unidades: (acc?.unidades ?? 0) + (p?.unidades ?? 0),
      pickeadas: (acc?.pickeadas ?? 0) + (p?.pickeadas ?? 0),
      separadas: (acc?.separadas ?? 0) + (p?.separadas ?? 0),
      pendientePicking: (acc?.pendientePicking ?? 0) + (p?.pendientePicking ?? 0),
      pendienteSeparacion: (acc?.pendienteSeparacion ?? 0) + (p?.pendienteSeparacion ?? 0),
    }),
    { unidades: 0, pickeadas: 0, separadas: 0, pendientePicking: 0, pendienteSeparacion: 0 }
  )

  const columns = [
    {
      key: 'codigoTienda',
      label: 'Código',
      render: (val: any) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{val ?? '-'}</span>
      ),
    },
    {
      key: 'nombreCliente',
      label: 'Cliente',
      render: (val: any) => (
        <span className="font-semibold text-sm">{val ?? 'SIN NOMBRE'}</span>
      ),
    },
    { key: 'pedidos', label: 'Líneas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'unidades', label: 'Unidades', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'pickeadas', label: 'Pickeadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'separadas', label: 'Separadas', align: 'right' as const, render: (v: any) => formatNumber(v) },
    {
      key: 'pendientePicking',
      label: 'Pend. Pick.',
      align: 'right' as const,
      render: (v: any) => (
        <span className={`font-medium ${(v ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
          {formatNumber(v)}
        </span>
      ),
    },
    {
      key: 'pendienteSeparacion',
      label: 'Pend. Sep.',
      align: 'right' as const,
      render: (v: any) => (
        <span className={`font-medium ${(v ?? 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
          {formatNumber(v)}
        </span>
      ),
    },
    {
      key: 'eficienciaPicking',
      label: 'Efic. Pick.',
      align: 'right' as const,
      render: (v: any) => formatPercent(v),
    },
    {
      key: 'eficienciaSeparacion',
      label: 'Efic. Sep.',
      align: 'right' as const,
      render: (v: any) => formatPercent(v),
    },
  ]

  return (
    <Card className="border-amber-500/30 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText size={20} className="text-amber-500" />
            Clientes de <span className="text-primary">{seller}</span>
            <ChevronRight size={16} className="text-muted-foreground" />
            <span className="text-amber-500">{canal}</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({clientesFiltrados?.length ?? 0} de {clientes?.length ?? 0} clientes)
            </span>
          </CardTitle>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Unidades</p>
            <p className="text-lg font-bold text-blue-600">{formatNumber(totales?.unidades ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Pickeadas</p>
            <p className="text-lg font-bold text-green-600">{formatNumber(totales?.pickeadas ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Separadas</p>
            <p className="text-lg font-bold text-purple-600">{formatNumber(totales?.separadas ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Pend. Picking</p>
            <p className="text-lg font-bold text-amber-600">{formatNumber(totales?.pendientePicking ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Pend. Separación</p>
            <p className="text-lg font-bold text-red-500">{formatNumber(totales?.pendienteSeparacion ?? 0)}</p>
          </div>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={clientesFiltrados} emptyMessage={busqueda ? `No se encontraron clientes con "${busqueda}"` : 'No hay clientes para este canal'} />
      </CardContent>
    </Card>
  )
}
