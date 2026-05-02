import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Loader2, Calendar, LayoutDashboard } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { cn } from '../../../lib/utils';

export function MROIssues() {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const q = collection(db, `companies/${profile.companyId}/mro_issues`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIssues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'mro_issues');
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.companyId]);

  const totalValue = issues.reduce((sum, i) => sum + (i.totalValue || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">MRO Issues</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Maintenance, Repair, and Operations consumables distribution</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 h-10 rounded-xl font-bold hover:bg-slate-800 transition-all text-xs shrink-0">
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Issues', value: issues.length.toString(), color: 'text-slate-900' },
          { label: 'Value Consumed', value: `${currency}${totalValue.toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Budget Status', value: 'ON TRACK', color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className={cn("text-3xl font-black mt-2", stat.color)}>{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Issues</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead>
                <tr className="border-b border-slate-100">
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                </tr>
             </thead>
             <tbody>
                {loading ? (
                   <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                         <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      </td>
                   </tr>
                ) : issues.length > 0 ? (
                   issues.map((issue) => (
                      <tr key={issue.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                               </div>
                               <span className="font-bold text-slate-900 text-sm uppercase">{issue.department}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="font-black text-slate-900 text-sm">{currency}{issue.totalValue.toLocaleString()}</span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                              issue.status === 'ISSUED' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                               {issue.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-400">
                               <Calendar className="w-3.5 h-3.5" />
                               <span className="text-xs font-bold uppercase">{issue.timestamp ? new Date(issue.timestamp).toLocaleDateString() : 'N/A'}</span>
                            </div>
                         </td>
                      </tr>
                   ))
                ) : (
                   <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                         <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 mx-auto border border-slate-100">
                            <Wrench className="w-6 h-6 text-slate-300" />
                         </div>
                         <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                            No issues recorded
                         </p>
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
