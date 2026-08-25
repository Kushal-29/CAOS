import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Task, TaskStatus } from '../types';
import PageHeader from '../components/ui/PageHeader';
import PriorityBadge from '../components/ui/PriorityBadge';
import { MessageSquare, Paperclip } from 'lucide-react';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'WAITING_FOR_CLIENT', label: 'Waiting For Client' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function Kanban() {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data.tasks as Task[],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      api.patch(`/tasks/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading || !data) return <div className="text-sm text-slate-500">Loading board…</div>;

  return (
    <div>
      <PageHeader title="Kanban Board" subtitle="Drag tasks across stages as work progresses" />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnTasks = data.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="flex-1 min-w-[260px] max-w-[300px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) updateStatus.mutate({ id: dragId, status: col.key });
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-ink-700 rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    className="card p-3.5 cursor-grab active:cursor-grabbing hover:border-accent/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{task.title}</p>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    {task.client && (
                      <p className="text-xs text-slate-500 mt-1.5">{task.client.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {!!task._count?.comments && (
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {task._count.comments}</span>
                        )}
                        {!!task._count?.attachments && (
                          <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {task._count.attachments}</span>
                        )}
                      </div>
                      {task.assignee && (
                        <div className="h-6 w-6 rounded-full bg-accent-soft dark:bg-ink-700 text-accent-dark dark:text-white text-[10px] font-semibold flex items-center justify-center">
                          {task.assignee.name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
