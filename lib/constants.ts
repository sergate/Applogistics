export const BRAND_COLORS: Record<string, string> = {
  CHEEKY: '#FF6363',
  CQQTQ: '#60B5FF',
  AWADA: '#A19AD3',
  FLY: '#2DA882',
}

export const CANAL_COLORS: Record<string, string> = {
  PROPIO: '#60B5FF',
  FRANQUICIA: '#FF9149',
  CLIENTE: '#FF90BB',
  DEPOSITO: '#2DA882',
  OOLL: '#A19AD3',
  'SIN CANAL': '#94a3b8',
}

export const ESTADO_COLORS: Record<string, string> = {
  OD_PENDIENTE: '#FF9149',
  OD_PLANIFICADA: '#60B5FF',
  OD_PICKEADA: '#2DA882',
  OD_PICKEADA_PARCIAL: '#FF90BB',
}

export function getBrandColor(seller: string): string {
  return BRAND_COLORS?.[seller?.toUpperCase?.()] ?? '#94a3b8'
}

export function getCanalColor(canal: string): string {
  return CANAL_COLORS?.[canal?.toUpperCase?.()] ?? '#94a3b8'
}

export function formatNumber(n: number | null | undefined): string {
  return (n ?? 0)?.toLocaleString?.('es-AR') ?? '0'
}

export function formatPercent(n: number | null | undefined): string {
  return `${(n ?? 0)?.toFixed?.(1) ?? '0'}%`
}
