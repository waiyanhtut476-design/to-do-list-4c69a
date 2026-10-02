import React from 'react';
import {
  ListTodo,
  CheckCircle,
  AlertTriangle,
  Flame,
  Clock
} from 'lucide-react';
import { Todo } from '../types/todo';

interface TaskStatsProps {
  todos: Todo[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ todos }) => {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const remaining = total - completed;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = Date.now();
  const overdueCount = todos.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < now
  ).length;

  const urgentCount = todos.filter(
    (t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')
  ).length;

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              ความคืบหน้ารวม
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {progressPercent}%
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {completed} จาก {total} งานเสร็จแล้ว
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Remaining Tasks (Highlighted as requested) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-white dark:from-indigo-950/40 dark:to-slate-900/80 border border-indigo-100 dark:border-indigo-900/40 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-900/70 dark:text-indigo-300">
              งานที่เหลืออยู่
            </span>
            <div className="p-2 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {remaining}
            </span>
            <span className="text-[11px] font-medium text-indigo-700/60 dark:text-indigo-400/60">
              รายการ
            </span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900/80 border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300">
              ทำเสร็จแล้ว
            </span>
            <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {completed}
            </span>
            <span className="text-[11px] font-medium text-emerald-700/60 dark:text-emerald-400/60">
              รายการ
            </span>
          </div>
        </div>

        {/* Urgent & High Priority */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/30 dark:to-slate-900/80 border border-rose-100 dark:border-rose-900/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-900/70 dark:text-rose-300">
              งานด่วน / สำคัญ
            </span>
            <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {urgentCount}
            </span>
            <span className="text-[11px] font-medium text-rose-700/60 dark:text-rose-400/60">
              รายการ
            </span>
          </div>
        </div>

        {/* Overdue / Due Soon */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm transition-all ${
            overdueCount > 0
              ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-300/80 dark:border-amber-800/80'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${overdueCount > 0 ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
              เลยกำหนดเวลา
            </span>
            <div
              className={`p-2 rounded-xl ${
                overdueCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 animate-bounce'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {overdueCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                overdueCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {overdueCount}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              รายการ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
