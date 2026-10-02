import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { FridgeItem } from '../types/todo';
import { toastService, formatFirestoreError } from '../services/toastService';
import { soundService } from '../services/soundService';

const LOCAL_STORAGE_FRIDGE_KEY = 'zenith_fridge_local';

const INITIAL_FRIDGE_ITEMS: FridgeItem[] = [];

export function useFridge() {
  const { user, guestId } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_FRIDGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((item) => !item.id?.startsWith('fridge-'));
          }
        }
      } catch {}
    }
    return INITIAL_FRIDGE_ITEMS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isInitialMount.current && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_FRIDGE_KEY, JSON.stringify(items));
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

    const path = 'fridge_items';
    const q = query(collection(db, path), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteItems: FridgeItem[] = [];
        snapshot.forEach((docSnap) => {
          remoteItems.push({ id: docSnap.id, ...docSnap.data() } as FridgeItem);
        });

        const cleanRemote = remoteItems.filter((i) => !i.id?.startsWith('fridge-'));
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

  // Add Fridge Item
  const addItem = useCallback(
    async (itemData: {
      name: string;
      quantity: number;
      unit: string;
      category: string;
      expiryDate?: string;
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      const newId = 'fridge_' + Math.random().toString(36).substring(2, 12);
      const currentUserId = user ? user.uid : guestId;

      const newItem: FridgeItem = {
        id: newId,
        name: itemData.name.trim(),
        quantity: Math.max(0, Number(itemData.quantity) || 1),
        unit: itemData.unit.trim() || 'ชิ้น',
        category: itemData.category || 'ทั่วไป',
        expiryDate: itemData.expiryDate || '',
        notes: itemData.notes?.trim() || '',
        userId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      setItems((prev) => [newItem, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'fridge_items', newId), newItem);
          toastService.success(`เพิ่ม "${newItem.name}" ในตู้เย็นและบันทึกแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.CREATE, `fridge_items/${newId}`);
        }
      } else {
        toastService.success(`เพิ่ม "${newItem.name}" ในตู้เย็นแล้ว`);
      }
      return newItem;
    },
    [user, guestId]
  );

  // Update Fridge Item
  const updateItem = useCallback(
    async (id: string, updates: Partial<FridgeItem>) => {
      const now = new Date().toISOString();
      const payload = { ...updates, updatedAt: now };

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'fridge_items', id), payload);
          toastService.success('บันทึกการแก้ไขแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `fridge_items/${id}`);
        }
      } else {
        toastService.success('บันทึกการแก้ไขแล้ว');
      }
    },
    [user]
  );

  // Instant Quantity Adjust ➖ ➕
  const adjustQuantity = useCallback(
    async (id: string, delta: number) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;

      const newQty = Math.max(0, target.quantity + delta);
      const now = new Date().toISOString();

      if (delta > 0) {
        soundService.playComplete();
      }

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQty, updatedAt: now } : i))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'fridge_items', id), {
            quantity: newQty,
            updatedAt: now,
          });
          toastService.success(`ปรับจำนวน ${target.name} เป็น ${newQty} ${target.unit} แล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `fridge_items/${id}`);
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
          await deleteDoc(doc(db, 'fridge_items', id));
          toastService.success(`ลบ "${target?.name || 'รายการ'}" ออกจากตู้เย็นแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.DELETE, `fridge_items/${id}`);
        }
      } else {
        toastService.success(`ลบ "${target?.name || 'รายการ'}" ออกจากตู้เย็นแล้ว`);
      }
    },
    [items, user]
  );

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    adjustQuantity,
    deleteItem,
  };
}
