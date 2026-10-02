import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Tag,
  Bell,
  SlidersHorizontal,
  X,
  Sparkles,
  ListPlus,
  Trash2
} from 'lucide-react';
import { PriorityLevel, SubTask } from '../types/todo';
import { DEFAULT_CATEGORIES, TAG_COLOR_PALETTE } from '../constants/categories';

interface TaskInputProps {
  onAddTask: (data: {
    title: string;
    description?: string;
    priority: PriorityLevel;
    category: string;
    tagColor: string;
    dueDate?: string;
    reminderEnabled?: boolean;
    subtasks?: SubTask[];
  }) => Promise<unknown>;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [tagColor, setTagColor] = useState(DEFAULT_CATEGORIES[0].color);
  const [dueDate, setDueDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        title: newSubtaskInput.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const finalCategory = isCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : selectedCategory;

      await onAddTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        category: finalCategory,
        tagColor,
        dueDate: dueDate || undefined,
        reminderEnabled,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSubtasks([]);
      setDueDate('');
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (cat: typeof DEFAULT_CATEGORIES[0]) => {
    setSelectedCategory(cat.name);
    setTagColor(cat.color);
    setIsCustomCategory(false);
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md p-3 sm:p-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Input Row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="เพิ่มงานใหม่... (เช่น ซื้อของ, ส่งงานโปรเจกต์)"
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-1.5 pl-1"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                isExpanded
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="ตัวเลือกเพิ่มเติม (ความสำคัญ, วันครบกำหนด, แท็กสี)"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">ตัวเลือก</span>
            </button>

            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>เพิ่มงาน</span>
            </button>
          </div>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5 animate-in fade-in duration-200">
            {/* Description / Notes */}
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม / โน้ตย่อ (ไม่บังคับ)..."
                className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ระดับความสำคัญ (Priority)
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[
                  { id: 'low', label: 'ต่ำ (Low)', activeClass: 'bg-emerald-500 text-white border-emerald-600' },
                  { id: 'medium', label: 'ปานกลาง (Med)', activeClass: 'bg-sky-500 text-white border-sky-600' },
                  { id: 'high', label: 'สูง (High)', activeClass: 'bg-amber-500 text-white border-amber-600' },
                  { id: 'urgent', label: 'ด่วนมาก (Urgent)', activeClass: 'bg-rose-500 text-white border-rose-600' },
                ].map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as PriorityLevel)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all text-center ${
                        isSelected
                          ? p.activeClass + ' shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Tags Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                หมวดหมู่และแท็กสี (Category & Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const isSelected = !isCustomCategory && selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 font-bold ' +
                            cat.bgLight +
                            ' ' +
                            cat.bgDark
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}

                {/* Custom category button */}
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(true)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isCustomCategory
                      ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + หมวดหมู่ใหม่
                </button>
              </div>

              {/* Custom category input row */}
              {isCustomCategory && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="พิมพ์ชื่อหมวดหมู่ที่ต้องการ..."
                    className="flex-1 min-w-[160px] bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1">
                    {TAG_COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTagColor(color)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          tagColor === color ? 'scale-125 ring-2 ring-indigo-500 border-white' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date & Reminder Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  กำหนดส่ง (Due Date & Time)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Reminder Switch */}
              <div className="flex items-center justify-between sm:justify-end sm:gap-4 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    แจ้งเตือนเมื่อครบกำหนด
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      reminderEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Subtasks Builder */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5 text-emerald-500" />
                รายการงานย่อย (Subtasks)
              </label>

              {subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <span className="truncate">{st.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="เพิ่มงานย่อย แล้วกด Enter..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                >
                  เพิ่ม
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setSubtasks([]);
                  setDueDate('');
                  setIsExpanded(false);
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>ยกเลิก</span>
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกงานใหม่</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
