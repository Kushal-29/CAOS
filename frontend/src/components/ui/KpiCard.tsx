import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  hint?: string;
}

const toneClasses: Record<string, string> = {
  default: 'bg-accent-soft text-accent-dark dark:bg-accent/20 dark:text-white',
  warning: 'bg-amber-50 text-warning dark:bg-amber-500/10',
  danger: 'bg-red-50 text-danger dark:bg-red-500/10',
  success: 'bg-emerald-50 text-success dark:bg-emerald-500/10',
};

export default function KpiCard({ label, value, icon: Icon, tone = 'default', hint }: Props) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-semibold mt-1.5 tracking-tight">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className={clsx('h-10 w-10 rounded-lg flex items-center justify-center', toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
