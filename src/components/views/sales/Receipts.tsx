import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Receipt, Download, 
  ChevronDown, Calendar, User, DollarSign, CheckCircle2, 
  ArrowUpRight, Link as LinkIcon, Loader2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

export function Receipts() {
  const { user } = useAuth();
  const { profile, currency } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const path = `companies/${profile.companyId}/receipts`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReceipts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.companyId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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

      <div className="divide-y divide-slate-100 font-sans">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Received (MTD)', value: `${currency}${receipts.reduce((acc, r) => acc + (r.total || 0), 0).toLocaleString()}`, sub: 'vs last month +15%', color: 'blue' },
            { label: 'Avg Payment Time', value: 'Instant', sub: 'POS Transactions', color: 'emerald' },
            { label: 'Receipt Count', value: receipts.length.toString(), sub: 'Today', color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1 text-left">{stat.value}</h4>
              <p className="text-[10px] font-medium text-slate-500 mt-1 leading-none text-left">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-sm mt-6 mb-6">
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
          <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
            <div>Receipt ID</div>
            <div>Linked Order</div>
            <div>Customer</div>
            <div className="text-center">Date</div>
            <div className="text-right">Amount</div>
            <div className="text-center">Method</div>
          </div>
          <div className="divide-y divide-slate-100 font-sans">
            {(receipts.length > 0 ? receipts : []).filter(rc => 
              rc.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (rc.customerName && rc.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
            ).map((rc) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={rc.id} 
                className="group hover:bg-slate-50 transition-all font-sans text-left"
              >
                <div className="hidden lg:grid grid-cols-[140px_140px_1fr_120px_120px_140px] gap-4 px-8 py-5 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm truncate max-w-[120px]">{rc.id?.slice(-8) || rc.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 text-[11px] font-bold">
                     <LinkIcon className="w-3 h-3" />
                     {rc.id?.slice(-8)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{rc.customerName || 'Walk-in'}</span>
                  </div>
                  <div className="text-center text-xs font-semibold text-slate-500">
                    {rc.timestamp?.toDate ? rc.timestamp.toDate().toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-right font-black text-slate-900 text-sm">
                    {currency}{(rc.total || 0).toLocaleString()}
                  </div>
                  <div className="flex justify-center">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                      {rc.paymentMethod || 'Default'}
                    </span>
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="lg:hidden p-5 space-y-4 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{rc.id?.slice(-8) || rc.id}</h3>
                      <p className="text-[10px] font-bold text-blue-600 mt-0.5">Linked: {rc.id?.slice(-8)}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                      {rc.paymentMethod || 'Default'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                        <p className="font-bold text-slate-900 text-xs">{rc.customerName || 'Walk-in'}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                        <p className="font-black text-slate-900 text-sm">{currency}{(rc.total || 0).toLocaleString()}</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {receipts.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400">
                 <Receipt className="w-12 h-12 mx-auto opacity-10 mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No receipts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
