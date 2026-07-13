import { PorFechaDashboard } from './_components/por-fecha-dashboard'

export default function PorFechaPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Análisis por Fecha</h1>
        <p className="text-muted-foreground mt-1">Tendencias temporales de pedidos y eficiencia</p>
      </div>
      <PorFechaDashboard />
    </div>
  )
}
