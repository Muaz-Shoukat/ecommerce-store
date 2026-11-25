import { ChevronDown, PackageOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/ordersApi';
import OrderStatusBadge from '../components/OrderStatusBadge';
import {
  Alert,
  Card,
  EmptyState,
  LoadingSkeleton,
  SectionHeader,
} from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyOrders() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(() => getOrders(), []);
  const orders = Array.isArray(data) ? data : data?.results ?? [];
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        String(order.id),
        order.status,
        order.payment_method,
        ...(order.items ?? []).map((item) => item.product_name || ''),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, statusFilter, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <SectionHeader
        eyebrow="Account"
        title="My Orders"
        description="Track every stationery order in one place."
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order # or product…"
            className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-neutral-200 bg-white px-3 py-2.5 text-sm"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingSkeleton lines={6} />}
      {error && (
        <Alert tone="error" title="Could not load orders">
          Please try again in a moment.
        </Alert>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={PackageOpen}
          title={orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          description={
            orders.length === 0
              ? 'Place your first order and it will show up here.'
              : 'Try another status filter or search term.'
          }
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((order) => {
            const open = expandedId === order.id;
            return (
              <Card key={order.id} className="overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => setExpandedId(open ? null : order.id)}
                  aria-expanded={open}
                >
                  <div className="flex -space-x-2">
                    {(order.items ?? []).slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-xs font-bold text-primary-800"
                        title={item.product_name || `Product #${item.product}`}
                      >
                        {(item.product_name || 'P').slice(0, 1).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-neutral-900">Order #{order.id}</strong>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {new Date(order.created_at).toLocaleString()} ·{' '}
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-neutral-400 transition ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && (
                  <div className="border-t border-neutral-100 bg-neutral-50/80 px-4 py-4">
                    <ol className="mb-4 flex flex-wrap gap-2">
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map(
                        (step, index, all) => {
                          const currentIndex = all.indexOf(order.status);
                          const reached =
                            order.status === 'cancelled'
                              ? false
                              : currentIndex >= index;
                          return (
                            <li
                              key={step}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                reached
                                  ? 'bg-primary-800 text-white'
                                  : 'bg-white text-neutral-400'
                              }`}
                            >
                              {step}
                            </li>
                          );
                        },
                      )}
                      {order.status === 'cancelled' && (
                        <li>
                          <OrderStatusBadge status="cancelled" />
                        </li>
                      )}
                    </ol>
                    <ul className="space-y-2">
                      {(order.items ?? []).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex items-center gap-3 text-neutral-700">
                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white font-semibold text-primary-800 shadow-sm">
                              {(item.product_name || 'P').slice(0, 1).toUpperCase()}
                            </span>
                            {item.product_name || `Product #${item.product}`}
                            {item.variant_label ? ` (${item.variant_label})` : ''} ×{' '}
                            {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              Number(item.price_at_purchase) * Number(item.quantity),
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
