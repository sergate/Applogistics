import { PorCanalDashboard } from './_components/por-canal-dashboard'

export default function PorCanalPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Análisis por Canal</h1>
        <p className="text-muted-foreground mt-1">Rendimiento por tipo de cliente</p>
      </div>
      <PorCanalDashboard />
    </div>
  )
}
