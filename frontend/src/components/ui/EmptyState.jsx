import PrimaryButton from './PrimaryButton';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-surface-elevated/70 px-6 py-10 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display text-xl text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <PrimaryButton className="mt-4" onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}
