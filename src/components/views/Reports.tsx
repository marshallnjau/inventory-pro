import React from 'react';
import { 
  FileText, Plus, Search, Calendar, Clock, Download, 
  Play, Trash2, Eye, MoreVertical, LayoutDashboard,
  DollarSign, TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { cn } from '../../lib/utils';

const QUICK_REPORTS = [
  { id: 'summary', title: 'Inventory Summary', desc: 'Quick generate', icon: FileText, color: 'text-slate-700', bg: 'bg-slate-100' },
  { id: 'financial', title: 'Financial Overview', desc: 'Quick generate', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'performance', title: 'Performance Analytics', desc: 'Quick generate', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'category', title: 'Category Breakdown', desc: 'Quick generate', icon: PieChart, color: 'text-cyan-500', bg: 'bg-cyan-50' },
];

const SAVED_REPORTS = [
  { name: 'Inventory Valuation Report', type: 'Inventory', format: 'PDF', schedule: 'Weekly', lastRun: '2024-01-15 09:00', status: 'Ready' },
  { name: 'Stock Movement Analysis', type: 'Analytics', format: 'Excel', schedule: 'Daily', lastRun: '2024-01-16 06:00', status: 'Ready' },
  { name: 'Cash Flow by Category', type: 'Financial', format: 'PDF', schedule: 'Monthly', lastRun: '2024-01-01 08:00', status: 'Ready' },
  { name: 'Purchase Order Summary', type: 'Procurement', format: 'Excel', schedule: 'Weekly', lastRun: '2024-01-14 07:00', status: 'Ready' },
  { name: 'ABC Classification Report', type: 'Analytics', format: 'PDF', schedule: 'Monthly', lastRun: '2024-01-01 08:00', status: 'Generating' },
  { name: 'Deadstock Analysis', type: 'Inventory', format: 'CSV', schedule: 'On-Demand', lastRun: '2024-01-10 14:30', status: 'Ready' },
];

export function Reports() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Generate and schedule inventory reports</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 h-10 rounded-lg font-bold hover:bg-slate-800 transition-all text-xs">
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Quick Generate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_REPORTS.map((report) => (
          <button key={report.id} className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", report.bg, report.color)}>
              <report.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-tight">{report.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{report.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Saved Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Saved Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Report Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Format</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Run</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {SAVED_REPORTS.map((report, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        {report.type === 'Analytics' ? <BarChart3 className="w-4 h-4" /> : 
                         report.type === 'Financial' ? <DollarSign className="w-4 h-4" /> : 
                         <FileText className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{report.type}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 text-slate-400 uppercase tracking-widest">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-300" /> {report.schedule}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400">{report.lastRun}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight",
                      report.status === 'Ready' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-500"><Play className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900"><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
