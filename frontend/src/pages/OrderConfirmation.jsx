import { CheckCircle2, Download, PackageOpen } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import OrderStatusBadge from '../components/OrderStatusBadge';
import {
  Alert,
  Card,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import { formatCurrency } from '../utils/formatCurrency';

const PAYMENT_LABELS = {
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  cod: 'Cash on Delivery',
};

const TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const [invoiceMsg, setInvoiceMsg] = useState('');

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <EmptyState
          icon={PackageOpen}
          title="No order details found"
          description="Place an order from checkout to see confirmation here."
          actionLabel="Continue shopping"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const currentIndex =
    order.status === 'cancelled' ? -1 : TIMELINE.indexOf(order.status);
  const isWalletPayment =
    order.payment_method === 'jazzcash' || order.payment_method === 'easypaisa';

  function handleDownloadInvoice() {
    // PLACEHOLDER: no PDF generation implemented
    setInvoiceMsg('Invoice download is a UI placeholder — no PDF is generated yet.');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="mb-8 flex flex-col items-center text-center animate-[fadeSlideIn_450ms_ease-out]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 animate-[popIn_500ms_ease-out]">
          <CheckCircle2 size={34} />
        </div>
        <SectionHeader
          eyebrow="Success"
          title="Order confirmed"
          description="Thanks — your stationery order is on its way through our fulfillment flow."
        />
      </div>

      <Card className="mb-4 p-5 text-center">
        <p className="text-sm text-neutral-500">Order number</p>
        <p className="mt-1 font-display text-4xl text-neutral-900">#{order.id}</p>
        <div className="mt-3 flex justify-center">
          <OrderStatusBadge status={order.status} />
        </div>
      </Card>

      <Card className="mb-4 p-5">
        <h2 className="mb-4 font-display text-xl text-neutral-900">Status timeline</h2>
        {order.status === 'cancelled' ? (
          <Alert tone="warning" title="Order cancelled">
            This order was cancelled and will not progress further.
          </Alert>
        ) : (
          <ol className="space-y-3">
            {TIMELINE.map((step, index) => {
              const done = currentIndex >= index;
              const current = currentIndex === index;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-primary-800 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : index + 1}
                  </span>
                  <span
                    className={`capitalize ${
                      current
                        ? 'font-semibold text-primary-800'
                        : done
                          ? 'text-neutral-800'
                          : 'text-neutral-400'
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="mb-4 space-y-3 p-5">
        <h2 className="font-display text-xl text-neutral-900">Order summary</h2>
        <p className="text-sm text-neutral-500">
          Payment:{' '}
          <strong className="text-neutral-800">
            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
          </strong>
        </p>
        <ul className="space-y-2">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="text-neutral-600">
                {item.product_name || `Product #${item.product}`}
                {item.variant_label ? ` (${item.variant_label})` : ''} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatCurrency(
                  Number(item.price_at_purchase) * Number(item.quantity),
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-neutral-100 pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
        </div>
      </Card>

      {isWalletPayment && (
        <Alert tone="info" title="Digital wallet payment" className="mb-4">
          JazzCash / Easypaisa status polling will appear here once the payments
          phase is wired. Your order record is already created.
        </Alert>
      )}

      {invoiceMsg && (
        <Alert tone="info" className="mb-4">
          {invoiceMsg}
        </Alert>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link to="/products" className="no-underline">
          <PrimaryButton>Continue shopping</PrimaryButton>
        </Link>
        <SecondaryButton type="button" onClick={handleDownloadInvoice}>
          <Download size={16} /> Download invoice
        </SecondaryButton>
        <Link to="/my-orders" className="no-underline">
          <SecondaryButton type="button">View my orders</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
