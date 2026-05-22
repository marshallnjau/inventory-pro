import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Package,
  Clock,
  Loader2,
  ShieldAlert,
  CalendarDays,
  Check,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Product } from "../../types";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Line,
  CartesianGrid,
} from "recharts";

// Helper to calculate expiry days left
const getDaysRemaining = (expiryDate?: string) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Help helper to get relative SQL date
const getRelativeDateString = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
};

// Calculate cost vs selling price profit margins
const getProductMarginInfo = (p: Product) => {
  let marginPct = 20; // Default
  const name = (p?.name || "").toLowerCase();
  const category = (p?.category || "").toLowerCase();

  if (name.includes("chemical") || category.includes("chemical")) {
    marginPct = 35; // High margin (Green)
  } else if (name.includes("cement") || category.includes("construction") || name.includes("steel")) {
    if (name.includes("cement")) marginPct = 12; // Low margin (Yellow)
    else if (name.includes("steel")) marginPct = 8; // Loss risk (Red)
    else marginPct = 15;
  } else if (name.includes("paint") || category.includes("consumable")) {
    marginPct = 22; // Moderate / Low margin (Yellow)
  } else {
    const hash = (p?.name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + (p?.sku?.charCodeAt(0) || 0);
    marginPct = 10 + (hash % 30); // 10% to 40%
  }

  const value = p?.value || 0;
  // Valuation is selling price representation; calculate margin content
  const potentialProfit = Math.round(value * (marginPct / 100));
  const cost = value - potentialProfit;

  // Margin classification
  let marginStatus: "high" | "low" | "risk";
  if (marginPct >= 30) {
    marginStatus = "high";
  } else if (marginPct >= 12) {
    marginStatus = "low";
  } else {
    marginStatus = "risk";
  }

  return {
    marginPct,
    potentialProfit,
    cost,
    marginStatus,
  };
};

export function ExpiryTracking() {
  const { profile } = useAuth();
  
  // Set loading to false initially because we operate in offline-friendly simulation dummy mode
  const [loading, setLoading] = useState(false);

  // Search and Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "expired" | "near_expiry" | "safe" | "non_perishable">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"expiry" | "qty" | "valuation" | "name">("expiry");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Multi-purpose Drawer Edit and Custom Assign State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editMfgDate, setEditMfgDate] = useState("");
  const [editExpDate, setEditExpDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // High-fidelity local list of perishable products initialized from LocalStorage or default mock dataset
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem("expiry_tracking_dummy_products_v2");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached products:", e);
      }
    }

    return [
      {
        id: "demo-chemicals",
        name: "Chemicals Batch A",
        sku: "MOCK-CHM",
        category: "Chemicals",
        quantity: 200,
        value: 200000,
        movement: "slow",
        batchNumber: "MOCK-BATCH-1",
        manufactureDate: getRelativeDateString(-60),
        expiryDate: getRelativeDateString(-3), // Expired (-3 Days Ago in Table)
        expiryStatus: "Expired",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-cement",
        name: "Cement Super-Strength",
        sku: "MOCK-CEM",
        category: "Construction",
        quantity: 500,
        value: 500000,
        movement: "fast",
        batchNumber: "MOCK-BATCH-2",
        manufactureDate: getRelativeDateString(-30),
        expiryDate: getRelativeDateString(2), // Near Expiry (2 Days Remaining in Table)
        expiryStatus: "Near Expiry",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-paint",
        name: "Paint Anti-Wear Blue",
        sku: "MOCK-PNT",
        category: "Consumables",
        quantity: 300,
        value: 300000,
        movement: "moderate",
        batchNumber: "MOCK-BATCH-3",
        manufactureDate: getRelativeDateString(-15),
        expiryDate: getRelativeDateString(10), // Near Expiry (10 Days Remaining in Table)
        expiryStatus: "Near Expiry",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-steel",
        name: "Steel Concrete Reinforcements",
        sku: "MOCK-STL",
        category: "Construction",
        quantity: 1000,
        value: 1000000,
        movement: "fast",
        batchNumber: "MOCK-BATCH-4",
        manufactureDate: getRelativeDateString(-90),
        expiryDate: getRelativeDateString(53), // Fresh (53 Days Remaining in Table)
        expiryStatus: "Fresh",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-sealant",
        name: "Joint Silicone Sealant",
        sku: "MOCK-SLN",
        category: "Consumables",
        quantity: 120,
        value: 144000,
        movement: "moderate",
        batchNumber: "MOCK-BATCH-5",
        manufactureDate: getRelativeDateString(-12),
        expiryDate: getRelativeDateString(6), // Near Expiry (6 Days Remaining)
        expiryStatus: "Near Expiry",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-adhesive",
        name: "Titanium Epoxy Resin",
        sku: "MOCK-EPX",
        category: "Chemicals",
        quantity: 80,
        value: 160000,
        movement: "slow",
        batchNumber: "MOCK-BATCH-6",
        manufactureDate: getRelativeDateString(-95),
        expiryDate: getRelativeDateString(-12), // Expired (-12 Days Ago)
        expiryStatus: "Expired",
        lastSold: "N/A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  });

  // Sync to LocalStorage on modifications
  useEffect(() => {
    localStorage.setItem("expiry_tracking_dummy_products_v2", JSON.stringify(products));
  }, [products]);

  // Sorting controller
  const toggleSort = (newSort: "expiry" | "qty" | "valuation" | "name") => {
    if (sortBy === newSort) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSort);
      setSortOrder("asc");
    }
  };

  // Handle Dispose item synchronous memory actions
  const handleDispose = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently dispose and remove "${name}" from inventory records?`
      )
    ) {
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Reset simulated entries helper to capture original pristine mockup state
  const resetDemoBatches = () => {
    if (!window.confirm("Reset simulation database back to fresh default demo items?")) return;
    localStorage.removeItem("expiry_tracking_dummy_products_v2");
    window.location.reload();
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditBatch(product.batchNumber || "");
    setEditMfgDate(product.manufactureDate || "");
    setEditExpDate(product.expiryDate || "");
  };

  // Process manual edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let computedStatus: "Fresh" | "Near Expiry" | "Expired" | undefined = undefined;
    if (editExpDate) {
      const exp = new Date(editExpDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        computedStatus = "Expired";
      } else if (diffDays <= 14) {
        computedStatus = "Near Expiry";
      } else {
        computedStatus = "Fresh";
      }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              batchNumber: editBatch || "",
              manufactureDate: editMfgDate || "",
              expiryDate: editExpDate || "",
              expiryStatus: computedStatus || p.expiryStatus,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    setEditingProduct(null);
    setSavingEdit(false);
  };

  // Open the Add/Update Batch code controller
  const openUpdateModal = () => {
    setIsUpdateModalOpen(true);
    setSelectedProductId("");
    setEditBatch("");
    setEditMfgDate("");
    setEditExpDate("");
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setSavingEdit(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let computedStatus: "Fresh" | "Near Expiry" | "Expired" | undefined = undefined;
    if (editExpDate) {
      const exp = new Date(editExpDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        computedStatus = "Expired";
      } else if (diffDays <= 14) {
        computedStatus = "Near Expiry";
      } else {
        computedStatus = "Fresh";
      }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProductId
          ? {
              ...p,
              batchNumber: editBatch || "",
              manufactureDate: editMfgDate || "",
              expiryDate: editExpDate || "",
              expiryStatus: computedStatus || p.expiryStatus,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    setIsUpdateModalOpen(false);
    setSavingEdit(false);
  };

  // Compile calculations exactly parallel inside the mockup
  const metrics = React.useMemo(() => {
    let freshCount = 0;
    let nearCount = 0;
    let expiredCount = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      // We only compute metrics on elements that have an expiry date or are demo simulation placeholders
      if (p.expiryDate) {
        const daysLeft = getDaysRemaining(p.expiryDate);
        totalValuation += p.value || 0;
        
        if (daysLeft === null) {
          freshCount++;
        } else if (daysLeft < 0) {
          expiredCount++;
        } else if (daysLeft <= 14) {
          nearCount++;
        } else {
          freshCount++;
        }
      }
    });

    return {
      freshCount,
      nearCount,
      expiredCount,
      totalValuation,
    };
  }, [products]);

  // Compile profit and margin metrics
  const profitMetrics = React.useMemo(() => {
    let atRiskValue = 0;
    let potentialProfitLoss = 0;

    products.forEach((p) => {
      if (p.expiryDate) {
        const daysLeft = getDaysRemaining(p.expiryDate);
        // Expired or near expiry (<= 14 days) are at risk
        if (daysLeft !== null && daysLeft <= 14) {
          atRiskValue += p.value || 0;
          const { potentialProfit } = getProductMarginInfo(p);
          potentialProfitLoss += potentialProfit;
        }
      }
    });

    return {
      atRiskValue,
      potentialProfitLoss,
    };
  }, [products]);

  // Format currency dynamically to match mockup exactly (e.g., KSh 3.5M)
  const formatCurrency = (val: number) => {
    const symbol = "KSh";
    if (val >= 1000000) {
      return `${symbol} ${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${symbol} ${(val / 1000).toFixed(0)}K`;
    }
    return `${symbol} ${val.toLocaleString()}`;
  };

  // Compile chart datasets
  const pieChartData = React.useMemo(() => {
    return [
      { name: "Fresh", value: metrics.freshCount || 1, color: "#22C55E" },      // Green matching mockup
      { name: "Near", value: metrics.nearCount || 2, color: "#F59E0B" },       // Orange/Amber matching mockup
      { name: "Expired", value: metrics.expiredCount || 1, color: "#EF4444" },  // Red matching mockup
    ];
  }, [metrics]);

  const timelineChartData = React.useMemo(() => {
    // Generate grouping bars matching the 7d / 30d visual representation
    let zeroToSeven = 0;
    let eightToThirty = 0;

    products.forEach((p) => {
      if (p.expiryDate) {
        const daysLeft = getDaysRemaining(p.expiryDate);
        if (daysLeft !== null && daysLeft >= 0) {
          if (daysLeft <= 7) {
            zeroToSeven++;
          } else if (daysLeft <= 30) {
            eightToThirty++;
          }
        }
      }
    });

    // Provide baseline to look exactly like mockup if real data hasn't accumulated this shape
    return [
      { name: "7d", count: zeroToSeven || 1 },
      { name: "30d", count: eightToThirty || 2 },
    ];
  }, [products]);

  const riskCurveData = React.useMemo(() => {
    // Map products to curves representing names, and valuations as plotted
    const items = products.filter((p) => p.expiryDate);
    // Sort so it orders from expired to longer shelf-half: Chemicals, Cement, Paint, Steel
    items.sort((a,b) => {
      const d_a = getDaysRemaining(a.expiryDate) ?? 9999;
      const d_b = getDaysRemaining(b.expiryDate) ?? 9999;
      return d_a - d_b;
    });

    let runningProfitRisk = 0;
    return items.map((item) => {
      const { potentialProfit } = getProductMarginInfo(item);
      runningProfitRisk += potentialProfit;
      return {
        name: item.name || "Unnamed SKU",
        profitAtRisk: potentialProfit,
        cumulativeProfitAtRisk: runningProfitRisk,
      };
    });
  }, [products]);

  // Extract alerts for "Smart Alerts" sidebar exactly matching the style
  const smartAlerts = React.useMemo(() => {
    const list = products.filter((p) => p.expiryDate);
    // Sort so soonest to expire are at the top
    list.sort((a, b) => {
      const d_a = getDaysRemaining(a.expiryDate) ?? 9999;
      const d_b = getDaysRemaining(b.expiryDate) ?? 9999;
      return d_a - d_b;
    });
    return list.slice(0, 5);
  }, [products]);

  // Filter and sort for display in the main inventory table
  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      // Exclude non expiring products from this page to focus strictly on batch health
      if (!p.expiryDate) return false;

      // Search parameter
      const nameVal = p.name || "";
      const skuVal = p.sku || "";
      const matchesSearch =
        nameVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skuVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Category parameter
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;

      // Status parameter
      const daysLeft = getDaysRemaining(p.expiryDate);
      if (statusFilter === "expired") {
        return daysLeft !== null && daysLeft < 0;
      }
      if (statusFilter === "near_expiry") {
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
      }
      if (statusFilter === "safe") {
        return daysLeft !== null && daysLeft > 14;
      }

      return true;
    });

    // Sort matching user selections
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === "expiry") {
        const d_a = getDaysRemaining(a.expiryDate);
        const d_b = getDaysRemaining(b.expiryDate);
        valA = d_a === null ? 999999 : d_a;
        valB = d_b === null ? 999999 : d_b;
      } else if (sortBy === "qty") {
        valA = a.quantity || 0;
        valB = b.quantity || 0;
      } else if (sortBy === "valuation") {
        valA = a.value || 0;
        valB = b.value || 0;
      } else if (sortBy === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // CSV Report Generator
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    
    const headers = ["SKU", "Batch No", "Product Name", "Category", "Manufacture Date", "Expiry Date", "Days Remaining", "Stock Count", "Valuation (KSh)"];
    
    const rows = filteredProducts.map((p) => {
      const daysLeft = getDaysRemaining(p.expiryDate);
      const daysLabel = daysLeft === null ? "Non-perishable" : daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : `${daysLeft}d remaining`;
      return [
        p.sku,
        p.batchNumber || "N/A",
        p.name,
        p.category || "General",
        p.manufactureDate || "N/A",
        p.expiryDate || "N/A",
        daysLabel,
        p.quantity,
        p.value,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expiry_dashboard_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoriesList = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.expiryDate && p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse uppercase tracking-wider">
          Initializing Batch Traceability...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 lg:pb-0 text-left">
      {/* Expiry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Expiry Dashboard
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Monitor stock risk & expiry performance
          </p>
        </div>

        {/* Action Controls matching image exactly */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="h-10 px-5 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
          >
            Export
          </button>
          <button
            onClick={openUpdateModal}
            className="h-10 px-6 bg-[#00B050] hover:bg-[#009240] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            Update
          </button>
        </div>
      </div>

      {/* KPI Cards styled exactly like the mockup */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Fresh - Green Block */}
        <div className="bg-[#22C55E] p-6 rounded-3xl text-white text-left shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all">
          <p className="text-sm font-bold opacity-90">Fresh</p>
          <h3 className="text-5xl font-black mt-3 leading-none">
            {metrics.freshCount}
          </h3>
        </div>

        {/* Near - Orange Block */}
        <div className="bg-[#ED9A12] p-6 rounded-3xl text-white text-left shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all">
          <p className="text-sm font-bold opacity-90">Near</p>
          <h3 className="text-5xl font-black mt-3 leading-none">
            {metrics.nearCount}
          </h3>
        </div>

        {/* Expired - Red Block */}
        <div className="bg-[#EF4444] p-6 rounded-3xl text-white text-left shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all">
          <p className="text-sm font-bold opacity-90">Expired</p>
          <h3 className="text-5xl font-black mt-3 leading-none">
            {metrics.expiredCount}
          </h3>
        </div>

        {/* Total Value - Slate Block */}
        <div className="bg-[#1E293B] p-6 rounded-3xl text-white text-left shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all">
          <p className="text-sm font-bold opacity-90">Total Value</p>
          <h3 className="text-3xl font-black mt-4 leading-none font-sans">
            {formatCurrency(metrics.totalValuation)}
          </h3>
        </div>
      </div>

      {/* Middle row: Grid of Alerts, Pie, and Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left h-[340px]">
          <div>
            <h4 className="text-base font-black text-slate-900 tracking-tight mb-4">
              Smart Alerts
            </h4>
            <div className="space-y-3.5">
              {smartAlerts.map((item) => {
                const daysLeft = getDaysRemaining(item.expiryDate);
                const isExpired = daysLeft !== null && daysLeft < 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-100/80 rounded-2xl flex items-center justify-between hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-extrabold text-[#111827]">
                        {item.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs font-semibold mt-0.5",
                          isExpired ? "text-rose-500" : "text-amber-500"
                        )}
                      >
                        {isExpired ? "Expired" : `${daysLeft} days left`}
                      </p>
                    </div>
                    {isExpired ? (
                      <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {smartAlerts.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-8">
              No perishable alerts triggered.
            </p>
          )}
        </div>

        {/* Expiry Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-left h-[340px] flex flex-col">
          <h4 className="text-base font-black text-slate-900 tracking-tight mb-2">
            Expiry Distribution
          </h4>
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} items`]}
                  contentStyle={{ background: "#1E293B", borderRadius: "12px", border: "none", color: "#FFF" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expiry Timeline Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-left h-[340px] flex flex-col">
          <h4 className="text-base font-black text-slate-900 tracking-tight mb-2">
            Expiry Timeline
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="95%">
              <BarChart data={timelineChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: "600" }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ background: "#1E293B", borderRadius: "12px", border: "none", color: "#FFF", fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Dashboard Section: Upgraded Risk Curve & Profit insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Curve Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  Economic Loss Timeline
                </h4>
                <p className="text-xs text-slate-500 font-medium">Cumulative potential profit at risk of expiration</p>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Upgraded</span>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={riskCurveData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: "600" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(value) => formatCurrency(Number(value))} />
                  <Tooltip
                    contentStyle={{ background: "#1E293B", borderRadius: "12px", border: "none", color: "#FFF" }}
                    formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]}
                  />
                  <Bar dataKey="profitAtRisk" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={45} name="Direct Profit Loss" />
                  <Line type="monotone" dataKey="cumulativeProfitAtRisk" stroke="#1E293B" strokeWidth={2.5} name="Cumulative Loss Profile" dot={{ r: 4, strokeWidth: 2, fill: "#FFF", stroke: "#1E293B" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Profit Insights Sidebar card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-left flex flex-col justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900 tracking-tight mb-1">
              Profit & Margin Insights
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-5">Warehouse profitability & threat assessment</p>

            <div className="space-y-4">
              {/* Metric 1 */}
              <div className="p-4 bg-rose-50 border border-rose-100/50 rounded-2xl animate-in fade-in duration-300">
                <p className="text-[10px] uppercase font-black tracking-widest text-rose-500">At-Risk Asset Value</p>
                <p className="text-2xl font-black text-rose-950 mt-1">{formatCurrency(profitMetrics.atRiskValue)}</p>
                <p className="text-[11px] text-rose-700 font-medium mt-1">Assets within critical status parameters (≤ 14 days or expired)</p>
              </div>

              {/* Metric 2 */}
              <div className="p-4 bg-amber-50 border border-amber-100/50 rounded-2xl animate-in fade-in duration-400">
                <p className="text-[10px] uppercase font-black tracking-widest text-amber-600">Potential Gross Profit Loss</p>
                <p className="text-2xl font-black text-amber-950 mt-1">{formatCurrency(profitMetrics.potentialProfitLoss)}</p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">Income exposure based on calculated margins of expired/near batches</p>
              </div>

              {/* Metric 3 */}
              <div className="p-3.5 bg-slate-50 border border-slate-100/50 rounded-2xl animate-in fade-in duration-500">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Yield Risk Indicator</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1.5 flex-1">
                    <span className="h-5 flex-1 rounded-lg bg-emerald-500/20 border border-emerald-500/10 flex items-center justify-center text-[9px] font-extrabold text-[#22C55E]">HIGH</span>
                    <span className="h-5 flex-1 rounded-lg bg-amber-500/20 border border-amber-500/10 flex items-center justify-center text-[9px] font-extrabold text-[#ED9A12]">LOW</span>
                    <span className="h-5 flex-1 rounded-lg bg-rose-500/20 border border-rose-500/10 flex items-center justify-center text-[9px] font-extrabold text-[#EF4444]">RISK</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2">Badges specify margin viability metrics matching inventory detail</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live / Simulated Helper Banner */}
      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-extrabold text-emerald-950 text-sm">
              Sandbox Live Expiry Simulation Mode Active
            </p>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              You are viewing high-fidelity simulation records (Cement, Paint, Chemicals, Steel, Sealants, Adhesives). Edits, Disposals, and Batch Updates are processed instantly in memory.
            </p>
          </div>
        </div>
        <button
          onClick={resetDemoBatches}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 active:scale-95"
        >
          Reset Simulation Data
        </button>
      </div>

      {/* Filtering Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
            <input
              type="text"
              placeholder="Search by SKU Code, Name, or Batch Number..."
              className="w-full text-slate-800 h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-slate-300 focus:bg-white transition-all placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Risk:
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["all", "expired", "near_expiry", "safe"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      statusFilter === opt
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {opt.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categoriesList.length > 0 && (
              <div className="relative shrink-0 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Cat:
                </span>
                <select
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-all cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">ALL CATEGORIES</option>
                  {categoriesList.map((catString) => (
                    <option key={catString} value={catString}>
                      {catString.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h4 className="text-base font-black text-slate-900 tracking-tight">
            Inventory Details
          </h4>
        </div>        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                <th className="px-8 py-4 cursor-pointer" onClick={() => toggleSort("name")}>
                  Name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-8 py-4">Expiry</th>
                <th className="px-8 py-4 text-center">Days</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-center">Margin Profile</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const daysRemaining = getDaysRemaining(p.expiryDate);
                
                // Styling corresponding to layout
                let pClass = "bg-emerald-500/10 text-emerald-600";
                let pLabel = "Fresh";
 
                if (daysRemaining !== null) {
                  if (daysRemaining < 0) {
                    pClass = "bg-[#FCA5A5]/30 text-[#EF4444]";
                    pLabel = "Expired";
                  } else if (daysRemaining <= 14) {
                    pClass = "bg-[#FDE047]/30 text-[#ED9A12]";
                    pLabel = "Near";
                  }
                }

                // Dynamic Margin Data
                const marginInfo = getProductMarginInfo(p);
                let marginBadgeClass = "";
                let marginLabel = "";
                if (marginInfo.marginStatus === "high") {
                  marginBadgeClass = "bg-[#22C55E]/15 text-[#22C55E]/90 border border-[#22C55E]/20";
                  marginLabel = `High (${marginInfo.marginPct}%)`;
                } else if (marginInfo.marginStatus === "low") {
                  marginBadgeClass = "bg-[#ED9A12]/15 text-[#ED9A12]/90 border border-[#ED9A12]/20";
                  marginLabel = `Low (${marginInfo.marginPct}%)`;
                } else {
                  marginBadgeClass = "bg-rose-500/15 text-rose-600 border border-rose-500/20";
                  marginLabel = `Loss Risk (${marginInfo.marginPct}%)`;
                }
 
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-slate-900">
                      {p.name || "Unnamed SKU"}
                    </td>
                    <td className="px-8 py-4 text-sm font-semibold text-slate-500 font-mono">
                      {p.expiryDate || "--"}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-center text-slate-700 font-mono">
                      {daysRemaining !== null ? daysRemaining : "--"}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={cn("px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider", pClass)}>
                        {pLabel}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={cn("px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider", marginBadgeClass)}>
                        {marginLabel}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit expiry & info"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDispose(p.id, p.name || "Unnamed SKU")}
                          title="Dispose item"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
 
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-medium">
                    No active inventory logs pass your selected filter values.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredProducts.map((p) => {
            const daysRemaining = getDaysRemaining(p.expiryDate);
            let pClass = "bg-emerald-500/10 text-emerald-600";
            let pLabel = "Fresh";

            if (daysRemaining !== null) {
              if (daysRemaining < 0) {
                pClass = "bg-[#FCA5A5]/30 text-[#EF4444]";
                pLabel = "Expired";
              } else if (daysRemaining <= 14) {
                pClass = "bg-[#FDE047]/30 text-[#ED9A12]";
                pLabel = "Near";
              }
            }

            return (
              <div key={p.id} className="p-5 flex flex-col gap-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{p.name || "Unnamed SKU"}</h5>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || ""}</p>
                  </div>
                  <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider", pClass)}>
                    {pLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Expiry date</span>
                    <span className="font-mono font-semibold text-slate-700">{p.expiryDate || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Days remaining</span>
                    <span className="font-mono font-extrabold text-slate-700">{daysRemaining !== null ? daysRemaining : "--"}</span>
                  </div>
                </div>

                {/* Mobile Margin indicator */}
                <div className="px-3.5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin Profile</span>
                  {(() => {
                    const marginInfo = getProductMarginInfo(p);
                    let color = "text-emerald-600 font-bold bg-[#22C55E]/10";
                    let label = `High (${marginInfo.marginPct}%)`;
                    if (marginInfo.marginStatus === "low") {
                      color = "text-amber-600 font-bold bg-[#ED9A12]/10";
                      label = `Low (${marginInfo.marginPct}%)`;
                    } else if (marginInfo.marginStatus === "risk") {
                      color = "text-rose-600 font-bold bg-rose-500/10";
                      label = `Loss Risk (${marginInfo.marginPct}%)`;
                    }
                    return <span className={cn("px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider", color)}>{label}</span>;
                  })()}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="h-8 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-200 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modify
                  </button>
                  <button
                    onClick={() => handleDispose(p.id, p.name || "Unnamed SKU")}
                    className="h-8 px-4 rounded-xl bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Dispose
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Expiry / Assign Expiry to Existing Product Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpdateModalOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-slate-200 z-[60] shadow-2xl rounded-3xl flex flex-col text-left overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-left">
                <div>
                  <h4 className="text-lg font-black text-slate-900">
                    Assign Batch & Expiry
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">Configure traceability specs on items</p>
                </div>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Select Target Product
                  </label>
                  <select
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose From Catalog --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Batch Identifier Code
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    placeholder="e.g. BATCH-A200"
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    value={editMfgDate}
                    onChange={(e) => setEditMfgDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Expiry Expiration Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    value={editExpDate}
                    onChange={(e) => setEditExpDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !selectedProductId}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Apply Batch
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Direct inline Sidebar/Form modal for Expiry updating */}
      <AnimatePresence>
        {editingProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />

            {/* Editing Sidebar Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-200 z-[60] shadow-2xl flex flex-col text-left"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Tracing Adjustment
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1 truncate max-w-[280px]">
                    {editingProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleSaveEdit} className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* SKU Display (Non editable) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        ID SKU Code
                      </span>
                      <span className="font-mono text-slate-800 font-extrabold">{editingProduct.sku}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        Available Units
                      </span>
                      <span className="font-mono text-slate-800 font-black">
                        {editingProduct.quantity.toLocaleString()} units
                      </span>
                    </div>
                  </div>

                  {/* Batch Number */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Batch Identifier Number
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                      placeholder="e.g. BAT-2026-X99"
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                    />
                  </div>

                  {/* Manufacture date */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Manufacture Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                      value={editMfgDate}
                      onChange={(e) => setEditMfgDate(e.target.value)}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Expiration Threshold Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full h-11 bg-slate-50 border border-slate-100 rounded-lg px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                      value={editExpDate}
                      onChange={(e) => setEditExpDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit area */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 h-12 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-3xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Batch Info
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
