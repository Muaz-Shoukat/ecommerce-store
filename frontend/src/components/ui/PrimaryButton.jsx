function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Pill CTA — dark teal by default, white on hover (matches brand reference).
 */
export default function PrimaryButton({
  children,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(
        'inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full border-2 border-primary-800 bg-primary-800 px-6 text-sm font-semibold text-white shadow-card transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-primary-800 hover:bg-white hover:text-primary-800 hover:shadow-lift',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        'active:translate-y-0 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-primary-800 disabled:hover:bg-primary-800 disabled:hover:text-white disabled:hover:shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
