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
  const { profile, currency } = useSettings();
  const userName = profile?.name || 'Cashier';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (cart.length > 0 && !isProcessing) {
          handleCheckout(paymentMethod);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isProcessing, paymentMethod]);

  const filteredProducts = products.filter(p => {
    const name = p.name || '';
    const sku = p.sku || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const quickAccessProducts = products.slice(0, 8);

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
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  const handleCheckout = async (method: string) => {
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
        paymentMethod: method,
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
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8FAFC] font-sans scroll-smooth overflow-hidden">
      <div className="max-w-[1600px] mx-auto h-full p-4 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        
        {/* Left: Cart Panel */}
        <aside className="flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Current Cart
              </h2>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{cart.length} items</p>
            </div>
            <button 
              onClick={() => setCart([])}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Clear Cart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <Package className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-emerald-600 font-bold">{currency} {item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-7">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-1.5 hover:bg-slate-50 transition-colors border-r border-slate-200 h-full"
                      >
                        <Minus className="w-3 h-3 text-slate-500" />
                      </button>
                      <span className="w-6 text-[11px] font-bold text-center text-slate-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-1.5 hover:bg-slate-50 transition-colors border-l border-slate-200 h-full"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4 shrink-0">
            <div className="flex gap-2 text-[10px] items-center mb-2">
               <button className="flex-1 h-8 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider">
                  <Pause className="w-3 h-3" /> Hold
               </button>
               <button className="flex-1 h-8 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-300 cursor-not-allowed uppercase tracking-wider">
                  <RotateCcw className="w-3 h-3" /> Restore
               </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Subtotal</span>
                <span>{currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-2">
                <span>Tax (16%)</span>
                <span>{currency} {tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                <span className="text-xl font-bold text-slate-900 uppercase">Total</span>
                <span className="text-3xl font-black text-emerald-600">
                  {currency} {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', icon: Banknote, label: 'Cash' },
                { id: 'mpesa', icon: Smartphone, label: 'M-Pesa' },
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'split', icon: RotateCcw, label: 'Split' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border transition-all",
                    paymentMethod === method.id 
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                  )}
                >
                  <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-emerald-600" : "text-slate-400")} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{method.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCheckout(paymentMethod)}
              disabled={cart.length === 0 || isProcessing}
              className="w-full h-14 bg-[#0F172A] text-white rounded-xl font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Complete Sale
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right: Products Panel */}
        <div className="min-w-0 flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Header Area */}
          <div className="p-4 lg:p-6 border-b border-slate-100 space-y-4 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Point of Sale</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {userName} • Shift #1 • Cashier Mode
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Today Sales', value: `${currency} 18,450`, icon: Banknote },
                    { label: 'Orders', value: '64', icon: Receipt },
                    { label: 'Held', value: 'None', icon: Pause, hideMobile: true },
                  ].map((stat, i) => (
                    <div key={i} className={cn(
                      "bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center gap-3 min-w-[120px]",
                      stat.hideMobile && "hidden md:flex"
                    )}>
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                        <stat.icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{stat.label}</p>
                        <h4 className="text-xs font-black text-slate-900 truncate leading-none mt-0.5">{stat.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <button className="h-11 px-6 bg-[#0F172A] text-white rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-slate-800 transition-all shadow-md shrink-0">
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border",
                    activeCategory === cat 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                      : "bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-emerald-500 hover:text-emerald-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar">
            
            {/* Quick Access Row */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Quick Access</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Frequently Sold Products</span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {quickAccessProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="min-w-[150px] bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-left flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-50 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1 opacity-60 truncate block">{product.category || 'Retail'}</span>
                    <h4 className="text-[11px] font-black text-slate-900 truncate mb-2 uppercase">{product.name}</h4>
                    <p className="text-xs font-black text-emerald-600 mt-auto">{currency} {product.value?.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-1">Product Grid</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col shadow-sm group hover:border-emerald-500/50 transition-all relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {product.category || 'Retail'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-tighter block",
                          product.quantity <= 10 ? "text-rose-500" : "text-emerald-500"
                        )}>
                           {product.quantity} units
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-[13px] font-bold text-slate-900 mb-0.5 truncate uppercase tracking-tight">{product.name}</h4>
                    <p className="text-[9px] text-slate-400 font-medium mb-4 uppercase tracking-tighter opacity-60">SKU: {product.sku}</p>
                    
                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-base font-black text-emerald-600">{currency} {product.value?.toLocaleString()}</p>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-[#0F172A] text-white rounded-lg w-9 h-9 flex items-center justify-center hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => {
            const aside = document.querySelector('aside');
            if (aside) {
              aside.classList.toggle('hidden');
              aside.classList.toggle('fixed');
              aside.classList.toggle('inset-0');
              aside.classList.toggle('z-[60]');
            }
          }}
          className="w-14 h-14 bg-[#0F172A] text-white rounded-2xl shadow-xl flex items-center justify-center relative active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0F172A]">
              {cart.length}
            </span>
          )}
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
            <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border-4 border-white pointer-events-auto">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
               </div>
               <div className="text-center">
                  <h3 className="text-lg font-bold uppercase">Sale Successful!</h3>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mt-0.5">Receipt recorded & stock updated</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
