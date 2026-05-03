import { 
  collection, doc, setDoc, updateDoc, increment, 
  getDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { PurchaseOrder, POStatus, GoodReceiptNote, MROIssue, Product } from '../types';
import { handleFirestoreError, OperationType } from './firestoreUtils';

export class ProcurementService {
  private static getCompanyPath(companyId: string) {
    return `companies/${companyId}`;
  }

  static async createPurchaseOrder(companyId: string, poData: Omit<PurchaseOrder, 'id'>) {
    const path = `${this.getCompanyPath(companyId)}/purchaseOrders`;
    const poRef = doc(collection(db, path));
    const newPO: PurchaseOrder = {
      ...poData,
      id: poRef.id,
      date: new Date().toISOString(),
    };

    try {
      await setDoc(poRef, {
        ...newPO,
        createdAt: serverTimestamp(),
      });
      return newPO;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }

  static async updatePOStatus(companyId: string, poId: string, status: POStatus) {
    const path = `${this.getCompanyPath(companyId)}/purchaseOrders/${poId}`;
    try {
      await updateDoc(doc(db, path), { status, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }

  static async createGRN(companyId: string, grnData: Omit<GoodReceiptNote, 'id'>) {
    const path = `${this.getCompanyPath(companyId)}/grns`;
    const poPath = `${this.getCompanyPath(companyId)}/purchaseOrders/${grnData.poId}`;
    const grnRef = doc(collection(db, path));
    
    const newGRN: GoodReceiptNote = {
      ...grnData,
      id: grnRef.id,
      receivedDate: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      
      // Save GRN
      batch.set(grnRef, {
        ...newGRN,
        createdAt: serverTimestamp(),
      });

      // Update Product Quantities
      for (const item of grnData.items) {
        const productRef = doc(db, `${this.getCompanyPath(companyId)}/products/${item.productId}`);
        batch.update(productRef, {
          quantity: increment(item.receivedQuantity),
          updatedAt: new Date().toISOString()
        });

        // Record Stock Movement
        const movementRef = doc(collection(db, `${this.getCompanyPath(companyId)}/stockMovements`));
        batch.set(movementRef, {
          productId: item.productId,
          type: 'purchase',
          quantity: item.receivedQuantity,
          createdAt: new Date().toISOString(),
          reference: newGRN.grnNumber,
          poId: grnData.poId
        });
      }

      // Update PO Status to RECEIVED if all items received (simplified for now)
      batch.update(doc(db, poPath), { 
        status: 'RECEIVED',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      return newGRN;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }

  static async createMROIssue(companyId: string, issueData: Omit<MROIssue, 'id'>) {
    const path = `${this.getCompanyPath(companyId)}/mro_issues`;
    const issueRef = doc(collection(db, path));
    
    const newIssue: MROIssue = {
      ...issueData,
      id: issueRef.id,
      date: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      
      // Save Issue
      batch.set(issueRef, {
        ...newIssue,
        createdAt: serverTimestamp(),
      });

      // Decrease Product Quantities
      const productRef = doc(db, `${this.getCompanyPath(companyId)}/products/${issueData.productId}`);
      batch.update(productRef, {
        quantity: increment(-issueData.quantity),
        updatedAt: new Date().toISOString()
      });

      // Record Stock Movement
      const movementRef = doc(collection(db, `${this.getCompanyPath(companyId)}/stockMovements`));
      batch.set(movementRef, {
        productId: issueData.productId,
        type: 'adjustment', // Or 'mro_issue' if added to types
        quantity: -issueData.quantity,
        createdAt: new Date().toISOString(),
        reference: newIssue.issueNumber,
        department: issueData.department
      });

      await batch.commit();
      return newIssue;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }
}
