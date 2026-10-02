import { soundService } from './soundService';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  todoId?: string;
  priority?: string;
  timestamp: number;
}

type NotificationCallback = (notifications: InAppNotification[]) => void;

class NotificationService {
  private activeNotifications: InAppNotification[] = [];
  private listeners: Set<NotificationCallback> = new Set();
  private notifiedTaskIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('zenith_notified_tasks');
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            this.notifiedTaskIds = new Set(ids);
          }
        }
      } catch {}
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  public subscribe(callback: NotificationCallback): () => void {
    this.listeners.add(callback);
    callback(this.activeNotifications);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.activeNotifications));
  }

  public dismissNotification(id: string) {
    this.activeNotifications = this.activeNotifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  public clearAll() {
    this.activeNotifications = [];
    this.notifyListeners();
  }

  public triggerNotification(title: string, body: string, todoId?: string, priority?: string) {
    soundService.playAlarm();

    // 1. In-app notification toast
    const notif: InAppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      todoId,
      priority,
      timestamp: Date.now(),
    };

    this.activeNotifications = [notif, ...this.activeNotifications.slice(0, 4)];
    this.notifyListeners();

    // 2. Web / Push Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: todoId || 'todo-reminder',
        });
      } catch (err) {
        console.warn('Web notification dispatch fallback:', err);
      }
    }

    if (todoId && typeof sessionStorage !== 'undefined') {
      this.notifiedTaskIds.add(todoId);
      try {
        sessionStorage.setItem('zenith_notified_tasks', JSON.stringify(Array.from(this.notifiedTaskIds)));
      } catch {}
    }
  }

  public checkTaskDeadlines(todos: Array<{ id: string; title: string; dueDate?: string; completed: boolean; reminderEnabled?: boolean; priority: string }>) {
    if (typeof window === 'undefined') return;
    const now = Date.now();

    todos.forEach((todo) => {
      if (todo.completed || !todo.dueDate || todo.reminderEnabled === false) return;
      if (this.notifiedTaskIds.has(todo.id)) return;

      const dueTime = new Date(todo.dueDate).getTime();
      if (isNaN(dueTime)) return;

      const diffMinutes = Math.round((dueTime - now) / (1000 * 60));

      if (diffMinutes <= 0 && diffMinutes >= -120) {
        this.triggerNotification(
          `⏰ ถึงกำหนดเวลาแล้ว: ${todo.title}`,
          `งานนี้ครบกำหนดแล้ว (${todo.priority.toUpperCase()} priority)`,
          todo.id,
          todo.priority
        );
      } else if (diffMinutes > 0 && diffMinutes <= 15) {
        this.triggerNotification(
          `⏳ ใกล้ถึงกำหนดในอีก ${diffMinutes} นาที: ${todo.title}`,
          `อย่าลืมทำงาน: ${todo.title}`,
          todo.id,
          todo.priority
        );
      }
    });
  }
}

export const notificationService = new NotificationService();
