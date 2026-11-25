import { Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getProductBySlug,
  getProductReviews,
  getProductSuggestions,
} from '../api/productsApi';
import ProductCard from '../components/ProductCard';
import ProductReviewForm, {
  ProductReviewList,
} from '../components/ProductReviews';
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  EmptyState,
  LoadingSkeleton,
  PriceTag,
  PrimaryButton,
  RatingStars,
  SecondaryButton,
  SectionHeader,
} from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatCurrency';
import {
  getDiscountPercent,
  getListUnitPrice,
  getSaleUnitPrice,
} from '../utils/productPricing';
import { getStockStatus } from '../utils/stockStatus';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const {
    data: product,
    loading,
    error,
    refetch: refetchProduct,
  } = useAsync(() => getProductBySlug(slug), [slug, isAuthenticated]);
  const categorySlug = product?.category?.slug;
  const {
    data: suggestionsData,
    loading: relatedLoading,
    error: suggestionsError,
  } = useAsync(() => getProductSuggestions(slug, { limit: 4 }), [slug]);
  const {
    data: reviewsData,
    loading: reviewsLoading,
    refetch: refetchReviews,
  } = useAsync(() => getProductReviews(slug, { page_size: 50 }), [slug]);

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [localReviews, setLocalReviews] = useState(null);

  const variants = product?.variants ?? [];
  const activeVariantId =
    selectedVariantId ?? (variants.length > 0 ? variants[0].id : null);
  const activeVariant = variants.find((v) => v.id === activeVariantId) ?? null;
  const displayPrice = product
    ? getSaleUnitPrice(product, activeVariant)
    : 0;
  const listPrice = product ? getListUnitPrice(product, activeVariant) : 0;
  const discount = product ? getDiscountPercent(product) : 0;
  const stockSource = activeVariant ?? product;
  const stock = getStockStatus(stockSource?.stock);
  const related = (
    Array.isArray(suggestionsData)
      ? suggestionsData
      : suggestionsData?.results ?? []
  ).filter((item) => item.slug !== slug);
  const reviews = localReviews ?? reviewsData?.results ?? [];
  const averageRating = Number(product?.average_rating) || 0;
  const reviewCount = Number(product?.review_count) || 0;
  const soldCount = Number(product?.sold_count) || 0;

  const images = product?.image ? [product.image] : [];

  useEffect(() => {
    setLocalReviews(null);
  }, [slug, reviewsData]);

  useEffect(() => {
    if (loading || !product) return;
    if (window.location.hash !== '#reviews') return;
    const el = document.getElementById('reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, product, reviewsLoading]);

  function handleAddToCart() {
    if (!product || !stock.inStock) return;
    addItem({ product, variant: activeVariant, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (!product || !stock.inStock) return;
    addItem({ product, variant: activeVariant, quantity });
    navigate('/checkout');
  }

  function handleReviewSubmitted(review) {
    setLocalReviews((prev) => [review, ...(prev ?? reviews)]);
    refetchProduct();
    refetchReviews();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <EmptyState
          title="Product not found"
          description="This item may be unavailable or the link is incorrect."
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const purchasePanel = (
    <div className="space-y-4">
      {product.category?.name && (
        <Badge tone="primary">{product.category.name}</Badge>
      )}
      <h1 className="font-display text-3xl text-neutral-900 md:text-4xl">
        {product.name}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        <RatingStars
          rating={averageRating}
          count={reviewCount}
          onCountClick={() => {
            document.getElementById('reviews')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }}
        />
        <span className="text-sm font-medium text-neutral-500">
          {soldCount} sold
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <PriceTag
          amount={displayPrice}
          compareAt={discount > 0 ? listPrice : null}
          className="text-2xl"
        />
        {discount > 0 && <Badge tone="accent">-{discount}% off</Badge>}
        <Badge tone={stock.tone}>{stock.label}</Badge>
      </div>

      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-800">Options</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const selected = activeVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-full border-2 px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? 'border-primary-800 bg-primary-800 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                  }`}
                >
                  {variant.name}: {variant.value}
                  {Number(variant.extra_price) > 0
                    ? ` (+${formatCurrency(variant.extra_price)})`
                    : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-800">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white">
          <button
            type="button"
            className="px-3 py-2 text-neutral-600"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            className="px-3 py-2 text-neutral-600"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <PrimaryButton
          type="button"
          className="flex-1"
          disabled={!stock.inStock}
          onClick={handleAddToCart}
        >
          {added ? 'Added!' : 'Add to cart'}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          className="flex-1"
          disabled={!stock.inStock}
          onClick={handleBuyNow}
        >
          Buy now
        </SecondaryButton>
      </div>

      <div className="grid gap-2 text-sm text-neutral-500">
        <p className="flex items-center gap-2">
          <Truck size={16} /> Fast city delivery options
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck size={16} /> Secure checkout
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Card className="overflow-hidden">
            <img
              src={images[0]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </Card>
        </div>

        <div className="lg:hidden">{purchasePanel}</div>
        <Card className="hidden h-fit p-5 lg:sticky lg:top-24 lg:block">
          {purchasePanel}
        </Card>
      </div>

      <section className="mt-10">
        <SectionHeader eyebrow="Details" title="Specifications" />
        <Card className="p-5">
          <p className="whitespace-pre-wrap text-neutral-600">
            {product.description || 'No additional specifications provided.'}
          </p>
        </Card>
      </section>

      <section id="reviews" className="mt-10 scroll-mt-24">
        <SectionHeader
          eyebrow="Feedback"
          title="Customer reviews"
          description={`${reviewCount} review${reviewCount === 1 ? '' : 's'} · ${soldCount} sold`}
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-5">
            {reviewsLoading && !localReviews ? (
              <LoadingSkeleton lines={4} />
            ) : (
              <ProductReviewList reviews={reviews} />
            )}
          </Card>
          <Card className="h-fit p-5">
            <ProductReviewForm
              slug={slug}
              canReview={Boolean(product.can_review)}
              hasReviewed={Boolean(product.has_reviewed)}
              onSubmitted={handleReviewSubmitted}
            />
          </Card>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          eyebrow="Related"
          title="You may also like"
          description="Based on purchases and similar items."
          actionLabel="View category"
          actionTo={
            categorySlug ? `/products?category=${categorySlug}` : '/products'
          }
        />
        {relatedLoading && <LoadingSkeleton lines={4} />}
        {!relatedLoading && suggestionsError && (
          <Alert tone="error" title="Could not load suggestions">
            We could not fetch product suggestions. Try again later or browse the
            catalog.
          </Alert>
        )}
        {!relatedLoading && !suggestionsError && related.length === 0 && (
          <Alert tone="info" title="No related products">
            Try browsing the full catalog instead.
          </Alert>
        )}
        {!relatedLoading && related.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
