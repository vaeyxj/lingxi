import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  LUNCH_START_HOUR,
  LUNCH_END_HOUR,
  GAME_MINUTES_PER_SECOND,
} from '../../shared/constants';
import { useGameStore } from '../../shared/store/gameStore';
import eventBus from '../../shared/EventBus';
import type { Employee } from '../entities/Employee';
import type { ZoneManager } from '../map/ZoneManager';
import { dailySchedule } from '../../data/mock/activities';

export class DayCycleManager {
  private employees: Employee[] = [];
  private zoneManager: ZoneManager;
  private scheduledEventsTriggered: Set<string> = new Set();
  private lunchTriggered = false;
  private departureTriggered = false;
  private lastCoffeeCheck = 0;

  constructor(zoneManager: ZoneManager) {
    this.zoneManager = zoneManager;
  }

  setEmployees(employees: Employee[]): void {
    this.employees = employees;
  }

  startNewDay(): void {
    this.scheduledEventsTriggered.clear();
    this.lunchTriggered = false;
    this.departureTriggered = false;
    this.lastCoffeeCheck = 0;

    const store = useGameStore.getState();
    // Sync with real clock
    const now = new Date();
    const realMinutes = now.getHours() * 60 + now.getMinutes();
    store.setTime(realMinutes);

    // All employees arrive
    for (const emp of this.employees) {
      const arrivalOffset = (Math.random() - 0.5) * 20; // +/- 10 min
      setTimeout(() => {
        emp.fsm.transition('arriving');
      }, arrivalOffset * 50); // stagger the arrivals visually
    }
  }

  update(realDeltaMs: number): void {
    const store = useGameStore.getState();
    if (store.isPaused) return;

    const gameMinutesDelta = (realDeltaMs / 1000) * GAME_MINUTES_PER_SECOND * store.timeSpeed;
    const newTime = store.currentTime + gameMinutesDelta;
    store.setTime(newTime);

    const currentHour = Math.floor(newTime / 60);
    const currentMinute = Math.floor(newTime % 60);

    // Check scheduled events
    for (const event of dailySchedule) {
      const eventKey = `${event.hour}:${event.minute}-${event.activity}`;
      if (this.scheduledEventsTriggered.has(eventKey)) continue;

      if (currentHour > event.hour || (currentHour === event.hour && currentMinute >= event.minute)) {
        this.scheduledEventsTriggered.add(eventKey);
        this.triggerScheduledEvent(event);
      }
    }

    // Lunch time
    if (!this.lunchTriggered && currentHour >= LUNCH_START_HOUR && currentHour < LUNCH_END_HOUR) {
      this.lunchTriggered = true;
      this.triggerLunch();
    }

    // Random coffee breaks (check every 10 game minutes)
    if (newTime - this.lastCoffeeCheck > 10) {
      this.lastCoffeeCheck = newTime;
      this.checkCoffeeBreaks();
    }

    // End of day departure
    if (!this.departureTriggered && currentHour >= DAY_END_HOUR) {
      this.departureTriggered = true;
      this.triggerDeparture();
    }

    // Day ended
    if (newTime >= 24 * 60) {
      const dayNum = store.dayNumber;
      eventBus.emit('time:dayEnd', dayNum);
      store.setDayNumber(dayNum + 1);
      this.startNewDay();
    }

    // Update all employees
    for (const emp of this.employees) {
      emp.updateTick(gameMinutesDelta);
    }

    // Periodic store sync (every ~30 frames)
    if (Math.random() < 0.03) {
      for (const emp of this.employees) {
        emp.periodicSync();
      }
    }

    return;
  }

  private triggerScheduledEvent(event: { activity: string; employeeFilter?: string[]; description: string }): void {
    const affected = event.employeeFilter
      ? this.employees.filter((e) => event.employeeFilter!.includes(e.employeeId))
      : this.employees.slice(0, 4);

    const zoneType = event.activity === 'meeting' ? 'meeting_room' : 'desk_area';

    for (const emp of affected) {
      if (emp.fsm.currentActivity === 'gone' || emp.fsm.currentActivity === 'departing') continue;
      const point = this.zoneManager.getRandomInteractionPoint(zoneType);
      if (point) {
        emp.fsm.sendTo(event.activity as any, point);
      }
    }
  }

  private triggerLunch(): void {
    for (const emp of this.employees) {
      if (emp.fsm.currentActivity === 'gone' || emp.fsm.currentActivity === 'departing') continue;
      // Stagger lunch
      const delay = Math.random() * 3000;
      setTimeout(() => {
        const point = this.zoneManager.getRandomInteractionPoint('lunch_area');
        if (point) {
          emp.fsm.sendTo('lunch', point);
        }
      }, delay);
    }
  }

  private checkCoffeeBreaks(): void {
    for (const emp of this.employees) {
      if (emp.fsm.currentActivity !== 'working') continue;
      const attrs = emp.getAttributes();
      // Low energy = higher chance of coffee break
      const chance = attrs.energy < 50 ? 0.15 : 0.05;
      if (Math.random() < chance) {
        const point = this.zoneManager.getRandomInteractionPoint('coffee_area');
        if (point) {
          emp.fsm.sendTo('coffee_break', point);
        }
      }
    }
  }

  private triggerDeparture(): void {
    for (const emp of this.employees) {
      if (emp.fsm.currentActivity === 'gone') continue;
      const delay = Math.random() * 5000;
      setTimeout(() => {
        emp.fsm.transition('departing');
      }, delay);
    }
  }
}
