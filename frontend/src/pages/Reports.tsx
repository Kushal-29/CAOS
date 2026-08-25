import { Download } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const reports = [
  { title: 'Pending Filings', desc: 'All GST/ITR/TDS/ROC filings not yet completed' },
  { title: 'Completed Filings', desc: 'Filings closed out this month, by client and type' },
  { title: 'Employee Productivity', desc: 'Tasks completed per team member, this month' },
  { title: 'Monthly Workload', desc: 'Open tasks and filings by priority and due date' },
  { title: 'Client Growth', desc: 'New clients onboarded over time, by client type' },
];

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Export firm performance data as PDF or Excel" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary !px-2.5 text-xs"><Download className="h-3.5 w-3.5" /> PDF</button>
              <button className="btn-secondary !px-2.5 text-xs"><Download className="h-3.5 w-3.5" /> Excel</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">
        Export wiring (PDF/Excel generation) is a TODO in this scaffold — see README module status table.
      </p>
    </div>
  );
}
