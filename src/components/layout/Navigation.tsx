import React from 'react';
import { 
  LayoutDashboard, Package, Grid, BarChart3, Settings, Menu, X, 
  ChevronDown, Bell, Search, Plus, User, Warehouse, FileText, 
  ShoppingCart, Factory, Users, ShieldCheck, AlertCircle, HelpCircle,
  Wrench, Building, ClipboardCheck, Layers, ClipboardList, Gauge,
  Receipt, Truck, FileX
} from 'lucide-react';
import { ViewType } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'pos' as ViewType, label: 'POS', icon: ShoppingCart },
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory' as ViewType, label: 'Inventory', icon: Package },
  { id: 'categories' as ViewType, label: 'Categories', icon: Grid },
  { id: 'warehouses' as ViewType, label: 'Warehouses', icon: Warehouse },
];

const insightsItems = [
  { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
  { id: 'supplier' as ViewType, label: 'Supplier Analytics', icon: Gauge },
  { id: 'reports' as ViewType, label: 'Reports', icon: FileText },
  { id: 'warranties' as ViewType, label: 'Warranties', icon: ShieldCheck },
  { id: 'alerts' as ViewType, label: 'Alerts', icon: Bell, badge: '!' },
];

export function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    sales: true,
    procurement: true,
    production: false,
    contacts: true,
    insights: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  React.useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen || isLargeScreen ? 0 : -280 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-brand-sidebar text-[#e0e0e0] z-50 flex flex-col lg:translate-x-0 transition-none border-r border-brand-border h-screen",
          !isOpen && "lg:block"
        )}
      >
        <div className="p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center shadow-lg shadow-[#10b981]/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-none">InventoryPro</h1>
              <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-wider">Smart Decisions</p>
            </div>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-8 mt-4 overflow-y-auto no-scrollbar pb-10">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                  currentView === item.id
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-colors",
                  currentView === item.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                <span className="text-xs font-semibold tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('sales')}
              className="w-full px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between hover:text-zinc-300 transition-colors"
            >
              Sales 
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !expandedSections.sales && "-rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {expandedSections.sales && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  {[
                    { id: 'invoices' as ViewType, label: 'Invoices', icon: FileText },
                    { id: 'receipts' as ViewType, label: 'Receipts', icon: Receipt },
                    { id: 'delivery_notes' as ViewType, label: 'Delivery Notes', icon: Truck },
                    { id: 'credit_notes' as ViewType, label: 'Credit Notes / Returns', icon: FileX },
                  ].map((sub) => (
                    <button 
                      key={sub.id} 
                      onClick={() => {
                        onViewChange(sub.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-10 py-2 text-[11px] font-medium transition-colors group",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <sub.icon className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('procurement')}
              className="w-full px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between hover:text-zinc-300 transition-colors"
            >
              Procurement 
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !expandedSections.procurement && "-rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {expandedSections.procurement && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  {[
                    { id: 'purchase_orders' as ViewType, label: 'Purchase Orders', icon: ClipboardList },
                    { id: 'grn' as ViewType, label: 'GRN', icon: Package },
                    { id: 'mro_issues' as ViewType, label: 'MRO Issues', icon: Wrench },
                    { id: 'procurement_hub' as ViewType, label: 'Procurement Hub', icon: ShoppingCart },
                  ].map((sub) => (
                    <button 
                      key={sub.id} 
                      onClick={() => {
                        onViewChange(sub.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-10 py-2 text-[11px] font-medium transition-colors group",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <sub.icon className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('production')}
              className="w-full px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between hover:text-zinc-300 transition-colors"
            >
              Production 
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !expandedSections.production && "-rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {expandedSections.production && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  {[
                    { id: 'bom' as ViewType, label: 'Bills of Materials', icon: Layers },
                    { id: 'production_orders' as ViewType, label: 'Production Orders', icon: Factory },
                  ].map((sub) => (
                    <button 
                      key={sub.id} 
                      onClick={() => {
                        onViewChange(sub.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-10 py-2 text-[11px] font-medium transition-colors group",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <sub.icon className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('contacts')}
              className="w-full px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between hover:text-zinc-300 transition-colors"
            >
              Contacts 
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !expandedSections.contacts && "-rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {expandedSections.contacts && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  {[
                    { id: 'customers' as ViewType, label: 'Customers', icon: User },
                    { id: 'suppliers' as ViewType, label: 'Suppliers', icon: Building },
                  ].map((sub) => (
                    <button 
                      key={sub.id} 
                      onClick={() => {
                        onViewChange(sub.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-10 py-2 text-[11px] font-medium transition-colors group",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <sub.icon className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        currentView === sub.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
             <button 
               onClick={() => toggleSection('insights')}
               className="w-full px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between hover:text-zinc-300 transition-colors"
             >
               Insights 
               <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", !expandedSections.insights && "-rotate-90")} />
             </button>
             <AnimatePresence initial={false}>
               {expandedSections.insights && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ duration: 0.2 }}
                   className="space-y-1 overflow-hidden"
                 >
                    {insightsItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onViewChange(item.id);
                          if (window.innerWidth < 1024) onToggle();
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                          currentView === item.id
                            ? "bg-blue-600/10 text-blue-400"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn(
                            "w-4 h-4 transition-colors",
                            currentView === item.id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                          )} />
                          <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </nav>

        <div className="p-4 space-y-1 mt-auto shrink-0 border-t border-white/5 bg-brand-sidebar">
           <button 
             onClick={() => {
               onViewChange('help');
               if (window.innerWidth < 1024) onToggle();
             }}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-2 transition-colors text-xs font-medium",
               currentView === 'help' ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
             )}
           >
             <HelpCircle className="w-4 h-4" /> Help & Tutorials
           </button>
           <button 
             onClick={() => onViewChange('settings')}
             className="w-full flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-medium"
           >
             <Settings className="w-4 h-4" /> Settings
           </button>
        </div>
      </motion.aside>
    </>
  );
}

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const title = user?.displayName || user?.email?.split('@')[0] || 'User';
  
  return (
    <header className="sticky top-0 z-30 bg-brand-header border-b border-brand-border h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative flex-1 max-w-[200px] sm:max-w-sm group text-left">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        <div className="relative group">
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full relative transition-all duration-300 transform group-hover:scale-105 group-active:scale-95">
            <Bell className="w-5 h-5 transition-transform duration-300" />
            
            {/* Pulsing ring for high visibility */}
            <span className="absolute top-2 right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white overflow-hidden">
                3
              </span>
            </span>
          </button>
          
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-full blur-xl transition-all duration-500 -z-10" />
        </div>

        <div className="flex items-center gap-2 group border-l border-slate-100 pl-4 ml-1 sm:ml-0 relative">
          <div className="hidden lg:block text-right">
            <p className="text-[13px] font-bold text-slate-900 leading-none capitalize">{title}</p>
            <p className="text-[10px] text-slate-500 mt-1">Inventory Manager</p>
          </div>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0 hover:ring-2 hover:ring-blue-500 transition-all group"
            title="Log out"
          >
             {user?.photoURL ? (
               <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-blue-600" />
             )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ currentView, onViewChange }: { currentView: ViewType, onViewChange: (view: ViewType) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden flex items-center justify-between px-2 pb-safe z-40 h-16 sm:h-20 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 gap-1 h-full min-w-[64px] transition-all",
            currentView === item.id ? "text-blue-600" : "text-slate-400"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg transition-all",
            currentView === item.id ? "bg-blue-50" : ""
          )}>
            <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
