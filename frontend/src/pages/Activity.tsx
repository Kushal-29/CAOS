import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import { format } from 'date-fns';

interface Log {
  id: string;
  entityType: string;
  action: string;
  createdAt: string;
  user?: { name: string } | null;
}

export default function Activity() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => (await api.get('/activity')).data.logs as Log[],
  });

  return (
    <div>
      <PageHeader title="Activity Timeline" subtitle="Every client, task, and document action across the firm" />

      <div className="card p-5">
        {isLoading && <p className="text-sm text-slate-400">Loading activity…</p>}
        <ol className="relative border-l border-slate-200 dark:border-ink-700 ml-2">
          {data?.map((log) => (
            <li key={log.id} className="mb-5 ml-4">
              <div className="absolute w-2 h-2 bg-accent rounded-full mt-1.5 -left-1 border border-white dark:border-ink-800" />
              <p className="text-sm">
                <span className="font-medium">{log.user?.name || 'System'}</span>{' '}
                <span className="text-slate-500">{log.action.toLowerCase().replace('_', ' ')}d a</span>{' '}
                <span className="font-medium">{log.entityType.toLowerCase()}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
