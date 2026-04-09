import type { EmployeeActivity } from '../../shared/store/types';
import type { Employee } from '../entities/Employee';

interface FSMState {
  enter(): void;
  update(dt: number): void;
  exit(): void;
}

export class EmployeeFSM {
  private states: Map<EmployeeActivity, FSMState> = new Map();
  private currentState: FSMState | null = null;
  private _currentActivity: EmployeeActivity = 'gone';
  private employee: Employee;

  constructor(employee: Employee) {
    this.employee = employee;
    this.registerStates();
  }

  get currentActivity(): EmployeeActivity {
    return this._currentActivity;
  }

  private registerStates(): void {
    this.states.set('arriving', {
      enter: () => {
        this.employee.walkToDesk();
      },
      update: () => {
        if (!this.employee.isMoving) {
          this.transition('working');
        }
      },
      exit: () => {
        this.employee.logActivity('到达工位，开始工作');
      },
    });

    this.states.set('working', {
      enter: () => {
        this.employee.playSitAnimation();
        this.employee.setThoughtBubble('💻');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 45 + Math.random() * 45; // 45-90 min
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: -0.5 * dt,
          mood: -0.2 * dt,
          productivity: 0.3 * dt,
        });
      },
      exit: () => {},
    });

    this.states.set('walking', {
      enter: () => {
        this.employee.setThoughtBubble('🚶');
      },
      update: () => {
        if (!this.employee.isMoving) {
          this.transition(this.employee.pendingActivity ?? 'idle');
          this.employee.pendingActivity = null;
        }
      },
      exit: () => {},
    });

    this.states.set('coffee_break', {
      enter: () => {
        this.employee.setThoughtBubble('☕');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 5 + Math.random() * 10;
        this.employee.logActivity('去喝咖啡');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: 2.0 * dt,
          mood: 0.5 * dt,
          productivity: 0,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {},
    });

    this.states.set('meeting', {
      enter: () => {
        this.employee.setThoughtBubble('📋');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 30 + Math.random() * 30;
        this.employee.logActivity('参加会议');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: -0.3 * dt,
          mood: -0.3 * dt,
          productivity: 0.1 * dt,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {
        this.employee.logActivity('会议结束');
      },
    });

    this.states.set('lunch', {
      enter: () => {
        this.employee.setThoughtBubble('🍜');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 30 + Math.random() * 30;
        this.employee.logActivity('去吃午饭');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: 3.0 * dt,
          mood: 1.0 * dt,
          productivity: 0,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {
        this.employee.logActivity('午饭结束，回到工位');
      },
    });

    this.states.set('phone_call', {
      enter: () => {
        this.employee.setThoughtBubble('📞');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 5 + Math.random() * 15;
        this.employee.logActivity('去打电话');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: -0.1 * dt,
          mood: 0.3 * dt,
          productivity: 0,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {
        this.employee.logActivity('电话结束');
      },
    });

    this.states.set('shopping', {
      enter: () => {
        this.employee.setThoughtBubble('🛒');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 5 + Math.random() * 10;
        this.employee.logActivity('去超市购物');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: -0.2 * dt,
          mood: 1.0 * dt,
          productivity: 0,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {
        this.employee.logActivity('购物结束');
      },
    });

    this.states.set('restroom', {
      enter: () => {
        this.employee.setThoughtBubble('🚻');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 2 + Math.random() * 5;
        this.employee.logActivity('去卫生间');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: 1.0 * dt,
          mood: 0.2 * dt,
          productivity: 0,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {},
    });

    this.states.set('exercising', {
      enter: () => {
        this.employee.setThoughtBubble('💪');
        this.employee.activityTimer = 0;
        this.employee.activityDuration = 15 + Math.random() * 20;
        this.employee.logActivity('去健身');
      },
      update: (dt: number) => {
        this.employee.activityTimer += dt;
        this.employee.updateAttributes({
          energy: 2.5 * dt,
          mood: 1.5 * dt,
          productivity: 0.2 * dt,
        });
        if (this.employee.activityTimer >= this.employee.activityDuration) {
          this.employee.walkToDesk();
          this.employee.pendingActivity = 'working';
          this.transition('walking');
        }
      },
      exit: () => {
        this.employee.logActivity('健身结束');
      },
    });

    this.states.set('idle', {
      enter: () => {
        this.employee.setThoughtBubble('💤');
      },
      update: () => {},
      exit: () => {},
    });

    this.states.set('departing', {
      enter: () => {
        this.employee.setThoughtBubble('👋');
        this.employee.walkToEntrance();
        this.employee.logActivity('下班离开');
      },
      update: () => {
        if (!this.employee.isMoving) {
          this.transition('gone');
        }
      },
      exit: () => {},
    });

    this.states.set('gone', {
      enter: () => {
        this.employee.setVisible(false);
      },
      update: () => {},
      exit: () => {
        this.employee.setVisible(true);
      },
    });
  }

  transition(activity: EmployeeActivity): void {
    if (this.currentState) {
      this.currentState.exit();
    }
    this._currentActivity = activity;
    this.currentState = this.states.get(activity) ?? null;
    this.currentState?.enter();
    this.employee.syncToStore();
  }

  update(dt: number): void {
    this.currentState?.update(dt);
  }

  // External command to go somewhere
  sendTo(activity: EmployeeActivity, targetTile: { x: number; y: number }): void {
    this.employee.pendingActivity = activity;
    this.employee.walkTo(targetTile.x, targetTile.y);
    this.transition('walking');
  }
}
