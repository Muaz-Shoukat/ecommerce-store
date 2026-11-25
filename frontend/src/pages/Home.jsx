import {
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategories, getProducts } from '../api/productsApi';
import ProductCard from '../components/ProductCard';
import {
  ClientsSection,
  ClientVideoReviewsSection,
} from '../components/TrustSections';
import {
  Card,
  LoadingSkeleton,
  PrimaryButton,
  SectionHeader,
} from '../components/ui';
import { useAsync } from '../hooks/useAsync';

const reasons = [
  {
    icon: Sparkles,
    title: 'Thoughtfully designed',
    text: 'Bright colors and durable materials made for everyday school use.',
  },
  {
    icon: Truck,
    title: 'Fast delivery',
    text: 'Same-city shipping options so supplies arrive before Monday morning.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality checked',
    text: 'Every product is reviewed for safety, finish, and kid-friendly use.',
  },
  {
    icon: PackageCheck,
    title: 'Easy returns',
    text: 'Hassle-free exchanges when sizes or colors aren’t quite right.',
  },
];

const testimonials = [
  {
    quote: 'The backpacks are sturdy and my kids actually love packing for school.',
    name: 'Ayesha K.',
    role: 'Parent of two',
  },
  {
    quote: 'Uniforms arrived quickly and the fabric quality is better than expected.',
    name: 'Hassan R.',
    role: 'Frequent shopper',
  },
  {
    quote: 'Finally a stationery shop that feels modern without being overpriced.',
    name: 'Sara M.',
    role: 'Teacher',
  },
];

export default function Home() {
  const {
    data: categoriesData,
    loading: categoriesLoading,
  } = useAsync(() => getCategories(), []);
  const {
    data: productsData,
    loading: productsLoading,
  } = useAsync(() => getProducts({ page_size: 8 }), []);

  const categories = categoriesData?.results ?? [];
  const products = productsData?.results ?? [];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6 md:py-20">
          <div className="text-white">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-100">
              Kids stationery, elevated
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">
              Stationery Store
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-50 md:text-lg">
              Pens, erasers, bottles, uniforms, and bags curated for school days
              that feel polished — and a little more fun.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="no-underline">
                <PrimaryButton>Shop collection</PrimaryButton>
              </Link>
              <Link
                to="/products?category=bags"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-6 text-sm font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-primary-800"
              >
                Explore bags
              </Link>
            </div>
          </div>
          <Card className="border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
            <p className="text-sm uppercase tracking-wide text-primary-100">
              This season
            </p>
            <h2 className="mt-2 font-display text-3xl">Back-to-school essentials</h2>
            <p className="mt-3 text-sm text-primary-50">
              Build a complete kit in minutes — from gel pens to lunch totes.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white no-underline"
            >
              Browse all <ArrowRight size={16} />
            </Link>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <SectionHeader
          eyebrow="Categories"
          title="Shop by aisle"
          description="Jump straight into the supplies you need."
          actionLabel="View all"
          actionTo="/products"
        />
        {categoriesLoading ? (
          <LoadingSkeleton lines={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="no-underline"
              >
                <Card hover className="h-full p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                    Category
                  </p>
                  <h3 className="mt-2 font-display text-xl text-neutral-900">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Explore {category.name.toLowerCase()}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-8">
        <SectionHeader
          eyebrow="Featured"
          title="Popular picks"
          description="Real products from the store catalog."
          actionLabel="Shop all"
          actionTo="/products"
        />
        {productsLoading ? (
          <LoadingSkeleton lines={6} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* PLACEHOLDER: promotional banner — static sample content */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <Card className="overflow-hidden border-none bg-gradient-to-r from-accent-500 via-accent-400 to-primary-500 p-0 text-white shadow-lift">
          <div className="flex flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Limited drop
              </p>
              <h2 className="mt-2 font-display text-3xl">
                Free sticker pack on orders over Rs 2,000
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/90">
                Sample promo only — not connected to coupons or discounts in the
                backend.
              </p>
            </div>
            <Link to="/products" className="no-underline">
              <PrimaryButton>Claim the vibe</PrimaryButton>
            </Link>
          </div>
        </Card>
      </section>

      {/* PLACEHOLDER: why choose us — static marketing copy */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeader
          eyebrow="Why us"
          title="Built for parents, loved by kids"
          description="A smoother way to stock up for school."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <Card key={reason.title} className="p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <reason.icon size={18} />
              </div>
              <h3 className="font-display text-lg text-neutral-900">{reason.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{reason.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <ClientsSection />
      <ClientVideoReviewsSection />

      {/* PLACEHOLDER: testimonials — clearly fake sample content */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Love notes"
            title="What families are saying"
            description="Sample testimonials for layout only — not from real reviews."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="p-4">
                <p className="text-sm leading-relaxed text-neutral-700">
                  “{item.quote}”
                </p>
                <p className="mt-4 text-sm font-semibold text-neutral-900">
                  {item.name}
                </p>
                <p className="text-xs text-neutral-500">{item.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PLACEHOLDER: newsletter — UI only, does not submit */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <Card className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:items-center md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              Newsletter
            </p>
            <h2 className="mt-2 font-display text-3xl text-neutral-900">
              New drops in your inbox
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Placeholder signup — no backend mailing list is connected yet.
            </p>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
            <PrimaryButton type="submit">Notify me</PrimaryButton>
          </form>
        </Card>
      </section>
    </div>
  );
}
