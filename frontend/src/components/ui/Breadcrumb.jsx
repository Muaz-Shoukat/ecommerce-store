import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="text-neutral-300" />}
              {isLast || !item.to ? (
                <span className="font-medium text-neutral-800">{item.label}</span>
              ) : (
                <Link to={item.to} className="transition hover:text-primary-700">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
