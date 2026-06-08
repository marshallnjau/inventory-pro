import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Download,
  Upload,
  Plus,
  Package,
  Hash,
  ClipboardCheck,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  setDoc,
  doc,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { handleFirestoreError, OperationType } from "../../lib/firestoreUtils";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { MOCK_PRODUCTS } from "../../constants";
import { seedSampleData } from "../../services/sampleDataService";
import { cn, formatCompactNumber } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MovementSpeed, Product } from "../../types";
import { ConfirmationModal } from "../ConfirmationModal";

const movementStyles: Record<MovementSpeed, string> = {
  fast: "bg-emerald-50 text-emerald-600 border-emerald-100",
  moderate: "bg-blue-50 text-blue-600 border-blue-100",
  slow: "bg-amber-50 text-amber-600 border-amber-100",
  obsolete: "bg-rose-50 text-rose-600 border-rose-100",
};

import Papa from "papaparse";

export function Inventory() {
  const { user } = useAuth();
  const { profile, company, currency } = useSettings();

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    productId: "",
    quantity: 0,
    reason: "manual",
    customReason: "",
  });

  useEffect(() => {
    if (!profile?.companyId) return;

    const path = `companies/${profile.companyId}/products`;
    const q = collection(db, path);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Product[];
        setProducts(docs);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [profile?.companyId]);

  const seedData = async () => {
    if (!user || !profile?.companyId || isSeeding) return;
    setIsSeeding(true);
    try {
      await seedSampleData(user.uid, profile.companyId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const [expiryFilter, setExpiryFilter] = useState<
    "all" | "expired" | "soon" | "healthy"
  >("all");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "Electronics",
    quantity: 0,
    value: 0,
    movement: "moderate",
    expiryDate: "",
    manufactureDate: "",
    batchNumber: "",
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.companyId) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const results_data = (results.data || []) as any[];
          for (const item of results_data) {
            const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const productData: Partial<Product> = {
              id,
              name: item.name || "Unknown Product",
              sku: item.sku || `SKU-${Date.now()}`,
              category: item.category || "General",
              quantity: parseFloat(item.quantity) || 0,
              value: parseFloat(item.value) || 0,
              movement: (item.movement || "moderate") as MovementSpeed,
              lastSold: new Date().toISOString().split("T")[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(
              doc(db, `companies/${profile.companyId}/products`, id),
              productData,
            );
          }
          alert(`Successfully imported ${results_data?.length || 0} products.`);
        } catch (error) {
          console.error("Import failed:", error);
          alert("Import failed. Please check your CSV format.");
        } finally {
          setIsImporting(false);
          if (e.target) e.target.value = "";
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        setIsImporting(false);
        alert("Could not parse CSV file.");
      },
    });
  };

  const handleAuditChange = (productId: string, value: string) => {
    const count = parseInt(value);
    setAuditCounts((prev) => ({
      ...prev,
      [productId]: isNaN(count) ? 0 : count,
    }));
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !adjustmentData.productId) return;

    try {
      const product = products.find((p) => p.id === adjustmentData.productId);
      if (!product) return;

      const adjustmentValue = adjustmentData.quantity;
      const newQty = product.quantity + adjustmentValue;

      if (newQty < 0) {
        alert("Error: Stock cannot go below zero.");
        return;
      }

      const productRef = doc(
        db,
        `companies/${profile.companyId}/products`,
        product.id,
      );

      await updateDoc(productRef, {
        quantity: newQty,
        updatedAt: new Date().toISOString(),
      });

      const finalReason =
        adjustmentData.reason === "manual"
          ? adjustmentData.customReason || "Manual Adjustment"
          : adjustmentData.reason;

      const movementId = `mov_${Date.now()}`;
      await setDoc(
        doc(db, `companies/${profile.companyId}/stockMovements`, movementId),
        {
          id: movementId,
          productId: product.id,
          type: adjustmentValue >= 0 ? "inbound" : "outbound",
          quantity: Math.abs(adjustmentValue),
          beforeQty: product.quantity,
          afterQty: newQty,
          reason: finalReason,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || "system",
        },
      );

      setIsAdjustingStock(false);
      setAdjustmentData({
        productId: "",
        quantity: 0,
        reason: "manual",
        customReason: "",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "products");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.companyId || !newProduct.name || !newProduct.sku)
      return;

    try {
      const productId = `prod_${Date.now()}`;
      const productData = {
        ...newProduct,
        id: productId,
        lastSold: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, `companies/${profile.companyId}/products`, productId),
        productData,
      );

      // Record movement
      const movementId = `mov_${Date.now()}`;
      await setDoc(
        doc(db, `companies/${profile.companyId}/stockMovements`, movementId),
        {
          id: movementId,
          productId,
          type: "adjustment",
          quantity: newProduct.quantity || 0,
          beforeQty: 0,
          afterQty: newProduct.quantity || 0,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        },
      );

      setIsAddingProduct(false);
      setNewProduct({
        name: "",
        sku: "",
        category: "Electronics",
        quantity: 0,
        value: 0,
        movement: "moderate",
        expiryDate: "",
        manufactureDate: "",
        batchNumber: "",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "products");
    }
  };

  const finalizeAudit = async () => {
    if (!profile?.companyId) return;
    try {
      for (const id in auditCounts) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;

        const actual = auditCounts[id];
        if (actual === product.quantity) continue;

        const productRef = doc(
          db,
          `companies/${profile.companyId}/products`,
          id,
        );
        await updateDoc(productRef, {
          quantity: actual,
          updatedAt: new Date().toISOString(),
        });

        // Record movement
        const movementId = `mov_${Date.now()}_${id}`;
        await setDoc(
          doc(db, `companies/${profile.companyId}/stockMovements`, movementId),
          {
            id: movementId,
            productId: id,
            type: "adjustment",
            quantity: actual - product.quantity,
            beforeQty: product.quantity,
            afterQty: actual,
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || "system",
          },
        );
      }
      setIsAuditing(false);
      setAuditCounts({});
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "products");
    }
  };

  const handleDeleteProduct = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Inventory Asset",
      message: "Are you sure you want to remove or dispose of this inventory product? This action cannot be undone.",
      confirmText: "Dispose Asset",
      type: "danger",
      onConfirm: async () => {
        if (!profile?.companyId) return;
        try {
          await deleteDoc(doc(db, `companies/${profile.companyId}/products`, id));
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, "products");
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const allProducts = [...products];
  MOCK_PRODUCTS.forEach((mock) => {
    if (!products.some((p) => p.sku === mock.sku)) {
      allProducts.push(mock);
    }
  });

  const todayTime = new Date().setHours(0, 0, 0, 0);
  const expiredCount = allProducts.filter((p) => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate).getTime();
    return exp < todayTime;
  }).length;

  const soonCount = allProducts.filter((p) => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((exp - todayTime) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  }).length;

  const healthyCount = allProducts.filter((p) => {
    if (!p.expiryDate) return true;
    const exp = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((exp - todayTime) / (1000 * 60 * 60 * 24));
    return diffDays > 14;
  }).length;

  const displayProducts = allProducts.filter((p) => {
    // Search matching
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.batchNumber &&
        p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Expiry status matching
    if (expiryFilter === "all") return true;
    if (!p.expiryDate) {
      return expiryFilter === "healthy";
    }

    const exp = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((exp - todayTime) / (1000 * 60 * 60 * 24));

    if (expiryFilter === "expired") {
      return diffDays < 0;
    } else if (expiryFilter === "soon") {
      return diffDays >= 0 && diffDays <= 14;
    } else if (expiryFilter === "healthy") {
      return diffDays > 14;
    }
    return true;
  });

  // Sort displayProducts by nearest expiry date
  // Products that are expired or expiring soon come first. Products with no expiry date come last.
  displayProducts.sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock Inventory
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Managing stock for{" "}
            <span className="text-blue-600 font-bold">
              {company?.name || "Workspace"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length === 0 && (
            <button
              disabled={isSeeding}
              onClick={seedData}
              className="px-4 h-11 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              {isSeeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isSeeding ? "Seeding..." : "Seed Sample Data"}
            </button>
          )}
          <button
            onClick={() => setIsAdjustingStock(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs"
          >
            <ArrowUpDown className="w-4 h-4" />
            Stock Adjust
          </button>
          <button
            onClick={() => {
              const initialCounts: Record<string, number> = {};
              displayProducts.forEach((p) => {
                initialCounts[p.id] = p.quantity;
              });
              setAuditCounts(initialCounts);
              setIsAuditing(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs"
          >
            <ClipboardCheck className="w-4 h-4" />
            Perform Audit
          </button>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              id="csv-upload"
            />
            <button
              className={cn(
                "w-full h-11 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-xs flex items-center justify-center gap-2",
                isImporting && "opacity-50 pointer-events-none",
              )}
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? "Importing..." : "Import CSV"}
            </button>
          </div>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="hidden sm:flex flex-none items-center justify-center gap-2 bg-[#0f172a] text-white px-5 h-11 rounded-lg font-bold hover:bg-slate-800 transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdjustingStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Stock Adjustment
                </h3>
                <button
                  onClick={() => setIsAdjustingStock(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Select Product
                    </label>
                    <select
                      required
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={adjustmentData.productId}
                      onChange={(e) =>
                        setAdjustmentData({
                          ...adjustmentData,
                          productId: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Current: {p.quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Adjustment Value (+ for Inbound, - for Outbound)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={adjustmentData.quantity}
                      onChange={(e) =>
                        setAdjustmentData({
                          ...adjustmentData,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Reason Category
                    </label>
                    <select
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={adjustmentData.reason}
                      onChange={(e) =>
                        setAdjustmentData({
                          ...adjustmentData,
                          reason: e.target.value,
                        })
                      }
                    >
                      <option value="manual">
                        Manual Adjustment (Type Below)
                      </option>
                      <option value="damaged">Damaged Stock</option>
                      <option value="return">Customer Return</option>
                      <option value="expired">Expired Stock</option>
                      <option value="found">Found during Audit</option>
                    </select>
                  </div>

                  {adjustmentData.reason === "manual" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Manual Entry Reason
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Stock transfer between warehouses"
                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                        value={adjustmentData.customReason}
                        onChange={(e) =>
                          setAdjustmentData({
                            ...adjustmentData,
                            customReason: e.target.value,
                          })
                        }
                      />
                    </motion.div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdjustingStock(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] h-12 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700 transition-all"
                  >
                    Adjust Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Add New Product
                </h3>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Product Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      SKU Identifier
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Category
                    </label>
                    <select
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    >
                      <option>Electronics</option>
                      <option>Hardware</option>
                      <option>Raw Materials</option>
                      <option>Safety Gear</option>
                      <option>Components</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={newProduct.quantity}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Value ({currency})
                    </label>
                    <input
                      type="number"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={newProduct.value}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          value: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                      value={newProduct.expiryDate || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          expiryDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Manufacture Date
                    </label>
                    <input
                      type="date"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                      value={newProduct.manufactureDate || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          manufactureDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="e.g. BAT-3948"
                      value={newProduct.batchNumber || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          batchNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] h-12 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Register Product
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Stock Count Audit
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Verification of physical inventory vs system records
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAuditing(false);
                    setAuditCounts({});
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {products.map((product) => {
                  const actual = auditCounts[product.id] ?? product.quantity;
                  const diff = actual - product.quantity;

                  return (
                    <div
                      key={product.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center gap-6 group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                            {product.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {product.sku}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            System
                          </p>
                          <p className="text-base font-extrabold text-slate-900">
                            {product.quantity}
                          </p>
                        </div>

                        <div className="flex flex-col items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Actual
                          </p>
                          <input
                            type="number"
                            className="w-20 h-9 bg-white border border-slate-200 rounded-lg text-center text-slate-900 font-bold focus:border-blue-500 outline-none text-sm shadow-sm"
                            value={auditCounts[product.id] ?? ""}
                            placeholder={product.quantity.toString()}
                            onChange={(e) =>
                              handleAuditChange(product.id, e.target.value)
                            }
                          />
                        </div>

                        <div className="min-w-[70px] flex flex-col items-end">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Variance
                          </p>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-sm font-bold",
                              diff === 0
                                ? "text-slate-400"
                                : diff > 0
                                  ? "text-emerald-600"
                                  : "text-rose-600",
                            )}
                          >
                            {diff === 0
                              ? "--"
                              : `${diff > 0 ? "+" : ""}${diff}`}
                            {diff !== 0 && (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <p className="text-[11px] text-slate-400 font-medium italic">
                  Note: Confirming counts will create a reconciliation
                  adjustment record.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsAuditing(false);
                      setAuditCounts({});
                    }}
                    className="px-6 h-10 rounded-lg font-bold text-slate-500 hover:text-slate-700 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finalizeAudit}
                    className="px-6 h-11 bg-blue-600 rounded-lg text-white font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Finalize Audit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            val: allProducts.length.toString(),
            sub: `${currency} ${(allProducts.reduce((acc, p) => acc + p.value * p.quantity, 0) / 1000).toFixed(1)}k value`,
            variant: "blue",
          },
          {
            label: "Low Stock Items",
            val: allProducts.filter((p) => p.quantity < 50).length.toString(),
            sub: "Needs reordering",
            variant: "rose",
          },
          {
            label: "Fast Moving",
            val: allProducts
              .filter((p) => p.movement === "fast")
              .length.toString(),
            sub: "High velocity",
            variant: "emerald",
          },
          {
            label: "Stock Valuation",
            val: `${currency}${formatCompactNumber(
              allProducts.reduce((acc, p) => acc + p.value * p.quantity, 0),
              currency,
            )}`,
            sub: "Total equity",
            variant: "indigo",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={cn(
              "p-5 rounded-xl border flex flex-col justify-between h-32 shadow-sm",
              stat.variant === "blue"
                ? "bg-blue-50 border-blue-100 text-blue-600"
                : stat.variant === "emerald"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                  : stat.variant === "rose"
                    ? "bg-rose-50 border-rose-100 text-rose-600"
                    : stat.variant === "indigo"
                      ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                      : "bg-white border-slate-200 text-slate-900",
            )}
          >
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                stat.variant === "gray" ? "text-slate-400" : "opacity-80",
              )}
            >
              {stat.label}
            </p>
            <h4 className="text-3xl font-black mt-1">{stat.val}</h4>
            <p
              className={cn(
                "text-[10px] font-medium mt-1",
                stat.variant === "gray" ? "text-slate-400" : "opacity-60",
              )}
            >
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Hub with Expiry Track Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, SKU, or batch identifier..."
              className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium text-slate-900 text-sm placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <Filter className="w-3 h-3" /> All Status{" "}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <Plus className="w-3 h-3" /> Categories{" "}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <ArrowUpDown className="w-3 h-3" /> Velocity{" "}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </div>
        </div>

        {/* Expiry Tracking Action Tabs */}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Shelf Life & Expiry Tracking
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "all",
                label: "All Inventory",
                count: allProducts.length,
                activeColor: "bg-slate-900 text-white border-slate-900",
                inactiveColor:
                  "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100",
              },
              {
                id: "expired",
                label: "Expired",
                count: expiredCount,
                activeColor: "bg-rose-500 text-white border-rose-500",
                inactiveColor:
                  "bg-rose-50/70 hover:bg-rose-50 text-rose-700 border-rose-100",
                isCaution: true,
              },
              {
                id: "soon",
                label: "Expiring Soon (30d)",
                count: soonCount,
                activeColor: "bg-amber-500 text-white border-amber-500",
                inactiveColor:
                  "bg-amber-50/70 hover:bg-amber-50/90 text-amber-700 border-amber-100",
                isWarning: true,
              },
              {
                id: "healthy",
                label: "Healthy / Non-Perishable",
                count: healthyCount,
                activeColor: "bg-emerald-600 text-white border-emerald-600",
                inactiveColor:
                  "bg-emerald-50/70 hover:bg-emerald-50 text-emerald-700 border-emerald-100",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExpiryFilter(tab.id as any)}
                className={cn(
                  "px-4 h-9 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 shadow-sm",
                  expiryFilter === tab.id ? tab.activeColor : tab.inactiveColor,
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none",
                    expiryFilter === tab.id
                      ? "bg-white/25 text-white"
                      : "bg-slate-200/50 text-slate-700",
                    tab.id === "expired" &&
                      expiryFilter !== "expired" &&
                      "bg-rose-100 text-rose-700",
                    tab.id === "soon" &&
                      expiryFilter !== "soon" &&
                      "bg-amber-100 text-amber-700",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-[1.2fr_100px_100px_80px_110px_130px_110px_100px_90px] gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div>Inventory Record</div>
          <div>SKU ID</div>
          <div>Category</div>
          <div className="text-right">Units</div>
          <div className="text-right">Valuation</div>
          <div className="text-center">Expiry Date</div>
          <div className="text-center">Days left</div>
          <div className="text-center">Status</div>
          <div className="text-center">Disposal</div>
        </div>

        <div className="divide-y divide-slate-100">
          {displayProducts.map((product) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let diffDays: number | null = null;
            let expiryLabel = "Non-Perishable";
            let daysLeftLabel = "--";
            let statusLabel = "Fresh";
            let statusBadgeColor =
              "bg-emerald-50 text-emerald-600 border-emerald-100";

            if (product.expiryDate) {
              const exp = new Date(product.expiryDate);
              exp.setHours(0, 0, 0, 0);
              diffDays = Math.ceil(
                (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );
              expiryLabel = product.expiryDate;
              if (diffDays < 0) {
                daysLeftLabel = `${Math.abs(diffDays)}d ago`;
                statusLabel = "Expired";
                statusBadgeColor =
                  "bg-rose-50 text-rose-600 border-rose-100 font-extrabold animate-pulse";
              } else if (diffDays <= 14) {
                daysLeftLabel = `${diffDays}d left`;
                statusLabel = "Near Expiry";
                statusBadgeColor =
                  "bg-amber-50 text-amber-600 border-amber-100 font-bold";
              } else {
                daysLeftLabel = `${diffDays}d left`;
                statusLabel = "Fresh";
                statusBadgeColor =
                  "bg-emerald-50 text-emerald-600 border-emerald-100 font-medium";
              }
            }

            return (
              <React.Fragment key={product.id}>
                {/* Desktop Row */}
                <div className="hidden lg:grid grid-cols-[1.2fr_100px_100px_80px_110px_130px_110px_100px_90px] gap-4 px-8 py-5 items-center group hover:bg-slate-50 transition-all text-left">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-white transition-all border border-slate-100 group-hover:border-blue-200 group-hover:shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-all text-sm leading-tight truncate text-left">
                        {product.name}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight text-left flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                        <span>Last sold: {product.lastSold}</span>
                        {product.batchNumber && (
                          <span className="text-slate-500 bg-slate-100 px-1 rounded-sm">
                            Batch: {product.batchNumber}
                          </span>
                        )}
                        {product.manufactureDate && (
                          <span className="text-slate-500 bg-slate-100 px-1 rounded-sm">
                            Mfg: {product.manufactureDate}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-slate-400 text-[11px] font-mono tracking-tighter uppercase">
                    {product.sku}
                  </div>
                  <div className="font-semibold text-slate-500 text-[11px] italic truncate">
                    {product.category}
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        product.quantity < 50
                          ? "text-rose-500"
                          : "text-slate-900",
                      )}
                    >
                      {product.quantity.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right font-extrabold text-slate-900 text-xs">
                    {currency} {product.value.toLocaleString()}
                  </div>
                  <div className="text-center font-bold text-xs text-slate-700 font-mono">
                    {expiryLabel}
                  </div>
                  <div
                    className={cn(
                      "text-center font-bold text-xs font-mono",
                      diffDays !== null
                        ? diffDays < 0
                          ? "text-[#E63946]"
                          : diffDays <= 14
                            ? "text-[#E28743]"
                            : "text-[#2A9D8F]"
                        : "text-slate-400",
                    )}
                  >
                    {daysLeftLabel}
                  </div>
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm leading-none",
                        statusBadgeColor,
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      title="Dispose expired item"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="lg:hidden p-5 flex flex-col gap-4 bg-white border-b border-slate-100 text-left">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-slate-900 truncate leading-tight pr-2">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border shrink-0",
                              movementStyles[product.movement],
                            )}
                          >
                            {product.movement}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate">
                        {product.sku} • {product.category}
                      </p>

                      {product.expiryDate && (
                        <div className="mt-2 flex items-center gap-1.5 leading-none">
                          {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const exp = new Date(product.expiryDate);
                            exp.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil(
                              (exp.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            if (diffDays < 0) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest animate-pulse leading-none">
                                  ⚠️ Expired ({product.expiryDate})
                                </span>
                              );
                            } else if (diffDays <= 30) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest leading-none">
                                  ⏳ Expiring soon in {diffDays}d
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tight leading-none">
                                  🛡️ Expires: {product.expiryDate}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      )}

                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            In Stock
                          </span>
                          <span
                            className={cn(
                              "text-sm font-extrabold",
                              product.quantity < 50
                                ? "text-rose-500"
                                : "text-slate-900",
                            )}
                          >
                            {product.quantity.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Valuation
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatCompactNumber(product.value, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-medium text-slate-400 italic">
                      Recorded: {product.lastSold}
                    </span>
                    <button className="text-[9px] font-bold text-blue-600 uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 transition-colors active:bg-blue-100">
                      View Details
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {products.length === 0 && !loading && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">
                No products found. Use the "Seed Sample Data" button to populate
                the database.
              </p>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
