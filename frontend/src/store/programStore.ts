import { create } from 'zustand';
import { programApi } from '../services/api';

export interface DayContent {
  id: string;
  dayId: string;
  type: string;
  title: string;
  content: any;
  orderIndex: number;
  isRequired: boolean;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  contents: DayContent[];
  nextDayNumber?: number | null;
}

interface UserProgress {
  id: string;
  userId: string;
  dayId: string;
  contentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  answers?: any;
  completedAt?: string;
  content: DayContent;
  day: ProgramDay;
}

interface Reflection {
  id: string;
  userId: string;
  dayId: string;
  reflectionType: string;
  content: string;
  createdAt: string;
}

interface ProgramState {
  currentDay: ProgramDay | null;
  progress: UserProgress[];
  reflections: Reflection[];
  canUnlockNext: boolean;
  completedRequired: number;
  totalRequired: number;
  isLoading: boolean;
  fetchCurrentDay: () => Promise<void>;
  fetchDay: (dayNumber: number) => Promise<ProgramDay>;
  completeContent: (dayNumber: number, contentId: string, answers?: any) => Promise<void>;
  saveReflection: (data: any) => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchPreviousDay: () => Promise<number>;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  currentDay: null,
  progress: [],
  reflections: [],
  canUnlockNext: false,
  completedRequired: 0,
  totalRequired: 0,
  isLoading: false,

  fetchCurrentDay: async () => {
    set({ isLoading: true });
    try {
      const { data } = await programApi.currentDay();
      set({
        currentDay: data.day,
        progress: data.progress,
        canUnlockNext: data.canUnlockNext,
        completedRequired: data.completedRequired,
        totalRequired: data.totalRequired,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchDay: async (dayNumber) => {
    const { data } = await programApi.getDay(dayNumber);
    const day = { ...data.day, nextDayNumber: data.nextDayNumber ?? null };
    set({ currentDay: day, progress: data.progress || [] });
    return day;
  },

  completeContent: async (dayNumber, contentId, answers) => {
    const { data } = await programApi.completeContent(dayNumber, contentId, answers);
    const { currentDay } = get();
    if (currentDay) {
      const existingIndex = get().progress.findIndex(p => p.contentId === contentId);
      const content = currentDay.contents.find(item => item.id === contentId);
      const completedProgress = {
        ...data.progress,
        status: 'COMPLETED' as const,
        answers,
        content,
        day: currentDay,
      } as UserProgress;
      const updatedProgress = [...get().progress];
      if (existingIndex >= 0) {
        updatedProgress[existingIndex] = { ...updatedProgress[existingIndex], ...completedProgress };
      } else {
        updatedProgress.push(completedProgress);
      }
      const completedRequired = updatedProgress.filter(p => p.content?.isRequired && p.status === 'COMPLETED').length;
      const totalRequired = currentDay.contents.filter(c => c.isRequired).length;
      set({ progress: updatedProgress, completedRequired, canUnlockNext: totalRequired > 0 && completedRequired === totalRequired });
    }
  },

  saveReflection: async (data) => {
    await programApi.saveReflection(data);
    const { reflections } = get();
    const existing = reflections.findIndex(r => r.dayId === data.dayId && r.reflectionType === data.reflectionType);
    const newReflection = { id: crypto.randomUUID(), userId: '', ...data, createdAt: new Date().toISOString() };
    if (existing >= 0) {
      const updated = [...reflections];
      updated[existing] = newReflection;
      set({ reflections: updated });
    } else {
      set({ reflections: [...reflections, newReflection] });
    }
  },

  fetchProgress: async () => {
    const { data } = await programApi.progress();
    set({ progress: data.progress, reflections: data.reflections });
  },

  fetchPreviousDay: async () => {
    const { data } = await programApi.previousDay();
    return data.dayNumber;
  },
}));
