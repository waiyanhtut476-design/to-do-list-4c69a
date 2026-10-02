import React from 'react';
import { Sparkles, CheckCircle, Search, ClipboardList } from 'lucide-react';
import { FilterType } from '../types/todo';

interface EmptyStateProps {
  filter: FilterType;
  searchQuery: string;
  hasAnyTasks: boolean;
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  searchQuery,
  hasAnyTasks,
  onResetFilters,
}) => {
  if (searchQuery) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          ไม่พบงานที่ตรงกับ "{searchQuery}"
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          ลองค้นหาด้วยคำค้นอื่น หรือล้างช่องค้นหาเพื่อดูงานทั้งหมด
        </p>
        <button
          onClick={onResetFilters}
          className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          ล้างการค้นหา
        </button>
      </div>
    );
  }

  if (filter === 'completed') {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          ยังไม่มีงานที่เสร็จสิ้น
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          คลิกที่รายการงานเพื่อทำเครื่องหมายว่าเสร็จสิ้นแล้ว!
        </p>
      </div>
    );
  }

  if (filter === 'overdue') {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          ยอดเยี่ยม! ไม่มีงานที่เลยกำหนดเวลา
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          คุณจัดการตารางเวลาได้อย่างมีประสิทธิภาพมาก
        </p>
      </div>
    );
  }

  if (!hasAnyTasks) {
    return (
      <div className="py-14 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-sky-500/10 dark:from-indigo-500/20 dark:to-sky-500/20 flex items-center justify-center text-indigo-500 mb-3">
          <ClipboardList className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          ยังไม่มีรายการงาน
        </h4>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          กด <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ เพิ่มงาน</span> ด้านบน เพื่อเริ่มบันทึกเป้าหมายและรายการงานของคุณ
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        <ClipboardList className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
        ไม่มีรายการงานในหมวดนี้
      </h4>
      <button
        onClick={onResetFilters}
        className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
      >
        แสดงงานทั้งหมด
      </button>
    </div>
  );
};
