export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const seller = req.nextUrl.searchParams.get('seller') ?? ''
    if (!seller) {
      return NextResponse.json({ error: 'Se requiere parámetro seller' }, { status: 400 })
    }

    const cacheKey = getCacheKey('dashboard', 'marca-canales', seller)
    
    // Check cache first
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    const porCanal = await prisma.pedidoProcesado.groupBy({
      by: ['canal'],
      where: { seller },
      _sum: {
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
        pendientePicking: true,
        pendienteSeparacion: true,
      },
      _count: true,
    })

    const canales = (porCanal ?? []).map((c: any) => {
      const uni = c?._sum?.unidades ?? 0
      const pick = c?._sum?.unidadesPickeadas ?? 0
      const sep = c?._sum?.unidadesSeparadas ?? 0
      return {
        canal: c?.canal ?? 'SIN CANAL',
        unidades: uni,
        pickeadas: pick,
        separadas: sep,
        pendientePicking: c?._sum?.pendientePicking ?? 0,
        pendienteSeparacion: c?._sum?.pendienteSeparacion ?? 0,
        eficienciaPicking: uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0,
        eficienciaSeparacion: uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0,
        pedidos: c?._count ?? 0,
      }
    })

    const responseData = { canales }

    // Cache result for 5 minutes
    setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error marca-canales:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}
