import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, 
  Banknote, Receipt, User, Package, Loader2, CheckCircle2,
  Scan, Pause, RotateCcw, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  sku?: string;
}

const CATEGORIES = ['All', 'Drinks', 'Food', 'Groceries', 'Retail', 'Services'];

export function POS() {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();
  const userName = profile?.name || 'Cashier';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!profile?.companyId) return;
    
    const q = collection(db, `companies/${profile.companyId}/products`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.companyId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const quickAccessProducts = filteredProducts.slice(0, 5);

  const addToCart = (product: any, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.value || 0, 
        quantity: qty,
        category: product.category,
        sku: product.sku,
        ...(product.image ? { image: product.image } : {})
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = 0;
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax - discount;

  const handleCheckout = async (paymentMethod: string) => {
    if (!user || !profile?.companyId || cart.length === 0) return;
    setIsProcessing(true);
    try {
      const receiptData = {
        customerName: 'Walk-in Customer',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          ...(item.image ? { image: item.image } : {})
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
        timestamp: serverTimestamp(),
        status: 'PAID',
        type: 'receipt',
        currency: currency
      };
      
      await addDoc(collection(db, `companies/${profile.companyId}/receipts`), receiptData);

      for (const item of cart) {
        const productRef = doc(db, `companies/${profile.companyId}/products`, item.id);
        const original = products.find(p => p.id === item.id);
        const beforeQty = original?.quantity || 0;
        
        await updateDoc(productRef, {
          quantity: increment(-item.quantity)
        });

        // Record movement
        const movementId = `mov_${Date.now()}_${item.id}`;
        await setDoc(doc(db, `companies/${profile.companyId}/stockMovements`, movementId), {
          id: movementId,
          productId: item.id,
          type: 'sale',
          quantity: item.quantity,
          beforeQty,
          afterQty: beforeQty - item.quantity,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });
      }

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'receipts');
    } finally {
      setIsProcessing(false);
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
    <div className="h-[calc(100vh-70px)] bg-[#f8fafc] overflow-hidden text-left relative flex flex-col">
      <div className="flex-1 p-4 lg:p-8 flex flex-col lg:flex-row-reverse gap-6 lg:gap-8 overflow-hidden">
        
        {/* Main Product Selection Area */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 min-w-0">
          
          {/* Header & Categories Card */}
          <div className="bg-white rounded-[2.5rem] p-5 lg:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-white/50 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div>
                  <h1 className="text-2xl lg:text-4xl font-black text-[#0f172a] tracking-tight">POS</h1>
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 lg:mt-2 opacity-80">
                    {userName} • Shift #1 • Cashier Mode
                  </p>
               </div>
               
               <div className="flex items-center gap-3 lg:gap-4">
                  <div className="relative flex-1 md:w-80 lg:w-96">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                       type="text"
                       placeholder="Search products..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full h-12 lg:h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs lg:text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                     />
                  </div>
                  <button className="h-12 lg:h-14 px-4 lg:px-6 bg-[#0f172a] text-white rounded-2xl flex items-center gap-2 font-black text-xs lg:text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 shrink-0">
                     <Scan className="w-4 h-4 lg:w-5 lg:h-5" />
                     <span className="hidden lg:inline">Scan</span>
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
               {CATEGORIES.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={cn(
                     "px-5 lg:px-6 py-2 lg:py-2.5 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                     activeCategory === cat 
                       ? "bg-[#00a64c] text-white shadow-lg shadow-emerald-100" 
                       : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:text-[#00a64c] hover:border-[#00a64c]"
                   )}
                 >
                   {cat}
                 </button>
               ))}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
               {[
                 { label: 'Today Sales', value: `${currency} 18,450`, mobile: true },
                 { label: 'Orders', value: '64', mobile: true },
                 { label: 'Held', value: 'None', mobile: false },
               ].map((stat, i) => (
                 <div key={i} className={cn(
                   "bg-white p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-white shadow-sm",
                   !stat.mobile && "hidden md:block"
                 )}>
                    <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 lg:mb-2">{stat.label}</p>
                    <h4 className="text-lg lg:text-2xl font-black text-[#0f172a] leading-none">{stat.value}</h4>
                 </div>
               ))}
            </div>

            {/* Quick Access */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest leading-none">Quick Access</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Recent items</span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {quickAccessProducts.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="min-w-[140px] lg:min-w-[150px] bg-white border border-white p-4 lg:p-5 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm hover:shadow-md transition-all text-left group"
                    >
                       <h4 className="text-[10px] lg:text-[11px] font-black text-slate-900 truncate mb-1 uppercase tracking-tight">{product.name}</h4>
                       <p className="text-[7px] lg:text-[8px] text-slate-400 font-bold mb-3 uppercase tracking-tighter">{product.sku}</p>
                       <p className="text-xs font-black text-[#00a64c]">{currency} {product.value?.toLocaleString()}</p>
                    </button>
                  ))}
               </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
               {filteredProducts.map(product => (
                 <div key={product.id} className="bg-white border border-white rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-6 flex flex-col shadow-sm group hover:border-emerald-100/50 transition-all">
                    <div className="flex justify-between items-start mb-4 lg:mb-6">
                       <div className="px-2 lg:px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {product.category || 'RETAIL'}
                          </span>
                       </div>
                       <div className="text-right">
                          <span className={cn(
                            "text-[8px] lg:text-[9px] font-black uppercase tracking-tight block leading-none",
                            product.quantity <= 10 ? "text-rose-500" : "text-[#00a64c]"
                          )}>
                             {product.quantity} left
                          </span>
                       </div>
                    </div>
                    
                    <h4 className="text-xs lg:text-[15px] font-black text-[#0f172a] mb-0.5 lg:mb-1 leading-tight uppercase tracking-tight truncate">{product.name}</h4>
                    <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold mb-4 lg:mb-8 uppercase tracking-tighter truncate opacity-60">SKU: {product.sku}</p>
                    
                    <div className="mt-auto flex flex-col gap-3 lg:gap-5">
                       <div className="flex items-center justify-between">
                          <p className="text-sm lg:text-lg font-black text-[#00a64c]">{currency} {product.value?.toLocaleString()}</p>
                          <button 
                            onClick={() => addToCart(product)}
                            className="bg-[#0f172a] text-white rounded-xl lg:rounded-2xl w-10 h-10 lg:w-14 lg:h-14 flex flex-col items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                          >
                             <Plus className="w-3 h-3 lg:w-4 lg:h-4 mb-0.5" />
                             <span className="text-[6px] lg:text-[7px] font-black uppercase tracking-widest">Add</span>
                          </button>
                       </div>
                       
                       <div className="flex items-center justify-between gap-1.5 lg:gap-2 border-t border-slate-50 pt-3 lg:pt-5">
                          {[1, 2, 5].map(v => (
                            <button 
                              key={v}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, v);
                              }}
                              className="flex-1 py-1.5 lg:py-2.5 bg-slate-50 text-slate-400 text-[8px] lg:text-[9px] font-black rounded-lg lg:rounded-xl border border-slate-100 hover:border-[#00a64c] hover:text-[#00a64c] transition-all"
                            >
                               +{v}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar Side-Card */}
        <aside className="hidden lg:flex lg:w-[420px] flex-col h-full overflow-hidden shrink-0 transition-transform duration-300 ease-in-out translate-x-0">
          <div className="h-full bg-white rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] border border-white flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="p-8 lg:p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
               <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                     <h2 className="text-2xl font-black text-[#0f172a] tracking-tight leading-none">Current Cart</h2>
                     <button 
                        className="lg:hidden p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                        onClick={() => {
                           const aside = document.querySelector('aside');
                           if (aside) {
                              aside.classList.add('translate-x-full');
                              aside.classList.remove('translate-x-0');
                              setTimeout(() => {
                                 aside.classList.remove('flex', 'fixed', 'inset-0', 'z-[60]');
                                 aside.classList.add('hidden');
                              }, 300);
                           }
                        }}
                     >
                        <RotateCcw className="w-4 h-4 rotate-45" />
                     </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{cart.length} items</p>
               </div>
               <div className="w-14 h-14 bg-[#ecfdf5] rounded-2xl flex items-center justify-center text-[#00a64c] border border-emerald-100 shadow-sm">
                  <ShoppingCart className="w-7 h-7" />
               </div>
            </div>

            {/* Cart Toolbar */}
            <div className="px-8 lg:px-10 py-4 grid grid-cols-2 gap-4 border-b border-slate-50 shrink-0">
               <button className="h-12 lg:h-14 flex items-center justify-center gap-2 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest">
                  <Pause className="w-4 h-4" /> Hold
               </button>
               <button className="h-12 lg:h-14 flex items-center justify-center gap-2 bg-[#f8fafc] border border-slate-50 rounded-2xl text-[10px] font-black text-slate-300 cursor-not-allowed uppercase tracking-widest">
                  <RotateCcw className="w-4 h-4" /> Restore
               </button>
            </div>

            {/* Scrollable Cart Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-8 lg:px-10 py-8 space-y-8">
               <AnimatePresence mode="popLayout">
                 {cart.map((item) => (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     key={item.id} 
                     className="flex items-center gap-5 group"
                   >
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-colors">
                         <Package className="w-7 h-7 text-slate-300 group-hover:text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[13px] font-black text-[#0f172a] truncate uppercase tracking-tight leading-tight mb-0.5">{item.name}</h4>
                         <p className="text-[9px] text-slate-400 font-bold tracking-widest">{currency} {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                         <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-2.5 py-1 border border-slate-100">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-[10px] font-black w-5 text-center text-slate-700">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Plus className="w-4 h-4" /></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
               {cart.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-[3rem] flex items-center justify-center mb-8 bg-slate-50">
                       <ShoppingCart className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cart is empty</h3>
                 </div>
               )}
            </div>

            {/* Cart Summary & Pay - Absolute Bottom fixed */}
            <div className="px-8 lg:px-10 pb-10 pt-8 bg-white border-t border-slate-50 space-y-6 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)] shrink-0">
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Subtotal</span>
                     <span className="text-slate-600">{currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Tax/VAT (16%)</span>
                     <span className="text-slate-600">{currency} {tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                     <span className="text-2xl lg:text-3xl font-black text-[#0f172a] uppercase tracking-tight">Total</span>
                     <span className="text-2xl lg:text-3xl font-black text-[#0f172a]">{currency} {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
               </div>

               <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => handleCheckout('cash')} className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-[#0f172a] transition-all">
                     <Banknote className="w-5 h-5 text-slate-400" />
                     <span className="text-[8px] font-black uppercase text-slate-600">Cash</span>
                  </button>
                  <button onClick={() => handleCheckout('mpesa')} className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-[#00a64c] hover:text-white transition-all group">
                     <Smartphone className="w-5 h-5 text-emerald-500 group-hover:text-white" />
                     <span className="text-[8px] font-black uppercase text-emerald-600 group-hover:text-white">M-Pesa</span>
                  </button>
                  <button onClick={() => handleCheckout('card')} className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-[#0f172a] transition-all">
                     <CreditCard className="w-5 h-5 text-slate-400" />
                     <span className="text-[8px] font-black uppercase text-slate-600">Card</span>
                  </button>
                  <button onClick={() => handleCheckout('split')} className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-[#0f172a] transition-all">
                     <RotateCcw className="w-5 h-5 text-slate-400" />
                     <span className="text-[8px] font-black uppercase text-slate-600">Split</span>
                  </button>
               </div>

               <button 
                 onClick={() => handleCheckout('cash')}
                 disabled={cart.length === 0 || isProcessing}
                 className="w-full h-16 lg:h-20 bg-[#f1f5f9] text-[#94a3b8] rounded-[2rem] text-[11px] lg:text-[13px] font-black uppercase tracking-[0.4em] transition-all disabled:cursor-not-allowed hover:bg-slate-200 disabled:bg-[#f1f5f9] border border-slate-100"
               >
                  {isProcessing ? 'Processing...' : 'Complete Sale'}
               </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Floating Cart Indicator - Optimized */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
         <button 
           className="w-16 h-16 bg-[#0f172a] text-white rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all scroll-smooth"
           onClick={() => {
              const aside = document.querySelector('aside');
              if (aside) {
                // Toggle sliding panel classes
                aside.classList.toggle('translate-x-full');
                aside.classList.toggle('translate-x-0');
                if (aside.classList.contains('translate-x-0')) {
                   aside.classList.add('flex', 'fixed', 'inset-0', 'z-[60]');
                   aside.classList.remove('hidden');
                } else {
                   setTimeout(() => {
                     aside.classList.remove('flex', 'fixed', 'inset-0', 'z-[60]');
                     aside.classList.add('hidden');
                   }, 300);
                }
              }
           }}
         >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0f172a] animate-in zoom-in duration-300">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[7px] font-black uppercase tracking-widest">Cart</span>
         </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#00a64c] text-white px-10 py-6 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 border-8 border-white pointer-events-auto">
               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <div className="text-center">
                  <h3 className="text-xl font-black uppercase tracking-tight">Sale Completed!</h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Receipt generated successfully</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-center gap-4">
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
           <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Processing Payment...</p>
        </div>
      )}
    </div>
  );
}
