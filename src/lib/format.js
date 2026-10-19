export const CURRENCY = '\u20b9'

export function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return `${CURRENCY}0`
  }
  return `${CURRENCY}${value.toLocaleString('en-IN')}`
}

export function formatArea(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '\u2014'
  }
  return `${value.toLocaleString('en-IN')} sq ft`
}