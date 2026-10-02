import React from 'react';
import {
  Search,
  Sliders,
  CheckCheck,
  Trash2,
  X,
  Flame,
  Clock,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { FilterType, SortOption, Todo } from '../types/todo';
import { DEFAULT_CATEGORIES } from '../constants/categories';

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  selectedPriority: string | null;
  onSelectPriority: (priority: string | null) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  todos: Todo[];
  onClearCompleted: () => void;
  onToggleAll: (status: boolean) => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  selectedCategory,
  onSelectCategory,
  selectedPriority,
  onSelectPriority,
  sortOption,
  onSortChange,
  todos,
  onClearCompleted,
  onToggleAll,
}) => {
  const now = Date.now();
  const totalCompleted = todos.filter((t) => t.completed).length;
  const totalActive = todos.filter((t) => !t.completed).length;

  const totalOverdue = todos.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < now
  ).length;

  const totalToday = todos.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    return (
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate()
    );
  }).length;

  const totalHighPriority = todos.filter(
    (t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')
  ).length;

  // Extract all unique categories
  const uniqueCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES.map((c) => c.name), ...todos.map((t) => t.category)])
  );

  const filterTabs: { id: FilterType; label: string; count: number; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'ทั้งหมด', count: todos.length },
    { id: 'active', label: 'กำลังทำ', count: totalActive },
    { id: 'completed', label: 'เสร็จแล้ว', count: totalCompleted },
    { id: 'today', label: 'วันนี้', count: totalToday, icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'overdue', label: 'เลยกำหนด', count: totalOverdue, icon: <Clock className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'high-priority', label: 'งานด่วน/สำคัญ', count: totalHighPriority, icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Search Bar & Sorting / Batch Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหางานตามชื่อหรือโน้ต..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="เรียงลำดับรายการงาน"
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="order">เรียงตามลำดับเริ่มต้น</option>
              <option value="dueDateAsc">กำหนดส่ง: ใกล้ถึงก่อน</option>
              <option value="dueDateDesc">กำหนดส่ง: ไกลสุดก่อน</option>
              <option value="priority">ความสำคัญ: สูงสุดก่อน</option>
              <option value="title">ชื่อ: ก-ฮ (A-Z)</option>
              <option value="createdAt">วันที่สร้าง: ใหม่สุด</option>
            </select>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleAll(totalActive > 0)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-colors"
              title={totalActive > 0 ? 'ทำเครื่องหมายว่าเสร็จทั้งหมด' : 'ยกเลิกการทำเสร็จทั้งหมด'}
            >
              <CheckCheck className="w-4 h-4" />
            </button>

            {totalCompleted > 0 && (
              <button
                onClick={onClearCompleted}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-sm transition-colors"
                title="ล้างรายการที่เสร็จแล้วทั้งหมด"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Tag & Priority Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-medium pl-1 shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span>แท็ก:</span>
        </div>

        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
            selectedCategory === null
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          ทั้งหมด ({todos.length})
        </button>

        {uniqueCategories.map((catName) => {
          const isSelected = selectedCategory === catName;
          const count = todos.filter((t) => t.category === catName).length;
          const matchingPreset = DEFAULT_CATEGORIES.find((c) => c.name === catName);
          const dotColor = matchingPreset ? matchingPreset.color : '#6366F1';

          return (
            <button
              key={catName}
              onClick={() => onSelectCategory(isSelected ? null : catName)}
              className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-indigo-500 font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
              <span>{catName}</span>
              <span className="text-[10px] text-slate-400 font-normal">({count})</span>
            </button>
          );
        })}

        {/* Priority Filter Filter Pill */}
        <div className="flex items-center gap-1 text-slate-400 font-medium pl-3 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>ความสำคัญ:</span>
        </div>

        {['urgent', 'high', 'medium', 'low'].map((pri) => {
          const isSelected = selectedPriority === pri;
          const priCount = todos.filter((t) => t.priority === pri).length;
          const priLabels: Record<string, string> = {
            urgent: 'ด่วนมาก',
            high: 'สูง',
            medium: 'ปานกลาง',
            low: 'ต่ำ',
          };
          return (
            <button
              key={pri}
              onClick={() => onSelectPriority(isSelected ? null : pri)}
              className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize transition-all cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{priLabels[pri]}</span>
              <span className="text-[10px] opacity-75">({priCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
