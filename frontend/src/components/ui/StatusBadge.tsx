import clsx from 'clsx';

const styles: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-ink-700 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-accent-dark dark:bg-accent/20 dark:text-white',
  WAITING_FOR_CLIENT: 'bg-amber-50 text-warning dark:bg-amber-500/10',
  REVIEW: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  COMPLETED: 'bg-emerald-50 text-success dark:bg-emerald-500/10',
  OVERDUE: 'bg-red-50 text-danger dark:bg-red-500/10',
};

const labels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_CLIENT: 'Waiting for Client',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={clsx('badge', styles[status] || styles.PENDING)}>{labels[status] || status}</span>;
}
