import { CategoryTag } from '../types/todo';

export const DEFAULT_CATEGORIES: CategoryTag[] = [
  {
    id: 'work',
    name: 'งาน (Work)',
    color: '#3B82F6',
    bgLight: 'bg-blue-50 border-blue-200 text-blue-700',
    textLight: 'text-blue-700',
    bgDark: 'dark:bg-blue-950/60 dark:border-blue-800/80 dark:text-blue-300',
    textDark: 'dark:text-blue-300',
  },
  {
    id: 'personal',
    name: 'ส่วนตัว (Personal)',
    color: '#8B5CF6',
    bgLight: 'bg-purple-50 border-purple-200 text-purple-700',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/60 dark:border-purple-800/80 dark:text-purple-300',
    textDark: 'dark:text-purple-300',
  },
  {
    id: 'study',
    name: 'การเรียน (Study)',
    color: '#10B981',
    bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    textLight: 'text-emerald-700',
    bgDark: 'dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-300',
    textDark: 'dark:text-emerald-300',
  },
  {
    id: 'shopping',
    name: 'ซื้อของ (Shopping)',
    color: '#EC4899',
    bgLight: 'bg-pink-50 border-pink-200 text-pink-700',
    textLight: 'text-pink-700',
    bgDark: 'dark:bg-pink-950/60 dark:border-pink-800/80 dark:text-pink-300',
    textDark: 'dark:text-pink-300',
  },
  {
    id: 'health',
    name: 'สุขภาพ (Health)',
    color: '#F59E0B',
    bgLight: 'bg-amber-50 border-amber-200 text-amber-700',
    textLight: 'text-amber-700',
    bgDark: 'dark:bg-amber-950/60 dark:border-amber-800/80 dark:text-amber-300',
    textDark: 'dark:text-amber-300',
  },
  {
    id: 'finance',
    name: 'การเงิน (Finance)',
    color: '#06B6D4',
    bgLight: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    textLight: 'text-cyan-700',
    bgDark: 'dark:bg-cyan-950/60 dark:border-cyan-800/80 dark:text-cyan-300',
    textDark: 'dark:text-cyan-300',
  },
  {
    id: 'general',
    name: 'ทั่วไป (General)',
    color: '#64748B',
    bgLight: 'bg-slate-100 border-slate-200 text-slate-700',
    textLight: 'text-slate-700',
    bgDark: 'dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300',
    textDark: 'dark:text-slate-300',
  }
];

export const TAG_COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export function getCategoryStyle(categoryName: string, customColor?: string) {
  const match = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match;

  return {
    id: categoryName.toLowerCase(),
    name: categoryName,
    color: customColor || '#6366F1',
    bgLight: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    textLight: 'text-indigo-700',
    bgDark: 'dark:bg-indigo-950/60 dark:border-indigo-800/80 dark:text-indigo-300',
    textDark: 'dark:text-indigo-300',
  };
}
