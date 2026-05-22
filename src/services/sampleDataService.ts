import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MOCK_PRODUCTS, MOCK_SUPPLIERS, MOCK_CUSTOMERS } from '../constants';

const SAMPLE_BOMS = [
  { productId: 'WPX-500', productName: 'Widget Pro X-500 Assembly', status: 'ACTIVE' },
  { productId: 'PH-892', productName: 'Premium Headphones Assembly', status: 'ACTIVE' },
];

const SAMPLE_PRODUCTION_ORDERS = [
  { productName: 'Widget Pro X-500 Assembly', quantity: 10, status: 'IN_PROGRESS', bomId: 'BOM-001' },
  { productName: 'Premium Headphones Assembly', quantity: 50, status: 'COMPLETED', bomId: 'BOM-002' },
];

const SAMPLE_MRO_ISSUES = [
  { department: 'Engineering', totalValue: 450, status: 'ISSUED', timestamp: new Date().toISOString() },
  { department: 'Maintenance', totalValue: 1200, status: 'PENDING', timestamp: new Date().toISOString() },
];

export async function seedSampleData(userId: string, companyId: string) {
  try {
    const batch = writeBatch(db);

    // 1. Seed Products
    for (const prod of MOCK_PRODUCTS) {
      const prodRef = doc(collection(db, `companies/${companyId}/products`));
      batch.set(prodRef, {
        ...prod,
        lastSold: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 1b. Seed some more products
    const extraProducts = [
      { name: 'Industrial Lubricant', sku: 'MRO-LUB-001', category: 'Consumables', value: 45, quantity: 100, minStock: 20, movement: 'moderate' },
      { name: 'Safety Gloves', sku: 'MRO-PPE-001', category: 'PPE', value: 12, quantity: 200, minStock: 50, movement: 'slow' },
    ];
    for (const prod of extraProducts) {
      const prodRef = doc(collection(db, `companies/${companyId}/products`));
      batch.set(prodRef, {
        ...prod,
        lastSold: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 2. Seed Suppliers
    for (const sup of MOCK_SUPPLIERS) {
      const supRef = doc(collection(db, `companies/${companyId}/suppliers`));
      batch.set(supRef, {
        ...sup,
        createdAt: serverTimestamp()
      });
    }

    // 3. Seed Customers
    for (const cust of MOCK_CUSTOMERS) {
      const custRef = doc(collection(db, `companies/${companyId}/customers`));
      batch.set(custRef, {
        ...cust,
        createdAt: serverTimestamp()
      });
    }

    // 4. Seed BOMS
    for (const bom of SAMPLE_BOMS) {
      const bomRef = doc(collection(db, `companies/${companyId}/boms`));
      batch.set(bomRef, {
        ...bom,
        createdAt: serverTimestamp()
      });
    }

    // 5. Seed Production Orders
    for (const po of SAMPLE_PRODUCTION_ORDERS) {
      const poRef = doc(collection(db, `companies/${companyId}/production_orders`));
      batch.set(poRef, {
        ...po,
        createdAt: serverTimestamp()
      });
    }

    // 6. Seed MRO Issues
    for (const issue of SAMPLE_MRO_ISSUES) {
      const issueRef = doc(collection(db, `companies/${companyId}/mro_issues`));
      batch.set(issueRef, {
        ...issue,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}
