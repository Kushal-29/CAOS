import clsx from 'clsx';

const styles: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-ink-700 dark:text-slate-300',
  MEDIUM: 'bg-blue-50 text-accent-dark dark:bg-accent/20 dark:text-white',
  HIGH: 'bg-amber-50 text-warning dark:bg-amber-500/10',
  CRITICAL: 'bg-red-50 text-danger dark:bg-red-500/10',
};

export default function PriorityBadge({ priority }: { priority: string }) {
  return <span className={clsx('badge', styles[priority] || styles.MEDIUM)}>{priority}</span>;
}
