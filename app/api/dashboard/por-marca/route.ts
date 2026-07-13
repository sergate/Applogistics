export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, getCacheKey } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = getCacheKey('dashboard', 'por-marca')
    
    // Check cache first
    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // By seller with canal breakdown
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

    // Seller + grupo breakdown
    const porMarcaGrupo = await prisma.pedidoProcesado.groupBy({
      by: ['seller', 'grupo'],
      _sum: {
        unidades: true,
        unidadesPickeadas: true,
        unidadesSeparadas: true,
      },
      _count: true,
      orderBy: { _sum: { unidades: 'desc' } },
    })

    const detalle = (porMarcaGrupo ?? []).map((d: any) => {
      const uni = d?._sum?.unidades ?? 0
      const pick = d?._sum?.unidadesPickeadas ?? 0
      const sep = d?._sum?.unidadesSeparadas ?? 0
      return {
        seller: d?.seller ?? 'N/A',
        grupo: d?.grupo ?? 'N/A',
        unidades: uni,
        pickeadas: pick,
        separadas: sep,
        eficienciaPicking: uni > 0 ? Math.round((pick / uni) * 10000) / 100 : 0,
        eficienciaSeparacion: uni > 0 ? Math.round((sep / uni) * 10000) / 100 : 0,
        pedidos: d?._count ?? 0,
      }
    })

    // Seller + estado breakdown
    const porMarcaEstado = await prisma.pedidoProcesado.groupBy({
      by: ['seller', 'estadoPedido'],
      _sum: { unidades: true },
      _count: true,
    })

    const estados = (porMarcaEstado ?? []).map((d: any) => ({
      seller: d?.seller ?? 'N/A',
      estado: d?.estadoPedido ?? 'N/A',
      unidades: d?._sum?.unidades ?? 0,
      pedidos: d?._count ?? 0,
    }))

    const result = { marcas, detalle, estados }

    // Cache result for 5 minutes
    setCache(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error por-marca:', error)
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })
  }
}
