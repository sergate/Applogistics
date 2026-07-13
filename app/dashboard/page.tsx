import { ResumenDashboard } from './_components/resumen-dashboard'

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard Resumen</h1>
        <p className="text-muted-foreground mt-1">Vista general del rendimiento logístico</p>
      </div>
      <ResumenDashboard />
    </div>
  )
}
