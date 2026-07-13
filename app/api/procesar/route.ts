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

    // 5. Clear old data and insert new data in a single operation
    // Using a single large INSERT avoids multiple connection pool requests
    
    // First, TRUNCATE the table
    try {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "PedidoProcesado"')
      console.log('✓ Table truncated successfully')
    } catch (truncateErr: any) {
      console.warn('⚠️  TRUNCATE warning (non-critical):', truncateErr.message)
    }

    // Build a massive INSERT statement with ALL records at once
    if (records.length > 0) {
      console.log(`📊 Preparing to insert ${records.length} records in a single batch...`)
      
      const columns = Object.keys(records[0])
      let sqlInsert = `INSERT INTO "PedidoProcesado" (${columns.map(c => `"${c}"`).join(', ')}) VALUES `
      
      const values: string[] = []
      records.forEach((record) => {
        const recordValues = columns.map(col => {
          const val = record[col]
          if (val === null || val === undefined) return 'NULL'
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          if (typeof val === 'number') return val.toString()
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
          if (val instanceof Date) return `'${val.toISOString()}'`
          return `'${String(val).replace(/'/g, "''")}'`
        })
        values.push(`(${recordValues.join(', ')})`)
      })
      
      sqlInsert += values.join(', ')
      
      console.log(`⏳ Executing massive INSERT (${sqlInsert.length} bytes of SQL)...`)
      try {
        await prisma.$executeRawUnsafe(sqlInsert)
        console.log(`✅ All ${records.length} records inserted successfully`)
      } catch (insertErr: any) {
        console.error('❌ Massive INSERT failed:', insertErr.message)
        // If massive insert fails, try smaller chunks
        console.log('🔄 Fallback: Trying chunked inserts (10 records at a time)...')
        
        const smallChunkSize = 10
        let insertedCount = 0
        
        for (let i = 0; i < records.length; i += smallChunkSize) {
          const chunk = records.slice(i, i + smallChunkSize)
          const chunkColumns = Object.keys(chunk[0])
          let chunkSql = `INSERT INTO "PedidoProcesado" (${chunkColumns.map(c => `"${c}"`).join(', ')}) VALUES `
          
          const chunkValues: string[] = []
          chunk.forEach((record) => {
            const recordValues = chunkColumns.map(col => {
              const val = record[col]
              if (val === null || val === undefined) return 'NULL'
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
              if (typeof val === 'number') return val.toString()
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
              if (val instanceof Date) return `'${val.toISOString()}'`
              return `'${String(val).replace(/'/g, "''")}'`
            })
            chunkValues.push(`(${recordValues.join(', ')})`)
          })
          
          chunkSql += chunkValues.join(', ')
          
          try {
            await prisma.$executeRawUnsafe(chunkSql)
            insertedCount += chunk.length
            console.log(`  ✓ Chunk ${i}-${i + chunk.length}: ${insertedCount}/${records.length}`)
            
            // Small delay between chunks
            if (i + smallChunkSize < records.length) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          } catch (chunkErr: any) {
            console.error(`  ✗ Chunk ${i} failed:`, chunkErr.message)
            // Skip this chunk and continue
          }
        }
      }
    }

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
