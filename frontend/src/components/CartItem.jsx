import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Card, IconButton, PriceTag } from './ui';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <Card className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
      <img
        src={item.image}
        alt={item.name}
        className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-24"
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg text-neutral-900">{item.name}</h2>
        {item.variantLabel && (
          <p className="text-sm text-neutral-500">{item.variantLabel}</p>
        )}
        <PriceTag amount={item.unitPrice} className="mt-1 text-sm" />
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-neutral-200">
          <button
            type="button"
            className="px-2 py-2"
            aria-label="Decrease quantity"
            onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
          >
            <Minus size={14} />
          </button>
          <span className="min-w-8 text-center text-sm font-semibold">
            {item.quantity}
          </span>
          <button
            type="button"
            className="px-2 py-2"
            aria-label="Increase quantity"
            onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
          >
            <Plus size={14} />
          </button>
        </div>
        <PriceTag amount={lineTotal} />
        <IconButton label="Remove item" onClick={() => onRemove(item.key)}>
          <Trash2 size={16} />
        </IconButton>
      </div>
    </Card>
  );
}
