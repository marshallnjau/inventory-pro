import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, FileText, Download, MoreHorizontal, 
  ChevronDown, Calendar, User, DollarSign, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, Loader2, X, Package, 
  Trash2, ShoppingCart
} from 'lucide-react';
import { collection, onSnapshot, query, where, setDoc, doc, addDoc, serverTimestamp, updateDoc, increment, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../../lib/firestoreUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_INVOICES_SEED = [
  { id: 'INV-2024-001', customer: 'Acme Corp', date: '2024-03-15', dueDate: '2024-04-15', amount: 12450.00, status: 'paid' },
  { id: 'INV-2024-002', customer: 'Global Tech', date: '2024-03-18', dueDate: '2024-04-18', amount: 8900.50, status: 'pending' },
  { id: 'INV-2024-003', customer: 'Starlight Inc', date: '2024-03-20', dueDate: '2024-04-20', amount: 3200.00, status: 'overdue' },
  { id: 'INV-2024-004', customer: 'Nexus Systems', date: '2024-03-22', dueDate: '2024-04-22', amount: 15600.00, status: 'paid' },
  { id: 'INV-2024-005', customer: 'Orbit Tech', date: '2024-03-25', dueDate: '2024-04-25', amount: 5400.00, status: 'draft' },
];

const statusStyles = {
  paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
  pending: "bg-blue-50 text-blue-600 border-blue-100",
  overdue: "bg-rose-50 text-rose-600 border-rose-100",
  draft: "bg-slate-50 text-slate-500 border-slate-100",
  proforma: "bg-amber-50 text-amber-600 border-amber-100",
};

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

export function Invoices({ filterType }: { filterType?: 'standard' | 'proforma' }) {
  const { user } = useAuth();
  const { profile, currency } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // New Invoice Form State
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isProforma, setIsProforma] = useState(filterType === 'proforma');

  useEffect(() => {
    if (!profile?.companyId) return;
    const path = `companies/${profile.companyId}/invoices`;
    
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    if (filterType) {
      q = query(collection(db, path), where('type', '==', filterType), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.companyId, filterType]);

  useEffect(() => {
    if (isNewInvoiceOpen && profile?.companyId) {
      const q = collection(db, `companies/${profile.companyId}/products`);
      getDocs(q).then(snapshot => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [isNewInvoiceOpen, profile?.companyId]);

  const addItem = (product: any) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.value || 0,
        sku: product.sku || ''
      }];
    });
  };

  const removeItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setSelectedItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.companyId || !customerName || selectedItems.length === 0) return;

    setIsSubmitting(true);
    const totalAmount = calculateTotal();
    const type = isProforma ? 'PRO' : 'INV';
    const invoiceId = `${type}-${Date.now()}`;
    
    try {
      const invoiceData = {
        id: invoiceId,
        customer: customerName,
        amount: totalAmount,
        status: isProforma ? 'proforma' : 'pending',
        type: isProforma ? 'proforma' : 'standard',
        date: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: selectedItems,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      };

      // 1. Create Invoice
      await setDoc(doc(db, `companies/${profile.companyId}/invoices`, invoiceId), invoiceData);

      // 2. ONLY Reduce Inventory & Create Movements IF NOT PROFORMA
      if (!isProforma) {
        for (const item of selectedItems) {
          const productRef = doc(db, `companies/${profile.companyId}/products`, item.productId);
          const product = products.find(p => p.id === item.productId);
          const beforeQty = product?.quantity || 0;

          await updateDoc(productRef, {
            quantity: increment(-item.quantity),
            updatedAt: new Date().toISOString()
          });

          const movementId = `mov_${Date.now()}_${item.productId}`;
          await setDoc(doc(db, `companies/${profile.companyId}/stockMovements`, movementId), {
            id: movementId,
            productId: item.productId,
            type: 'sale',
            quantity: item.quantity,
            beforeQty: beforeQty,
            afterQty: beforeQty - item.quantity,
            createdAt: new Date().toISOString(),
            createdBy: user.uid,
            reference: invoiceId
          });
        }

        // 3. Generate Delivery Note (Only for regular invoices)
        const deliveryNoteId = `DN-${Date.now()}`;
        await setDoc(doc(db, `companies/${profile.companyId}/deliveryNotes`, deliveryNoteId), {
          id: deliveryNoteId,
          orderId: invoiceId,
          customer: customerName,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          items: selectedItems,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });
      }

      setIsNewInvoiceOpen(false);
      setCustomerName('');
      setSelectedItems([]);
      setDueDate('');
      setIsProforma(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'invoices');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postToInvoice = async (proformaInvoice: any) => {
    if (!user || !profile?.companyId) return;
    setIsSubmitting(true);
    
    try {
      const invoiceId = `INV-${Date.now()}`;
      const invoiceData = {
        ...proformaInvoice,
        id: invoiceId,
        status: 'pending',
        type: 'standard',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        source_type: 'proforma',
        source_id: proformaInvoice.id,
        converted_date: new Date().toISOString()
      };

      // 1. Create Real Invoice
      await setDoc(doc(db, `companies/${profile.companyId}/invoices`, invoiceId), invoiceData);

      // 2. Mark Proforma as Converted
      await updateDoc(doc(db, `companies/${profile.companyId}/invoices`, proformaInvoice.id), {
        status: 'paid',
        isConverted: true,
        convertedTo: invoiceId,
        converted_date: new Date().toISOString()
      });

      // 3. Reduce Inventory
      for (const item of proformaInvoice.items) {
        const productRef = doc(db, `companies/${profile.companyId}/products`, item.productId);
        
        // Fetch current product state
        const q = collection(db, `companies/${profile.companyId}/products`);
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const product = productsList.find(p => p.id === item.productId);
        const beforeQty = (product as any)?.quantity || 0;

        await updateDoc(productRef, {
          quantity: increment(-item.quantity),
          updatedAt: new Date().toISOString()
        });

        const movementId = `mov_${Date.now()}_${item.productId}`;
        await setDoc(doc(db, `companies/${profile.companyId}/stockMovements`, movementId), {
          id: movementId,
          productId: item.productId,
          type: 'sale',
          quantity: item.quantity,
          beforeQty: beforeQty,
          afterQty: beforeQty - item.quantity,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          reference: invoiceId
        });
      }

      // 4. Generate Delivery Note
      const deliveryNoteId = `DN-${Date.now()}`;
      await setDoc(doc(db, `companies/${profile.companyId}/deliveryNotes`, deliveryNoteId), {
        id: deliveryNoteId,
        orderId: invoiceId,
        customer: proformaInvoice.customer,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        items: proformaInvoice.items,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'post_invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const seedInvoices = async () => {
    if (!user || !profile?.companyId) return;
    const path = `companies/${profile.companyId}/invoices`;
    try {
      for (const inv of MOCK_INVOICES_SEED) {
        await setDoc(doc(db, path, `${profile.companyId}_${inv.id}`), {
          ...inv,
          id: `${profile.companyId}_${inv.id}`,
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

  const stats = [
    { label: 'Total Invoiced', value: `${currency}${invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0).toLocaleString()}`, trend: '+12%', color: 'blue' },
    { label: 'Outstanding', value: `${currency}${invoices.filter(i => i.status !== 'paid').reduce((acc, inv) => acc + (inv.amount || 0), 0).toLocaleString()}`, trend: '-5%', color: 'amber' },
    { label: 'Total Count', value: invoices.length.toString(), trend: '+8%', color: 'emerald' },
    { label: 'Overdue', value: `${currency}${invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + (inv.amount || 0), 0).toLocaleString()}`, trend: '+2%', color: 'rose' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Invoices</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage billing and track customer payments</p>
        </div>
        <div className="flex items-center gap-2 text-left">
          {invoices.length === 0 && (
            <button 
              onClick={seedInvoices}
              className="px-4 h-11 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all"
            >
              Seed Sample Invoices
            </button>
          )}
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => setIsNewInvoiceOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isNewInvoiceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewInvoiceOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Create New Invoice</h3>
                  <p className="text-xs text-slate-500 font-medium">Draft a new sales invoice and generate dispatch note</p>
                </div>
                <button 
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Customer Name</label>
                      <input 
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name..."
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Payment Due Date</label>
                      <input 
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Invoice Type</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setIsProforma(false)}
                          className={cn(
                            "flex-1 h-10 rounded-lg text-xs font-bold transition-all",
                            !isProforma ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          Tax Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsProforma(true)}
                          className={cn(
                            "flex-1 h-10 rounded-lg text-xs font-bold transition-all",
                            isProforma ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          Proforma
                        </button>
                      </div>
                    </div>
                    <div className="pt-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-3 block">Product Inventory</label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                        {products.map(product => (
                          <button
                            key={product.id}
                            onClick={() => addItem(product)}
                            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">SKU: {product.sku} • Stock: {product.quantity}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-600">{currency}{product.value?.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-white/50 flex items-center justify-between bg-white/50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-600" /> Invoice Items
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{selectedItems.length} items selected</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedItems.map(item => (
                        <div key={item.productId} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[9px] font-bold text-emerald-600">{currency}{item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8">
                            <button 
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              className="px-2 border-r border-slate-200 hover:bg-white transition-colors"
                            >
                              <Minus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className="w-8 text-[11px] font-bold text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              className="px-2 border-l border-slate-200 hover:bg-white transition-colors"
                            >
                              <Plus className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeItem(item.productId)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {selectedItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                          <ShoppingCart className="w-12 h-12 mb-2" />
                          <p className="text-xs font-black uppercase tracking-widest">Cart is empty</p>
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-[#0F172A] text-white">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Total Amount</span>
                        <h5 className="text-3xl font-black">{currency}{calculateTotal().toLocaleString()}</h5>
                      </div>
                      <button 
                        onClick={handleSubmitInvoice}
                        disabled={isSubmitting || !customerName || selectedItems.length === 0}
                        className={cn(
                          "w-full h-14 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50",
                          isProforma ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {isProforma ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            {isProforma ? 'Save Proforma' : 'Post Invoice'}
                          </>
                        )}
                      </button>
                      <p className="mt-4 text-[9px] text-center text-slate-500 font-medium leading-relaxed">
                        {isProforma 
                          ? "Proforma invoices do not reduce inventory until they are posted as tax invoices." 
                          : "By posting, you will reduce inventory and automatically generate a delivery dispatch note."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search invoices by ID or customer..."
            className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 text-left">
            <Filter className="w-4 h-4" /> Status <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-12 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 text-left">
            <Calendar className="w-4 h-4" /> Date Range <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[140px_1fr_120px_120px_100px_120px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
          <div>Invoice ID</div>
          <div>Customer</div>
          <div>Issue Date</div>
          <div>Due Date</div>
          <div className="text-right">Amount</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-100 font-sans">
          {(invoices.length > 0 ? invoices : []).filter(inv => 
            inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (inv.customer && inv.customer.toLowerCase().includes(searchTerm.toLowerCase()))
          ).map((inv) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={inv.id} 
              className="group hover:bg-slate-50 transition-all text-left"
            >
              <div className="hidden lg:grid grid-cols-[140px_1fr_120px_120px_100px_120px] gap-4 px-8 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{inv.id?.replace(`${profile?.companyId}_`, '') || inv.id}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{inv.customer}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500">{inv.date}</div>
                <div className="text-xs font-semibold text-slate-500">{inv.dueDate}</div>
                <div className="text-right font-black text-slate-900 text-sm">
                  {currency}{(inv.amount || 0).toLocaleString()}
                </div>
                <div className="flex justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    statusStyles[inv.status as keyof typeof statusStyles]
                  )}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex justify-end">
                   {inv.status === 'proforma' ? (
                     <button 
                        onClick={() => postToInvoice(inv)}
                        disabled={isSubmitting}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-[10px] uppercase tracking-wider flex items-center gap-2"
                     >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
                        Post
                     </button>
                   ) : (
                     <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all">
                       <MoreHorizontal className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{inv.id?.replace(`${profile?.companyId}_`, '') || inv.id}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{inv.customer}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                    statusStyles[inv.status as keyof typeof statusStyles]
                  )}>
                    {inv.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                      <p className="font-black text-slate-900 text-sm">{currency}{(inv.amount || 0).toLocaleString()}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                      <p className="font-bold text-slate-700 text-xs">{inv.dueDate}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
          {invoices.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400">
               <FileText className="w-12 h-12 mx-auto opacity-10 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Minus({ className }: { className?: string }) {
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
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

