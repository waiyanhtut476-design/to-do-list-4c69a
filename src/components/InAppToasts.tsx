import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { toastService, ToastItem } from '../services/toastService';
import { notificationService, InAppNotification } from '../services/notificationService';

export const InAppToasts: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const unsubToast = toastService.subscribe((list) => {
      setToasts([...list]);
    });
    const unsubNotif = notificationService.subscribe((list) => {
      setNotifications([...list]);
    });
    return () => {
      unsubToast();
      unsubNotif();
    };
  }, []);

  if (toasts.length === 0 && notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {/* Action Confirmation & Error Toasts */}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 animate-in slide-in-from-top-3 duration-200 ${
            t.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 shadow-rose-500/10'
              : t.type === 'info'
              ? 'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-100 shadow-sky-500/10'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/10'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : t.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              {t.message}
            </p>
          </div>
          <button
            onClick={() => toastService.dismiss(t.id)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Push Deadline Reminders */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl shadow-indigo-500/10 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            {notif.priority === 'urgent' ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
            ) : (
              <Bell className="w-5 h-5 text-indigo-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {notif.title}
            </h4>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {notif.body}
            </p>
          </div>
          <button
            onClick={() => notificationService.dismissNotification(notif.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
