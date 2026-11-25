function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Soft pill button — outlined by default, fills dark teal on hover.
 */
export default function SecondaryButton({
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
        'inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full border-2 border-primary-800/20 bg-white px-6 text-sm font-semibold text-primary-800 shadow-sm transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-primary-800 hover:bg-primary-800 hover:text-white hover:shadow-lift',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        'active:translate-y-0 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-primary-800/20 disabled:hover:bg-white disabled:hover:text-primary-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
