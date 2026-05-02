import React, { useState } from 'react';
import { 
  Search, Filter, Plus, FileX, Download, 
  ChevronDown, Calendar, User, DollarSign, 
  ArrowDownRight, RefreshCcw
} from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

const MOCK_CREDITS = [
  { id: 'CN-2024-012', invoiceId: 'INV-2024-001', customer: 'Acme Corp', date: '2024-03-25', amount: 450.00, reason: 'Damaged Goods' },
  { id: 'CN-2024-015', invoiceId: 'INV-2024-005', customer: 'Orbit Tech', date: '2024-03-26', amount: 120.00, reason: 'Pricing Error' },
];

export function CreditNotes() {
  const { settings } = useSettings();
  const currency = settings?.currency || '$';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Credit Notes / Returns</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage refunds, returns, and billing adjustments</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            Issue Credit Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Credits Issued', value: `${currency}8,420`, sub: 'Last 30 days', color: 'rose' },
          { label: 'Return Rate', value: '1.2%', sub: 'Target: < 2.0%', color: 'emerald' },
          { label: 'Pending Processing', value: `${currency}1,150`, sub: '4 adjustments', color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
            <p className="text-[10px] font-medium text-slate-500 mt-1 leading-none">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search credits by ID or customer..."
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="shrink-0 flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
          <Calendar className="w-4 h-4" /> Date Filter
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>Note ID</div>
          <div>Reference Invoice</div>
          <div>Customer</div>
          <div className="text-center">Issued Date</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Reason</div>
        </div>
        <div className="divide-y divide-slate-100 font-sans">
          {MOCK_CREDITS.filter(cn_item => 
            cn_item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            cn_item.customer.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((cn_item) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={cn_item.id} 
              className="group hover:bg-slate-50 transition-all font-sans"
            >
              <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <FileX className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{cn_item.id}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                   {cn_item.invoiceId}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{cn_item.customer}</span>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500">{cn_item.date}</div>
                <div className="text-right font-black text-rose-600 text-sm">
                  -{currency}{cn_item.amount.toLocaleString()}
                </div>
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                    {cn_item.reason}
                  </span>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden p-5 space-y-3">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="font-bold text-slate-900 text-sm">{cn_item.id}</h3>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{cn_item.customer}</p>
                    </div>
                    <span className="font-black text-rose-600 text-sm">-{currency}{cn_item.amount.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><RefreshCcw className="w-3 h-3" /> {cn_item.reason}</span>
                    <span>Ref: {cn_item.invoiceId}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
