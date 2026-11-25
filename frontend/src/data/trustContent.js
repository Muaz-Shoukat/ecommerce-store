/**
 * Home-page trust content for B2B clients (marts / stores).
 * Swap logoSrc / videoUrl with real assets when available.
 * logoSrc: path under /public, or null to use the monogram fallback.
 * videoUrl: YouTube/Vimeo embed URL, or "" until a real review is ready.
 */

export const storeClients = [
  {
    id: 'metro-mart',
    name: 'Metro Mart',
    tagline: 'National retail chain',
    logoSrc: null,
  },
  {
    id: 'city-superstore',
    name: 'City Superstore',
    tagline: 'Urban grocery & general',
    logoSrc: null,
  },
  {
    id: 'school-essentials-co',
    name: 'School Essentials Co.',
    tagline: 'Education supplier',
    logoSrc: null,
  },
  {
    id: 'family-hyper',
    name: 'Family Hyper',
    tagline: 'Regional hypermarket',
    logoSrc: null,
  },
  {
    id: 'bright-aisle',
    name: 'Bright Aisle',
    tagline: 'Kids & stationery aisle',
    logoSrc: null,
  },
  {
    id: 'campus-depot',
    name: 'Campus Depot',
    tagline: 'Campus retail group',
    logoSrc: null,
  },
];

export const clientVideoReviews = [
  {
    id: 'metro-mart-review',
    clientName: 'Metro Mart',
    role: 'Category Manager',
    title: 'How Metro Mart stocks back-to-school aisles with us',
    quote:
      'Reliable restocks and kid-safe quality checks made them our go-to stationery partner.',
    // Paste a YouTube/Vimeo embed URL, e.g. https://www.youtube.com/embed/VIDEO_ID
    videoUrl: '',
    posterGradient: 'from-primary-700 to-primary-500',
  },
  {
    id: 'city-superstore-review',
    clientName: 'City Superstore',
    role: 'Procurement Lead',
    title: 'Uniforms and bags that move off the shelf',
    quote:
      'Clear packaging, consistent sizing, and on-time delivery for seasonal peaks.',
    videoUrl: '',
    posterGradient: 'from-accent-600 to-primary-600',
  },
  {
    id: 'school-essentials-review',
    clientName: 'School Essentials Co.',
    role: 'Operations Director',
    title: 'Supplying multiple campuses from one catalog',
    quote:
      'One wholesale flow for pens, bottles, and bags — fewer vendors, fewer delays.',
    videoUrl: '',
    posterGradient: 'from-primary-800 to-accent-500',
  },
];
