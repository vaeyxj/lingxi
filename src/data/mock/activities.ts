import type { EmployeeActivity } from '../../shared/store/types';

export interface ActivityDefinition {
  type: EmployeeActivity;
  targetZone: string; // zone type
  durationMinutes: [number, number]; // [min, max]
  effects: {
    energy?: number;
    mood?: number;
    productivity?: number;
  };
  label: string;
  emoji: string;
}

export const activityDefinitions: Record<string, ActivityDefinition> = {
  working: {
    type: 'working',
    targetZone: 'desk_area',
    durationMinutes: [45, 90],
    effects: { energy: -0.5, mood: -0.2, productivity: 0.3 },
    label: '工作中',
    emoji: '💻',
  },
  meeting: {
    type: 'meeting',
    targetZone: 'meeting_room',
    durationMinutes: [30, 60],
    effects: { energy: -0.3, mood: -0.3, productivity: 0.1 },
    label: '开会中',
    emoji: '📋',
  },
  coffee_break: {
    type: 'coffee_break',
    targetZone: 'coffee_area',
    durationMinutes: [5, 15],
    effects: { energy: 2.0, mood: 0.5, productivity: 0 },
    label: '喝咖啡',
    emoji: '☕',
  },
  lunch: {
    type: 'lunch',
    targetZone: 'lunch_area',
    durationMinutes: [30, 60],
    effects: { energy: 3.0, mood: 1.0, productivity: 0 },
    label: '午餐',
    emoji: '🍜',
  },
};

// Scheduled events during the day (hour, activity type, affected employee filter)
export interface ScheduledEvent {
  hour: number;
  minute: number;
  activity: EmployeeActivity;
  employeeFilter?: string[]; // employee ids, undefined = random selection
  description: string;
}

export const dailySchedule: ScheduledEvent[] = [
  { hour: 10, minute: 0, activity: 'meeting', description: '晨会', employeeFilter: ['emp-01', 'emp-02', 'emp-03', 'emp-05'] },
  { hour: 14, minute: 0, activity: 'meeting', description: '下午评审会', employeeFilter: ['emp-03', 'emp-04', 'emp-07', 'emp-05'] },
  { hour: 16, minute: 0, activity: 'meeting', description: '需求讨论', employeeFilter: ['emp-01', 'emp-02', 'emp-03'] },
];
