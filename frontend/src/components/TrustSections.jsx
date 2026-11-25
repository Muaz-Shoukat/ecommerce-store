import { Play } from 'lucide-react';
import { useState } from 'react';
import { clientVideoReviews, storeClients } from '../data/trustContent';
import { Modal, SectionHeader } from './ui';

function ClientMonogram({ name }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-50 font-display text-lg text-primary-800">
      {initials}
    </div>
  );
}

export function ClientsSection() {
  return (
    <section className="border-y border-neutral-200/80 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeader
          eyebrow="Partners"
          title="Trusted by marts & stores"
          description="Wholesale partners who stock our stationery across city aisles and school seasons."
        />
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {storeClients.map((client) => (
            <li
              key={client.id}
              className="flex flex-col items-center text-center"
            >
              {client.logoSrc ? (
                <img
                  src={client.logoSrc}
                  alt={`${client.name} logo`}
                  className="h-12 w-auto max-w-[7rem] object-contain opacity-90"
                />
              ) : (
                <ClientMonogram name={client.name} />
              )}
              <p className="mt-3 text-sm font-semibold text-neutral-800">
                {client.name}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">{client.tagline}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ClientVideoReviewsSection() {
  const [active, setActive] = useState(null);

  return (
    <>
      <section className="bg-neutral-100/80 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SectionHeader
            eyebrow="Client stories"
            title="Video reviews from our partners"
            description="Hear how marts and store buyers use Stationery Store for seasonal and everyday supply."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {clientVideoReviews.map((review) => (
              <article key={review.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setActive(review)}
                  className="group relative aspect-video w-full overflow-hidden rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  aria-label={`Play video review from ${review.clientName}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${review.posterGradient}`}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-800 shadow-lift transition duration-300 group-hover:scale-105">
                      <Play size={22} fill="currentColor" className="ml-0.5" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10">
                    <p className="text-sm font-semibold text-white">
                      {review.clientName}
                    </p>
                    <p className="text-xs text-white/80">{review.role}</p>
                  </div>
                </button>
                <h3 className="mt-3 font-display text-lg leading-snug text-neutral-900">
                  {review.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">“{review.quote}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.clientName ?? 'Client review'}
      >
        {active && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">{active.title}</p>
            {active.videoUrl ? (
              <div className="aspect-video overflow-hidden rounded-md bg-neutral-900">
                <iframe
                  title={`${active.clientName} video review`}
                  src={`${active.videoUrl}?autoplay=1`}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="rounded-md bg-neutral-100 p-4 text-sm text-neutral-600">
                Video coming soon. Add a YouTube or Vimeo embed URL for this
                client in trust content.
              </p>
            )}
            <p className="text-sm text-neutral-500">“{active.quote}”</p>
          </div>
        )}
      </Modal>
    </>
  );
}
