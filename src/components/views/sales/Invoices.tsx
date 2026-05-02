import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, FileText, Download, MoreHorizontal, 
  ChevronDown, Calendar, User, DollarSign, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, Loader2
} from 'lucide-react';
import { collection, onSnapshot, query, where, setDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

const MOCK_INVOICES_SEED = [
  { id: 'INV-2024-001', customer: 'Acme Corp', date: '2024-03-15', dueDate: '2024-04-15', amount: 12450.00, status: 'paid' },
  { id: 'INV-2024-002', customer: 'Global Tech', date: '2024-03-18', dueDate: '2024-04-18', amount: 8900.50, status: 'pending' },
  { id: 'INV-2024-003', customer: 'Starlight Inc', date: '2024-03-20', dueDate: '2024-04-20', amount: 3200.00, status: 'overdue' },
  { id: 'INV-2024-004', customer: 'Nexus Systems', date: '2024-03-22', dueDate: '2024-04-22', amount: 15600.00, status: 'paid' },
  { id: 'INV-2024-005', customer: 'Orbit Tech', date: '2024-03-25', dueDate: '2024-04-25', amount: 5400.00, status: 'draft' },
];

const statusStyles = {
  paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
  pending: "bg-blue-50 text-blue-600 border-blue-100",
  overdue: "bg-rose-50 text-rose-600 border-rose-100",
  draft: "bg-slate-50 text-slate-500 border-slate-100",
};

export function Invoices() {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const path = `companies/${profile.companyId}/invoices`;
    const q = collection(db, path);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.companyId]);

  const seedInvoices = async () => {
    if (!user || !profile?.companyId) return;
    const path = `companies/${profile.companyId}/invoices`;
    try {
      for (const inv of MOCK_INVOICES_SEED) {
        await setDoc(doc(db, path, `${profile.companyId}_${inv.id}`), {
          ...inv,
          id: `${profile.companyId}_${inv.id}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Invoiced', value: `${currency}${invoices.reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}`, trend: '+12%', color: 'blue' },
    { label: 'Outstanding', value: `${currency}${invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}`, trend: '-5%', color: 'amber' },
    { label: 'Paid Today', value: `${currency}5,400`, trend: '+8%', color: 'emerald' },
    { label: 'Overdue', value: `${currency}${invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + inv.amount, 0).toLocaleString()}`, trend: '+2%', color: 'rose' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Invoices</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage billing and track customer payments</p>
        </div>
        <div className="flex items-center gap-2 text-left">
          {invoices.length === 0 && (
            <button 
              onClick={seedInvoices}
              className="px-4 h-11 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all"
            >
              Seed Sample Invoices
            </button>
          )}
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search invoices by ID or customer..."
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 text-left">
            <Filter className="w-4 h-4" /> Status <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 text-left">
            <Calendar className="w-4 h-4" /> Date Range <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[140px_1fr_120px_120px_100px_120px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
          <div>Invoice ID</div>
          <div>Customer</div>
          <div>Issue Date</div>
          <div>Due Date</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Status</div>
        </div>
        <div className="divide-y divide-slate-100 font-sans">
          {(invoices.length > 0 ? invoices : []).filter(inv => 
            inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((inv) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={inv.id} 
              className="group hover:bg-slate-50 transition-all text-left"
            >
              <div className="hidden lg:grid grid-cols-[140px_1fr_120px_120px_100px_120px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{inv.id?.replace(`${profile?.companyId}_`, '') || inv.id}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{inv.customer}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500">{inv.date}</div>
                <div className="text-xs font-semibold text-slate-500">{inv.dueDate}</div>
                <div className="text-right font-black text-slate-900 text-sm">
                  {currency}{(inv.amount || 0).toLocaleString()}
                </div>
                <div className="flex justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    statusStyles[inv.status as keyof typeof statusStyles]
                  )}>
                    {inv.status}
                  </span>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{inv.id?.replace(`${profile?.companyId}_`, '') || inv.id}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{inv.customer}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                    statusStyles[inv.status as keyof typeof statusStyles]
                  )}>
                    {inv.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                      <p className="font-black text-slate-900 text-sm">{currency}{(inv.amount || 0).toLocaleString()}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                      <p className="font-bold text-slate-700 text-xs">{inv.dueDate}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
          {invoices.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400">
               <FileText className="w-12 h-12 mx-auto opacity-10 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

