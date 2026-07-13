'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FileField {
  key: string
  label: string
  description: string
  accept: string
  icon: any
}

const fileFields: FileField[] = [
  { key: 'clientes', label: 'Archivo de Clientes', description: 'Formato Excel (.xlsx) con códigos y canales', accept: '.xlsx,.xls', icon: FileSpreadsheet },
  { key: 'tienda', label: 'Pedidos por Tienda', description: 'Formato CSV con separador ; y comillas', accept: '.csv', icon: FileText },
  { key: 'grupo', label: 'Pedidos por Grupo', description: 'Formato CSV con separador ; y comillas', accept: '.csv', icon: FileText },
]

export function ImportForm() {
  const [files, setFiles] = useState<Record<string, File | null>>({ clientes: null, tienda: null, grupo: null })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)
  const router = useRouter()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({ clientes: null, tienda: null, grupo: null })

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev: any) => ({ ...(prev ?? {}), [key]: file }))
    setResult(null)
  }

  const allFilesSelected = Object.values(files ?? {})?.every?.((f: any) => f !== null)

  const handleSubmit = async () => {
    if (!allFilesSelected) return
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      if (files?.clientes) formData.append('clientes', files.clientes)
      if (files?.tienda) formData.append('tienda', files.tienda)
      if (files?.grupo) formData.append('grupo', files.grupo)

      const res = await fetch('/api/procesar', { method: 'POST', body: formData })
      const data = await res?.json?.() ?? {}

      if (res?.ok) {
        setResult({ success: true, message: data?.message ?? 'Datos procesados correctamente', count: data?.count ?? 0 })
        toast.success('Datos procesados correctamente')
      } else {
        setResult({ success: false, message: data?.error ?? 'Error al procesar los datos' })
        toast.error(data?.error ?? 'Error al procesar')
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Error de conexión con el servidor' })
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {fileFields?.map?.((field: FileField) => {
          const Icon = field?.icon
          const file = files?.[field?.key]
          return (
            <Card key={field?.key} variant="interactive" className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-4 p-6 cursor-pointer"
                  onClick={() => inputRefs?.current?.[field?.key]?.click?.()}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    file ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'
                  }`}>
                    {file ? <CheckCircle2 size={24} /> : (Icon && <Icon size={24} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{field?.label ?? ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {file ? file?.name ?? 'Archivo seleccionado' : field?.description ?? ''}
                    </p>
                    {file && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {((file?.size ?? 0) / 1024)?.toFixed?.(1) ?? '0'} KB
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e: any) => {
                      e?.stopPropagation?.()
                      inputRefs?.current?.[field?.key]?.click?.()
                    }}
                  >
                    {file ? 'Cambiar' : 'Seleccionar'}
                  </Button>
                  <input
                    ref={(el: any) => { if (inputRefs?.current) inputRefs.current[field?.key] = el }}
                    type="file"
                    accept={field?.accept ?? ''}
                    className="hidden"
                    onChange={(e: any) => handleFileChange(field?.key, e?.target?.files?.[0] ?? null)}
                  />
                </div>
              </CardContent>
            </Card>
          )
        }) ?? []}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!allFilesSelected || loading}
        className="w-full h-14 text-lg gap-3"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="animate-spin" size={22} /> Procesando datos...</>
        ) : (
          <><Upload size={22} /> Procesar Datos</>
        )}
      </Button>

      {result && (
        <Card className={result?.success ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {result?.success ? (
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={24} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              )}
              <div>
                <p className={`font-semibold ${result?.success ? 'text-emerald-800' : 'text-red-800'}`}>
                  {result?.success ? '¡Procesamiento exitoso!' : 'Error en el procesamiento'}
                </p>
                <p className={`text-sm mt-1 ${result?.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result?.message ?? ''}
                </p>
              </div>
            </div>
            {result?.success && (
              <Button
                onClick={() => router?.push?.('/dashboard')}
                className="mt-4 gap-2"
              >
                Ver Dashboard <ArrowRight size={16} />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
