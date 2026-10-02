export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: PriorityLevel;
  category: string;
  tagColor: string;
  dueDate?: string; // ISO string or datetime-local string
  reminderEnabled?: boolean;
  notified?: boolean;
  subtasks?: SubTask[];
  order?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTag {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  textLight: string;
  bgDark: string;
  textDark: string;
}

export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue' | 'high-priority';
export type SortOption = 'order' | 'dueDateAsc' | 'dueDateDesc' | 'priority' | 'title' | 'createdAt';

// --- Fridge Item ---
export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Recipe ---
export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings: number;
  cookTime?: string;
  category: string;
  ingredients?: RecipeIngredient[];
  steps?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Shopping Item ---
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  completed: boolean;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type AppTab = 'todos' | 'fridge' | 'recipes' | 'shopping';
