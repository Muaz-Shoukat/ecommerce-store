/** Unit price after product discount, plus optional variant extra. */
export function getSaleUnitPrice(product, variant = null) {
  const sale =
    product?.sale_price != null
      ? Number(product.sale_price)
      : Number(product?.price) || 0;
  return sale + Number(variant?.extra_price ?? 0);
}

/** List/compare-at unit price before discount. */
export function getListUnitPrice(product, variant = null) {
  return Number(product?.price || 0) + Number(variant?.extra_price ?? 0);
}

export function getDiscountPercent(product) {
  return Number(product?.discount_percent) || 0;
}
