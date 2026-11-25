import { Badge } from './ui';

const STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  processing: { label: 'Processing', tone: 'primary' },
  shipped: { label: 'Shipped', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'error' },
};

export default function OrderStatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
