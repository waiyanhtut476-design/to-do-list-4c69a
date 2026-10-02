import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Calendar,
  Bell,
  Trash2,
  Plus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Todo, PriorityLevel, SubTask } from '../types/todo';
import { DEFAULT_CATEGORIES, TAG_COLOR_PALETTE } from '../constants/categories';

interface TaskEditModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Todo>) => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  todo,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [tagColor, setTagColor] = useState(DEFAULT_CATEGORIES[0].color);
  const [dueDate, setDueDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setCategory(todo.category);
      setTagColor(todo.tagColor || DEFAULT_CATEGORIES[0].color);
      setDueDate(todo.dueDate || '');
      setReminderEnabled(todo.reminderEnabled ?? true);
      setSubtasks(todo.subtasks || []);
    }
  }, [todo]);

  if (!isOpen || !todo) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(todo.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        tagColor,
        dueDate: dueDate || '',
        reminderEnabled,
        subtasks,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              แก้ไขรายละเอียดงาน
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ชื่องาน
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุชื่องาน..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              รายละเอียด / โน้ตย่อ
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="ใส่ข้อมูลเพิ่มเติมเกี่ยวกับงานนี้..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              ระดับความสำคัญ (Priority)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'ต่ำ', activeClass: 'bg-emerald-500 text-white border-emerald-600' },
                { id: 'medium', label: 'ปานกลาง', activeClass: 'bg-sky-500 text-white border-sky-600' },
                { id: 'high', label: 'สูง', activeClass: 'bg-amber-500 text-white border-amber-600' },
                { id: 'urgent', label: 'ด่วนมาก', activeClass: 'bg-rose-500 text-white border-rose-600' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as PriorityLevel)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    priority === p.id
                      ? p.activeClass
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Tag Color */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              หมวดหมู่และสีแท็ก
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    setTagColor(cat.color);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    category === cat.name
                      ? 'ring-2 ring-indigo-500 font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Tag Color Palette */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">เลือกสีแท็ก:</span>
              <div className="flex items-center gap-1.5">
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
          </div>

          {/* Due Date & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                กำหนดส่ง
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 self-end">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  แจ้งเตือนเวลา
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

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              งานย่อย ({subtasks.length})
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
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
                placeholder="เพิ่มงานย่อย..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskInput.trim()}
                className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
