import { Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProductReview } from '../api/productsApi';
import { useAuth } from '../hooks/useAuth';
import { Alert, PrimaryButton, RatingStars } from './ui';

export default function ProductReviewForm({
  slug,
  canReview,
  hasReviewed,
  onSubmitted,
}) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <Alert tone="info" title="Sign in to review">
        <Link to="/login" className="font-semibold text-primary-800 underline">
          Log in
        </Link>{' '}
        after purchasing this product to leave a review.
      </Alert>
    );
  }

  if (hasReviewed || success) {
    return (
      <Alert tone="success" title="Thanks for your feedback">
        You have already reviewed this product.
      </Alert>
    );
  }

  if (!canReview) {
    return (
      <Alert tone="info" title="Purchase required">
        You can leave a review after your order for this product is confirmed.
      </Alert>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const review = await createProductReview(slug, { rating, comment });
      setSuccess(true);
      onSubmitted?.(review);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.comment?.[0] ||
        err?.response?.data?.rating?.[0] ||
        'Could not submit review. Please try again.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-neutral-800">Write a review</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const active = value <= rating;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} stars`}
              onClick={() => setRating(value)}
              className={`rounded p-0.5 ${active ? 'text-amber-500' : 'text-neutral-300'}`}
            >
              <Star size={22} fill={active ? 'currentColor' : 'none'} />
            </button>
          );
        })}
        <span className="ml-2 text-sm text-neutral-500">{rating} / 5</span>
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        required
        minLength={5}
        placeholder="Share what you liked or what could be better…"
        className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
      {error && (
        <Alert tone="error" title="Could not save">
          {error}
        </Alert>
      )}
      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </PrimaryButton>
    </form>
  );
}

export function ProductReviewList({ reviews }) {
  if (!reviews?.length) {
    return (
      <p className="text-sm text-neutral-500">
        No reviews yet. Be the first to share feedback after purchasing.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-neutral-800">
              {review.user}
            </span>
            <RatingStars rating={review.rating} showCount={false} />
            <span className="text-xs text-neutral-400">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">
            {review.comment}
          </p>
        </li>
      ))}
    </ul>
  );
}
