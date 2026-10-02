import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Clock,
  Flame,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Plus,
  AlertCircle,
  Bell
} from 'lucide-react';
import { Todo, PriorityLevel } from '../types/todo';
import { getCategoryStyle } from '../constants/categories';

interface TaskItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const categoryStyle = getCategoryStyle(todo.category, todo.tagColor);

  // Due date calculations
  const now = Date.now();
  let isOverdue = false;
  let isDueToday = false;
  let formattedDueDate = '';

  if (todo.dueDate) {
    const dueTime = new Date(todo.dueDate).getTime();
    if (!isNaN(dueTime)) {
      isOverdue = !todo.completed && dueTime < now;

      const dueDateObj = new Date(todo.dueDate);
      const today = new Date();
      isDueToday =
        dueDateObj.getFullYear() === today.getFullYear() &&
        dueDateObj.getMonth() === today.getMonth() &&
        dueDateObj.getDate() === today.getDate();

      formattedDueDate = new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dueDateObj);
    }
  }

  const priorityConfig: Record<
    PriorityLevel,
    { label: string; badgeClass: string; icon?: React.ReactNode }
  > = {
    urgent: {
      label: 'ด่วนมาก',
      badgeClass:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
      icon: <Flame className="w-3 h-3 text-rose-500" />,
    },
    high: {
      label: 'สำคัญ',
      badgeClass:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
      icon: <Flame className="w-3 h-3 text-amber-500" />,
    },
    medium: {
      label: 'ปานกลาง',
      badgeClass:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900',
    },
    low: {
      label: 'ทั่วไป/ต่ำ',
      badgeClass:
        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700',
    },
  };

  const totalSubtasks = todo.subtasks?.length || 0;
  const completedSubtasks = todo.subtasks?.filter((s) => s.completed).length || 0;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    onAddSubtask(todo.id, newSubtaskInput);
    setNewSubtaskInput('');
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        todo.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
          : isOverdue
          ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-sm hover:shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Priority subtle left indicator strip */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
          todo.priority === 'urgent'
            ? 'bg-rose-500'
            : todo.priority === 'high'
            ? 'bg-amber-500'
            : todo.priority === 'medium'
            ? 'bg-sky-500'
            : 'bg-slate-300 dark:bg-slate-700'
        }`}
      />

      <div className="p-3.5 sm:p-4 pl-4 sm:pl-5">
        <div className="flex items-start gap-3">
          {/* Checkbox Trigger Button (Click to complete) */}
          <button
            type="button"
            onClick={() => onToggleComplete(todo.id)}
            className={`mt-0.5 shrink-0 w-6 h-6 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              todo.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-800'
            }`}
            title={todo.completed ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
            aria-label="เปลี่ยนสถานะงาน"
          >
            {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Main Content Area (Clickable to toggle complete as requested) */}
          <div
            className="flex-1 min-w-0 cursor-pointer select-none"
            onClick={() => onToggleComplete(todo.id)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm sm:text-base font-semibold leading-snug break-words transition-all ${
                  todo.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {todo.title}
              </h3>
            </div>

            {/* Description Notes */}
            {todo.description && (
              <p
                className={`mt-1 text-xs sm:text-sm line-clamp-2 ${
                  todo.completed
                    ? 'line-through text-slate-400 dark:text-slate-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {todo.description}
              </p>
            )}

            {/* Badges & Metadata Row */}
            <div
              className="mt-2.5 flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs"
              onClick={(e) => e.stopPropagation()} // Prevent completing task when clicking metadata
            >
              {/* Category Tag Badge */}
              <span
                className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1 ${categoryStyle.bgLight} ${categoryStyle.bgDark}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: todo.tagColor || categoryStyle.color }}
                />
                <span>{todo.category}</span>
              </span>

              {/* Priority Badge */}
              <span
                className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1 ${
                  priorityConfig[todo.priority].badgeClass
                }`}
              >
                {priorityConfig[todo.priority].icon}
                <span>{priorityConfig[todo.priority].label}</span>
              </span>

              {/* Due Date Badge */}
              {todo.dueDate && (
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1 ${
                    isOverdue
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-900 animate-pulse'
                      : isDueToday
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {isOverdue ? (
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400" />
                  )}
                  <span>
                    {isOverdue ? 'เลยกำหนด: ' : isDueToday ? 'วันนี้: ' : ''}
                    {formattedDueDate}
                  </span>
                </span>
              )}

              {/* Reminder active indicator */}
              {todo.reminderEnabled && todo.dueDate && !todo.completed && (
                <span
                  className="p-0.5 text-indigo-500 dark:text-indigo-400"
                  title="เปิดการแจ้งเตือนเตือนความจำ"
                >
                  <Bell className="w-3 h-3" />
                </span>
              )}

              {/* Subtasks Counter Trigger */}
              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <ListTodo className="w-3 h-3 text-indigo-500" />
                  <span>
                    {completedSubtasks}/{totalSubtasks} งานย่อย
                  </span>
                  {showSubtasks ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Menu Buttons */}
          <div className="relative shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(todo)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors"
              title="แก้ไขงาน"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
              title="ลบงานนี้"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtasks Expandable Panel */}
        {showSubtasks && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 pl-9 space-y-2">
            {todo.subtasks?.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between group/sub py-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onToggleSubtask(todo.id, st.id)}
                  className="flex items-center gap-2 text-left"
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      st.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className={
                      st.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }
                  >
                    {st.title}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(todo.id, st.id)}
                  className="opacity-0 group-hover/sub:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                  title="ลบงานย่อยนี้"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Quick Add Subtask Input */}
            <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                placeholder="เพิ่มงานย่อย..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskInput.trim()}
                className="p-1 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-40"
              >
                เพิ่ม
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
