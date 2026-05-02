import React from 'react';
import { 
  ShieldCheck, Package, Calendar, User, FileText, 
  RefreshCcw, CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

const WARRANTIES = [
  {
    id: 'WAR-0002',
    product: 'Wireless Charger Pad',
    sku: 'WCP-15W',
    customer: 'Acme Corp',
    invoice: 'INV-0001',
    period: '12 months',
    start: '2026-04-27',
    end: '2027-04-27',
    status: 'Active'
  },
  {
    id: 'WAR-0001',
    product: 'Wireless Charger Pad',
    sku: 'WCP-15W',
    customer: 'Acme Corp',
    invoice: 'INV-0001',
    period: '12 months',
    start: '2026-04-27',
    end: '2027-04-27',
    status: 'Active'
  },
];

export function Warranties() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Warranties</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Auto-tracked from invoices • manage claims and replacements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {WARRANTIES.map((war) => (
          <div key={war.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{war.id}</h3>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-1">{war.product}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">{war.sku}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-slate-400">Customer: <span className="text-slate-900 font-bold">{war.customer}</span></span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-slate-400">Invoice: <span className="text-slate-900 font-bold">{war.invoice}</span></span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium text-slate-400">Period: <span className="text-slate-900 font-bold">{war.period}</span></span>
                </div>
                <div className="flex items-center justify-between pb-1">
                   <span className="text-xs font-medium text-slate-400">Valid: <span className="text-slate-900 font-bold">{war.start} → {war.end}</span></span>
                </div>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 p-1 gap-1 border-t border-slate-100 bg-slate-50/50">
              <button className="flex items-center justify-center h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                Mark Claimed
              </button>
              <button className="flex items-center justify-center h-10 px-4 rounded-xl bg-[#0f172a] text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all">
                Replace
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
