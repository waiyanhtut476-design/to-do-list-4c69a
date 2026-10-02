import React, { useState, useMemo } from 'react';
import {
  Refrigerator,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Search,
  Layers,
  Sparkles,
  X,
  Save,
  Check
} from 'lucide-react';
import { FridgeItem } from '../types/todo';
import { ConfirmModal } from './ConfirmModal';

interface FridgeViewProps {
  items: FridgeItem[];
  isLoading: boolean;
  onAddItem: (data: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    expiryDate?: string;
    notes?: string;
  }) => Promise<unknown>;
  onUpdateItem: (id: string, updates: Partial<FridgeItem>) => Promise<void>;
  onAdjustQuantity: (id: string, delta: number) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const FRIDGE_CATEGORIES = [
  'ทั้งหมด',
  'ผัก/ผลไม้',
  'เนื้อสัตว์',
  'ของสด',
  'นม/เนย',
  'เครื่องดื่ม',
  'ของแห้ง',
  'เบเกอรี่',
  'เครื่องปรุง',
  'ทั่วไป'
];

export const FridgeView: React.FC<FridgeViewProps> = ({
  items,
  isLoading,
  onAddItem,
  onUpdateItem,
  onAdjustQuantity,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ชิ้น');
  const [category, setCategory] = useState('ของสด');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = Date.now();

  const handleOpenAdd = () => {
    setName('');
    setQuantity(1);
    setUnit('ชิ้น');
    setCategory('ของสด');
    setExpiryDate('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: FridgeItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setCategory(item.category);
    setExpiryDate(item.expiryDate || '');
    setNotes(item.notes || '');
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddItem({
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit.trim() || 'ชิ้น',
        category,
        expiryDate: expiryDate || undefined,
        notes: notes.trim(),
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onUpdateItem(editingItem.id, {
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit.trim() || 'ชิ้น',
        category,
        expiryDate: expiryDate || '',
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

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchName && !matchNotes) return false;
      }
      if (selectedCategory !== 'ทั้งหมด' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedCategory]);

  // Expiry statistics
  const expiringSoonCount = useMemo(() => {
    return items.filter((item) => {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate).getTime();
      const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 3;
    }).length;
  }, [items, now]);

  const expiredCount = useMemo(() => {
    return items.filter((item) => {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate).getTime();
      return exp < now;
    }).length;
  }, [items, now]);

  const itemToDelete = items.find((i) => i.id === deletingItemId);

  return (
    <div className="space-y-5">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Refrigerator className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              ตู้เย็น & คลังวัตถุดิบ 🧊
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            จัดการของสด วัตถุดิบ และแจ้งเตือนวันหมดอายุอัตโนมัติ
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>เพิ่มของเข้าตู้เย็น</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            วัตถุดิบทั้งหมด
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {items.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
          <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 font-medium">
            ใกล้หมดอายุ (≤3 วัน)
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {expiringSoonCount} <span className="text-xs font-normal text-amber-600/70">รายการ</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
          <span className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-300 font-medium">
            หมดอายุแล้ว
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {expiredCount} <span className="text-xs font-normal text-rose-600/70">รายการ</span>
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาวัตถุดิบในตู้เย็น..."
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
          {FRIDGE_CATEGORIES.map((cat) => {
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

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          let isExpired = false;
          let isExpiringSoon = false;
          let expFormatted = '';

          if (item.expiryDate) {
            const exp = new Date(item.expiryDate).getTime();
            if (!isNaN(exp)) {
              isExpired = exp < now;
              const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
              isExpiringSoon = !isExpired && diffDays <= 3;
              expFormatted = new Intl.DateTimeFormat('th-TH', {
                day: 'numeric',
                month: 'short',
                year: '2-digit',
              }).format(new Date(item.expiryDate));
            }
          }

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isExpired
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                  : isExpiringSoon
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      title="แก้ไขวัตถุดิบ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="ลบออกจากตู้เย็น"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.notes && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Bottom Quantity Control and Expiry */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                {/* ➖ ➕ Quantity Adjust Buttons (Instant Firestore sync) */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => onAdjustQuantity(item.id, -1)}
                    disabled={item.quantity <= 0}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
                    title="ลดจำนวน 1 ชิ้น"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span className="min-w-[40px] text-center text-xs font-bold text-slate-900 dark:text-white">
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

                {/* Expiry Badge */}
                {item.expiryDate ? (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
                        : isExpiringSoon
                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                    }`}
                  >
                    {isExpired ? (
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Calendar className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{isExpired ? 'หมดอายุ: ' : 'หมด: '}{expFormatted}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ไม่มีวันหมดอายุ</span>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
            <Refrigerator className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'ไม่พบวัตถุดิบที่ค้นหา' : 'ตู้เย็นยังว่างอยู่'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คลิกปุ่ม "+ เพิ่มของเข้าตู้เย็น" ด้านบนเพื่อบันทึกวัตถุดิบแรก
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
                {editingItem ? 'แก้ไขวัตถุดิบในตู้เย็น' : 'เพิ่มวัตถุดิบใหม่เข้าตู้เย็น'}
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
              onSubmit={editingItem ? handleSubmitEdit : handleSubmitAdd}
              className="py-4 space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อวัตถุดิบ / อาหาร *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นมสด, ไข่ไก่, อกไก่"
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
                    min="0"
                    step="any"
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
                    placeholder="เช่น ชิ้น, ฟอง, กรัม, ขวด"
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    หมวดหมู่
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {FRIDGE_CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    วันหมดอายุ (ถ้ามี)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  โน้ตย่อ / ตำแหน่งจัดเก็บ
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น แช่ช่องฟรีซ, เปิดแล้ว"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md disabled:opacity-50"
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
        title="ยืนยันการลบวัตถุดิบ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemToDelete?.name || 'รายการนี้'}" ออกจากตู้เย็น?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItemId(null)}
      />
    </div>
  );
};
