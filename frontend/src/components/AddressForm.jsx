export default function AddressForm({
  value,
  onChange,
  showLabel = true,
  showDefault = false,
}) {
  function update(field) {
    return (event) => {
      const nextValue =
        event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      onChange({ ...value, [field]: nextValue });
    };
  }

  const fieldClass =
    'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:bg-white';

  return (
    <div className="grid gap-3">
      {showLabel && (
        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Label
          <input
            type="text"
            value={value.label ?? ''}
            onChange={update('label')}
            placeholder="Home, School…"
            required
            className={fieldClass}
          />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
        Full address
        <textarea
          value={value.full_address ?? ''}
          onChange={update('full_address')}
          rows={3}
          required
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
        City
        <input
          type="text"
          value={value.city ?? ''}
          onChange={update('city')}
          required
          className={fieldClass}
        />
      </label>
      {showDefault && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(value.is_default)}
            onChange={update('is_default')}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Set as default address
        </label>
      )}
    </div>
  );
}
