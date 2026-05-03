import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Truck, Download, 
  ChevronDown, Calendar, User, Package, 
  CheckCircle2, Clock, AlertCircle, MapPin, Loader2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion } from 'motion/react';

const statusStyles = {
  delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  shipped: "bg-blue-50 text-blue-600 border-blue-100",
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

export function DeliveryNotes() {
  const { user } = useAuth();
  const { profile } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const path = `companies/${profile.companyId}/deliveryNotes`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeliveryNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
          { label: 'Out for Delivery', value: deliveryNotes.filter(dn => dn.status === 'shipped').length.toString(), sub: 'Active shipments', color: 'blue' },
          { label: 'Delivered (MTD)', value: deliveryNotes.filter(dn => dn.status === 'delivered').length.toString(), sub: 'Successful drops', color: 'emerald' },
          { label: 'Pending Dispatch', value: deliveryNotes.filter(dn => dn.status === 'pending').length.toString(), sub: 'Needs attention', color: 'amber' },
          { label: 'Total Notes', value: deliveryNotes.length.toString(), sub: 'Lifetime count', color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1 text-left">{stat.value}</h4>
            <p className="text-[10px] font-medium text-slate-500 mt-1 text-left line-clamp-1">{stat.sub}</p>
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
          {(deliveryNotes.length > 0 ? deliveryNotes : []).filter(dn => 
            dn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            dn.customer.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((dn) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={dn.id} 
              className="group hover:bg-slate-50 transition-all font-sans text-left"
            >
              <div className="hidden lg:grid grid-cols-[140px_140px_1fr_140px_140px_140px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{dn.id?.replace(`${profile?.companyId}_`, '') || dn.id}</span>
                </div>
                <div className="text-[11px] font-bold text-zinc-500 bg-slate-100 px-2 py-1 rounded w-fit italic truncate max-w-full">
                   #{dn.orderId?.replace(`${profile?.companyId}_`, '') || dn.orderId}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{dn.customer}</span>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500">{dn.date}</div>
                <div className="text-center">
                   <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {dn.carrier || 'Standard'}
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
              <div className="lg:hidden p-5 flex items-start gap-4 text-left">
                 <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                       <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-none truncate">{dn.id?.replace(`${profile?.companyId}_`, '') || dn.id}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest truncate">{dn.customer}</p>
                       </div>
                       <span className={cn(
                          "px-2 px-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                          statusStyles[dn.status as keyof typeof statusStyles]
                       )}>
                          {dn.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500">
                       <span className="flex items-center gap-1.5 truncate"><Package className="w-3 h-3" /> {dn.orderId?.replace(`${profile?.companyId}_`, '') || dn.orderId}</span>
                       <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3" /> {dn.carrier || 'Standard'}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
          {deliveryNotes.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400">
               <Truck className="w-12 h-12 mx-auto opacity-10 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No delivery notes found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
