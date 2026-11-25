import { formatCurrency } from '../../utils/formatCurrency';

export default function PriceTag({
  amount,
  compareAt,
  className = '',
}) {
  const hasCompare =
    compareAt != null &&
    Number(compareAt) > Number(amount) &&
    Number.isFinite(Number(compareAt));

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className="font-semibold text-neutral-900">
        {formatCurrency(amount)}
      </span>
      {hasCompare && (
        <span className="text-sm font-medium text-neutral-400 line-through">
          {formatCurrency(compareAt)}
        </span>
      )}
    </span>
  );
}
