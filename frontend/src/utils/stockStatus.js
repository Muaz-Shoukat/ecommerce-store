export function getStockStatus(stock) {
  const value = Number(stock) || 0;
  if (value <= 0) {
    return { label: 'Out of stock', tone: 'error', inStock: false };
  }
  if (value <= 10) {
    return { label: 'Low stock', tone: 'warning', inStock: true };
  }
  return { label: 'In stock', tone: 'success', inStock: true };
}
