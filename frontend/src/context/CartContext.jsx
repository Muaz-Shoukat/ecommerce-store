import { createContext, useState } from 'react';

export const CartContext = createContext(null);

function cartLineKey(productId, variantId = null) {
  return `${productId}:${variantId ?? 'none'}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem({ product, variant = null, quantity = 1 }) {
    const key = cartLineKey(product.id, variant?.id);
    const unitPrice =
      Number(product.sale_price ?? product.price) +
      Number(variant?.extra_price ?? 0);

    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          productSlug: product.slug,
          name: product.name,
          image: product.image,
          variantId: variant?.id ?? null,
          variantLabel: variant
            ? `${variant.name}: ${variant.value}`
            : null,
          unitPrice,
          quantity,
        },
      ];
    });
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateQuantity(key, quantity) {
    const nextQty = Number(quantity);
    if (!Number.isFinite(nextQty) || nextQty < 1) {
      removeItem(key);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, quantity: nextQty } : item,
      ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
