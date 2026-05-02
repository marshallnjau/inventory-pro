import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Receipt, Download, 
  ChevronDown, Calendar, User, DollarSign, CheckCircle2, 
  ArrowUpRight, Link as LinkIcon
} from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

const MOCK_RECEIPTS = [
  { id: 'RCT-2024-101', invoiceId: 'INV-2024-001', customer: 'Acme Corp', date: '2024-03-20', amount: 12450.00, method: 'Bank Transfer' },
  { id: 'RCT-2024-102', invoiceId: 'INV-2024-004', customer: 'Nexus Systems', date: '2024-03-23', amount: 15600.00, method: 'Credit Card' },
  { id: 'RCT-2024-103', invoiceId: 'INV-2024-010', customer: 'Starlight Inc', date: '2024-03-24', amount: 1200.00, method: 'PayPal' },
  { id: 'RCT-2024-104', invoiceId: 'INV-2024-012', customer: 'Global Tech', date: '2024-03-25', amount: 8900.50, method: 'Bank Transfer' },
];

export function Receipts() {
  const { settings } = useSettings();
  const currency = settings?.currency || '$';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Receipts</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Record and track all customer payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Received (MTD)', value: `${currency}38,150.50`, sub: 'vs last month +15%', color: 'blue' },
          { label: 'Avg Payment Time', value: '4.2 Days', sub: '-1.2 from average', color: 'emerald' },
          { label: 'Pending Clearances', value: `${currency}2,450`, sub: '3 transactions', color: 'amber' },
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
            placeholder="Search receipts by ID or customer..."
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Payment Method <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>Receipt ID</div>
          <div>Linked Invoice</div>
          <div>Customer</div>
          <div className="text-center">Date</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Method</div>
        </div>
        <div className="divide-y divide-slate-100 font-sans">
          {MOCK_RECEIPTS.filter(rc => 
            rc.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            rc.customer.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((rc) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={rc.id} 
              className="group hover:bg-slate-50 transition-all font-sans"
            >
              <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{rc.id}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-[11px] font-bold">
                   <LinkIcon className="w-3 h-3" />
                   {rc.invoiceId}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{rc.customer}</span>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500">{rc.date}</div>
                <div className="text-right font-black text-slate-900 text-sm">
                  {currency}{rc.amount.toLocaleString()}
                </div>
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                    {rc.method}
                  </span>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rc.id}</h3>
                    <p className="text-[10px] font-bold text-blue-600 mt-0.5">Linked: {rc.invoiceId}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                    {rc.method}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                      <p className="font-bold text-slate-900 text-xs">{rc.customer}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                      <p className="font-black text-slate-900 text-sm">{currency}{rc.amount.toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
