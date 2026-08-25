import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Filing } from '../types';
import PageHeader from '../components/ui/PageHeader';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  GST: 'bg-blue-500', ITR: 'bg-emerald-500', TDS: 'bg-amber-500', ROC: 'bg-purple-500',
  AUDIT: 'bg-red-500', CONSULTATION: 'bg-slate-500',
};

export default function Compliance() {
  const [cursor, setCursor] = useState(new Date());

  const { data } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => (await api.get('/filings')).data.filings as Filing[],
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const filingsByDay = (day: Date) =>
    data?.filter((f) => isSameDay(new Date(f.dueDate), day)) || [];

  return (
    <div>
      <PageHeader
        title="Compliance Calendar"
        subtitle="GST, ITR, TDS, and ROC deadlines across the firm"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary !px-2.5" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium w-32 text-center">{format(cursor, 'MMMM yyyy')}</span>
            <button className="btn-secondary !px-2.5" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-4 mb-4 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-slate-500">
            <span className={`h-2 w-2 rounded-full ${color}`} /> {type}
          </span>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-ink-800 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-3 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = filingsByDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-t border-l border-slate-100 dark:border-ink-700 p-2 ${
                  !isSameMonth(day, cursor) ? 'bg-slate-50/50 dark:bg-ink-900/40' : ''
                }`}
              >
                <p className={`text-xs mb-1.5 ${isSameMonth(day, cursor) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                  {format(day, 'd')}
                </p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((f) => (
                    <div key={f.id} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-ink-700 truncate flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TYPE_COLORS[f.type]}`} />
                      {f.client.name}
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-[11px] text-slate-400">+{items.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
