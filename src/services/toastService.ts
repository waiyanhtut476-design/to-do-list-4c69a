export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastService {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public show(message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };

    // Keep max 4 toasts
    this.toasts = [newToast, ...this.toasts.slice(0, 3)];
    this.notify();

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  public success(message: string = 'บันทึกแล้ว') {
    this.show(message, 'success');
  }

  public error(message: string) {
    this.show(message, 'error', 5000);
  }

  public info(message: string) {
    this.show(message, 'info');
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toastService = new ToastService();

// Helper to convert Firestore error to friendly Thai text
export function formatFirestoreError(error: unknown): string {
  if (!error) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  const str = error instanceof Error ? error.message : String(error);

  if (str.includes('permission-denied') || str.includes('Missing or insufficient permissions')) {
    return 'ไม่มีสิทธิ์ในการบันทึกหรือแก้ไขข้อมูลใน Firestore (โปรดตรวจสอบสถานะเข้าสู่ระบบ)';
  }
  if (str.includes('unavailable') || str.includes('client is offline')) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Firestore ได้ในขณะนี้ (ออฟไลน์)';
  }
  if (str.includes('not-found')) {
    return 'ไม่พบเอกสารข้อมูลนี้ในระบบ';
  }
  if (str.includes('already-exists')) {
    return 'มีรายการนี้อยู่แล้วในระบบ';
  }
  if (str.includes('resource-exhausted') || str.includes('Quota exceeded')) {
    return 'การใช้งานเกินโควตาของ Firebase ชั่วคราว';
  }
  if (str.includes('unauthenticated')) {
    return 'ต้องเข้าสู่ระบบก่อนทำการบันทึกข้อมูล';
  }
  return str.length > 120 ? str.slice(0, 120) + '...' : str;
}
