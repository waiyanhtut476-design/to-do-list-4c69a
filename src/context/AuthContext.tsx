import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  testConnection,
  type User
} from '../firebase/config';
import { toastService } from '../services/toastService';
import { ShieldAlert, Copy, Check, X } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  guestId: string;
  isFirebaseConnected: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [unauthorizedHost, setUnauthorizedHost] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [guestId] = useState<string>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        let saved = localStorage.getItem('zenith_guest_id');
        if (!saved) {
          saved = 'guest_' + Math.random().toString(36).substring(2, 12);
          localStorage.setItem('zenith_guest_id', saved);
        }
        return saved;
      } catch {}
    }
    return 'guest_default';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          const anonCred = await signInAnonymously(auth);
          setUser(anonCred.user);
        } catch (err) {
          console.warn('Anonymous sign-in fallback:', err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toastService.success('เข้าสู่ระบบด้วย Google สำเร็จ');
      setUnauthorizedHost(null);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('auth/unauthorized-domain') || errorMessage.includes('unauthorized-domain')) {
        if (typeof window !== 'undefined') {
          setUnauthorizedHost(window.location.hostname);
        }
        toastService.show('การยืนยันตัวตนล้มเหลว: โดเมนยังไม่ได้รับการอนุญาต', 'error', 10000);
      } else if (errorMessage.includes('auth/operation-not-allowed') || errorMessage.includes('operation-not-allowed')) {
        toastService.show('กรุณาเปิดการลงชื่อเข้าใช้ด้วย Google ใน Firebase Console (Authentication -> Sign-in method -> Google -> Enable)', 'error', 15000);
      } else {
        toastService.error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ' + (error instanceof Error ? error.message : ''));
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toastService.info('ออกจากระบบเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Logout failed:', error);
      toastService.error('ออกจากระบบไม่สำเร็จ');
      throw error;
    }
  };

  const handleCopyHost = () => {
    if (!unauthorizedHost) return;
    navigator.clipboard.writeText(unauthorizedHost);
    setCopied(true);
    toastService.success('คัดลอกชื่อโดเมนเรียบร้อยแล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        guestId: user?.uid || guestId,
        isFirebaseConnected,
        loginWithGoogle,
        logout,
      }}
    >
      {children}

      {/* Unauthorized Domain Guide Modal */}
      {unauthorizedHost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-rose-500">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  ต้องอนุญาตโดเมนใน Firebase
                </h3>
              </div>
              <button
                onClick={() => setUnauthorizedHost(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              โดเมนปัจจุบันของคุณยังไม่ได้รับการอนุญาตให้ล็อกอินด้วย Google บน Firebase ของคุณเอง กรุณาเพิ่มโดเมนนี้เพื่อใช้งาน:
            </p>

            {/* Host Name Presenter */}
            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 select-all break-all pr-2">
                {unauthorizedHost}
              </span>
              <button
                onClick={handleCopyHost}
                className="p-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-all flex items-center gap-1 cursor-pointer text-xs shrink-0 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>

            {/* Instruction List */}
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">1</span>
                <span>ไปที่หน้า <strong>Firebase Console</strong> สำหรับโครงการของคุณ</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">2</span>
                <span>เลือกเมนู <strong>Authentication</strong> และเลือกแท็บ <strong>Settings</strong></span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">3</span>
                <span>เลื่อนลงไปที่ <strong>Authorized domains</strong> และคลิก <strong>Add domain</strong></span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">4</span>
                <span>วางชื่อโดเมนที่คัดลอกไว้ (และเพิ่ม <code>localhost</code> หากไม่มี) แล้วกดบันทึก</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setUnauthorizedHost(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
              <button
                onClick={() => {
                  window.open('https://console.firebase.google.com/', '_blank');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                เปิด Firebase Console
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
