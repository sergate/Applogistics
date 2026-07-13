'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Column {
  key: string
  label: string
  render?: (val: any, row: any) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  activeRow?: string
  activeKey?: string
  emptyMessage?: string
}

export function DataTable({ columns, data, onRowClick, activeRow, activeKey, emptyMessage }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...(data ?? [])].sort((a: any, b: any) => {
    if (!sortKey) return 0
    const va = a?.[sortKey] ?? 0
    const vb = b?.[sortKey] ?? 0
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va))
  })

  if ((data?.length ?? 0) === 0) {
    return <p className="text-center text-muted-foreground py-8">{emptyMessage ?? 'No hay datos disponibles'}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {(columns ?? []).map((col: Column) => (
              <th
                key={col?.key}
                className={`px-4 py-3 font-semibold text-muted-foreground text-${col?.align ?? 'left'} ${col?.sortable !== false ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
                onClick={() => col?.sortable !== false && handleSort(col?.key)}
              >
                <div className={`flex items-center gap-1 ${col?.align === 'right' ? 'justify-end' : ''}`}>
                  {col?.label ?? ''}
                  {sortKey === col?.key && (
                    sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row: any, i: number) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border/50 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-accent/50' : ''
              } ${activeKey && activeRow && row?.[activeKey] === activeRow ? 'bg-primary/10' : ''}`}
            >
              {(columns ?? []).map((col: Column) => (
                <td key={col?.key} className={`px-4 py-3 text-${col?.align ?? 'left'}`}>
                  {col?.render ? col.render(row?.[col?.key], row) : (row?.[col?.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
