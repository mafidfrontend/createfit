export function useFormat() {
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  function formatNumber(value: number, unit = 'см'): string {
    return `${value} ${unit}`
  }

  return { formatPrice, formatNumber }
}
