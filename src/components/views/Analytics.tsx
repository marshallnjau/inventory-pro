import React, { useState, useEffect } from 'react';
import { TURNOVER_DATA, MOCK_PRODUCTS } from '../../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import { TrendingUp, DollarSign, Package, BarChart3, Calendar, RotateCcw, FileDown, Activity, MousePointer2, Clock, Ban } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { motion } from 'motion/react';

const COLORS = ['#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

export function Analytics() {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const q = collection(db, `companies/${profile.companyId}/products`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Query error in Analytics:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.companyId]);

  // Dynamic Metrics Calculation
  const allProducts = [...products];
  MOCK_PRODUCTS.forEach(mock => {
    if (!products.some(p => p.sku === mock.sku)) {
      allProducts.push(mock);
    }
  });
  
  const totalCapital = allProducts.reduce((sum, p) => sum + (p.value * p.quantity), 0);
  const totalSKUs = allProducts.length;
  
  const categoryStats = allProducts.reduce((acc: any[], p) => {
    const existing = acc.find(c => c.name === p.category);
    const val = p.value * p.quantity;
    if (existing) {
      existing.value += val;
    } else {
      acc.push({ 
        id: acc.length + 1, 
        name: p.category, 
        value: val, 
        color: COLORS[acc.length % COLORS.length] 
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const movementDataMap = allProducts.reduce((acc, p) => {
    let key = p.movement || 'slow';
    if (p.usage === 'MRO') key = 'mro';
    
    if (!acc[key]) acc[key] = { value: 0, items: 0 };
    acc[key].value += p.value * p.quantity;
    acc[key].items += p.quantity; // Summing quantities as requested
    return acc;
  }, {} as any);

  const MOVEMENT_DATA = [
    { name: 'Fast Moving', key: 'fast', color: 'bg-blue-500', icon: TrendingUp, desc: 'High demand, maintain stock' },
    { name: 'Moderate', key: 'moderate', color: 'bg-emerald-500', icon: Activity, desc: 'Steady sales, monitor trends' },
    { name: 'Slow Moving', key: 'slow', color: 'bg-amber-500', icon: Clock, desc: 'Consider discounts' },
    { name: 'Obsolete', key: 'obsolete', color: 'bg-rose-500', icon: Ban, desc: 'Liquidate or clear' },
    { name: 'MRO', key: 'mro', color: 'bg-slate-500', icon: MousePointer2, desc: 'Maintenance, repair & operations' },
  ].map(m => {
    const data = movementDataMap[m.key] || { value: 0, items: 0 };
    return {
      ...m,
      value: data.value,
      items: data.items,
      percentage: totalCapital > 0 ? Math.round((data.value / totalCapital) * 100) : 0
    };
  });

  // ABC Analysis (70/20/10 rule simulation based on value density)
  const sortedByValue = [...allProducts].sort((a, b) => (b.value * b.quantity) - (a.value * a.quantity));
  let cumulativeValue = 0;
  const abcAnalysis = [
    { class: 'A', limit: 0.7, items: [] as any[], val: 0, color: 'bg-emerald-500', desc: 'High-value items requiring tight control.' },
    { class: 'B', limit: 0.9, items: [] as any[], val: 0, color: 'bg-blue-500', desc: 'Medium-value items. Balance control and efficiency.' },
    { class: 'C', limit: 1.0, items: [] as any[], val: 0, color: 'bg-slate-400', desc: 'Low-value items. Simplify ordering processes.' },
  ];

  sortedByValue.forEach(p => {
    const pVal = p.value * p.quantity;
    cumulativeValue += pVal;
    const ratio = totalCapital > 0 ? cumulativeValue / totalCapital : 1;
    if (ratio <= 0.7) {
      abcAnalysis[0].items.push(p);
      abcAnalysis[0].val += pVal;
    } else if (ratio <= 0.9) {
      abcAnalysis[1].items.push(p);
      abcAnalysis[1].val += pVal;
    } else {
      abcAnalysis[2].items.push(p);
      abcAnalysis[2].val += pVal;
    }
  });

  // XYZ Analysis
  const xyzCounts = products.reduce((acc, p) => {
    const key = p.xyzClassification || 'Y';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Deep insights into inventory performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 h-10 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs">
            <Calendar className="w-4 h-4" />
            Last 30 Days <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <button className="flex items-center gap-2 px-4 h-10 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs">
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 h-10 rounded-lg font-bold hover:bg-slate-800 transition-all text-xs">
            <FileDown className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="text-left">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">4.2x</p>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-1.5">Avg Turnover</p>
          </div>
        </div>
        {/* Total Inventory */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">{currency}{(totalCapital / 1000).toFixed(0)}K</p>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-1.5">Total Inventory</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">{totalSKUs.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-1.5">Active SKUs</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4 text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">87%</p>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-1.5">Fill Rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turnover Trend */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
          <div className="mb-0">
            <h3 className="text-lg font-extrabold text-slate-900">Stock Turnover Trend</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Monthly inventory turnover ratio</p>
          </div>
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TURNOVER_DATA}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}x`}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="turnover" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Tied by Category */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col text-left">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">Cash Tied by Category</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Distribution of inventory value</p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-between gap-8 py-2">
            <div className="relative w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.length > 0 ? categoryStats : [{ name: 'No Data', value: 1, color: '#f1f5f9' }]}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[12px] font-medium text-slate-400 tracking-tight">Total</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">
                  {currency}{totalCapital >= 1000000 
                    ? `${(totalCapital / 1000000).toFixed(1)}M` 
                    : totalCapital.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex-1 w-full space-y-3 min-w-[200px]">
              {categoryStats.slice(0, 7).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{cat.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{currency}{cat.value.toLocaleString()}</span>
                </div>
              ))}
              {categoryStats.length > 7 && (
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
                  + {categoryStats.length - 7} more categories
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stock Movement Analysis */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Stock Movement Analysis</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">Inventory categorized by sales velocity</p>
            </div>
            <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[200px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Inventory Value</p>
              <p className="text-xl font-black text-slate-900">{currency}{totalCapital.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {MOVEMENT_DATA.map((segment, i) => (
              <motion.div 
                key={i} 
                initial={{ width: 0 }}
                animate={{ width: `${segment.percentage}%` }}
                className={cn("h-full transition-all duration-1000", segment.color)} 
                title={`${segment.name}: ${segment.percentage}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {MOVEMENT_DATA.map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4 }}
                className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.name}</p>
                    <h4 className="text-lg font-black text-slate-900 leading-none">
                      {currency}{item.value.toLocaleString()}
                    </h4>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100/50">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-slate-700">{item.items.toLocaleString()} items</p>
                      <p className={cn("text-[11px] font-black", item.color.replace('bg-', 'text-'))}>{item.percentage}%</p>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ABC Analysis */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">ABC Analysis</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Value-based inventory classification</p>
            </div>
          </div>

          <div className="space-y-6">
            {abcAnalysis.map((item, i) => (
              <div key={i} className="space-y-3 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-sm font-bold text-slate-900">Class {item.class}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{currency}{item.val.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-left">
                  <span className="text-slate-400">Items: <span className="text-slate-900">{item.items.length}</span> <span className="text-slate-400 font-medium tracking-tight">({totalSKUs > 0 ? Math.round((item.items.length/totalSKUs)*100) : 0}%)</span></span>
                  <span className="text-slate-400">Value: <span className="text-blue-600">{totalCapital > 0 ? Math.round((item.val/totalCapital)*100) : 0}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XYZ Analysis (Demand Analysis) */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm text-left text-left">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">XYZ (Demand) Analysis</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Consumption-variance classification</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-center">
                  <span className="text-lg font-black text-indigo-500">X</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Steady</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-lg font-black text-purple-500">Y</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Var</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-lg font-black text-pink-500">Z</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Stoch</span>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { 
                class: 'Class X', 
                key: 'X',
                desc: 'Constant consumption. High accuracy in forecasting.',
                reliability: '95%',
                color: 'bg-indigo-500'
              },
              { 
                class: 'Class Y', 
                key: 'Y',
                desc: 'Varying demand (seasonal/trends). Medium accuracy.',
                reliability: '75%',
                color: 'bg-purple-500'
              },
              { 
                class: 'Class Z', 
                key: 'Z',
                desc: 'Irregular/Stochastic demand. Difficult to forecast.',
                reliability: '40%',
                color: 'bg-pink-500'
              },
            ].map((item, i) => (
              <div key={i} className="space-y-3 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-sm font-bold text-slate-900">{item.class}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{item.reliability} Accuracy</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                <p className="text-[10px] font-bold text-slate-400">Total Items: <span className="text-slate-900">{xyzCounts[item.key] || 0}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* ABC-XYZ Combination Matrix */}
        <div className="lg:col-span-3 bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
            <div>
              <h3 className="text-xl font-black text-white">ABC/XYZ Efficiency Matrix</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">The intersection of value (ABC) and predictability (XYZ) defines your core procurement strategy.</p>
              
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">AX Items: The Gold Standard</span>
                   </div>
                   <p className="text-[11px] text-slate-400">High value items with constant demand. Focus on JIT (Just-in-Time) delivery and high-frequency replenishment.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">CZ Items: The Tail End</span>
                   </div>
                   <p className="text-[11px] text-slate-400">Low value, irregular demand items. Use bulk ordering or manual review to minimize handling costs.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
              <div className="grid grid-cols-4 gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-1">
                 <div /> <div>X</div> <div>Y</div> <div>Z</div>
              </div>
              <div className="grid grid-cols-[30px_1fr_1fr_1fr] gap-1">
                 {/* A Row */}
                 <div className="flex items-center justify-center font-black text-slate-500">A</div>
                 <div className="aspect-square bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30 group hover:bg-emerald-500/40 transition-all cursor-help relative text-left">
                    <span className="text-emerald-400 font-bold">AX</span>
                 </div>
                 <div className="aspect-square bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                    <span className="text-emerald-400/60 font-bold">AY</span>
                 </div>
                 <div className="aspect-square bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                    <span className="text-amber-400/60 font-bold">AZ</span>
                 </div>

                 {/* B Row */}
                 <div className="flex items-center justify-center font-black text-slate-500">B</div>
                 <div className="aspect-square bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                    <span className="text-blue-400/60 font-bold">BX</span>
                 </div>
                 <div className="aspect-square bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                    <span className="text-blue-400/60 font-bold">BY</span>
                 </div>
                 <div className="aspect-square bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                    <span className="text-amber-400/60 font-bold">BZ</span>
                 </div>

                 {/* C Row */}
                 <div className="flex items-center justify-center font-black text-slate-500">C</div>
                 <div className="aspect-square bg-slate-500/10 rounded-lg flex items-center justify-center border border-slate-500/20">
                    <span className="text-slate-400/60 font-bold">CX</span>
                 </div>
                 <div className="aspect-square bg-slate-500/10 rounded-lg flex items-center justify-center border border-slate-500/20">
                    <span className="text-slate-400/60 font-bold">CY</span>
                 </div>
                 <div className="aspect-square bg-pink-500/20 rounded-lg flex items-center justify-center border border-pink-500/30">
                    <span className="text-pink-400 font-bold">CZ</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
