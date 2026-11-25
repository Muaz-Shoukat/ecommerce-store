import { Star } from 'lucide-react';

export default function RatingStars({
  rating = 0,
  count = 0,
  showCount = true,
  onCountClick,
  className = '',
}) {
  const value = Number(rating) || 0;
  const reviewCount = Number(count) || 0;
  const fullStars = Math.floor(value);

  const countLabel = (
    <span className="ml-1 text-xs font-medium text-neutral-500">
      {value.toFixed(1)} ({reviewCount})
    </span>
  );

  return (
    <div
      className={`inline-flex items-center gap-1 text-amber-500 ${className}`}
      aria-label={`Rated ${value.toFixed(1)} out of 5 from ${reviewCount} reviews`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          fill={index < fullStars ? 'currentColor' : 'none'}
          className={index < fullStars ? '' : 'text-neutral-300'}
        />
      ))}
      {showCount &&
        (onCountClick ? (
          <button
            type="button"
            onClick={onCountClick}
            className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {countLabel}
          </button>
        ) : (
          countLabel
        ))}
    </div>
  );
}
