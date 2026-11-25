function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function IconButton({
  children,
  className = '',
  label,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'group/icon relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-neutral-700 transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary-800 hover:bg-primary-800 hover:text-white hover:shadow-lift',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        className,
      )}
      {...props}
    >
      {children}
      {label && (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100"
        >
          {label}
        </span>
      )}
    </button>
  );
}
