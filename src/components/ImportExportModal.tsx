import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonStr: string) => Promise<boolean>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    setErrorMsg('');
    if (!jsonText.trim()) {
      setErrorMsg('กรุณาวางโค้ด JSON ที่ต้องการนำเข้า');
      return;
    }

    try {
      const ok = await onImport(jsonText.trim());
      if (ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setJsonText('');
          onClose();
        }, 1200);
      } else {
        setErrorMsg('รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบโครงสร้างข้อมูล');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการประมวลผล JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              นำเข้าข้อมูลงาน (Import JSON)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            วางข้อมูลสำรอง JSON ที่บันทึกไว้เพื่อกู้คืนรายการงานทั้งหมดของคุณ
          </p>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setErrorMsg('');
            }}
            rows={7}
            placeholder='[{"id": "1", "title": "Example task", "completed": false, "priority": "high", "category": "Work"}]'
            className="w-full font-mono bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
          />

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <Check className="w-4 h-4 shrink-0" />
              <span>นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว!</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonText.trim() || isSuccess}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้าข้อมูล</span>
          </button>
        </div>
      </div>
    </div>
  );
};
