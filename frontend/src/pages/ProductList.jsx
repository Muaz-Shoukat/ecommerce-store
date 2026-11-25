import { LayoutGrid, List, PackageOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../api/productsApi';
import ProductCard from '../components/ProductCard';
import {
  Alert,
  Card,
  EmptyState,
  IconButton,
  LoadingSkeleton,
  PrimaryButton,
  SectionHeader,
} from '../components/ui';
import { useAsync } from '../hooks/useAsync';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');

  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useAsync(() => getCategories(), []);

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useAsync(() => {
    const params = { page, page_size: 12 };
    if (category) params.category = category;
    if (search) params.search = search;
    return getProducts(params);
  }, [category, search, page]);

  const categories = categoriesData?.results ?? [];
  const rawProducts = productsData?.results ?? [];
  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  const products = useMemo(() => {
    let list = [...rawProducts];
    const min = priceMin === '' ? null : Number(priceMin);
    const max = priceMax === '' ? null : Number(priceMax);
    const saleOf = (item) => Number(item.sale_price ?? item.price);
    if (min !== null && !Number.isNaN(min)) {
      list = list.filter((item) => saleOf(item) >= min);
    }
    if (max !== null && !Number.isNaN(max)) {
      list = list.filter((item) => saleOf(item) <= max);
    }
    if (sort === 'price-asc') {
      list.sort((a, b) => saleOf(a) - saleOf(b));
    } else if (sort === 'price-desc') {
      list.sort((a, b) => saleOf(b) - saleOf(a));
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [rawProducts, priceMin, priceMax, sort]);

  function updateParams(mutator) {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next);
  }

  function setCategory(nextCategory) {
    updateParams((next) => {
      if (nextCategory) next.set('category', nextCategory);
      else next.delete('category');
      next.delete('page');
    });
  }

  function submitSearch(event) {
    event.preventDefault();
    updateParams((next) => {
      const value = searchInput.trim();
      if (value) next.set('search', value);
      else next.delete('search');
      next.delete('page');
    });
  }

  function goToPage(nextPage) {
    updateParams((next) => {
      if (nextPage <= 1) next.delete('page');
      else next.set('page', String(nextPage));
    });
  }

  const totalCount = productsData?.count ?? 0;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = Boolean(productsData?.next);
  const hasPrev = Boolean(productsData?.previous);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <SectionHeader
        eyebrow="Catalog"
        title="Products"
        description="Search, filter, and sort the full stationery range."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside>
          <Card className="sticky top-24 space-y-5 p-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Category</h3>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                    !category
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                      category === cat.slug
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">
                Price range
              </h3>
              <p className="mb-2 text-xs text-neutral-500">
                Client-side filter on loaded results
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 px-2 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 px-2 py-2 text-sm"
                />
              </div>
            </div>
          </Card>
        </aside>

        <div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <form onSubmit={submitSearch} className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </form>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
            <div className="flex gap-1">
              <IconButton
                label="Grid view"
                className={view === 'grid' ? 'border-primary-800 bg-primary-800 text-white' : ''}
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={16} />
              </IconButton>
              <IconButton
                label="List view"
                className={view === 'list' ? 'border-primary-800 bg-primary-800 text-white' : ''}
                onClick={() => setView('list')}
              >
                <List size={16} />
              </IconButton>
            </div>
          </div>

          {loading && <LoadingSkeleton lines={6} className="py-8" />}
          {error && (
            <Alert tone="error" title="Could not load products">
              Is the API running at localhost:8000?
            </Alert>
          )}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              icon={PackageOpen}
              title="No products found"
              description="Try another category, price range, or search term."
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div
                className={
                  view === 'grid'
                    ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                    : 'flex flex-col gap-4'
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} layout={view} />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                  Page {page} of {totalPages} · {totalCount} products
                </p>
                <div className="flex gap-2">
                  <PrimaryButton
                    type="button"
                    className="px-4 py-2"
                    disabled={!hasPrev}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    className="px-4 py-2"
                    disabled={!hasNext}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </PrimaryButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
