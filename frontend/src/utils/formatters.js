/**
 * Format a number as Colombian pesos: $1.234.567,50
 */
export function formatCOP(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '$0'
  const num = parseFloat(value)
  const formatted = num.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `$${formatted}`
}

/**
 * Format a number with Colombian thousands separator (no symbol)
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return parseFloat(value).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function statusLabel(status) {
  const map = {
    borrador: 'Borrador',
    calculado: 'Calculado',
    exportado: 'Exportado',
  }
  return map[status] || status
}

export function statusColor(status) {
  const map = {
    borrador: 'bg-slate-100 text-slate-600',
    calculado: 'bg-blue-100 text-blue-700',
    exportado: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}

export function machineTypeLabel(type) {
  const map = {
    cnc: 'Mesa CNC',
    troqueladora_pliego: 'Troqueladora de Pliego',
    troqueladora_rodillo: 'Troqueladora de Rodillo',
  }
  return map[type] || type
}

export function materialTypeLabel(type) {
  const map = {
    corrugado: 'Cartón Corrugado',
    microcorrugado: 'Microcorrugado',
    plegadizo: 'Cartulina Plegadiza',
  }
  return map[type] || type
}
