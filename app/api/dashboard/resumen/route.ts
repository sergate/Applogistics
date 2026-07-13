export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = getCacheKey('dashboard', 'resumen')
    
    // Check cache first
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Global KPIs
    const agg = await prisma.pedidoProcesado.aggregate({
      _sum: {
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
        pendientePicking: true,
        pendienteSeparacion: true,
      },
      _count: true,
    })

    const totalUni = agg?._sum?.unidades ?? 0
    const totalPick = agg?._sum?.unidadesPickeadas ?? 0
    const totalSep = agg?._sum?.unidadesSeparadas ?? 0
    const totalPendPick = agg?._sum?.pendientePicking ?? 0
    const totalPendSep = agg?._sum?.pendienteSeparacion ?? 0
    const efPick = totalUni > 0 ? Math.round((totalPick / totalUni) * 10000) / 100 : 0
    const efSep = totalUni > 0 ? Math.round((totalSep / totalUni) * 10000) / 100 : 0

    // By seller (marca)
    const porMarca = await prisma.pedidoProcesado.groupBy({
      by: ['seller'],
      _sum: {
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
        pendientePicking: true,
        pendienteSeparacion: true,
      },
      _count: true,
    })

    const marcas = (porMarca ?? []).map((m: any) => {
      const uni = m?._sum?.unidades ?? 0
      const pick = m?._sum?.unidadesPickeadas ?? 0
      const sep = m?._sum?.unidadesSeparadas ?? 0
      return {
        seller: m?.seller ?? 'N/A',
        unidades: uni,
        pickeadas: pick,
        separadas: sep,
        pendientePicking: m?._sum?.pendientePicking ?? 0,
        pendienteSeparacion: m?._sum?.pendienteSeparacion ?? 0,
        eficienciaPicking: uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0,
        eficienciaSeparacion: uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0,
        pedidos: m?._count ?? 0,
      }
    })

    const result = {
      kpis: {
        totalUnidades: totalUni,
        totalPickeadas: totalPick,
        totalSeparadas: totalSep,
        pendientePicking: totalPendPick,
        pendienteSeparacion: totalPendSep,
        eficienciaPicking: efPick,
        eficienciaSeparacion: efSep,
        totalRegistros: agg?._count ?? 0,
      },
      marcas,
    }

    // Cache result for 5 minutes
    setCache(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error en resumen:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}
