import React, { useState, useEffect } from 'react';
import { Plus, Printer, Package, MoreVertical, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, where, setDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';

const GRNS_SEED = [
  {
    id: 'GRN-0002',
    postStatus: 'POSTED',
    poRef: 'PO-0002',
    supplier: 'BeanWorld Roasters',
    date: '2026-04-20',
    itemCount: 1
  },
  {
    id: 'GRN-0001',
    postStatus: 'POSTED',
    poRef: 'PO-0001',
    supplier: 'TechSource Distributors',
    date: '2026-04-24',
    itemCount: 2
  }
];

export function GRN() {
  const { user } = useAuth();
  const { profile } = useSettings();
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const path = `companies/${profile.companyId}/grns`;
    const q = collection(db, path);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGrns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.companyId]);

  const seedGrns = async () => {
    if (!user || !profile?.companyId) return;
    const path = `companies/${profile.companyId}/grns`;
    try {
      for (const grn of GRNS_SEED) {
        await setDoc(doc(db, path, `${profile.companyId}_${grn.id}`), {
          ...grn,
          id: `${profile.companyId}_${grn.id}`,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Goods Received Notes (GRN)</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Verify and post incoming supplier deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          {grns.length === 0 && (
            <button 
              onClick={seedGrns}
              className="px-4 h-10 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all"
            >
              Seed Sample GRNs
            </button>
          )}
          <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 h-10 rounded-lg font-bold hover:bg-slate-800 transition-all text-xs shrink-0">
            <Plus className="w-4 h-4" />
            Receive Goods (GRN)
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {grns.map((grn) => (
          <div key={grn.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition-all text-left group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-slate-900 tracking-tight">{grn.id?.replace(`${profile?.companyId}_`, '') || grn.id}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {grn.postStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-400 border border-slate-100 uppercase">
                      Ref: {grn.poRef}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                    <span>{grn.supplier}</span>
                    <span>•</span>
                    <span>Received {grn.date}</span>
                    <span>•</span>
                    <span>{grn.itemCount} items</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="flex items-center gap-2 px-4 h-9 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">
                   <Printer className="w-3.5 h-3.5" />
                   Print
                 </button>
                 <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                   <MoreVertical className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        ))}
        {grns.length === 0 && (
          <div className="p-12 text-center text-slate-400">
             <Package className="w-12 h-12 mx-auto opacity-10 mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No goods received notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

