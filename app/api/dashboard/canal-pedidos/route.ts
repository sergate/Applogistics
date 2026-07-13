export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

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
    const clienteMap = new Map<string, {
      nombreCliente: string
      codigoTienda: string
      unidades: number
      pickeadas: number
      separadas: number
      pendientePicking: number
      pendienteSeparacion: number
      pedidos: number
    }>()

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

    const result = Array.from(clienteMap.values()).map((c: any) => {
      const uni = c?.unidades ?? 0
      const pick = c?.pickeadas ?? 0
      const sep = c?.separadas ?? 0
      return {
        ...c,
        eficienciaPicking: uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0,
        eficienciaSeparacion: uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0,
      }
    }).sort((a: any, b: any) => (b?.unidades ?? 0) - (a?.unidades ?? 0))

    const responseData = { pedidos: result }

    // Cache result for 5 minutes
    setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error canal-pedidos:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}
