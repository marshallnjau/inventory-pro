import React from 'react';
import { Grid, ChevronRight, BarChart, Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { CATEGORY_STATS } from '../../constants';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function Categories() {
  const { settings } = useSettings();
  const currency = settings?.currency || '$';
  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Curation Verticals</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Strategic grouping by velocity and performance</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#0f172a] text-white px-6 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-sm text-xs">
          <Plus className="w-4 h-4" />
          Define Vertical
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 lg:pb-0">
        {[
          { name: 'Priority Flux', desc: 'High demand assets with rapid turnover', stats: { items: 423, val: `${currency}312K`, perc: 33 }, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { name: 'Stable Growth', desc: 'Consistent movement with predictable demand', stats: { items: 687, val: `${currency}298K`, perc: 31 }, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { name: 'Dormant Assets', desc: 'Reduced velocity requiring attention', stats: { items: 512, val: `${currency}198K`, perc: 21 }, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { name: 'Critical Exit', desc: 'Stagnant assets nearing archival limit', stats: { items: 225, val: `${currency}38K`, perc: 4 }, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { name: 'Internal MRO', desc: 'Technical consumables and maintenance stock', stats: { items: 168, val: `${currency}103K`, perc: 11 }, color: 'text-slate-500 bg-slate-50 border-slate-100' },
        ].map((cat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110", cat.color)}>
                  <BarChart className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-lg font-extrabold text-slate-900 leading-tight">{cat.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
               {[
                 { val: cat.stats.items, label: 'Units' },
                 { val: cat.stats.val, label: 'Value' },
                 { val: cat.stats.perc + '%', label: 'Share' }
               ].map((s, j) => (
                 <div key={j} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-lg font-black text-slate-900">{s.val}</p>
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mt-1">{s.label}</p>
                 </div>
               ))}
            </div>

            <button className="w-full h-12 border border-slate-200 rounded-lg shadow-sm font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
              View All Items
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
