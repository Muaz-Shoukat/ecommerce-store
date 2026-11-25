import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { getStockStatus } from '../utils/stockStatus';
import {
  Badge,
  Card,
  IconButton,
  Modal,
  PriceTag,
  PrimaryButton,
  RatingStars,
  SecondaryButton,
} from './ui';

/** PLACEHOLDER: fake discount only on selected product ids for UI demo */
function placeholderDiscount(productId) {
  if (productId % 4 === 0) return 15;
  if (productId % 5 === 0) return 10;
  return null;
}

export default function ProductCard({ product, layout = 'grid' }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const stock = getStockStatus(product.stock);
  const discount = placeholderDiscount(product.id);
  const [quickOpen, setQuickOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [added, setAdded] = useState(false);

  const averageRating = Number(product.average_rating) || 0;
  const reviewCount = Number(product.review_count) || 0;
  const soldCount = Number(product.sold_count) || 0;

  function handleAdd(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!stock.inStock) return;
    addItem({ product, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function toggleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();
    setFavorited((value) => !value);
  }

  function openQuickView(event) {
    event.preventDefault();
    event.stopPropagation();
    setQuickOpen(true);
  }

  function goToReviews(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    navigate(`/products/${product.slug}#reviews`);
  }

  const isList = layout === 'list';

  return (
    <>
      <Card
        className={`group relative ${
          isList ? 'flex flex-col gap-0 sm:flex-row' : ''
        }`}
      >
        <div
          className={`relative overflow-hidden bg-neutral-100 ${
            isList
              ? 'rounded-t-lg sm:w-48 sm:shrink-0 sm:rounded-l-lg sm:rounded-tr-none'
              : 'aspect-square rounded-t-lg'
          }`}
        >
          <Link
            to={`/products/${product.slug}`}
            className="block h-full w-full no-underline"
          >
            <img
              src={product.image}
              alt={product.name}
              className={`w-full object-cover transition duration-300 group-hover:scale-110 ${
                isList ? 'aspect-square sm:h-full' : 'h-full'
              }`}
            />
          </Link>

          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2">
            <Badge tone={stock.tone}>{stock.label}</Badge>
            {/* PLACEHOLDER: discount badge */}
            {discount && <Badge tone="accent">-{discount}% off</Badge>}
          </div>

          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <IconButton
              label="Quick view"
              className="h-9 w-9 border-white/80 bg-white/95 shadow-sm hover:translate-y-0"
              onClick={openQuickView}
            >
              <Eye size={15} />
            </IconButton>
            {/* PLACEHOLDER: favorite is UI-only, not persisted */}
            <IconButton
              label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              className={`h-9 w-9 border-white/80 bg-white/95 shadow-sm hover:translate-y-0 ${
                favorited ? 'border-accent-400 text-accent-500' : ''
              }`}
              onClick={toggleFavorite}
            >
              <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
            </IconButton>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          {product.category?.name && (
            <Badge tone="primary" className="w-fit">
              {product.category.name}
            </Badge>
          )}
          <Link to={`/products/${product.slug}`} className="no-underline">
            <h3 className="font-display text-lg leading-snug text-neutral-900">
              {product.name}
            </h3>
          </Link>
          <RatingStars
            rating={averageRating}
            count={reviewCount}
            onCountClick={goToReviews}
          />
          <div className="flex flex-wrap items-center gap-2">
            <PriceTag amount={product.price} />
            {/* PLACEHOLDER: struck-through "compare" price */}
            {discount && (
              <span className="text-sm text-neutral-400 line-through">
                Rs {(Number(product.price) / (1 - discount / 100)).toFixed(0)}
              </span>
            )}
            <span className="text-xs font-medium text-neutral-500">
              {soldCount} sold
            </span>
          </div>

          <div className="mt-auto pt-3">
            <PrimaryButton
              type="button"
              className="w-full px-3 text-xs"
              disabled={!stock.inStock}
              onClick={handleAdd}
            >
              <ShoppingBag size={14} />
              {added ? 'Added' : 'Add'}
            </PrimaryButton>
          </div>
        </div>
      </Card>

      <Modal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title={product.name}
      >
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full rounded-md object-cover"
          />
          <div className="space-y-3">
            {product.category?.name && (
              <Badge tone="primary">{product.category.name}</Badge>
            )}
            <RatingStars
              rating={averageRating}
              count={reviewCount}
              onCountClick={() => {
                setQuickOpen(false);
                goToReviews();
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <PriceTag amount={product.price} className="text-lg" />
              <span className="text-xs font-medium text-neutral-500">
                {soldCount} sold
              </span>
            </div>
            <Badge tone={stock.tone}>{stock.label}</Badge>
            <p className="text-sm text-neutral-500">
              {product.description || 'No description available.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton
                type="button"
                disabled={!stock.inStock}
                onClick={() => {
                  handleAdd();
                  setQuickOpen(false);
                }}
              >
                Add to cart
              </PrimaryButton>
              <Link to={`/products/${product.slug}`} className="no-underline">
                <SecondaryButton type="button" onClick={() => setQuickOpen(false)}>
                  View details
                </SecondaryButton>
              </Link>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
