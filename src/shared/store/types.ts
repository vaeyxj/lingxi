export type EmployeeRole = 'engineer' | 'designer' | 'pm' | 'manager' | 'intern';

export type EmployeeActivity =
  | 'arriving'
  | 'working'
  | 'meeting'
  | 'coffee_break'
  | 'lunch'
  | 'idle'
  | 'walking'
  | 'departing'
  | 'gone';

export interface EmployeeAttributes {
  energy: number;
  mood: number;
  productivity: number;
}

export interface EmployeeState {
  id: string;
  name: string;
  role: EmployeeRole;
  avatar: string;
  deskId: string;
  activity: EmployeeActivity;
  attributes: EmployeeAttributes;
  tileX: number;
  tileY: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number; // game minutes
  employeeId: string;
  employeeName: string;
  message: string;
}

export type TimeSpeed = 1 | 2 | 5;
