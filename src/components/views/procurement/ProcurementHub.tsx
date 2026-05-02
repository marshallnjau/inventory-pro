import React from 'react';
import { 
  Plus, Search, ShoppingCart, Clock, Truck, 
  CheckCircle2, DollarSign, Package, MoreVertical, 
  Eye, Edit3, ClipboardList
} from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';

const PO_DATA = [
  { id: 'PO-2024-001', supplier: 'TechSupply Inc.', items: 5, total: 12500, status: 'Pending', expected: '2024-01-22' },
  { id: 'PO-2024-002', supplier: 'Global Electronics', items: 12, total: 28750, status: 'Approved', expected: '2024-01-25' },
  { id: 'PO-2024-003', supplier: 'Office Essentials', items: 8, total: 4200, status: 'Shipped', expected: '2024-01-18' },
  { id: 'PO-2024-004', supplier: 'FoodCo Distributors', items: 20, total: 8900, status: 'Received', expected: '2024-01-12' },
  { id: 'PO-2024-005', supplier: 'Premium Goods Ltd', items: 3, total: 15600, status: 'Draft', expected: '2024-01-30' },
];

export function ProcurementHub() {
  const { settings } = useSettings();
  const currency = settings?.currency || 'KSh';
  const [activeTab, setActiveTab] = React.useState('All Orders');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Procurement</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage purchase orders and supplier relationships</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 h-10 rounded-lg font-bold hover:bg-slate-800 transition-all text-xs shrink-0">
          <Plus className="w-4 h-4" />
          Create PO
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: '5', icon: ClipboardList, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Pending Approval', value: `${currency}12,500`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'In Transit', value: `${currency}4,200`, icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-50' },
          { label: 'Total Value', value: `${currency}69,950`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 tracking-tight uppercase leading-none mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="px-6 py-2 border-b border-slate-100 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['All Orders', 'Draft', 'Pending', 'Approved', 'Shipped', 'Received'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap",
                activeTab === tab ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">PO Number</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Expected</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PO_DATA.map((po, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-900">{po.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600">{po.supplier}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-900">{po.items}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-slate-900">{currency}{po.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      po.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      po.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      po.status === 'Shipped' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                      po.status === 'Received' ? "bg-slate-100 text-slate-600 border-slate-200" :
                      "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-3.5 h-3.5 text-slate-300" />
                       <span className="text-[10px] font-bold text-slate-400">{po.expected}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                      {po.status === 'Pending' && (
                        <button className="p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
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
