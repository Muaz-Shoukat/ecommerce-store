import { Sparkles } from 'lucide-react';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl overflow-hidden lg:grid-cols-2">
      <div className="flex items-center px-4 py-10 md:px-8 animate-[fadeSlideIn_400ms_ease-out]">
        <div className="mx-auto w-full max-w-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Stationery Store
          </p>
          <h1 className="font-display text-3xl text-neutral-900 md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-accent-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_30%)]" />
        <div className="relative">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Sparkles size={22} />
          </div>
          <h2 className="font-display text-4xl leading-tight">
            School days,
            <br />
            beautifully stocked.
          </h2>
          <p className="mt-4 max-w-sm text-primary-50">
            Pens, bags, bottles, and uniforms — curated for kids who like their
            supplies as sharp as their ideas.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {['Pens', 'Bags', 'Kits'].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-wide text-primary-100">Aisle</p>
              <p className="mt-1 font-display text-xl">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
