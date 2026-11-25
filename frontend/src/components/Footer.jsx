import { AtSign, Mail, MapPin, Phone, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' },
      { label: 'Pens', to: '/products?category=pens' },
      { label: 'Bags', to: '/products?category=bags' },
      { label: 'Uniforms', to: '/products?category=uniforms' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/' },
      { label: 'My orders', to: '/my-orders' },
      { label: 'Cart', to: '/cart' },
      { label: 'Checkout', to: '/checkout' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-neutral-950 text-neutral-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6 md:py-12">
        <div>
          <p className="font-display text-2xl text-white">Stationery Store</p>
          <p className="mt-3 text-sm text-neutral-400">
            Premium kids stationery for school days that feel a little brighter.
          </p>
          <div className="mt-4 flex gap-3 text-neutral-300">
            {/* PLACEHOLDER: social links are static */}
            <a href="#" aria-label="Share" className="hover:text-white">
              <Share2 size={18} />
            </a>
            <a href="#" aria-label="Email social" className="hover:text-white">
              <AtSign size={18} />
            </a>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              {column.title}
            </h3>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-neutral-400 no-underline hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Contact
          </h3>
          {/* PLACEHOLDER: contact details are static sample content */}
          <ul className="space-y-3 text-sm text-neutral-400">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5" />
              12 School Lane, Lahore
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> 0300-0000000
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> hello@stationerystore.example
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Stationery Store. All rights reserved.
      </div>
    </footer>
  );
}
