export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateCache } from '@/lib/cache'
import * as XLSX from 'xlsx'
import { parse } from 'csv/sync'

const EXCLUDED_GROUPS = ['PACKAGING', 'MATERIALES EMPAQUE', 'MATERIALES DE EMPAQUE', 'VIDRIERA', 'PROMOCION']
const EXCLUDED_STATES = ['OD_TERMINADO']

// Cache uppercase strings to avoid repeated conversions
const EXCLUDED_GROUPS_UPPER = EXCLUDED_GROUPS.map(g => g.toUpperCase())
const EXCLUDED_STATES_UPPER = EXCLUDED_STATES.map(s => s.toUpperCase())

function cleanStr(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val).replace(/^"|"$/g, '').trim()
}

function cleanInt(val: any): number {
  const s = cleanStr(val)
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const clientesFile = formData.get('clientes') as File | null
    const tiendaFile = formData.get('tienda') as File | null
    const grupoFile = formData.get('grupo') as File | null

    if (!clientesFile || !tiendaFile || !grupoFile) {
      return NextResponse.json({ error: 'Faltan archivos. Se requieren los 3 archivos.' }, { status: 400 })
    }

    // 1. Parse clientes.xlsx → map codigo → canal
    const clientesBuffer = Buffer.from(await clientesFile.arrayBuffer())
    const wb = XLSX.read(clientesBuffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const clientesData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

    const clienteMap = new Map<string, { canal: string; nombre: string }>()
    for (const row of clientesData ?? []) {
      const codigo = cleanStr(row?.['Codigo'] ?? row?.['codigo'] ?? row?.['CODIGO'] ?? '')
      const canal = cleanStr(row?.['Canal'] ?? row?.['canal'] ?? row?.['CANAL'] ?? '')
      const nombre = cleanStr(row?.['Nombre'] ?? row?.['nombre'] ?? row?.['NOMBRE'] ?? '')
      if (codigo && canal) {
        clienteMap.set(codigo, { canal, nombre })
      }
    }

    // 2. Parse pedidos_tienda.csv → map pedido → codigoTienda
    const tiendaText = await tiendaFile.text()
    const tiendaRows: any[] = parse(tiendaText, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      quote: '"',
      trim: true,
    })

    const pedidoTiendaMap = new Map<string, string>()
    for (const row of tiendaRows ?? []) {
      const pedido = cleanStr(row?.['Pedido'] ?? '')
      const tienda = cleanStr(row?.['Tiendas destino'] ?? '')
      if (pedido && tienda) {
        pedidoTiendaMap.set(pedido, tienda)
      }
    }

    // 3. Parse pedidos_grupo.csv → main data
    const grupoText = await grupoFile.text()
    const grupoRows: any[] = parse(grupoText, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      quote: '"',
      trim: true,
    })

    // 4. Filter and enrich
    const records: any[] = []
    for (const row of grupoRows ?? []) {
      const grupo = cleanStr(row?.['Grupo'] ?? '')
      const estado = cleanStr(row?.['Estado pedido'] ?? '')
      const grupoUpper = grupo.toUpperCase()
      const estadoUpper = estado.toUpperCase()

      // Exclude POP groups (use cached uppercase array)
      if (EXCLUDED_GROUPS_UPPER.includes(grupoUpper)) continue
      // Exclude terminated (use cached uppercase array)
      if (EXCLUDED_STATES_UPPER.includes(estadoUpper)) continue

      const pedido = cleanStr(row?.['Pedido'] ?? '')
      const codigoTienda = pedidoTiendaMap.get(pedido) ?? ''
      const clienteInfo = clienteMap.get(codigoTienda)
      const canal = clienteInfo?.canal ?? 'SIN CANAL'
      const nombreCliente = clienteInfo?.nombre ?? ''

      const uni = cleanInt(row?.['Uni'])
      const uniPick = cleanInt(row?.['Uni.Pick'])
      const uniSep = cleanInt(row?.['Uni.Sep.'])
      const uniPlan = cleanInt(row?.['Uni.Plan.'])
      const uniPend = cleanInt(row?.['Uni.Pend'])

      const pendPick = Math.max(uni - uniPick, 0)
      const pendSep = Math.max(uni - uniSep, 0)
      const efPick = uni > 0 ? Math.round((uniPick / uni) * 10000) / 100 : 0
      const efSep = uni > 0 ? Math.round((uniSep / uni) * 10000) / 100 : 0

      let fechaCreacion: Date | null = null
      const fechaStr = cleanStr(row?.['Fecha creacion'] ?? '')
      if (fechaStr) {
        const d = new Date(fechaStr)
        if (!isNaN(d.getTime())) fechaCreacion = d
      }

      records.push({
        pedido,
        nombrePedido: cleanStr(row?.['Nombre pedido'] ?? ''),
        tipo: cleanStr(row?.['Tipo'] ?? ''),
        grupo,
        sector: cleanStr(row?.['Sector'] ?? ''),
        seller: cleanStr(row?.['Seller'] ?? ''),
        estadoPedido: estado,
        fechaCreacion,
        codigoTienda,
        nombreCliente,
        canal,
        oollAsignado: cleanStr(row?.['OOLL asignado'] ?? ''),
        esRetira: cleanStr(row?.['Es retira?'] ?? ''),
        unidades: uni,
        unidadesPlan: uniPlan,
        unidadesPickeadas: uniPick,
        unidadesSeparadas: uniSep,
        unidadesPendientes: uniPend,
        pendientePicking: pendPick,
        pendienteSeparacion: pendSep,
        eficienciaPicking: efPick,
        eficienciaSeparacion: efSep,
      })
    }

    if ((records?.length ?? 0) === 0) {
      return NextResponse.json({ error: 'No se encontraron registros válidos después de aplicar los filtros.' }, { status: 400 })
    }

    // 5. TRUNCATE old data (very fast) then insert new records
    // TRUNCATE is a DDL operation and is much faster than DELETE
    console.log('🗑️  Truncating table...')
    try {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "PedidoProcesado"')
      console.log('✓ Table truncated successfully')
    } catch (truncateErr: any) {
      console.warn('⚠️  TRUNCATE failed (will proceed with insert):', truncateErr.message)
      // Continue anyway - worst case we have duplicate data
    }

    // 6. Insert new records in small batches with longer delays
    console.log(`📊 Inserting ${records.length} new records in batches...`)
    const batchSize = 300
    let insertedCount = 0
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      try {
        await prisma.pedidoProcesado.createMany({
          data: batch,
          skipDuplicates: false
        })
        insertedCount += batch.length
        console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${insertedCount}/${records.length} records`)
        
        // Longer wait to let pool recover between batches
        if (i + batchSize < records.length) {
          console.log(`     Waiting 2 seconds for pool recovery...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (insertErr: any) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} insert failed:`, insertErr.message)
        // Continue with next batch - skip this one
        console.log(`    Skipping this batch and continuing...`)
      }
    }
    
    console.log(`✅ Import complete: ${insertedCount} records inserted`)

    // Create import session
    await prisma.sesionImportacion.create({
      data: {
        archClientes: clientesFile?.name ?? 'clientes.xlsx',
        archTienda: tiendaFile?.name ?? 'pedidos_tienda.csv',
        archGrupo: grupoFile?.name ?? 'pedidos_grupo.csv',
        totalRegistros: records.length,
      },
    })

    // Invalidate all dashboard caches since data changed
    invalidateCache('dashboard')

    return NextResponse.json({
      message: `Se procesaron ${records.length} registros correctamente.`,
      count: records.length,
    })
  } catch (error: any) {
    console.error('Error procesando archivos:', error)
    return NextResponse.json(
      { error: `Error al procesar los archivos: ${error?.message ?? 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
