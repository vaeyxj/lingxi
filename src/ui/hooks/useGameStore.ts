import { useGameStore } from '../../shared/store/gameStore';
import type { EmployeeState, ActivityLogEntry, TimeSpeed } from '../../shared/store/types';

export function useEmployees(): Record<string, EmployeeState> {
  return useGameStore((s) => s.employees);
}

export function useSelectedEmployee(): EmployeeState | null {
  return useGameStore((s) => {
    const id = s.selectedEmployeeId;
    return id ? s.employees[id] ?? null : null;
  });
}

export function useSelectedEmployeeId(): string | null {
  return useGameStore((s) => s.selectedEmployeeId);
}

export function useCurrentTime(): number {
  return useGameStore((s) => s.currentTime);
}

export function useDayNumber(): number {
  return useGameStore((s) => s.dayNumber);
}

export function useTimeSpeed(): TimeSpeed {
  return useGameStore((s) => s.timeSpeed);
}

export function useIsPaused(): boolean {
  return useGameStore((s) => s.isPaused);
}

export function useActivityLog(): ActivityLogEntry[] {
  return useGameStore((s) => s.activityLog);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
