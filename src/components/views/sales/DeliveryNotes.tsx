import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Truck, Download, 
  ChevronDown, Calendar, User, Package, 
  CheckCircle2, Clock, AlertCircle, MapPin
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

const MOCK_DELIVERIES = [
  { id: 'DN-2024-501', orderId: 'ORD-882', customer: 'Acme Corp', date: '2024-03-22', status: 'shipped', carrier: 'FedEx' },
  { id: 'DN-2024-502', orderId: 'ORD-885', customer: 'Nexus Systems', date: '2024-03-24', status: 'delivered', carrier: 'DHL' },
  { id: 'DN-2024-503', orderId: 'ORD-889', customer: 'Starlight Inc', date: '2024-03-25', status: 'pending', carrier: 'UPS' },
  { id: 'DN-2024-504', orderId: 'ORD-891', customer: 'Global Tech', date: '2024-03-25', status: 'shipped', carrier: 'Internal' },
];

const statusStyles = {
  delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  shipped: "bg-blue-50 text-blue-600 border-blue-100",
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

export function DeliveryNotes() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Delivery Notes</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Track dispatch and shipping performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" />
            Bulk Print
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            Create Dispatch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Out for Delivery', value: '12', sub: 'Active shipments', color: 'blue' },
          { label: 'Delivered (MTD)', value: '148', sub: '98.5% on-time', color: 'emerald' },
          { label: 'Pending Dispatch', value: '5', sub: 'Needs attention', color: 'amber' },
          { label: 'Returned', value: '2', sub: 'Last 30 days', color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
            <p className="text-[10px] font-medium text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by ID, Order, or Customer..."
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="shrink-0 flex items-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
            <Truck className="w-4 h-4" /> Carrier <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[140px_140px_1fr_140px_140px_140px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>Note ID</div>
          <div>Order Reference</div>
          <div>Customer</div>
          <div className="text-center">Ship Date</div>
          <div className="text-center">Carrier</div>
          <div className="text-center">Status</div>
        </div>
        <div className="divide-y divide-slate-100 font-sans">
          {MOCK_DELIVERIES.filter(dn => 
            dn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            dn.customer.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((dn) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={dn.id} 
              className="group hover:bg-slate-50 transition-all font-sans"
            >
              <div className="hidden lg:grid grid-cols-[140px_140px_1fr_140px_140px_140px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{dn.id}</span>
                </div>
                <div className="text-[11px] font-bold text-zinc-500 bg-slate-100 px-2 py-1 rounded w-fit italic">
                   #{dn.orderId}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{dn.customer}</span>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500">{dn.date}</div>
                <div className="text-center">
                   <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {dn.carrier}
                   </div>
                </div>
                <div className="flex justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                    statusStyles[dn.status as keyof typeof statusStyles]
                  )}>
                    {dn.status}
                  </span>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden p-5 flex items-start gap-4">
                 <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                       <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-none">{dn.id}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{dn.customer}</p>
                       </div>
                       <span className={cn(
                          "px-2 px-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                          statusStyles[dn.status as keyof typeof statusStyles]
                       )}>
                          {dn.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500">
                       <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> {dn.orderId}</span>
                       <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {dn.carrier}</span>
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
