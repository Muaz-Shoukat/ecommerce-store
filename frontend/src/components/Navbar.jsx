import {
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { IconButton, PrimaryButton, SecondaryButton } from './ui';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop' },
  { to: '/my-orders', label: 'Orders', auth: true },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setUserOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-surface-elevated/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <Link to="/" className="shrink-0 no-underline">
          <span className="font-display text-xl font-semibold text-primary-800 md:text-2xl">
            Stationery Store
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .filter((link) => !link.auth || isAuthenticated)
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-semibold transition duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>

        <form
          onSubmit={handleSearch}
          className="ml-auto hidden min-w-[12.5rem] flex-1 max-w-sm items-center md:flex"
        >
          <label className="relative w-full">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary-400 focus:bg-white"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link to="/cart" className="relative no-underline">
            <IconButton label="Cart">
              <ShoppingBag size={18} />
            </IconButton>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white transition duration-200">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <IconButton
                label="Account menu"
                onClick={() => setUserOpen((open) => !open)}
              >
                <UserRound size={18} />
              </IconButton>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-md border border-neutral-200 bg-surface-elevated shadow-lift">
                  <div className="border-b border-neutral-100 px-3 py-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {user?.username}
                    </p>
                    <p className="text-xs text-neutral-500">Signed in</p>
                  </div>
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 no-underline hover:bg-neutral-50"
                    onClick={() => setUserOpen(false)}
                  >
                    <Package size={16} /> My Orders
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="no-underline">
                <SecondaryButton>Login</SecondaryButton>
              </Link>
              <Link to="/register" className="no-underline">
                <PrimaryButton>Register</PrimaryButton>
              </Link>
            </div>
          )}

          <IconButton
            className="md:hidden"
            label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </IconButton>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200 bg-surface-elevated px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="mb-3">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm outline-none"
              />
            </label>
          </form>
          <div className="flex flex-col gap-1">
            {navLinks
              .filter((link) => !link.auth || isAuthenticated)
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-neutral-700 no-underline hover:bg-neutral-100"
                >
                  {link.label}
                </NavLink>
              ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Logout ({user?.username})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-neutral-700 no-underline"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-primary-700 no-underline"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
