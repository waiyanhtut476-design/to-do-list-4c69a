import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { ShoppingItem, FridgeItem } from '../types/todo';
import { toastService, formatFirestoreError } from '../services/toastService';
import { soundService } from '../services/soundService';

const LOCAL_STORAGE_SHOPPING_KEY = 'zenith_shopping_local';

const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [];

export function useShopping() {
  const { user, guestId } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_SHOPPING_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((i) => !i.id?.startsWith('shop-'));
          }
        }
      } catch {}
    }
    return INITIAL_SHOPPING_ITEMS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isInitialMount.current && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_SHOPPING_KEY, JSON.stringify(items));
      } catch {}
    }
    isInitialMount.current = false;
  }, [items]);

  // Realtime sync with Firestore
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const path = 'shopping_items';
    const q = query(collection(db, path), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteItems: ShoppingItem[] = [];
        snapshot.forEach((docSnap) => {
          remoteItems.push({ id: docSnap.id, ...docSnap.data() } as ShoppingItem);
        });

        const cleanRemote = remoteItems.filter((i) => !i.id?.startsWith('shop-'));
        setItems(cleanRemote);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch {}
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add Shopping Item
  const addItem = useCallback(
    async (itemData: {
      name: string;
      quantity: number;
      unit: string;
      category?: string;
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      const newId = 'shop_' + Math.random().toString(36).substring(2, 12);
      const currentUserId = user ? user.uid : guestId;

      const newItem: ShoppingItem = {
        id: newId,
        name: itemData.name.trim(),
        quantity: Math.max(1, Number(itemData.quantity) || 1),
        unit: itemData.unit.trim() || 'ชิ้น',
        category: itemData.category || 'ทั่วไป',
        completed: false,
        notes: itemData.notes?.trim() || '',
        userId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      setItems((prev) => [newItem, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'shopping_items', newId), newItem);
          toastService.success(`เพิ่ม "${newItem.name}" ในรายการซื้อของและบันทึกแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.CREATE, `shopping_items/${newId}`);
        }
      } else {
        toastService.success(`เพิ่ม "${newItem.name}" ในรายการซื้อของแล้ว`);
      }
      return newItem;
    },
    [user, guestId]
  );

  // Update Shopping Item
  const updateItem = useCallback(
    async (id: string, updates: Partial<ShoppingItem>) => {
      const now = new Date().toISOString();
      const payload = { ...updates, updatedAt: now };

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...payload } : i))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'shopping_items', id), payload);
          toastService.success('บันทึกการแก้ไขแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `shopping_items/${id}`);
        }
      } else {
        toastService.success('บันทึกการแก้ไขแล้ว');
      }
    },
    [user]
  );

  // Toggle Checked
  const toggleCompleted = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;

      const nextCompleted = !target.completed;
      const now = new Date().toISOString();

      if (nextCompleted) {
        soundService.playComplete();
      } else {
        soundService.playUncomplete();
      }

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed: nextCompleted, updatedAt: now } : i))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'shopping_items', id), {
            completed: nextCompleted,
            updatedAt: now,
          });
          toastService.success(nextCompleted ? `ซื้อ "${target.name}" เรียบร้อยแล้ว` : `ยกเลิกสถานะซื้อ "${target.name}" แล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `shopping_items/${id}`);
        }
      } else {
        toastService.success(nextCompleted ? `ซื้อ "${target.name}" เรียบร้อยแล้ว` : `ยกเลิกสถานะซื้อ "${target.name}" แล้ว`);
      }
    },
    [items, user]
  );

  // Adjust Quantity ➖ ➕ (Instant Firestore update)
  const adjustQuantity = useCallback(
    async (id: string, delta: number) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;

      const newQty = Math.max(1, target.quantity + delta);
      const now = new Date().toISOString();

      if (delta > 0) soundService.playComplete();

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQty, updatedAt: now } : i))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'shopping_items', id), {
            quantity: newQty,
            updatedAt: now,
          });
          toastService.success(`ปรับจำนวน ${target.name} เป็น ${newQty} ${target.unit} แล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `shopping_items/${id}`);
        }
      } else {
        toastService.success(`ปรับจำนวน ${target.name} เป็น ${newQty} ${target.unit} แล้ว`);
      }
    },
    [items, user]
  );

  // Delete Item
  const deleteItem = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      soundService.playDelete();
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (user) {
        try {
          await deleteDoc(doc(db, 'shopping_items', id));
          toastService.success(`ลบ "${target?.name || 'รายการ'}" ออกจากรายการซื้อของแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.DELETE, `shopping_items/${id}`);
        }
      } else {
        toastService.success(`ลบ "${target?.name || 'รายการ'}" ออกจากรายการซื้อของแล้ว`);
      }
    },
    [items, user]
  );

  // Move checked items to Fridge
  const moveCheckedToFridge = useCallback(
    async (onAddFridgeItem: (item: Omit<FridgeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<unknown>) => {
      const bought = items.filter((i) => i.completed);
      if (bought.length === 0) {
        toastService.info('ยังไม่มีรายการที่ซื้อเสร็จสมบูรณ์');
        return;
      }

      soundService.playComplete();

      for (const item of bought) {
        await onAddFridgeItem({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category || 'ทั่วไป',
          notes: item.notes || '',
        });
      }

      setItems((prev) => prev.filter((i) => !i.completed));

      if (user) {
        try {
          const batch = writeBatch(db);
          bought.forEach((i) => {
            batch.delete(doc(db, 'shopping_items', i.id));
          });
          await batch.commit();
        } catch (error) {
          console.error('Error batch deleting moved items:', error);
        }
      }

      toastService.success(`ย้ายสินค้าที่ซื้อแล้ว ${bought.length} รายการเข้าตู้เย็นเรียบร้อย!`);
    },
    [items, user]
  );

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    toggleCompleted,
    adjustQuantity,
    deleteItem,
    moveCheckedToFridge,
  };
}
