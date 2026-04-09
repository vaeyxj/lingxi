import { create } from 'zustand';
import type { EmployeeState, ActivityLogEntry, TimeSpeed } from './types';

interface GameState {
  employees: Record<string, EmployeeState>;
  selectedEmployeeId: string | null;
  currentTime: number; // minutes since 00:00
  dayNumber: number;
  timeSpeed: TimeSpeed;
  isPaused: boolean;
  activityLog: ActivityLogEntry[];
  playerZone: string | null;

  // Actions
  setEmployees: (employees: Record<string, EmployeeState>) => void;
  updateEmployee: (id: string, patch: Partial<EmployeeState>) => void;
  selectEmployee: (id: string | null) => void;
  setTime: (time: number) => void;
  setDayNumber: (day: number) => void;
  setSpeed: (speed: TimeSpeed) => void;
  togglePause: () => void;
  addLogEntry: (entry: ActivityLogEntry) => void;
  setPlayerZone: (zone: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  employees: {},
  selectedEmployeeId: null,
  currentTime: 480, // 08:00
  dayNumber: 1,
  timeSpeed: 1,
  isPaused: false,
  activityLog: [],
  playerZone: null,

  setEmployees: (employees) => set({ employees }),

  updateEmployee: (id, patch) =>
    set((state) => {
      const existing = state.employees[id];
      if (!existing) return state;
      return {
        employees: {
          ...state.employees,
          [id]: { ...existing, ...patch },
        },
      };
    }),

  selectEmployee: (id) => set({ selectedEmployeeId: id }),

  setTime: (time) => set({ currentTime: time }),

  setDayNumber: (day) => set({ dayNumber: day }),

  setSpeed: (speed) => set({ timeSpeed: speed }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  addLogEntry: (entry) =>
    set((state) => ({
      activityLog: [entry, ...state.activityLog].slice(0, 50),
    })),

  setPlayerZone: (zone) => set({ playerZone: zone }),
}));
