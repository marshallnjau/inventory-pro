/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, Navbar, BottomNav } from './components/layout/Navigation';
import { Dashboard } from './components/views/Dashboard';
import { Inventory } from './components/views/Inventory';
import { Categories } from './components/views/Categories';
import { Analytics } from './components/views/Analytics';
import { Help } from './components/views/Help';
import { Settings as SettingsView } from './components/views/Settings';
import { SupplierAnalytics } from './components/views/SupplierAnalytics';
import { Reports } from './components/views/Reports';
import { Warranties } from './components/views/Warranties';
import { Alerts } from './components/views/Alerts';
import { Customers } from './components/views/Customers';
import { Suppliers } from './components/views/Suppliers';
import { POS } from './components/views/POS';
import { BOM } from './components/views/production/BOM';
import { ProductionOrders } from './components/views/production/ProductionOrders';
import { PurchaseOrders } from './components/views/procurement/PurchaseOrders';
import { GRN } from './components/views/procurement/GRN';
import { MROIssues } from './components/views/procurement/MROIssues';
import { ProcurementHub } from './components/views/procurement/ProcurementHub';
import { Invoices } from './components/views/sales/Invoices';
import { Receipts } from './components/views/sales/Receipts';
import { DeliveryNotes } from './components/views/sales/DeliveryNotes';
import { CreditNotes } from './components/views/sales/CreditNotes';
import { ViewType } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Warehouse, ShieldCheck, FileText, AlertCircle, 
  ClipboardList, Wrench, ShoppingCart, Layers, Factory, User, Building,
  Gauge, Bell, Package, LogIn, Loader2, BarChart3, WifiOff
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, loading: authLoading, login, connectionError } = useAuth();
  const { profile, company, loading: settingsLoading, createCompany } = useSettings();
  const [companyName, setCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-2xl text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">{connectionError}</p>
          <div className="p-3 sm:p-4 bg-slate-50 rounded-xl text-left mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Troubleshooting</p>
            <ul className="text-[10px] sm:text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Ensure the Firestore database was created in your Firebase Console.</li>
              <li>Check your internet connection.</li>
              <li>If the issue persists, try running the Firebase Setup again in AI Studio.</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full h-11 sm:h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-xs sm:text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
        {/* Abstract shapes for background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-3xl animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[2rem] border border-slate-200 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-[#10b981] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#10b981]/20 mb-8">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">InventoryPro</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Smart Decisions • Cloud ERP</p>
            
            <div className="w-full h-px bg-slate-100 my-10" />
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm mb-8">Sign in to manage your inventory and procurement pipeline</p>
            
            <button 
              onClick={login}
              className="w-full flex items-center justify-center gap-3 bg-[#0f172a] text-white h-14 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </button>
            
            <p className="mt-8 text-[10px] text-slate-400 font-medium">
              By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // If user is logged in but has no company, force company creation
  if (!profile?.companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2rem] border border-slate-200 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Create Your Company</h2>
            <p className="text-slate-500 text-sm mt-2">Set up your workspace to begin managing inventory.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all"
              />
            </div>
            
            <button 
              onClick={async () => {
                if (!companyName.trim()) return;
                setIsCreatingCompany(true);
                try {
                  await createCompany(companyName);
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsCreatingCompany(false);
                }
              }}
              disabled={!companyName.trim() || isCreatingCompany}
              className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isCreatingCompany ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Next Step</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'pos': return <POS />;
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'inventory': return <Inventory />;
      case 'categories': return <Categories />;
      case 'analytics': return <Analytics />;
      case 'invoices': return <Invoices />;
      case 'receipts': return <Receipts />;
      case 'delivery_notes': return <DeliveryNotes />;
      case 'credit_notes': return <CreditNotes />;
      case 'purchase_orders': return <PurchaseOrders />;
      case 'grn': return <GRN />;
      case 'mro_issues': return <MROIssues />;
      case 'procurement_hub': return <ProcurementHub />;
      case 'bom': return <BOM />;
      case 'production_orders': return <ProductionOrders />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'warehouses': return <SettingsPlaceholder title="Warehouses Management" description="Monitor and configure your physical storage locations and zoning." icon={Warehouse} />;
      case 'supplier': return <SupplierAnalytics />;
      case 'reports': return <Reports />;
      case 'warranties': return <Warranties />;
      case 'alerts': return <Alerts />;
      case 'help': return <Help />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-900 antialiased font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col min-w-0 overflow-x-hidden",
        isSidebarCollapsed ? "md:pl-[64px]" : "md:pl-[260px]",
        "pl-0"
      )}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 lg:pt-4 lg:pb-8 xl:px-10 xl:pt-4 xl:pb-10 mb-20 lg:mb-0 w-full mx-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, scale: 0.99, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.01, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

const SettingsPlaceholder = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium max-w-sm mt-2">{description}</p>
      <button className="mt-8 px-6 h-11 bg-[#0f172a] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
        Explore Module
      </button>
    </div>
);

function PackageSearch({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.29 7 12 12 20.71 7"></polyline>
      <line x1="12" y1="22" x2="12" y2="12"></line>
      <circle cx="18" cy="18" r="3"></circle>
      <line x1="20.1" y1="20.1" x2="22" y2="22"></line>
    </svg>
  );
}

