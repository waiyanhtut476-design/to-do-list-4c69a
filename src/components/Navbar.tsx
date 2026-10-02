import React, { useState } from 'react';
import {
  CheckCircle2,
  Sun,
  Moon,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Cloud,
  HardDrive,
  LogOut,
  User as UserIcon,
  Download,
  Upload,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { soundService } from '../services/soundService';
import { notificationService } from '../services/notificationService';

interface NavbarProps {
  syncStatus: 'cloud' | 'local' | 'syncing';
  onExport: () => void;
  onOpenImport: () => void;
  totalRemaining: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncStatus,
  onExport,
  onOpenImport,
  totalRemaining,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, loginWithGoogle, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [notificationPermission, setNotificationPermission] = useState(
    notificationService.getPermissionStatus()
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleToggleSound = () => {
    const nextMuted = soundService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) soundService.playComplete();
  };

  const handleRequestNotification = async () => {
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      notificationService.triggerNotification(
        '🎉 เปิดการแจ้งเตือนสำเร็จ!',
        'คุณจะได้รับการแจ้งเตือนเมื่องานใกล้ถึงกำหนดหรือครบกำหนดเวลา'
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      setShowUserMenu(false);
    } catch {
      // Handled
    } finally {
      setIsLoggingIn(false);
    }
  };

  const todayStr = new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass-panel">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            {totalRemaining > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {totalRemaining > 99 ? '99+' : totalRemaining}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-700 dark:from-white dark:via-indigo-200 dark:to-slate-300 bg-clip-text text-transparent">
                Zenith Task
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                <Sparkles className="w-3 h-3" />
                To-Do Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {todayStr}
            </p>
          </div>
        </div>

        {/* Sync & Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud / Local Sync Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              user
                ? syncStatus === 'cloud'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
            title={user ? 'เชื่อมต่อ Firebase Firestore เรียลไทม์' : 'บันทึกในเบราว์เซอร์ (Local Storage)'}
          >
            {user ? (
              <>
                <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'กำลังซิงค์...' : 'Firebase ซิงค์แล้ว'}</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>บันทึกในเครื่อง</span>
              </>
            )}
          </div>

          {/* Push Notification Toggle */}
          <button
            onClick={handleRequestNotification}
            className={`relative p-2 rounded-xl border transition-colors ${
              notificationPermission === 'granted'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'เปิดการแจ้งเตือน Push Notification แล้ว (คลิกเพื่อทดสอบ)'
                : 'คลิกเพื่อเปิดการแจ้งเตือนเมื่อครบกำหนดเวลา'
            }
            aria-label="การแจ้งเตือน"
          >
            {notificationPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {notificationPermission !== 'granted' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title={isMuted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์'}
            aria-label="สลับเสียง"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            title={isDark ? 'สลับเป็นโหมดสว่าง (Light)' : 'สลับเป็นโหมดมืด (Dark)'}
            aria-label="สลับธีม"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Google Auth Dropdown */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:ring-2 hover:ring-indigo-500/30 transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-300 dark:border-indigo-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ'}</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {showUserMenu && user && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'ผู้ใช้งาน'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={onExport}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>สำรองข้อมูล (Export JSON)</span>
                </button>

                <button
                  onClick={onOpenImport}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-500" />
                  <span>นำเข้าข้อมูล (Import JSON)</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
