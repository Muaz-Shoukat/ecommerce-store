import { ShoppingBag, Tag, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import {
  Card,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';

export default function Cart() {
  const navigate = useNavigate();
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [removingKey, setRemovingKey] = useState(null);

  function handleRemove(key) {
    setRemovingKey(key);
    window.setTimeout(() => {
      removeItem(key);
      setRemovingKey(null);
    }, 220);
  }

  function applyCoupon(event) {
    event.preventDefault();
    // PLACEHOLDER: coupon does not affect totals
    setCouponMsg(
      coupon.trim()
        ? 'Coupon UI only — totals are unchanged (no backend coupons).'
        : 'Enter a sample code to preview this placeholder.',
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <SectionHeader eyebrow="Cart" title="Your bag" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few bright school essentials and come back to checkout."
          actionLabel="Continue shopping"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <SectionHeader
        eyebrow="Cart"
        title="Your bag"
        description={`${items.length} line item${items.length === 1 ? '' : 's'} ready for checkout.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`transition duration-200 ${
                removingKey === item.key
                  ? 'translate-x-4 scale-[0.98] opacity-0'
                  : 'opacity-100'
              }`}
            >
              <CartItem
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={handleRemove}
              />
            </div>
          ))}
        </div>

        <Card className="h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-neutral-900">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          {/* PLACEHOLDER: shipping estimate */}
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-500">
              <Truck size={16} /> Shipping estimate
            </span>
            <span className="text-right text-neutral-600">
              Calculated at delivery
              <br />
              <span className="text-xs text-neutral-400">(placeholder)</span>
            </span>
          </div>

          {/* PLACEHOLDER: coupon box */}
          <form onSubmit={applyCoupon} className="space-y-2 border-t border-neutral-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Tag size={16} /> Coupon
            </label>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Try SCHOOL10"
                className="w-full rounded-full border border-neutral-200 px-3 py-2 text-sm"
              />
              <SecondaryButton type="submit" className="px-4 py-2 text-xs">
                Apply
              </SecondaryButton>
            </div>
            {couponMsg && (
              <p className="text-xs text-neutral-500">{couponMsg}</p>
            )}
          </form>

          <div className="flex justify-between border-t border-neutral-100 pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          <Link to="/checkout" className="block no-underline">
            <PrimaryButton className="w-full">Proceed to checkout</PrimaryButton>
          </Link>
          <Link to="/products" className="block no-underline">
            <SecondaryButton className="w-full">Continue shopping</SecondaryButton>
          </Link>
        </Card>
      </div>
    </div>
  );
}
