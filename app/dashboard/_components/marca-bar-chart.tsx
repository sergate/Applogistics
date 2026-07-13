'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { getBrandColor } from '@/lib/constants'

interface MarcaData {
  seller: string
  unidades: number
  pickeadas: number
  separadas: number
}

export function MarcaBarChart({ data }: { data: MarcaData[] }) {
  if ((data?.length ?? 0) === 0) return <p className="text-center text-muted-foreground py-8">Sin datos</p>

  const chartData = (data ?? []).map((d: any) => ({
    name: d?.seller ?? 'N/A',
    Unidades: d?.unidades ?? 0,
    Pickeadas: d?.pickeadas ?? 0,
    Separadas: d?.separadas ?? 0,
    fill: getBrandColor(d?.seller ?? ''),
  }))

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis tickLine={false} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Unidades" fill="#60B5FF" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pickeadas" fill="#2DA882" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Separadas" fill="#A19AD3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
