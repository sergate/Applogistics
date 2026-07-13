import { AppShell } from '@/components/app-shell'
import { ImportForm } from './_components/import-form'

export default function ImportarPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Importar Datos</h1>
          <p className="text-muted-foreground mt-2">Sube los tres archivos necesarios para procesar los datos logísticos.</p>
        </div>
        <ImportForm />
      </div>
    </AppShell>
  )
}
