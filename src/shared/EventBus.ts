import EventEmitter from 'eventemitter3';

export interface EventMap {
  'employee:clicked': [employeeId: string];
  'employee:sendTo': [employeeId: string, zoneType: string];
  'employee:selected': [employeeId: string | null];
  'location:clicked': [zoneId: string];
  'time:dayEnd': [dayNumber: number];
  'speed:changed': [speed: number];
  'camera:follow': [employeeId: string];
}

const eventBus = new EventEmitter<EventMap>();

export default eventBus;
