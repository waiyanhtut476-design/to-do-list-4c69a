/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTodos } from './hooks/useTodos';
import { useFridge } from './hooks/useFridge';
import { useRecipes } from './hooks/useRecipes';
import { useShopping } from './hooks/useShopping';
import { Navbar } from './components/Navbar';
import { TaskStats } from './components/TaskStats';
import { TaskInput } from './components/TaskInput';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskItem } from './components/TaskItem';
import { TaskEditModal } from './components/TaskEditModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { InAppToasts } from './components/InAppToasts';
import { EmptyState } from './components/EmptyState';
import { FridgeView } from './components/FridgeView';
import { RecipesView } from './components/RecipesView';
import { ShoppingView } from './components/ShoppingView';
import { FilterType, SortOption, Todo, AppTab } from './types/todo';
import {
  ListTodo,
  Refrigerator,
  Utensils,
  ShoppingCart,
  Sparkles,
  Layers
} from 'lucide-react';

function TodoAppContent() {
  const [currentTab, setCurrentTab] = useState<AppTab>('todos');

  // To-Do Hook
  const {
    todos,
    isLoading: isTodosLoading,
    syncStatus,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    clearCompleted,
    toggleAll,
    exportTodosJson,
    importTodosJson,
  } = useTodos();

  // Fridge Hook
  const {
    items: fridgeItems,
    isLoading: isFridgeLoading,
    addItem: addFridgeItem,
    updateItem: updateFridgeItem,
    adjustQuantity: adjustFridgeQuantity,
    deleteItem: deleteFridgeItem,
  } = useFridge();

  // Recipes Hook
  const {
    recipes,
    isLoading: isRecipesLoading,
    addRecipe,
    updateRecipe,
    adjustServings: adjustRecipeServings,
    deleteRecipe,
  } = useRecipes();

  // Shopping Hook
  const {
    items: shoppingItems,
    isLoading: isShoppingLoading,
    addItem: addShoppingItem,
    updateItem: updateShoppingItem,
    toggleCompleted: toggleShoppingCompleted,
    adjustQuantity: adjustShoppingQuantity,
    deleteItem: deleteShoppingItem,
    moveCheckedToFridge,
  } = useShopping();

  // Search & Filter states for To-Dos
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('order');

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Total remaining tasks for Navbar & badges
  const totalRemaining = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos]
  );

  const totalPendingShopping = useMemo(
    () => shoppingItems.filter((i) => !i.completed).length,
    [shoppingItems]
  );

  // Filter and Sort Logic for To-Dos
  const filteredAndSortedTodos = useMemo(() => {
    const now = Date.now();

    return todos
      .filter((todo) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = todo.title.toLowerCase().includes(q);
          const matchDesc = todo.description?.toLowerCase().includes(q);
          const matchCat = todo.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        if (activeFilter === 'active' && todo.completed) return false;
        if (activeFilter === 'completed' && !todo.completed) return false;
        if (activeFilter === 'overdue') {
          if (todo.completed || !todo.dueDate) return false;
          if (new Date(todo.dueDate).getTime() >= now) return false;
        }
        if (activeFilter === 'today') {
          if (!todo.dueDate) return false;
          const due = new Date(todo.dueDate);
          const today = new Date();
          const isSameDay =
            due.getFullYear() === today.getFullYear() &&
            due.getMonth() === today.getMonth() &&
            due.getDate() === today.getDate();
          if (!isSameDay) return false;
        }
        if (activeFilter === 'upcoming') {
          if (todo.completed || !todo.dueDate) return false;
          if (new Date(todo.dueDate).getTime() <= now) return false;
        }
        if (activeFilter === 'high-priority') {
          if (todo.priority !== 'urgent' && todo.priority !== 'high') return false;
        }

        if (selectedCategory && todo.category !== selectedCategory) {
          return false;
        }

        if (selectedPriority && todo.priority !== selectedPriority) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'dueDateAsc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortOption === 'dueDateDesc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        if (sortOption === 'priority') {
          const weights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortOption === 'title') {
          return a.title.localeCompare(b.title, 'th');
        }
        if (sortOption === 'createdAt') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [todos, searchQuery, activeFilter, selectedCategory, selectedPriority, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedCategory(null);
    setSelectedPriority(null);
  };

  const handleConfirmDeleteTodo = async () => {
    if (!deletingTodoId) return;
    await deleteTodo(deletingTodoId);
    setDeletingTodoId(null);
  };

  const todoToDelete = todos.find((t) => t.id === deletingTodoId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        syncStatus={syncStatus}
        onExport={exportTodosJson}
        onOpenImport={() => setIsImportModalOpen(true)}
        totalRemaining={totalRemaining}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 overflow-x-auto no-scrollbar shadow-inner">
          <button
            onClick={() => setCurrentTab('todos')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentTab === 'todos'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>รายการงาน</span>
            {totalRemaining > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold">
                {totalRemaining}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('fridge')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentTab === 'fridge'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Refrigerator className="w-4 h-4" />
            <span>ตู้เย็น</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-extrabold">
              {fridgeItems.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('recipes')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentTab === 'recipes'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>สูตรอาหาร</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
              {recipes.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('shopping')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              currentTab === 'shopping'
                ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>ซื้อของ</span>
            {totalPendingShopping > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold">
                {totalPendingShopping}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TO-DO LIST */}
        {currentTab === 'todos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Task Stats Overview & Counter */}
            <TaskStats todos={todos} />

            {/* Task Input Creation Card */}
            <TaskInput onAddTask={addTodo} />

            {/* Filter & Search Bar */}
            <TaskFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedPriority={selectedPriority}
              onSelectPriority={setSelectedPriority}
              sortOption={sortOption}
              onSortChange={setSortOption}
              todos={todos}
              onClearCompleted={clearCompleted}
              onToggleAll={toggleAll}
            />

            {/* Task List */}
            <div className="space-y-2.5 min-h-[220px]">
              {isTodosLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium text-slate-400">กำลังเชื่อมต่อ Firestore...</p>
                </div>
              ) : filteredAndSortedTodos.length > 0 ? (
                filteredAndSortedTodos.map((todo) => (
                  <TaskItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onDelete={(id) => setDeletingTodoId(id)}
                    onEdit={(item) => setEditingTodo(item)}
                    onToggleSubtask={toggleSubtask}
                    onAddSubtask={addSubtask}
                    onDeleteSubtask={deleteSubtask}
                  />
                ))
              ) : (
                <EmptyState
                  filter={activeFilter}
                  searchQuery={searchQuery}
                  hasAnyTasks={todos.length > 0}
                  onResetFilters={handleResetFilters}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FRIDGE */}
        {currentTab === 'fridge' && (
          <div className="animate-in fade-in duration-200">
            <FridgeView
              items={fridgeItems}
              isLoading={isFridgeLoading}
              onAddItem={addFridgeItem}
              onUpdateItem={updateFridgeItem}
              onAdjustQuantity={adjustFridgeQuantity}
              onDeleteItem={deleteFridgeItem}
            />
          </div>
        )}

        {/* TAB 3: RECIPES */}
        {currentTab === 'recipes' && (
          <div className="animate-in fade-in duration-200">
            <RecipesView
              recipes={recipes}
              isLoading={isRecipesLoading}
              onAddRecipe={addRecipe}
              onUpdateRecipe={updateRecipe}
              onAdjustServings={adjustRecipeServings}
              onDeleteRecipe={deleteRecipe}
              onAddIngredientToShopping={async (ingName, ingAmount, ingUnit) => {
                await addShoppingItem({
                  name: ingName,
                  quantity: ingAmount,
                  unit: ingUnit,
                  category: 'ของสด',
                });
              }}
            />
          </div>
        )}

        {/* TAB 4: SHOPPING LIST */}
        {currentTab === 'shopping' && (
          <div className="animate-in fade-in duration-200">
            <ShoppingView
              items={shoppingItems}
              isLoading={isShoppingLoading}
              onAddItem={addShoppingItem}
              onUpdateItem={updateShoppingItem}
              onToggleCompleted={toggleShoppingCompleted}
              onAdjustQuantity={adjustShoppingQuantity}
              onDeleteItem={deleteShoppingItem}
              onMoveCheckedToFridge={moveCheckedToFridge}
              onAddFridgeItem={addFridgeItem}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span>Zenith Tasks & Lifestyle</span>
            <span>•</span>
            <span className="text-indigo-500 font-medium">To-Do, ตู้เย็น, สูตรอาหาร & ซื้อของ</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Firebase Firestore Real-time Cloud Persistence
          </p>
        </div>
      </footer>

      {/* Edit Task Modal */}
      <TaskEditModal
        todo={editingTodo}
        isOpen={Boolean(editingTodo)}
        onClose={() => setEditingTodo(null)}
        onSave={async (id, updates) => {
          await updateTodo(id, updates);
        }}
      />

      {/* Delete To-Do Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTodoId)}
        title="ยืนยันการลบรายการงาน"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${todoToDelete?.title || 'รายการนี้'}"?`}
        onConfirm={handleConfirmDeleteTodo}
        onCancel={() => setDeletingTodoId(null)}
      />

      {/* Import JSON Modal */}
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importTodosJson}
      />

      {/* Floating in-app notifications and action toasts */}
      <InAppToasts />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TodoAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
