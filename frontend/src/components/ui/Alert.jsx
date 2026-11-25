import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';

const styles = {
  success: {
    className: 'border-green-200 bg-green-50 text-green-800',
    Icon: CheckCircle2,
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-800',
    Icon: XCircle,
  },
  warning: {
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    Icon: TriangleAlert,
  },
  info: {
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    Icon: Info,
  },
};

export default function Alert({ tone = 'info', title, children, className = '' }) {
  const style = styles[tone] || styles.info;
  const Icon = style.Icon;
  return (
    <div className={`flex gap-3 rounded-md border p-3 ${style.className} ${className}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}
