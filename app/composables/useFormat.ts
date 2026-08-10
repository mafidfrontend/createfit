export function useFormat() {
  function formatPrice(price: number): string {
    if (Number.isInteger(price)) {
      return `$${price}`
    }
    return `$${price.toFixed(2)}`
  }

  function formatNumber(value: number, unit = 'см'): string {
    return `${value} ${unit}`
  }

  return { formatPrice, formatNumber }
}
