import { PorMarcaDashboard } from './_components/por-marca-dashboard'

export default function PorMarcaPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Análisis por Marca</h1>
        <p className="text-muted-foreground mt-1">Detalle de rendimiento por seller / marca</p>
      </div>
      <PorMarcaDashboard />
    </div>
  )
}
