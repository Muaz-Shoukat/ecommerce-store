import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';

const styles = {
  success: { className: 'bg-neutral-900 text-white', Icon: CheckCircle2 },
  error: { className: 'bg-error text-white', Icon: XCircle },
  warning: { className: 'bg-warning text-white', Icon: TriangleAlert },
  info: { className: 'bg-info text-white', Icon: Info },
};

export default function Toast({ tone = 'info', message, onClose }) {
  const { className, Icon } = styles[tone] || styles.info;
  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-md px-4 py-3 shadow-lift ${className}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-sm underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
