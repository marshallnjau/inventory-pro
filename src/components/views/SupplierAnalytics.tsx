import React from 'react';
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle2, 
  BarChart3, Clock, Percent, ShieldCheck, ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const SUPPLIERS = [
  { 
    name: 'TechSource Distributors', 
    grnCount: 1, 
    score: 91.3, 
    label: 'Excellent', 
    leadTime: '9d', 
    delay: '2d', 
    fillRate: '99.2%', 
    rejection: '0.8%',
    color: 'emerald'
  },
  { 
    name: 'BeanWorld Roasters', 
    grnCount: 1, 
    score: 88, 
    label: 'Good', 
    leadTime: '13d', 
    delay: '3d', 
    fillRate: '100%', 
    rejection: '0%',
    color: 'slate'
  },
];

export function SupplierAnalytics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-left">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Supplier Analytics</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Performance, delivery, and quality intelligence from posted GRNs</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Suppliers tracked', value: '2', sub: '', icon: Users },
          { label: 'Avg fill rate', value: '99.6%', sub: '', icon: Percent, color: 'text-emerald-500' },
          { label: 'Late deliveries', value: '2', sub: '', icon: Clock, color: 'text-amber-500' },
          { label: 'Partial deliveries', value: '1', sub: '', icon: AlertTriangle, color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className={cn("text-2xl font-black mt-1", stat.color || "text-slate-900")}>{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Reliability Bar Chart Placeholder */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
        <h3 className="text-lg font-extrabold text-slate-900 mb-8">Reliability Score — Supplier Comparison</h3>
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <span>TechSource Distributors</span>
              <span>91.3%</span>
            </div>
            <div className="h-16 bg-emerald-500 rounded-lg w-[91.3%] shadow-sm shadow-emerald-500/20" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <span>BeanWorld Roasters</span>
              <span>88.0%</span>
            </div>
            <div className="h-16 bg-[#0f172a] rounded-lg w-[88%] shadow-sm shadow-slate-900/20" />
          </div>
          <div className="pt-4 border-t border-slate-50 flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {SUPPLIERS.map((sup, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">{sup.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sup.grnCount} posted GRNs</p>
              </div>
              <div className="text-right">
                <p className={cn("text-3xl font-black tracking-tighter", i === 0 ? "text-emerald-500" : "text-slate-900")}>{sup.score}</p>
                <span className={cn(
                  "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border mt-1",
                  i === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                )}>
                  {i === 0 ? '☆ Excellent' : '☆ Good'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Avg Lead Time', val: sup.leadTime },
                { label: 'Avg Delay', val: sup.delay, color: 'text-rose-500' },
                { label: 'Fill Rate', val: sup.fillRate, color: 'text-emerald-500' },
                { label: 'Rejection Rate', val: sup.rejection, color: 'text-emerald-600' },
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className={cn("text-lg font-black mt-1 text-slate-900", s.color)}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Decision Insights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Decision Insights
          </h3>
          <div className="space-y-3">
            {[
              { text: 'TechSource Distributors has a 99.2% fill rate - highly reliable', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50/50' },
              { text: 'TechSource Distributors is a top performer', icon: ShieldCheck, iconColor: 'text-amber-500', bg: 'bg-amber-50/50' },
              { text: 'BeanWorld Roasters delivers ~3 days late on average', icon: AlertTriangle, iconColor: 'text-amber-500', bg: 'bg-amber-50/50' },
              { text: 'BeanWorld Roasters has a 100% fill rate - highly reliable', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50/50' },
            ].map((insight, i) => (
              <div key={i} className={cn("p-3.5 rounded-lg flex items-center gap-3 border border-transparent hover:border-slate-100 transition-all", insight.bg)}>
                <insight.icon className={cn("w-4 h-4 shrink-0", insight.iconColor)} />
                <p className="text-xs font-semibold text-slate-700 tracking-tight">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Late Delivery Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Late Delivery Report
          </h3>
          <div className="space-y-1">
            {[
              { ref: 'BeanWorld Roasters • GRN-0002', delay: '3d late' },
              { ref: 'TechSource Distributors • GRN-0001', delay: '2d late' },
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 grow">
                <span className="text-xs font-bold text-slate-700">{report.ref}</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                  <TrendingUp className="w-3 h-3 rotate-45" /> {report.delay}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
