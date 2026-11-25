import { Link } from 'react-router-dom';

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl text-neutral-900 md:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-neutral-500">{description}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center rounded-full border-2 border-primary-800 bg-primary-800 px-6 py-3 text-sm font-semibold text-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-800 hover:bg-white hover:text-primary-800 hover:shadow-lift"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
