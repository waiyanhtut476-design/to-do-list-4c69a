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
import { Recipe, RecipeIngredient } from '../types/todo';
import { toastService, formatFirestoreError } from '../services/toastService';
import { soundService } from '../services/soundService';

const LOCAL_STORAGE_RECIPES_KEY = 'zenith_recipes_local';

const INITIAL_RECIPES: Recipe[] = [];

export function useRecipes() {
  const { user, guestId } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_RECIPES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((r) => !r.id?.startsWith('recipe-'));
          }
        }
      } catch {}
    }
    return INITIAL_RECIPES;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isInitialMount.current && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(recipes));
      } catch {}
    }
    isInitialMount.current = false;
  }, [recipes]);

  // Realtime sync with Firestore
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const path = 'recipes';
    const q = query(collection(db, path), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteRecipes: Recipe[] = [];
        snapshot.forEach((docSnap) => {
          remoteRecipes.push({ id: docSnap.id, ...docSnap.data() } as Recipe);
        });

        const cleanRemote = remoteRecipes.filter((r) => !r.id?.startsWith('recipe-'));
        setRecipes(cleanRemote);
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

  // Add Recipe
  const addRecipe = useCallback(
    async (recipeData: {
      title: string;
      description?: string;
      servings: number;
      cookTime?: string;
      category: string;
      ingredients?: RecipeIngredient[];
      steps?: string[];
    }) => {
      const now = new Date().toISOString();
      const newId = 'recipe_' + Math.random().toString(36).substring(2, 12);
      const currentUserId = user ? user.uid : guestId;

      const newRecipe: Recipe = {
        id: newId,
        title: recipeData.title.trim(),
        description: recipeData.description?.trim() || '',
        servings: Math.max(1, Number(recipeData.servings) || 1),
        cookTime: recipeData.cookTime?.trim() || '15 นาที',
        category: recipeData.category || 'ทั่วไป',
        ingredients: recipeData.ingredients || [],
        steps: recipeData.steps || [],
        userId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      setRecipes((prev) => [newRecipe, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'recipes', newId), newRecipe);
          toastService.success(`เพิ่มสูตร "${newRecipe.title}" และบันทึกแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.CREATE, `recipes/${newId}`);
        }
      } else {
        toastService.success(`เพิ่มสูตร "${newRecipe.title}" แล้ว`);
      }
      return newRecipe;
    },
    [user, guestId]
  );

  // Update Recipe
  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      const now = new Date().toISOString();
      const payload = { ...updates, updatedAt: now };

      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...payload } : r))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'recipes', id), payload);
          toastService.success('บันทึกการแก้ไขสูตรอาหารแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `recipes/${id}`);
        }
      } else {
        toastService.success('บันทึกการแก้ไขสูตรอาหารแล้ว');
      }
    },
    [user]
  );

  // Adjust Servings ➖ ➕ (Instant Firestore update)
  const adjustServings = useCallback(
    async (id: string, delta: number) => {
      const target = recipes.find((r) => r.id === id);
      if (!target) return;

      const newServings = Math.max(1, target.servings + delta);
      const now = new Date().toISOString();

      if (delta > 0) soundService.playComplete();

      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, servings: newServings, updatedAt: now } : r))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'recipes', id), {
            servings: newServings,
            updatedAt: now,
          });
          toastService.success(`ปรับสัดส่วนสูตร "${target.title}" เป็น ${newServings} ที่เสิร์ฟแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `recipes/${id}`);
        }
      } else {
        toastService.success(`ปรับสัดส่วนสูตร "${target.title}" เป็น ${newServings} ที่เสิร์ฟแล้ว`);
      }
    },
    [recipes, user]
  );

  // Delete Recipe
  const deleteRecipe = useCallback(
    async (id: string) => {
      const target = recipes.find((r) => r.id === id);
      soundService.playDelete();
      setRecipes((prev) => prev.filter((r) => r.id !== id));

      if (user) {
        try {
          await deleteDoc(doc(db, 'recipes', id));
          toastService.success(`ลบสูตร "${target?.title || 'รายการ'}" เรียบร้อยแล้ว`);
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
        }
      } else {
        toastService.success(`ลบสูตร "${target?.title || 'รายการ'}" เรียบร้อยแล้ว`);
      }
    },
    [recipes, user]
  );

  return {
    recipes,
    isLoading,
    addRecipe,
    updateRecipe,
    adjustServings,
    deleteRecipe,
  };
}
