import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api, taskApi } from '../lib/api';
import type { Task } from '../types';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data.tasks as Task[],
  });

  const handleExportTasks = async () => {
    try {
      const exportData = await taskApi.export();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'FirmTasks');
      XLSX.writeFile(wb, `CAOS_Tasks_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${exportData.length} tasks`);
    } catch (err) {
      toast.error('Failed to export tasks');
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={data ? `${data.length} tasks` : 'Loading…'}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExportTasks} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Download className="h-4 w-4" /> Export (.xlsx)
            </button>
            <button className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="h-4 w-4" /> New Task
            </button>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-ink-800 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading tasks…</td></tr>}
            {data?.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-ink-800/60">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/tasks/${t.id}`} className="hover:text-accent">{t.title}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.client?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.assignee?.name || 'Unassigned'}</td>
                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-slate-500">{t.dueDate ? format(new Date(t.dueDate), 'dd MMM yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
