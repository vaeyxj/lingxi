import Phaser from 'phaser';
import { TILE_SIZE, ATTR_MIN, ATTR_MAX } from '../../shared/constants';
import { useGameStore } from '../../shared/store/gameStore';
import type { EmployeeActivity, EmployeeAttributes } from '../../shared/store/types';
import type { EmployeeData } from '../../data/mock/employees';
import type { DeskAssignment } from '../../data/mock/officeLayout';
import type { PathfindingManager, PathPoint } from '../systems/PathfindingManager';
import { EmployeeFSM } from '../ai/EmployeeFSM';
import eventBus from '../../shared/EventBus';

const MOVE_SPEED = 1.5; // tiles per second

export class Employee extends Phaser.GameObjects.Container {
  readonly employeeId: string;
  readonly data_: EmployeeData;
  readonly desk: DeskAssignment;

  private characterSprite: Phaser.GameObjects.Image;
  private nameLabel: Phaser.GameObjects.Text;
  private thoughtBubble: Phaser.GameObjects.Text;
  private pathfinding: PathfindingManager;
  private entranceTile: { x: number; y: number };

  private path: PathPoint[] = [];
  private pathIndex = 0;
  private moveProgress = 0;

  readonly fsm: EmployeeFSM;
  isMoving = false;
  pendingActivity: EmployeeActivity | null = null;
  activityTimer = 0;
  activityDuration = 0;

  private tileX: number;
  private tileY: number;
  private walkBobTime = 0;

  private attributes: EmployeeAttributes = {
    energy: 80 + Math.random() * 20,
    mood: 70 + Math.random() * 30,
    productivity: 0,
  };

  // Character spritesheet frame mapping for roles
  // Order in sheet: 0=player, 1=engineer, 2=designer, 3=pm, 4=manager, 5=intern
  private static ROLE_FRAMES: Record<string, number> = {
    engineer: 1,
    designer: 2,
    pm: 3,
    manager: 4,
    intern: 5,
  };

  constructor(
    scene: Phaser.Scene,
    data: EmployeeData,
    desk: DeskAssignment,
    pathfinding: PathfindingManager,
    entranceTile: { x: number; y: number }
  ) {
    super(scene, entranceTile.x * TILE_SIZE + TILE_SIZE / 2, entranceTile.y * TILE_SIZE + TILE_SIZE / 2);

    this.employeeId = data.id;
    this.data_ = data;
    this.desk = desk;
    this.pathfinding = pathfinding;
    this.entranceTile = entranceTile;
    this.tileX = entranceTile.x;
    this.tileY = entranceTile.y;

    const frame = Employee.ROLE_FRAMES[data.role] ?? 1;

    // Character sprite
    this.characterSprite = scene.add.image(0, -2, 'characters', frame);
    this.characterSprite.setScale(0.35);
    this.add(this.characterSprite);

    // Shadow - right under feet
    const shadow = scene.add.ellipse(0, 6, 10, 4, 0x000000, 0.25);
    this.add(this.characterSprite);

    // Name label - above head (use higher resolution + scale down for crisp text)
    this.nameLabel = scene.add.text(0, -18, data.name, {
      fontSize: '24px',
      fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      resolution: 2,
    });
    this.nameLabel.setScale(0.3);
    this.nameLabel.setOrigin(0.5, 1);
    // Use linear filtering so text isn't pixelated by pixelArt mode
    this.nameLabel.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.add(this.nameLabel);

    // Thought bubble
    this.thoughtBubble = scene.add.text(8, -20, '', {
      fontSize: '10px',
    });
    this.thoughtBubble.setOrigin(0, 1);
    this.add(this.thoughtBubble);

    this.setSize(16, 24);
    this.setInteractive(new Phaser.Geom.Rectangle(-8, -12, 16, 24), Phaser.Geom.Rectangle.Contains);

    this.on('pointerdown', () => {
      eventBus.emit('employee:clicked', this.employeeId);
    });

    this.on('pointerover', () => {
      this.characterSprite.setTint(0xffff88);
    });
    this.on('pointerout', () => {
      this.characterSprite.clearTint();
    });

    scene.add.existing(this);
    this.setDepth(10);

    this.fsm = new EmployeeFSM(this);
  }

  setThoughtBubble(emoji: string): void {
    this.thoughtBubble.setText(emoji);
  }

  playSitAnimation(): void {
    // For now just stop movement visual
    this.isMoving = false;
  }

  async walkTo(tileX: number, tileY: number): Promise<void> {
    const path = await this.pathfinding.findPath(this.tileX, this.tileY, tileX, tileY);
    if (path && path.length > 1) {
      this.path = path;
      this.pathIndex = 0;
      this.moveProgress = 0;
      this.isMoving = true;
    } else {
      // No path found — stay in place, retry later
      this.isMoving = false;
    }
  }

  walkToDesk(): void {
    this.walkTo(this.desk.chairX, this.desk.chairY);
  }

  walkToEntrance(): void {
    this.walkTo(this.entranceTile.x, this.entranceTile.y);
  }

  updateMovement(dt: number): void {
    if (!this.isMoving || this.path.length === 0) return;

    const current = this.path[this.pathIndex];
    const next = this.path[this.pathIndex + 1];

    if (!next) {
      this.tileX = current.x;
      this.tileY = current.y;
      this.x = current.x * TILE_SIZE + TILE_SIZE / 2;
      this.y = current.y * TILE_SIZE + TILE_SIZE / 2;
      this.isMoving = false;
      this.path = [];
      return;
    }

    this.moveProgress += MOVE_SPEED * dt;

    if (this.moveProgress >= 1) {
      this.moveProgress -= 1;
      this.pathIndex++;

      if (this.pathIndex >= this.path.length - 1) {
        const last = this.path[this.path.length - 1];
        this.tileX = last.x;
        this.tileY = last.y;
        this.x = last.x * TILE_SIZE + TILE_SIZE / 2;
        this.y = last.y * TILE_SIZE + TILE_SIZE / 2;
        this.isMoving = false;
        this.path = [];
        return;
      }
    }

    // Interpolate position
    const from = this.path[this.pathIndex];
    const to = this.path[this.pathIndex + 1];
    if (from && to) {
      this.x = (from.x + (to.x - from.x) * this.moveProgress) * TILE_SIZE + TILE_SIZE / 2;
      this.y = (from.y + (to.y - from.y) * this.moveProgress) * TILE_SIZE + TILE_SIZE / 2;
      this.tileX = Math.round(this.x / TILE_SIZE);
      this.tileY = Math.round(this.y / TILE_SIZE);
    }

    // Walking bob animation
    this.walkBobTime += dt * 12;
    const bobY = Math.sin(this.walkBobTime) * 1.5;
    this.characterSprite.y = -2 + bobY;

    // Update depth for y-sorting
    this.setDepth(10 + this.y / 1000);
  }

  updateAttributes(deltas: Partial<EmployeeAttributes>): void {
    if (deltas.energy !== undefined) {
      this.attributes.energy = Math.max(ATTR_MIN, Math.min(ATTR_MAX, this.attributes.energy + deltas.energy));
    }
    if (deltas.mood !== undefined) {
      this.attributes.mood = Math.max(ATTR_MIN, Math.min(ATTR_MAX, this.attributes.mood + deltas.mood));
    }
    if (deltas.productivity !== undefined) {
      this.attributes.productivity = Math.max(ATTR_MIN, Math.min(ATTR_MAX, this.attributes.productivity + deltas.productivity));
    }
  }

  getAttributes(): EmployeeAttributes {
    return { ...this.attributes };
  }

  syncToStore(): void {
    useGameStore.getState().updateEmployee(this.employeeId, {
      activity: this.fsm.currentActivity,
      attributes: { ...this.attributes },
      tileX: this.tileX,
      tileY: this.tileY,
    });
  }

  logActivity(message: string): void {
    const store = useGameStore.getState();
    store.addLogEntry({
      id: `${this.employeeId}-${Date.now()}`,
      timestamp: store.currentTime,
      employeeId: this.employeeId,
      employeeName: this.data_.name,
      message,
    });
  }

  updateTick(gameMinutesDelta: number): void {
    // Update movement with real delta (fixed 60fps assumption)
    this.updateMovement(1 / 60);
    // Update FSM with game-time delta
    this.fsm.update(gameMinutesDelta);
  }

  // Periodic sync to store (not every frame)
  periodicSync(): void {
    this.syncToStore();
  }
}
