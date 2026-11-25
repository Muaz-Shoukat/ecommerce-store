function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function LoadingSkeleton({ className = '', lines = 3 }) {
  return (
    <div className={cx('animate-pulse space-y-3', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded-full bg-neutral-200"
          style={{ width: `${88 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
