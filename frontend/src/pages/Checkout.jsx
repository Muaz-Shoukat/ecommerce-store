import {
  Banknote,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAddresses } from '../api/accountsApi';
import { createOrder } from '../api/ordersApi';
import AddressForm from '../components/AddressForm';
import {
  Alert,
  Card,
  EmptyState,
  LoadingSkeleton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';

const EMPTY_ADDRESS = {
  label: 'Home',
  full_address: '',
  city: '',
  is_default: true,
};

const PAYMENT_METHODS = [
  {
    value: 'stripe',
    label: 'Card (Stripe)',
    description: 'Pay securely with card — Stripe test mode',
    icon: CreditCard,
  },
  {
    value: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    icon: Banknote,
  },
  {
    value: 'jazzcash',
    label: 'JazzCash',
    description: 'Pay with JazzCash wallet (coming soon)',
    icon: Smartphone,
  },
  {
    value: 'easypaisa',
    label: 'Easypaisa',
    description: 'Pay with Easypaisa wallet (coming soon)',
    icon: CreditCard,
  },
];

const STEPS = [
  { id: 1, label: 'Address' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Review' },
];

function formatGuestAddress(address) {
  const parts = [
    address.label ? `${address.label}:` : null,
    address.full_address,
    address.city,
  ].filter(Boolean);
  return parts.join(' ');
}

export default function Checkout() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [guestEmail, setGuestEmail] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddress(EMPTY_ADDRESS);
      return;
    }

    let cancelled = false;
    setLoadingAddress(true);
    setAddressError('');

    getAddresses()
      .then((addresses) => {
        if (cancelled) return;
        const list = Array.isArray(addresses) ? addresses : [];
        const preferred =
          list.find((item) => item.is_default) ?? list[0] ?? null;
        if (preferred) {
          setAddress({
            label: preferred.label || 'Home',
            full_address: preferred.full_address || '',
            city: preferred.city || '',
            is_default: Boolean(preferred.is_default),
          });
        } else {
          setAddress(EMPTY_ADDRESS);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddressError('Could not load saved addresses.');
          setAddress(EMPTY_ADDRESS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <SectionHeader eyebrow="Checkout" title="Secure checkout" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products before starting checkout."
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  function validateAddressStep() {
    if (!address.full_address.trim() || !address.city.trim()) {
      setFormError('Please fill in the address details.');
      return false;
    }
    if (!isAuthenticated) {
      if (!guestName.trim() || !guestPhone.trim()) {
        setFormError('Please provide your name and phone number.');
        return false;
      }
      if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        setFormError('Please provide a valid email for order updates.');
        return false;
      }
      if (createAccount && (!accountUsername.trim() || !accountPassword)) {
        setFormError('Enter a username and password to create an account.');
        return false;
      }
    } else if (
      paymentMethod === 'stripe' &&
      guestEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())
    ) {
      setFormError('Please provide a valid email for card payments.');
      return false;
    }
    setFormError('');
    return true;
  }

  function goNext() {
    if (step === 1 && !validateAddressStep()) return;
    setStep((value) => Math.min(3, value + 1));
  }

  function goBack() {
    setFormError('');
    setStep((value) => Math.max(1, value - 1));
  }

  async function placeOrder() {
    if (!validateAddressStep()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      let placingAsGuest = !isAuthenticated;

      if (!isAuthenticated && createAccount) {
        await register({
          username: accountUsername.trim(),
          password: accountPassword,
          password_confirm: accountPassword,
          phone: guestPhone.trim(),
        });
        placingAsGuest = false;
      }

      const payload = {
        items: items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      };

      if (placingAsGuest) {
        payload.guest_name = guestName.trim();
        payload.guest_phone = guestPhone.trim();
        payload.guest_address = formatGuestAddress(address);
        payload.guest_email = guestEmail.trim();
      } else if (guestEmail.trim()) {
        payload.guest_email = guestEmail.trim();
      }

      const order = await createOrder(payload);
      if (order.checkout_url) {
        clearCart();
        window.location.href = order.checkout_url;
        return;
      }
      clearCart();
      navigate('/order-confirmation', { state: { order } });
    } catch (err) {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === 'object'
          ? Object.values(data).flat()?.[0]
          : null);
      setFormError(detail || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white';

  const summary = (
    <Card className="h-fit space-y-4 p-5 lg:sticky lg:top-24">
      <h2 className="font-display text-2xl text-neutral-900">Order summary</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="flex justify-between gap-3 text-sm">
            <span className="text-neutral-600">
              {item.name}
              {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
            </span>
            <span className="font-medium">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-neutral-100 pt-3">
        <span className="font-semibold">Subtotal</span>
        <span className="font-semibold">{formatCurrency(subtotal)}</span>
      </div>
      {/* PLACEHOLDER: trust indicators */}
      <div className="space-y-2 rounded-md bg-primary-50 p-3 text-sm text-primary-900">
        <p className="flex items-center gap-2 font-semibold">
          <Lock size={16} /> Secure checkout
        </p>
        <p className="flex items-center gap-2 text-primary-800">
          <ShieldCheck size={16} /> Encrypted payment details
        </p>
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <SectionHeader
        eyebrow="Checkout"
        title="Secure checkout"
        description="Address, payment, then review — same order API as before."
      />

      <ol className="mb-8 grid grid-cols-3 gap-2">
        {STEPS.map((item) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <li
              key={item.id}
              className={`rounded-full px-3 py-2 text-center text-sm font-semibold ${
                active
                  ? 'bg-primary-800 text-white'
                  : done
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {done && <Check size={14} className="mr-1 inline" />}
              {item.label}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {step === 1 && (
            <Card className="space-y-4 p-5">
              <h2 className="font-display text-xl">Shipping address</h2>
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-neutral-500">
                    Prefills from saved addresses when available.
                  </p>
                  {loadingAddress && <LoadingSkeleton lines={4} />}
                  {addressError && <Alert tone="warning">{addressError}</Alert>}
                  {!loadingAddress && (
                    <AddressForm value={address} onChange={setAddress} showLabel />
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-medium">
                      Full name
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className={fieldClass}
                        required
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      Phone
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className={fieldClass}
                        required
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Email
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className={fieldClass}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <AddressForm
                    value={address}
                    onChange={setAddress}
                    showLabel={false}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                    />
                    Create an account
                  </label>
                  {createAccount && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1.5 text-sm font-medium">
                        Username
                        <input
                          type="text"
                          value={accountUsername}
                          onChange={(e) => setAccountUsername(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium">
                        Password
                        <input
                          type="password"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card className="space-y-4 p-5">
              <h2 className="font-display text-xl">Payment method</h2>
              <div className="grid gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const selected = paymentMethod === method.value;
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition ${
                        selected
                          ? 'border-primary-800 bg-primary-50'
                          : 'border-neutral-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-800 shadow-sm">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block font-semibold text-neutral-900">
                          {method.label}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {method.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {isAuthenticated && paymentMethod === 'stripe' && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Receipt email (optional if already on your account)
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
              )}
              <p className="text-sm text-neutral-500">
                Card payments open Stripe Checkout. COD confirms immediately and emails
                when SMTP is configured. JazzCash / Easypaisa are placeholders.
              </p>
            </Card>
          )}

          {step === 3 && (
            <Card className="space-y-4 p-5">
              <h2 className="font-display text-xl">Review & place order</h2>
              <div className="grid gap-3 text-sm text-neutral-600">
                <p>
                  <strong className="text-neutral-900">Ship to:</strong>{' '}
                  {isAuthenticated
                    ? `${address.label}, ${address.full_address}, ${address.city}`
                    : `${guestName}, ${guestPhone}, ${formatGuestAddress(address)}`}
                </p>
                <p>
                  <strong className="text-neutral-900">Payment:</strong>{' '}
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </p>
                <p>
                  <strong className="text-neutral-900">Items:</strong> {items.length}
                </p>
              </div>
            </Card>
          )}

          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <SecondaryButton type="button" onClick={goBack}>
                Back
              </SecondaryButton>
            )}
            {step < 3 ? (
              <PrimaryButton type="button" onClick={goNext}>
                Continue
              </PrimaryButton>
            ) : (
              <PrimaryButton
                type="button"
                disabled={submitting}
                onClick={placeOrder}
              >
                {submitting
                  ? 'Placing order…'
                  : paymentMethod === 'stripe'
                    ? 'Pay with Stripe'
                    : 'Place order'}
              </PrimaryButton>
            )}
            <Link to="/cart" className="no-underline">
              <SecondaryButton type="button">Edit cart</SecondaryButton>
            </Link>
          </div>
        </div>

        {summary}
      </div>
    </div>
  );
}
