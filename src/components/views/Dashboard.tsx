import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, RefreshCcw, Package, 
  AlertTriangle, Boxes, ShoppingCart, BarChart2, Clock, 
  ChevronRight, ArrowRight, Share2, FileText, Zap, Grid, Bell, ClipboardList, Building,
  Box, ArrowUpRight, AlertCircle, Percent, Minus, Lock, Wrench
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TURNOVER_DATA, MOCK_PRODUCTS, MOCK_ALERTS } from '../../constants';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ViewType } from '../../types';

interface KPIProps {
  title: string;
  value: string;
  change?: { value: string; type: 'up' | 'down' };
  icon: React.ElementType;
  variant?: 'primary' | 'info' | 'warning' | 'danger' | 'gray';
  subtitle?: string;
  className?: string;
}

function KPICard({ title, value, change, icon: Icon, variant = 'gray', subtitle, className }: KPIProps) {
  const variants = {
    primary: "bg-slate-900 text-white border-transparent",
    info: "bg-blue-600 text-white border-transparent",
    warning: "bg-amber-500 text-white border-transparent",
    danger: "bg-rose-500 text-white border-transparent",
    gray: "bg-white text-slate-900 border-slate-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("p-6 rounded-2xl shadow-sm border relative overflow-hidden", variants[variant], className)}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-80", variant === 'gray' ? "text-slate-500" : "text-white/80")}>
            {title}
          </p>
          <h3 className="text-xl font-black tracking-tight">{value}</h3>
          
          {change && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                change.type === 'up' ? (variant === 'gray' ? "bg-emerald-50 text-emerald-600" : "bg-white/20 text-white") : (variant === 'gray' ? "bg-rose-50 text-rose-600" : "bg-white/20 text-white")
              )}>
                {change.type === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {change.value}
              </div>
            </div>
          )}
          {subtitle && (
            <p className={cn("text-[10px] font-bold mt-2 leading-none opacity-60", variant === 'gray' ? "text-slate-400" : "text-white/60")}>{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
          variant === 'gray' ? "bg-slate-50 text-slate-400 border border-slate-100" : "bg-white/10 text-white backdrop-blur-sm"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

export function Dashboard({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.companyId) return;

    const productsQuery = collection(db, `companies/${profile.companyId}/products`);
    const alertsQuery = collection(db, `companies/${profile.companyId}/inventory_alerts`);
    const poQuery = collection(db, `companies/${profile.companyId}/purchaseOrders`);

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribePO = onSnapshot(poQuery, (snapshot) => {
      setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeAlerts();
      unsubscribePO();
    };
  }, [profile?.companyId]);

  // Derived KPIs
  const allProducts = [...products];
  MOCK_PRODUCTS.forEach(mock => {
    if (!products.some(p => p.sku === mock.sku)) {
      allProducts.push(mock);
    }
  });

  const allAlerts = [...alerts];
  if (alerts.length === 0) {
    allAlerts.push(...MOCK_ALERTS);
  }

  const totalCapital = allProducts.reduce((sum, p) => sum + (p.value || 0) * (p.quantity || 0), 0);
  const totalSKUs = allProducts.length;
  const lowStockCount = allProducts.filter(p => p.quantity <= p.minStock).length;
  const activeAlertsCount = allAlerts.length;

  // ABC Analysis Calculation
  const sortedProducts = [...allProducts].sort((a, b) => ((b.value || 0) * (b.quantity || 0)) - ((a.value || 0) * (a.quantity || 0)));
  const abcDataSetup = {
    A: { count: 0, value: 0, description: 'High-value, low-quantity. Critical items requiring tight control.' },
    B: { count: 0, value: 0, description: 'Medium-value items. Balance between control and efficiency.' },
    C: { count: 0, value: 0, description: 'Low-value, high-quantity. Simplify ordering processes.' }
  };

  sortedProducts.forEach((p, index) => {
    const val = (p.value || 0) * (p.quantity || 0);
    const itemPct = allProducts.length > 0 ? (index + 1) / allProducts.length : 0;
    
    if (itemPct <= 0.1) {
      abcDataSetup.A.count++;
      abcDataSetup.A.value += val;
    } else if (itemPct <= 0.35) {
      abcDataSetup.B.count++;
      abcDataSetup.B.value += val;
    } else {
      abcDataSetup.C.count++;
      abcDataSetup.C.value += val;
    }
  });

  const abcDisplay = [
    { class: 'A', name: 'Class A', color: 'bg-emerald-500', ...abcDataSetup.A },
    { class: 'B', name: 'Class B', color: 'bg-blue-500', ...abcDataSetup.B },
    { class: 'C', name: 'Class C', color: 'bg-slate-900', ...abcDataSetup.C },
  ].map(item => ({
    ...item,
    valuePercentage: totalCapital > 0 ? Math.round((item.value / totalCapital) * 100) : 0,
    itemPercentage: allProducts.length > 0 ? Math.round((item.count / allProducts.length) * 100) : 0
  }));

  const categoryStats = allProducts.reduce((acc: any[], p) => {
    const existing = acc.find(c => c.name === p.category);
    const value = p.value * p.quantity;
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: p.category, value, color: COLORS[acc.length % COLORS.length] });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Movement Analysis
  const movementStats = {
    fast: { name: 'Fast Moving', count: 0, value: 0, color: 'bg-emerald-500', textColor: 'text-emerald-600', desc: 'High demand, maintain stock' },
    moderate: { name: 'Moderate', count: 0, value: 0, color: 'bg-blue-500', textColor: 'text-blue-600', desc: 'Steady sales, monitor trends' },
    slow: { name: 'Slow Moving', count: 0, value: 0, color: 'bg-amber-500', textColor: 'text-amber-600', desc: 'Consider discounts' },
    obsolete: { name: 'Obsolete', count: 0, value: 0, color: 'bg-rose-500', textColor: 'text-rose-600', desc: 'Liquidate or clear' },
    mro: { name: 'MRO', count: 0, value: 0, color: 'bg-slate-400', textColor: 'text-slate-500', desc: 'Maintenance, repair & operations' }
  };

  allProducts.forEach(p => {
    const val = (p.value || 0) * (p.quantity || 0);
    if (p.usage === 'MRO') {
      movementStats.mro.count++;
      movementStats.mro.value += val;
    } else {
      const type = (p.movement || 'slow') as keyof typeof movementStats;
      if (movementStats[type]) {
        movementStats[type].count++;
        movementStats[type].value += val;
      }
    }
  });

  const movementTotalValue = Object.values(movementStats).reduce((sum, s) => sum + s.value, 0);
  const getMovementWidth = (val: number) => movementTotalValue > 0 ? `${(val / movementTotalValue) * 100}%` : '0%';

  const movementItems = [
    { ...movementStats.fast, icon: TrendingUp },
    { ...movementStats.moderate, icon: Minus },
    { ...movementStats.slow, icon: TrendingDown },
    { ...movementStats.obsolete, icon: Lock },
    { ...movementStats.mro, icon: Wrench },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Top 6 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Inventory */}
        <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/50 flex flex-col justify-between h-[120px] sm:h-[130px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inventory</span>
            <div className="bg-slate-700/50 p-2 rounded-lg text-slate-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black text-white">{currency}{totalCapital.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-bold text-rose-400">-5.2% <span className="text-slate-500 ml-1">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Stock Turnover */}
        <div className="bg-[#14b8a6] p-5 rounded-xl border border-teal-400/30 flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-left">
            <span className="text-[11px] font-bold text-teal-50 uppercase tracking-wider">Stock Turnover</span>
            <div className="bg-white/20 p-2 rounded-lg text-white">
              <RefreshCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black text-white">4.2x</div>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3 h-3 text-teal-100" />
              <span className="text-[10px] font-bold text-teal-100">+8.3% <span className="text-teal-200/60 ml-1">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-[#f43f5e] p-5 rounded-xl border border-rose-400/30 flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-left">
            <span className="text-[11px] font-bold text-rose-50 uppercase tracking-wider">Active Alerts</span>
            <div className="bg-white/20 p-2 rounded-lg text-white">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black text-white">{activeAlertsCount}</div>
            <p className="text-[10px] font-bold text-rose-100 mt-1">Requires attention</p>
          </div>
        </div>

        {/* Total SKUs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total SKUs</span>
            <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black text-slate-900">{totalSKUs.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500">+2.4% <span className="text-slate-400 ml-1">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
            <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black text-slate-900">{lowStockCount}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Below reorder point</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts, Movement, ABC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Smart Alerts */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between text-left">
            <div>
              <h3 className="font-black text-slate-900 text-base">Smart Alerts</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">Actionable recommendations</p>
            </div>
            <button className="text-xs font-black text-teal-600 flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {[
              { type: 'reorder', title: 'Reorder Required', desc: 'Widget Pro X-500 below reorder point (15 units remaining)', action: 'Create Purchase Order', time: '2 hours ago', icon: AlertTriangle, variant: 'rose' },
              { type: 'expiry', title: 'Expiry Alert', desc: '45 units of Organic Coffee Beans expiring in 14 days', action: 'Run Clearance Sale', time: '3 hours ago', icon: AlertTriangle, variant: 'rose' },
              { type: 'slow', title: 'Slow Moving Stock', desc: 'Premium Headphones (SKU: PH-892) no sales in 60 days', action: 'Apply 15% Discount', time: '5 hours ago', icon: AlertCircle, variant: 'amber' },
              { type: 'overstock', title: 'Overstock Risk', desc: 'USB-C Cables inventory 3x above average demand', action: 'Transfer to Store B', time: '6 hours ago', icon: AlertCircle, variant: 'amber' },
            ].map((alert, i) => (
              <div key={i} className={cn(
                "p-4 rounded-xl border relative group transition-all text-left",
                alert.variant === 'rose' ? "bg-rose-50/40 border-rose-100" : "bg-amber-50/40 border-amber-100"
              )}>
                <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-400">{alert.time}</div>
                <div className="flex gap-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", alert.variant === 'rose' ? "bg-rose-500 text-white" : "bg-amber-500 text-white")}>
                    <alert.icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900">{alert.title}</p>
                    <p className="text-[11px] font-bold text-slate-500 leading-normal">{alert.desc}</p>
                    <button className={cn("text-[11px] font-black underline decoration-2 underline-offset-4 mt-2 inline-flex items-center gap-1", alert.variant === 'rose' ? "text-rose-600" : "text-amber-600")}>
                      {alert.action} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movement Analysis */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 text-left">
            <h3 className="font-extrabold text-slate-900 text-base">Stock Movement Analysis</h3>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Inventory categorized by sales velocity</p>
          </div>
          
          <div className="px-6 pb-2">
            <div className="h-3 w-full rounded-full flex overflow-hidden shadow-inner bg-slate-50 border border-slate-100">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: getMovementWidth(movementStats.fast.value) }} />
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: getMovementWidth(movementStats.moderate.value) }} />
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: getMovementWidth(movementStats.slow.value) }} />
              <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: getMovementWidth(movementStats.obsolete.value) }} />
              <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: getMovementWidth(movementStats.mro.value) }} />
            </div>
          </div>

          <div className="p-6 pt-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {movementItems.map((stat, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -2 }}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col items-start text-left transition-all relative overflow-hidden group bg-white",
                    "border-slate-100 hover:border-slate-200 shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", stat.color)} />
                      <span className="text-[11px] font-bold text-slate-900 tracking-tight">{stat.name}</span>
                    </div>
                    <stat.icon className="w-3.5 h-3.5 text-slate-300 transition-all" />
                  </div>

                  <div className="text-lg font-black text-slate-900 mb-1">{currency}{stat.value.toLocaleString()}</div>
                  
                  <div className="flex justify-between items-center w-full mt-auto mb-2">
                    <span className="text-[10px] font-bold text-slate-400">{stat.count} items</span>
                    <span className={cn("text-[10px] font-black", stat.textColor)}>
                      {movementTotalValue > 0 ? Math.round((stat.value / movementTotalValue) * 100) : 0}%
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                    {stat.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Inventory Value</span>
              <span className="text-lg font-black text-slate-900">{currency}{totalCapital.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ABC Analysis */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 text-left">
            <h3 className="font-black text-slate-900 text-base">ABC Analysis</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Value-based inventory classification</p>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center">
            <div className="flex justify-center gap-12 mb-8 mt-4">
              {['A', 'B', 'C'].map((label, i) => (
                <div key={i} className={cn("text-xl font-black", label === 'A' ? "text-emerald-500" : label === 'B' ? "text-blue-500" : "text-slate-900")}>
                  {label}
                </div>
              ))}
            </div>
            <div className="space-y-4 w-full">
              {abcDisplay.map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", item.color)} />
                      <span className="text-sm font-black text-slate-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{currency}{item.value.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mb-4 leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Items: <span className="text-slate-900">{item.count}</span> ({item.itemPercentage}%)</span>
                    <span>Value: <span className="text-slate-900">{item.valuePercentage}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Categories, Trend, Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cash Tied by Category */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 text-left">
            <h3 className="font-black text-slate-900 text-base">Cash Tied by Category</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Distribution of inventory value</p>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.length > 0 ? categoryStats : [{ name: 'None', value: 1 }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`${currency}${val.toLocaleString()}`, 'Total Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xs font-black text-slate-900">{currency}{(totalCapital / 1000).toFixed(0)}k</p>
              </div>
            </div>
            <div className="flex-1 w-full space-y-2 text-left">
              {categoryStats.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[11px] font-bold text-slate-500 overflow-hidden whitespace-nowrap text-ellipsis max-w-[120px] uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-900">{currency}{((item.value || 0) / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Turnover Trend */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 text-left">
            <h3 className="font-black text-slate-900 text-base">Stock Turnover Trend</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Monthly inventory turnover ratio</p>
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TURNOVER_DATA}>
                <defs>
                  <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="turnover" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTurnover)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 text-left">
            <h3 className="font-black text-slate-900 text-base">Quick Actions</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Frequently used operations</p>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Create PO', icon: ShoppingCart, color: 'bg-teal-500' },
              { label: 'Clearance Sale', icon: Percent, color: 'bg-orange-500' },
              { label: 'Stock Transfer', icon: RefreshCcw, color: 'bg-blue-500' },
              { label: 'Stock Count', icon: ClipboardList, color: 'bg-emerald-500' },
              { label: 'Generate Report', icon: FileText, color: 'bg-slate-700' },
              { label: 'Forecast', icon: BarChart2, color: 'bg-indigo-500' },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all gap-3 group">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110", action.color)}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-600 text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


