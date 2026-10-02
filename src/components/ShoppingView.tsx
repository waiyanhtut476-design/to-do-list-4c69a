import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Check,
  Search,
  ArrowRight,
  Refrigerator,
  X,
  Save,
  Sparkles
} from 'lucide-react';
import { ShoppingItem, FridgeItem } from '../types/todo';
import { ConfirmModal } from './ConfirmModal';

interface ShoppingViewProps {
  items: ShoppingItem[];
  isLoading: boolean;
  onAddItem: (data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    notes?: string;
  }) => Promise<unknown>;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  onToggleCompleted: (id: string) => Promise<void>;
  onAdjustQuantity: (id: string, delta: number) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onMoveCheckedToFridge: (
    onAddFridgeItem: (item: Omit<FridgeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<unknown>
  ) => Promise<void>;
  onAddFridgeItem: (item: Omit<FridgeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<unknown>;
}

const SHOPPING_CATEGORIES = [
  'ทั้งหมด',
  'ผัก/ผลไม้',
  'เนื้อสัตว์',
  'ของสด',
  'นม/เนย',
  'เครื่องปรุง',
  'ของใช้ในบ้าน',
  'ขนม/ของว่าง',
  'ทั่วไป'
];

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  items,
  isLoading,
  onAddItem,
  onUpdateItem,
  onToggleCompleted,
  onAdjustQuantity,
  onDeleteItem,
  onMoveCheckedToFridge,
  onAddFridgeItem,
}) => {
  const [quickName, setQuickName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ชิ้น');
  const [category, setCategory] = useState('ของสด');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddItem({
        name: quickName.trim(),
        quantity: 1,
        unit: 'ชิ้น',
        category: 'ทั่วไป',
      });
      setQuickName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddModal = () => {
    setName('');
    setQuantity(1);
    setUnit('ชิ้น');
    setCategory('ของสด');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ShoppingItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setCategory(item.category || 'ทั่วไป');
    setNotes(item.notes || '');
  };

  const handleSubmitModalAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddItem({
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit.trim() || 'ชิ้น',
        category,
        notes: notes.trim(),
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitModalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onUpdateItem(editingItem.id, {
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit.trim() || 'ชิ้น',
        category,
        notes: notes.trim(),
      });
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItemId) return;
    await onDeleteItem(deletingItemId);
    setDeletingItemId(null);
  };

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = i.name.toLowerCase().includes(q);
        const matchNotes = i.notes?.toLowerCase().includes(q);
        if (!matchName && !matchNotes) return false;
      }
      if (selectedCategory !== 'ทั้งหมด' && i.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedCategory]);

  const totalBought = items.filter((i) => i.completed).length;
  const totalPending = items.length - totalBought;
  const itemToDelete = items.find((i) => i.id === deletingItemId);

  return (
    <div className="space-y-5">
      {/* Header & Move to Fridge Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              รายการซื้อของ (Shopping List) 🛒
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            บันทึกรายการสินค้าที่จะซื้อ ติ๊กถูกเมื่อซื้อแล้ว และย้ายเข้าตู้เย็นได้ทันที
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalBought > 0 && (
            <button
              onClick={() => onMoveCheckedToFridge(onAddFridgeItem)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              title="ย้ายรายการที่ซื้อแล้วเข้าตู้เย็นอัตโนมัติ"
            >
              <Refrigerator className="w-4 h-4" />
              <span>ย้ายของที่ซื้อแล้วเข้าตู้เย็น ({totalBought})</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>เพิ่มรายการละเอียด</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            สินค้าที่ต้องซื้อ
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalPending} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
          <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            ซื้อเสร็จแล้ว
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalBought} <span className="text-xs font-normal text-emerald-600/70">รายการ</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            ทั้งหมดในรายการ
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {items.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          placeholder="พิมพ์สินค้าที่ต้องการซื้อด่วน แล้วกด Enter (เช่น นม, ขนมปัง)..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickName.trim() || isSubmitting}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>เพิ่ม</span>
        </button>
      </form>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารายการซื้อของ..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SHOPPING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
              item.completed
                ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleCompleted(item.id)}
                className={`shrink-0 w-6 h-6 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  item.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500'
                }`}
                title={item.completed ? 'ยกเลิกการซื้อ' : 'ทำเครื่องหมายว่าซื้อแล้ว'}
              >
                {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div
                className="min-w-0 flex-1 cursor-pointer select-none"
                onClick={() => onToggleCompleted(item.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm sm:text-base font-semibold truncate ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                      {item.category}
                    </span>
                  )}
                </div>
                {item.notes && (
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Controls: ➖ ➕ Quantity buttons and actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* ➖ ➕ Quantity Adjust Buttons (Instant Firestore sync) */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => onAdjustQuantity(item.id, -1)}
                  disabled={item.quantity <= 1}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
                  title="ลดจำนวน 1 ชิ้น"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="min-w-[36px] text-center text-xs font-bold text-slate-900 dark:text-white">
                  {item.quantity} {item.unit}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustQuantity(item.id, 1)}
                  className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors cursor-pointer"
                  title="เพิ่มจำนวน 1 ชิ้น"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                title="แก้ไขข้อมูล"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingItemId(item.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="ลบรายการ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="py-12 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
            <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีรายการซื้อของ'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              พิมพ์สินค้าในช่องด้านบน หรือกดส่งวัตถุดิบมาจากหน้าสูตรอาหาร
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'แก้ไขรายการซื้อของ' : 'เพิ่มรายการซื้อของใหม่'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingItem ? handleSubmitModalEdit : handleSubmitModalAdd}
              className="py-4 space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อสินค้า / วัตถุดิบ *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น น้ำมันพืช, ไข่ไก่"
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    หน่วย
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="เช่น ชิ้น, ขวด, แพ็ค"
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  หมวดหมู่
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {SHOPPING_CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  โน้ตย่อ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ยี่ห้อที่ชอบ หรือโปรโมชัน"
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingItemId)}
        title="ยืนยันการลบรายการซื้อของ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemToDelete?.name || 'รายการนี้'}" ออกจากรายการซื้อของ?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItemId(null)}
      />
    </div>
  );
};
