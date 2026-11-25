import { CheckCircle2, Download, PackageOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { downloadOrderInvoice } from '../api/ordersApi';
import { confirmStripeSession } from '../api/paymentsApi';
import OrderStatusBadge from '../components/OrderStatusBadge';
import {
  Alert,
  Card,
  EmptyState,
  LoadingSkeleton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import { formatCurrency } from '../utils/formatCurrency';

const PAYMENT_LABELS = {
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  cod: 'Cash on Delivery',
  stripe: 'Card (Stripe)',
};

const TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(location.state?.order ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceMsg, setInvoiceMsg] = useState('');
  const [invoiceTone, setInvoiceTone] = useState('info');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    if (!sessionId) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    confirmStripeSession({ sessionId, orderId })
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === 'string'
            ? detail
            : 'Could not confirm Stripe payment. If you were charged, contact support with your order id.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {error && (
          <Alert tone="error" title="Payment confirmation" className="mb-4">
            {error}
          </Alert>
        )}
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

  async function handleDownloadInvoice() {
    if (!order?.id || downloadingInvoice) return;
    setDownloadingInvoice(true);
    setInvoiceMsg('');
    try {
      const sessionId =
        searchParams.get('session_id') || order.stripe_checkout_session_id || '';
      await downloadOrderInvoice(order.id, {
        email: order.guest_email || '',
        sessionId,
      });
      setInvoiceTone('success');
      setInvoiceMsg('Invoice downloaded.');
    } catch (err) {
      const detail =
        err.response?.data instanceof Blob
          ? 'Could not download invoice.'
          : err.response?.data?.detail || err.message || 'Could not download invoice.';
      setInvoiceTone('error');
      setInvoiceMsg(typeof detail === 'string' ? detail : 'Could not download invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      {error && (
        <Alert tone="warning" title="Note" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="mb-8 flex flex-col items-center text-center animate-[fadeSlideIn_450ms_ease-out]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 animate-[popIn_500ms_ease-out]">
          <CheckCircle2 size={34} />
        </div>
        <SectionHeader
          eyebrow="Success"
          title={order.status === 'confirmed' ? 'Order confirmed' : 'Order received'}
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
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-primary-800 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={done ? 'font-semibold text-neutral-900' : 'text-neutral-400'}>
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="mb-4 p-5">
        <h2 className="mb-3 font-display text-xl text-neutral-900">Payment</h2>
        <p className="text-sm text-neutral-600">
          {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
        </p>
        <p className="mt-2 text-lg font-semibold">
          Total {formatCurrency(order.total_amount)}
        </p>
        {isWalletPayment && (
          <Alert tone="info" title="Digital wallet payment" className="mt-4">
            JazzCash / Easypaisa status polling will appear here once those gateways are
            connected.
          </Alert>
        )}
        {order.payment_method === 'stripe' && order.status === 'pending' && (
          <Alert tone="warning" title="Awaiting card confirmation" className="mt-4">
            If you just paid, refresh this page or wait a moment while Stripe confirms.
          </Alert>
        )}
      </Card>

      <Card className="mb-6 p-5">
        <h2 className="mb-3 font-display text-xl text-neutral-900">Items</h2>
        <ul className="space-y-2 text-sm">
          {(order.items || []).map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.product_name || 'Item'}
                {item.variant_label ? ` (${item.variant_label})` : ''} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatCurrency(item.price_at_purchase * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {invoiceMsg && (
        <Alert tone={invoiceTone} className="mb-4">
          {invoiceMsg}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <PrimaryButton
          type="button"
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
        >
          <Download size={16} className="mr-1 inline" />
          {downloadingInvoice ? 'Preparing PDF…' : 'Download invoice'}
        </PrimaryButton>
        <Link to="/products" className="no-underline">
          <SecondaryButton type="button">Continue shopping</SecondaryButton>
        </Link>
        <Link to="/my-orders" className="no-underline">
          <SecondaryButton type="button">My orders</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
