import { PorCategoriaDashboard } from './_components/por-categoria-dashboard'

export default function PorCategoriaPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Análisis por Categoría</h1>
        <p className="text-muted-foreground mt-1">Desglose por grupo de producto</p>
      </div>
      <PorCategoriaDashboard />
    </div>
  )
}
