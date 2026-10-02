import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Todo, PriorityLevel, SubTask } from '../types/todo';
import { soundService } from '../services/soundService';
import { notificationService } from '../services/notificationService';
import { toastService, formatFirestoreError } from '../services/toastService';

const LOCAL_STORAGE_KEY = 'zenith_todos_local';

const INITIAL_DEMO_TODOS: Todo[] = [];

export function useTodos() {
  const { user, guestId } = useAuth();
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            return parsed.filter((item) => !item.id?.startsWith('demo-'));
          }
        }
      } catch {}
    }
    return INITIAL_DEMO_TODOS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'cloud' | 'local' | 'syncing'>('local');
  const isInitialMount = useRef(true);

  // Keep local storage synchronized
  useEffect(() => {
    if (!isInitialMount.current && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
      } catch {}
    }
    isInitialMount.current = false;
  }, [todos]);

  // Periodic deadline reminder checker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    notificationService.checkTaskDeadlines(todos);
    const interval = setInterval(() => {
      notificationService.checkTaskDeadlines(todos);
    }, 30000);
    return () => clearInterval(interval);
  }, [todos]);

  // Firestore Realtime Listener
  useEffect(() => {
    if (!user) {
      setSyncStatus('local');
      setIsLoading(false);
      return;
    }

    setSyncStatus('syncing');
    const todosPath = 'todos';
    const q = query(collection(db, todosPath), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteTodos: Todo[] = [];
        snapshot.forEach((docSnap) => {
          remoteTodos.push({ id: docSnap.id, ...docSnap.data() } as Todo);
        });

        const cleanRemote = remoteTodos.filter((t) => !t.id?.startsWith('demo-'));
        cleanRemote.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setTodos(cleanRemote);
        setSyncStatus('cloud');
        setIsLoading(false);
      },
      (error) => {
        setSyncStatus('local');
        setIsLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, todosPath);
        } catch {}
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add Task
  const addTodo = useCallback(
    async (taskData: {
      title: string;
      description?: string;
      priority: PriorityLevel;
      category: string;
      tagColor: string;
      dueDate?: string;
      reminderEnabled?: boolean;
      subtasks?: SubTask[];
    }) => {
      const now = new Date().toISOString();
      const newId = 'todo_' + Math.random().toString(36).substring(2, 12);
      const currentUserId = user ? user.uid : guestId;

      const newTodo: Todo = {
        id: newId,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        completed: false,
        priority: taskData.priority,
        category: taskData.category,
        tagColor: taskData.tagColor,
        dueDate: taskData.dueDate || '',
        reminderEnabled: taskData.reminderEnabled ?? true,
        subtasks: taskData.subtasks || [],
        order: todos.length,
        userId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      setTodos((prev) => [newTodo, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'todos', newId), newTodo);
          toastService.success('เพิ่มงานใหม่และบันทึกแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.CREATE, `todos/${newId}`);
        }
      } else {
        toastService.success('บันทึกงานใหม่แล้ว');
      }
      return newTodo;
    },
    [user, guestId, todos.length]
  );

  // Update Task
  const updateTodo = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      const now = new Date().toISOString();
      const updatedPayload = { ...updates, updatedAt: now };

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedPayload } : t))
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'todos', id), updatedPayload);
          toastService.success('บันทึกการแก้ไขแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `todos/${id}`);
        }
      } else {
        toastService.success('บันทึกการแก้ไขแล้ว');
      }
    },
    [user]
  );

  // Toggle Completion
  const toggleComplete = useCallback(
    async (id: string) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;

      const nextCompleted = !target.completed;
      const now = new Date().toISOString();

      if (nextCompleted) {
        soundService.playComplete();
        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']
          });
        } catch {}
      } else {
        soundService.playUncomplete();
      }

      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: nextCompleted, updatedAt: now } : t
        )
      );

      if (user) {
        try {
          await updateDoc(doc(db, 'todos', id), {
            completed: nextCompleted,
            updatedAt: now,
          });
          toastService.success(nextCompleted ? 'ยินดีด้วย! ทำงานสำเร็จแล้ว' : 'เปลี่ยนสถานะเป็นยังไม่เสร็จแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.UPDATE, `todos/${id}`);
        }
      } else {
        toastService.success(nextCompleted ? 'ยินดีด้วย! ทำงานสำเร็จแล้ว' : 'เปลี่ยนสถานะแล้ว');
      }
    },
    [todos, user]
  );

  // Delete Task
  const deleteTodo = useCallback(
    async (id: string) => {
      soundService.playDelete();
      setTodos((prev) => prev.filter((t) => t.id !== id));

      if (user) {
        try {
          await deleteDoc(doc(db, 'todos', id));
          toastService.success('ลบงานเรียบร้อยแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
          handleFirestoreError(error, OperationType.DELETE, `todos/${id}`);
        }
      } else {
        toastService.success('ลบงานเรียบร้อยแล้ว');
      }
    },
    [user]
  );

  // Toggle Subtask
  const toggleSubtask = useCallback(
    async (todoId: string, subtaskId: string) => {
      const target = todos.find((t) => t.id === todoId);
      if (!target || !target.subtasks) return;

      const updatedSubtasks = target.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const allSubtasksDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
      soundService.playComplete();

      await updateTodo(todoId, {
        subtasks: updatedSubtasks,
        completed: allSubtasksDone ? true : target.completed,
      });
    },
    [todos, updateTodo]
  );

  // Add Subtask
  const addSubtask = useCallback(
    async (todoId: string, title: string) => {
      if (!title.trim()) return;
      const target = todos.find((t) => t.id === todoId);
      if (!target) return;

      const newSubtask: SubTask = {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        completed: false,
      };

      const updatedSubtasks = [...(target.subtasks || []), newSubtask];
      await updateTodo(todoId, { subtasks: updatedSubtasks });
    },
    [todos, updateTodo]
  );

  // Delete Subtask
  const deleteSubtask = useCallback(
    async (todoId: string, subtaskId: string) => {
      const target = todos.find((t) => t.id === todoId);
      if (!target || !target.subtasks) return;

      const updatedSubtasks = target.subtasks.filter((st) => st.id !== subtaskId);
      await updateTodo(todoId, { subtasks: updatedSubtasks });
    },
    [todos, updateTodo]
  );

  // Batch Clear Completed
  const clearCompleted = useCallback(async () => {
    const completedTasks = todos.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    soundService.playDelete();
    setTodos((prev) => prev.filter((t) => !t.completed));

    if (user) {
      try {
        const batch = writeBatch(db);
        completedTasks.forEach((t) => {
          batch.delete(doc(db, 'todos', t.id));
        });
        await batch.commit();
        toastService.success(`ล้างงานที่เสร็จแล้ว ${completedTasks.length} รายการแล้ว`);
      } catch (error) {
        toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
      }
    } else {
      toastService.success(`ล้างงานที่เสร็จแล้ว ${completedTasks.length} รายการแล้ว`);
    }
  }, [todos, user]);

  // Batch Toggle All
  const toggleAll = useCallback(
    async (completedStatus: boolean) => {
      const now = new Date().toISOString();
      if (completedStatus) {
        soundService.playComplete();
        confetti({ particleCount: 60, spread: 70 });
      }

      setTodos((prev) =>
        prev.map((t) => ({ ...t, completed: completedStatus, updatedAt: now }))
      );

      if (user) {
        try {
          const batch = writeBatch(db);
          todos.forEach((t) => {
            batch.update(doc(db, 'todos', t.id), {
              completed: completedStatus,
              updatedAt: now,
            });
          });
          await batch.commit();
          toastService.success(completedStatus ? 'ทำเครื่องหมายว่าเสร็จสิ้นทั้งหมดแล้ว' : 'ยกเลิกสถานะเสร็จสิ้นทั้งหมดแล้ว');
        } catch (error) {
          toastService.error('ผิดพลาด: ' + formatFirestoreError(error));
        }
      } else {
        toastService.success(completedStatus ? 'ทำเครื่องหมายว่าเสร็จสิ้นทั้งหมดแล้ว' : 'ยกเลิกสถานะเสร็จสิ้นทั้งหมดแล้ว');
      }
    },
    [todos, user]
  );

  // Export JSON backup
  const exportTodosJson = useCallback(() => {
    if (typeof window === 'undefined') return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(todos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zenith_todos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toastService.success('ส่งออกข้อมูลสำรองเรียบร้อยแล้ว');
  }, [todos]);

  // Import JSON backup
  const importTodosJson = useCallback(
    async (jsonContent: string) => {
      try {
        const imported = JSON.parse(jsonContent);
        if (!Array.isArray(imported)) throw new Error('Invalid format: expected array');

        const now = new Date().toISOString();
        const currentUserId = user ? user.uid : guestId;

        const sanitized: Todo[] = imported.map((item, index) => ({
          id: item.id || 'todo_' + Math.random().toString(36).substring(2, 12),
          title: String(item.title || 'Untitled Task'),
          description: String(item.description || ''),
          completed: Boolean(item.completed),
          priority: ['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium',
          category: String(item.category || 'General'),
          tagColor: String(item.tagColor || '#3B82F6'),
          dueDate: item.dueDate || '',
          reminderEnabled: Boolean(item.reminderEnabled ?? true),
          subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
          order: index,
          userId: currentUserId,
          createdAt: item.createdAt || now,
          updatedAt: now,
        }));

        setTodos(sanitized);

        if (user) {
          const batch = writeBatch(db);
          sanitized.forEach((t) => {
            batch.set(doc(db, 'todos', t.id), t);
          });
          await batch.commit();
        }
        toastService.success(`นำเข้าข้อมูลสำเร็จ ${sanitized.length} รายการ`);
        return true;
      } catch (err) {
        console.error('Import error:', err);
        toastService.error('ผิดพลาด: รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        return false;
      }
    },
    [user, guestId]
  );

  return {
    todos,
    isLoading,
    syncStatus,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    clearCompleted,
    toggleAll,
    exportTodosJson,
    importTodosJson,
  };
}
