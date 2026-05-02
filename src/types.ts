export type MovementSpeed = 'fast' | 'moderate' | 'slow' | 'obsolete' | 'mro';

export type XYZClassification = 'X' | 'Y' | 'Z';

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  category?: string; // Legacy/Display
  warehouseId?: string;
  usage: 'SALE' | 'MRO';
  quantity: number;
  value: number;
  movement: MovementSpeed;
  xyzClassification?: XYZClassification;
  status?: string;
  lastSold: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  quantity: number;
  beforeQty: number;
  afterQty: number;
  createdAt: string;
  createdBy: string;
}

export interface InventoryAlert {
  id: string;
  type: 'reorder' | 'expiry' | 'slow' | 'overstock';
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
  severity: 'high' | 'medium' | 'low';
}

export interface CategoryStats {
  id: string;
  name: string;
  items: number;
  value: number;
  percentage: number;
  color: string;
}

export type ViewType = 
  | 'pos' | 'dashboard' | 'inventory' | 'categories' | 'analytics' | 'settings' 
  | 'invoices' | 'receipts' | 'delivery_notes' | 'credit_notes' 
  | 'warehouses' | 'supplier' | 'reports' | 'warranties' | 'alerts'
  | 'purchase_orders' | 'grn' | 'mro_issues' | 'procurement_hub'
  | 'bom' | 'production_orders'
  | 'customers' | 'suppliers'
  | 'help';
