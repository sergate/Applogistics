export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

// Definimos la estructura del cliente para evitar usar 'any'
interface ClienteAgrupado {
  nombreCliente: string
  codigoTienda: string
  unidades: number
  pickeadas: number
  separadas: number
  pendientePicking: number
  pendienteSeparacion: number
  pedidos: number
}

export async function GET(req: NextRequest) {
  try {
    const seller = req.nextUrl.searchParams.get('seller') ?? ''
    const canal = req.nextUrl.searchParams.get('canal') ?? ''

    if (!seller || !canal) {
      return NextResponse.json(
        { error: 'Se requieren parámetros seller y canal' },
        { status: 400 }
      )
    }

    const cacheKey = getCacheKey('dashboard', 'canal-pedidos', seller, canal)
    
    // Check cache first
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Get all records for this seller + canal
    const records = await prisma.pedidoProcesado.findMany({
      where: { seller, canal },
      select: {
        nombreCliente: true,
        codigoTienda: true,
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
        pendientePicking: true,
        pendienteSeparacion: true,
      },
    })

    // Group by client (nombreCliente + codigoTienda)
    const clienteMap = new Map<string, ClienteAgrupado>()

    for (const r of records ?? []) {
      const key = r?.codigoTienda ?? r?.nombreCliente ?? 'SIN_CODIGO'
      const existing = clienteMap.get(key)
      
      if (existing) {
        existing.unidades += r?.unidades ?? 0
        existing.pickeadas += r?.unidadesPickeadas ?? 0
        existing.separadas += r?.unidadesSeparadas ?? 0
        existing.pendientePicking += r?.pendientePicking ?? 0
        existing.pendienteSeparacion += r?.pendienteSeparacion ?? 0
        existing.pedidos += 1
      } else {
        clienteMap.set(key, {
          nombreCliente: r?.nombreCliente ?? r?.codigoTienda ?? 'SIN NOMBRE',
          codigoTienda: r?.codigoTienda ?? '',
          unidades: r?.unidades ?? 0,
          pickeadas: r?.unidadesPickeadas ?? 0,
          separadas: r?.unidadesSeparadas ?? 0,
          pendientePicking: r?.pendientePicking ?? 0,
          pendienteSeparacion: r?.pendienteSeparacion ?? 0,
          pedidos: 1,
        })
      }
    }

    // Mapeo y cálculo de eficiencias con tipado seguro
    const result = Array.from(clienteMap.values())
      .map((c) => {
        const uni = c.unidades
        const pick = c.pickeadas
        const sep = c.separadas
        
        // Calculamos porcentaje y limitamos opcionalmente al 100% para evitar desbordes visuales
        const efipick = uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0
        const efisep = uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0

        return {
          ...c,
          eficienciaPicking: Math.min(efipick, 100),
          eficienciaSeparacion: Math.min(efisep, 100),
        }
      })
      .sort((a, b) => b.unidades - a.unidades) // Ordenamiento numérico limpio

    const responseData = { pedidos: result }

    // Cache result for 5 minutes
    setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error canal-pedidos:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}