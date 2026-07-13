export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = getCacheKey('dashboard', 'por-fecha')
    
    // Check cache first
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    const data = await prisma.pedidoProcesado.groupBy({
      by: ['fechaCreacion', 'seller'],
      _sum: {
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
        pendientePicking: true,
        pendienteSeparacion: true,
      },
      _count: true,
      orderBy: { fechaCreacion: 'asc' },
    })

    const result = (data ?? []).map((d: any) => {
      const uni = d?._sum?.unidades ?? 0
      const pick = d?._sum?.unidadesPickeadas ?? 0
      const sep = d?._sum?.unidadesSeparadas ?? 0
      return {
        fecha: d?.fechaCreacion ? new Date(d.fechaCreacion).toISOString().split('T')[0] : 'N/A',
        seller: d?.seller ?? 'N/A',
        unidades: uni,
        pickeadas: pick,
        separadas: sep,
        pendientePicking: d?._sum?.pendientePicking ?? 0,
        pendienteSeparacion: d?._sum?.pendienteSeparacion ?? 0,
        eficienciaPicking: uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0,
        eficienciaSeparacion: uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0,
        pedidos: d?._count ?? 0,
      }
    })

    const responseData = { data: result }

    // Cache result for 5 minutes
    setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error por-fecha:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}
