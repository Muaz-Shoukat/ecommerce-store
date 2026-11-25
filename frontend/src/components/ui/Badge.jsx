function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const tones = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-green-100 text-success',
  warning: 'bg-amber-100 text-warning',
  error: 'bg-red-100 text-error',
  info: 'bg-sky-100 text-info',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone] || tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}
