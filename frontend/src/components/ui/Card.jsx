function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function Card({ children, className = '', hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cx(
        'rounded-lg border border-neutral-200/80 bg-surface-elevated shadow-card',
        hover && 'hover-lift',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
