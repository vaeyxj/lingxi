import Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, DISPLAY_SCALE } from '../../shared/constants';
import {
  buildFloorLayer,
  buildWallLayer,
  buildFurnitureLayer,
  buildCollisionGrid,
  TILES,
} from '../map/TileMapBuilder';
import { ZoneManager } from '../map/ZoneManager';
import { PathfindingManager } from '../systems/PathfindingManager';
import { DayCycleManager } from '../systems/DayCycleManager';
import { EffectsManager } from '../systems/EffectsManager';
import { Employee } from '../entities/Employee';
import { Player } from '../entities/Player';
import { useGameStore } from '../../shared/store/gameStore';
import { officeZones, deskAssignments, ENTRANCE_TILE } from '../../data/mock/officeLayout';
import { mockEmployees } from '../../data/mock/employees';
import eventBus from '../../shared/EventBus';

export class OfficeScene extends Phaser.Scene {
  zoneManager!: ZoneManager;
  private pathfindingManager!: PathfindingManager;
  private dayCycleManager!: DayCycleManager;
  private effectsManager!: EffectsManager;
  private player!: Player;
  private employees: Employee[] = [];
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  cameraFollowsPlayer = true;
  private playerFootstepTimer = 0;

  constructor() {
    super({ key: 'OfficeScene' });
  }

  create(): void {
    // Setup camera
    this.cameras.main.setZoom(DISPLAY_SCALE);
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

    // Build collision grid first (needed by player)
    const collisionGrid = buildCollisionGrid();

    // Background
    this.renderBackground();

    // Build tilemap layers
    const floorGrid = buildFloorLayer();
    const wallGrid = buildWallLayer();
    const furnitureGrid = buildFurnitureLayer();
    this.renderTileLayer(floorGrid, 0);
    this.renderTileLayer(wallGrid, 1);
    this.renderTileLayer(furnitureGrid, 2);

    // Add animated effects for special tiles
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (wallGrid[row][col] !== -1) this.addTileEffects(col, row, wallGrid[row][col], 1);
        if (furnitureGrid[row][col] !== -1) this.addTileEffects(col, row, furnitureGrid[row][col], 2);
      }
    }

    // Render zone labels
    this.renderZoneLabels();

    // Setup zone manager
    this.zoneManager = new ZoneManager();
    this.zoneManager.load(officeZones);

    // Setup pathfinding
    this.pathfindingManager = new PathfindingManager();
    this.pathfindingManager.setGrid(collisionGrid);

    // Setup effects
    this.effectsManager = new EffectsManager(this);
    this.effectsManager.setupZoneLighting(officeZones);
    this.effectsManager.setupZoneParticles(officeZones);
    this.setupDetailedEffects();

    // Create player (spawn at entrance)
    this.player = new Player(this, ENTRANCE_TILE.x, ENTRANCE_TILE.y + 2);
    this.player.setCollisionGrid(collisionGrid);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Setup day cycle manager
    this.dayCycleManager = new DayCycleManager(this.zoneManager);

    // Spawn employees
    this.spawnEmployees();

    // Start day
    this.dayCycleManager.startNewDay();

    // Setup camera controls
    this.setupCameraControls();

    // Listen for events from React
    this.setupEventListeners();

    // Vignette overlay for atmosphere
    this.createVignette();
  }

  private setupDetailedEffects(): void {
    // Tile sprites already have built-in details (monitor glow, etc.)
    // Only add subtle coffee steam as ambient effect
    for (const zone of officeZones) {
      if (zone.type === 'coffee_area') {
        this.effectsManager.addCoffeeSteam(zone.bounds.x + 1, zone.bounds.y + 1);
      }
    }
  }

  private createVignette(): void {
    const { width, height } = this.cameras.main;
    const vignette = this.add.graphics();
    vignette.setScrollFactor(0);
    vignette.setDepth(100);

    // Gradient from edges
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const alpha = (1 - i / steps) * 0.15;
      const inset = i * 20;
      vignette.lineStyle(20, 0x000000, alpha);
      vignette.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
    }
  }

  private renderBackground(): void {
    const bg = this.add.rectangle(
      (MAP_COLS * TILE_SIZE) / 2,
      (MAP_ROWS * TILE_SIZE) / 2,
      MAP_COLS * TILE_SIZE + 200,
      MAP_ROWS * TILE_SIZE + 200,
      0x0e0e1a
    );
    bg.setDepth(-1);
  }

  private renderTileLayer(grid: number[][], depth: number): void {
    const tileScale = TILE_SIZE / 32; // tileset frames are 32x32, scale to TILE_SIZE

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileIndex = grid[row][col];
        if (tileIndex === -1 || tileIndex === TILES.EMPTY) continue;

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const tile = this.add.image(x, y, 'tileset', tileIndex);
        tile.setScale(tileScale);
        tile.setDepth(depth);
      }
    }
  }

  private addTileEffects(_col: number, _row: number, _tileIndex: number, _depth: number): void {
    // Tile sprites have built-in visual details; no additional effects needed
  }

  private renderZoneLabels(): void {
    const labelMap: Record<string, string> = {
      reception: '前台',
      'desk-area-1': '工位区',
      'meeting-room-1': '会议室 A',
      'meeting-room-2': '会议室 B',
      'coffee-area': '咖啡角',
      'lunch-area': '餐厅',
    };

    for (const zone of officeZones) {
      const label = labelMap[zone.id] ?? zone.type;
      const cx = (zone.bounds.x + zone.bounds.width / 2) * TILE_SIZE;
      const cy = (zone.bounds.y + zone.bounds.height / 2) * TILE_SIZE;

      const text = this.add.text(cx, zone.bounds.y * TILE_SIZE + TILE_SIZE + 3, label, {
        fontSize: '6px',
        fontFamily: 'monospace',
        color: '#aabbcc',
        stroke: '#000000',
        strokeThickness: 1.5,
      });
      text.setOrigin(0.5, 0);
      text.setAlpha(0.6);
      text.setDepth(20);
    }
  }

  private spawnEmployees(): void {
    const initialStoreState: Record<string, any> = {};

    for (const empData of mockEmployees) {
      const desk = deskAssignments.find((d) => d.deskId === empData.deskId);
      if (!desk) continue;

      const employee = new Employee(
        this, empData, desk, this.pathfindingManager, ENTRANCE_TILE
      );

      this.employees.push(employee);

      initialStoreState[empData.id] = {
        id: empData.id,
        name: empData.name,
        role: empData.role,
        avatar: empData.avatar,
        deskId: empData.deskId,
        activity: 'gone' as const,
        attributes: employee.getAttributes(),
        tileX: ENTRANCE_TILE.x,
        tileY: ENTRANCE_TILE.y,
      };
    }

    useGameStore.getState().setEmployees(initialStoreState);
    this.dayCycleManager.setEmployees(this.employees);
  }

  private setupCameraControls(): void {
    // Mouse drag to pan (only when holding middle mouse button or right click)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraFollowsPlayer = false;
        this.cameras.main.stopFollow();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom with mouse wheel
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _dx: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.002, 2.5, 8);
      this.cameras.main.setZoom(newZoom);
    });

    // Press Space to re-center camera on player
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => {
        this.cameraFollowsPlayer = true;
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      });
    }
  }

  private setupEventListeners(): void {
    eventBus.on('employee:sendTo', (employeeId, zoneType) => {
      const emp = this.employees.find((e) => e.employeeId === employeeId);
      if (!emp) return;

      const point = this.zoneManager.getRandomInteractionPoint(zoneType);
      if (point) {
        const activityMap: Record<string, string> = {
          coffee_area: 'coffee_break',
          meeting_room: 'meeting',
          lunch_area: 'lunch',
          desk_area: 'working',
        };
        emp.fsm.sendTo((activityMap[zoneType] ?? 'idle') as any, point);
        // Sparkle effect on command
        this.effectsManager.activitySparkle(emp.x, emp.y);
      }
    });

    eventBus.on('camera:follow', (employeeId) => {
      const emp = this.employees.find((e) => e.employeeId === employeeId);
      if (emp) {
        this.cameraFollowsPlayer = false;
        this.cameras.main.stopFollow();
        this.cameras.main.pan(emp.x, emp.y, 500, 'Sine.easeInOut');
      }
    });
  }

  update(time: number, delta: number): void {
    // Update player
    this.player.update(time, delta);

    // Player footstep particles
    if (this.player.isMoving) {
      this.playerFootstepTimer += delta;
      if (this.playerFootstepTimer > 200) {
        this.effectsManager.playerFootstep(this.player.playerX, this.player.playerY);
        this.playerFootstepTimer = 0;
      }
    }

    // Track player zone
    const playerTile = this.player.getTilePos();
    const playerZone = this.zoneManager.getZoneAt(playerTile.x, playerTile.y);
    useGameStore.getState().setPlayerZone(playerZone?.type ?? null);

    // Update pathfinding
    this.pathfindingManager.update();

    // Update day cycle (which updates employees)
    this.dayCycleManager.update(delta);

    // Update effects
    this.effectsManager.update(delta);
  }
}
