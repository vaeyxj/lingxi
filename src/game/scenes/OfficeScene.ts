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
import { DoorManager } from '../systems/DoorManager';
import { Employee } from '../entities/Employee';
import { Player } from '../entities/Player';
import { Minimap } from '../ui/Minimap';
import { useGameStore } from '../../shared/store/gameStore';
import { officeZones, deskAssignments, ENTRANCE_TILE } from '../../data/mock/officeLayout';
import { mockEmployees } from '../../data/mock/employees';
import eventBus from '../../shared/EventBus';

export class OfficeScene extends Phaser.Scene {
  zoneManager!: ZoneManager;
  private pathfindingManager!: PathfindingManager;
  private dayCycleManager!: DayCycleManager;
  private effectsManager!: EffectsManager;
  private doorManager!: DoorManager;
  private player!: Player;
  private employees: Employee[] = [];
  private minimap!: Minimap;
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
    this.cameras.main.setRoundPixels(true);

    // Build collision grid first (needed by player)
    const collisionGrid = buildCollisionGrid();

    // Background
    this.renderBackground();

    // Setup door manager (registers interactive door positions before tile rendering)
    this.doorManager = new DoorManager(this);
    this.setupInteractiveDoors();

    // Build tilemap layers
    const floorGrid = buildFloorLayer();
    const wallGrid = buildWallLayer();
    const furnitureGrid = buildFurnitureLayer();
    this.renderTileLayer(floorGrid, 0);
    this.renderTileLayer(wallGrid, 1);
    this.renderTileLayer(furnitureGrid, 2);

    // Custom desk rendering (replaces ugly tileset DESK sprites)
    this.renderCustomDesks();

    // Custom round tables for lunch area (replaces tileset LUNCH_TABLE)
    this.renderLunchRoundTables();

    // Meeting room decorations
    this.renderMeetingRoomInterior();

    // Scene decorations
    this.renderDecorations();

    // Room interior details
    this.renderPhoneBoothInterior();
    this.renderSupermarketInterior();
    this.renderRestroomInterior();
    this.renderGymInterior();

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

    // Create player (spawn at walkable tile near entrance)
    // Find first walkable tile near entrance
    let spawnX = ENTRANCE_TILE.x;
    let spawnY = ENTRANCE_TILE.y + 1;
    for (let dy = 1; dy <= 4; dy++) {
      const ty = ENTRANCE_TILE.y + dy;
      if (ty < MAP_ROWS && collisionGrid[ty][ENTRANCE_TILE.x] === 0) {
        spawnY = ty;
        break;
      }
    }
    this.player = new Player(this, spawnX, spawnY);
    this.player.setCollisionGrid(collisionGrid);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Setup day cycle manager
    this.dayCycleManager = new DayCycleManager(this.zoneManager);

    // Spawn employees
    this.spawnEmployees();

    // Start day
    this.dayCycleManager.startNewDay();

    // Setup camera controls (includes keyboard zoom shortcuts)
    this.setupCameraControls();

    // Setup minimap
    this.minimap = new Minimap(this, officeZones);

    // Listen for events from React
    this.setupEventListeners();
  }

  private setupDetailedEffects(): void {
    for (const zone of officeZones) {
      if (zone.type === 'coffee_area') {
        this.effectsManager.addCoffeeSteam(zone.bounds.x + 1, zone.bounds.y + 1);
      }
      if (zone.type === 'reception') {
        this.effectsManager.addWindowLight(zone.bounds.x + 1, zone.bounds.y, zone.bounds.width - 2);
      }
    }
  }

  private setupInteractiveDoors(): void {
    // Reception - glass automatic door
    this.doorManager.addGlassDoor(11, 9);

    // Meeting room 1
    this.doorManager.addRoomDoor(30, 8, 'y', -TILE_SIZE, 'meeting-room-1', 'meeting');
    this.doorManager.addRoomDoor(35, 11, 'x', -TILE_SIZE, 'meeting-room-1', 'meeting');

    // Supermarket (was meeting-room-2)
    this.doorManager.addRoomDoor(42, 8, 'y', -TILE_SIZE, 'supermarket', 'supermarket');
    this.doorManager.addRoomDoor(47, 11, 'x', -TILE_SIZE, 'supermarket', 'supermarket');

    // Phone booth
    this.doorManager.addRoomDoor(22, 9, 'x', -TILE_SIZE, 'phone-booth', 'phone-booth');

    // Coffee area (left wall x:30, midY: 14+6/2=17)
    this.doorManager.addRoomDoor(30, 17, 'y', -TILE_SIZE, undefined, 'coffee');

    // Lunch area (left wall x:30, midY: 22+10/2=27; top door midX: 30+12/2=36, y:22)
    this.doorManager.addRoomDoor(30, 27, 'y', -TILE_SIZE, undefined, 'lunch');
    this.doorManager.addRoomDoor(36, 22, 'x', -TILE_SIZE, undefined, 'lunch');

    // Desk area (top door midX: 5+22/2=16, y:12; bottom door midX:16, y:25)
    this.doorManager.addRoomDoor(16, 12, 'x', -TILE_SIZE, undefined, 'desk');
    this.doorManager.addRoomDoor(16, 25, 'x', -TILE_SIZE, undefined, 'desk');

    // Restroom (left wall x:42, midY: 14+6/2=17)
    this.doorManager.addRoomDoor(42, 17, 'y', -TILE_SIZE, 'restroom', 'restroom');

    // Gym (left wall x:44, midY: 22+10/2=27; top door midX: 44+8/2=48, y:22)
    this.doorManager.addRoomDoor(44, 27, 'y', -TILE_SIZE, 'gym', 'gym');
    this.doorManager.addRoomDoor(48, 22, 'x', -TILE_SIZE, 'gym', 'gym');
  }

  private renderPhoneBoothInterior(): void {
    const booth = officeZones.find((z) => z.id === 'phone-booth');
    if (!booth) return;

    const bx = booth.bounds.x;
    const by = booth.bounds.y;

    // Wall-mounted phone on the back wall
    const phoneX = (bx + 2) * TILE_SIZE;
    const phoneY = (by + 1) * TILE_SIZE + TILE_SIZE / 2;
    const phone = this.add.graphics();
    phone.setDepth(2.5);
    // Phone body
    phone.fillStyle(0x2a2a3e, 1);
    phone.fillRect(phoneX - 3, phoneY - 4, 6, 8);
    // Handset
    phone.fillStyle(0x1a1a2e, 1);
    phone.fillRect(phoneX - 2, phoneY - 3, 4, 2);
    // Keypad
    phone.fillStyle(0x556677, 1);
    phone.fillRect(phoneX - 1.5, phoneY, 3, 3);
    // Cord
    phone.lineStyle(0.5, 0x333344, 0.6);
    phone.lineBetween(phoneX, phoneY + 4, phoneX, phoneY + 7);

    // Small shelf under the phone
    const shelf = this.add.graphics();
    shelf.setDepth(2.3);
    shelf.fillStyle(0x7a5c3e, 0.9);
    shelf.fillRect(phoneX - 5, phoneY + 5, 10, 2);
    shelf.fillStyle(0x6a4c2e, 0.8);
    shelf.fillRect(phoneX - 5, phoneY + 7, 10, 1);

    // Small notepad on shelf
    shelf.fillStyle(0xe8e8e0, 0.9);
    shelf.fillRect(phoneX - 3, phoneY + 3, 4, 3);
    shelf.fillStyle(0xd0d0d0, 0.7);
    shelf.fillRect(phoneX - 2, phoneY + 4, 2, 1);
  }

  private renderSupermarketInterior(): void {
    const zone = officeZones.find((z) => z.id === 'supermarket');
    if (!zone) return;
    const bx = zone.bounds.x;
    const by = zone.bounds.y;
    const g = this.add.graphics();
    g.setDepth(2.5);

    // Shelving units (aisles)
    for (let row = 0; row < 2; row++) {
      const sy = (by + 2 + row * 3) * TILE_SIZE;
      for (let col = 0; col < 2; col++) {
        const sx = (bx + 2 + col * 3) * TILE_SIZE;
        g.fillStyle(0x8a7a6a, 0.85);
        g.fillRect(sx, sy, TILE_SIZE * 2, TILE_SIZE - 4);
        // Products on shelf
        const colors = [0xcc4444, 0x44aa44, 0x4488cc, 0xeeaa33, 0xcc44aa];
        for (let i = 0; i < 4; i++) {
          g.fillStyle(colors[i % colors.length], 0.8);
          g.fillRect(sx + 2 + i * 6, sy + 2, 4, 6);
        }
      }
    }

    // Cash register at front
    const cx = (bx + 7) * TILE_SIZE;
    const cy = (by + 2) * TILE_SIZE;
    g.fillStyle(0x555555, 0.9);
    g.fillRect(cx, cy, 10, 8);
    g.fillStyle(0x44cc44, 0.6);
    g.fillRect(cx + 2, cy + 1, 6, 3);
  }

  private renderRestroomInterior(): void {
    const zone = officeZones.find((z) => z.id === 'restroom');
    if (!zone) return;
    const bx = zone.bounds.x;
    const by = zone.bounds.y;
    const g = this.add.graphics();
    g.setDepth(2.5);

    // Toilet stalls
    for (let i = 0; i < 3; i++) {
      const sx = (bx + 1 + i * 2) * TILE_SIZE;
      const sy = (by + 1) * TILE_SIZE;
      // Stall walls
      g.fillStyle(0xd0d0d8, 0.8);
      g.fillRect(sx, sy, 1, TILE_SIZE * 2);
      g.fillRect(sx + TILE_SIZE * 2 - 2, sy, 1, TILE_SIZE * 2);
      // Toilet
      g.fillStyle(0xf0f0f0, 0.9);
      g.fillRect(sx + 4, sy + 6, 8, 10);
      g.fillStyle(0xe0e0e8, 0.7);
      g.fillRect(sx + 5, sy + 7, 6, 4);
    }

    // Sinks along bottom wall
    const sinkY = (by + 4) * TILE_SIZE;
    for (let i = 0; i < 3; i++) {
      const sinkX = (bx + 1 + i * 2) * TILE_SIZE + 4;
      g.fillStyle(0xddddee, 0.9);
      g.fillRect(sinkX, sinkY, 10, 6);
      g.fillStyle(0x88bbdd, 0.4);
      g.fillRect(sinkX + 2, sinkY + 1, 6, 3);
      // Faucet
      g.fillStyle(0xaaaaaa, 0.8);
      g.fillRect(sinkX + 4, sinkY - 2, 2, 3);
    }
  }

  private renderGymInterior(): void {
    const zone = officeZones.find((z) => z.id === 'gym');
    if (!zone) return;
    const bx = zone.bounds.x;
    const by = zone.bounds.y;
    const g = this.add.graphics();
    g.setDepth(2.5);

    // Treadmills
    for (let i = 0; i < 2; i++) {
      const tx = (bx + 1 + i * 3) * TILE_SIZE;
      const ty = (by + 2) * TILE_SIZE;
      g.fillStyle(0x3a3a4a, 0.9);
      g.fillRect(tx, ty, TILE_SIZE * 2, TILE_SIZE + 4);
      g.fillStyle(0x5a5a6a, 0.7);
      g.fillRect(tx + 2, ty + 2, TILE_SIZE * 2 - 4, 4);
      // Screen
      g.fillStyle(0x44cc44, 0.4);
      g.fillRect(tx + 6, ty - 4, 8, 4);
      // Handle bars
      g.fillStyle(0x888888, 0.7);
      g.fillRect(tx + 2, ty - 6, 2, 8);
      g.fillRect(tx + TILE_SIZE * 2 - 4, ty - 6, 2, 8);
    }

    // Weight rack
    const wx = (bx + 1) * TILE_SIZE;
    const wy = (by + 5) * TILE_SIZE;
    g.fillStyle(0x4a4a5a, 0.85);
    g.fillRect(wx, wy, TILE_SIZE * 5, TILE_SIZE - 2);
    // Dumbbells
    const dbColors = [0x333333, 0x444444, 0x555555, 0x444444, 0x333333];
    for (let i = 0; i < 5; i++) {
      g.fillStyle(dbColors[i], 0.8);
      g.fillRect(wx + 3 + i * 6, wy + 3, 4, 6);
    }

    // Yoga mat area
    const mx = (bx + 1) * TILE_SIZE;
    const my = (by + 7) * TILE_SIZE;
    g.fillStyle(0x7b5ea7, 0.35);
    g.fillRect(mx, my, TILE_SIZE * 3, TILE_SIZE + 4);
    g.fillStyle(0x6b4e97, 0.2);
    g.fillRect(mx + TILE_SIZE * 3 + 4, my, TILE_SIZE * 3, TILE_SIZE + 4);
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
      0x3a3a42
    );
    bg.setDepth(-1);
  }

  private renderTileLayer(grid: number[][], depth: number): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileIndex = grid[row][col];
        if (tileIndex === -1 || tileIndex === TILES.EMPTY) continue;

        if (depth === 1 && this.doorManager.shouldSkipTile(row, col)) continue;

        // Skip DESK and LUNCH_TABLE tiles — rendered as custom graphics
        if (depth === 2 && (tileIndex === TILES.DESK || tileIndex === TILES.LUNCH_TABLE)) continue;

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const tile = this.add.image(x, y, 'tileset', tileIndex);
        tile.setScale(0.5);
        tile.setDepth(depth);
      }
    }
  }

  private addTileEffects(_col: number, _row: number, _tileIndex: number, _depth: number): void {
    // Tile sprites have built-in visual details; no additional effects needed
  }

  private renderCustomDesks(): void {
    for (const desk of deskAssignments) {
      this.drawDesk(desk.tileX, desk.tileY);
    }
  }

  private drawDesk(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2);

    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE + 2;
    const w = TILE_SIZE * 2;
    const h = TILE_SIZE - 3;

    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRoundedRect(x + 1, y + h, w, 2, 0.5);

    // Desk surface
    g.fillStyle(0x9B7E56, 1);
    g.fillRoundedRect(x, y, w, h, 1.5);

    // Top edge highlight
    g.fillStyle(0xB89A6A, 0.5);
    g.fillRect(x + 1, y + 0.5, w - 2, 1.5);

    // Wood grain
    g.fillStyle(0x8A6E48, 0.2);
    g.fillRect(x + 3, y + 4, w - 6, 0.5);
    g.fillRect(x + 6, y + 7, w - 12, 0.5);
    g.fillRect(x + 2, y + 9, w - 4, 0.5);

    // Front edge
    g.fillStyle(0x7A5E3A, 0.6);
    g.fillRect(x, y + h - 1.5, w, 1.5);

    // Border
    g.lineStyle(0.4, 0x6A5438, 0.5);
    g.strokeRoundedRect(x, y, w, h, 1.5);

    // Thin laptop
    const lx = x + w / 2 - 5;
    const ly = y + 2;
    // Screen
    g.fillStyle(0x2a2a3a, 0.9);
    g.fillRoundedRect(lx, ly, 10, 6, 0.8);
    g.fillStyle(0x3a7acc, 0.5);
    g.fillRect(lx + 0.8, ly + 0.8, 8.4, 4.4);
    // Screen content hint
    g.fillStyle(0x5599dd, 0.3);
    g.fillRect(lx + 1.5, ly + 1.5, 4, 0.6);
    g.fillRect(lx + 1.5, ly + 2.8, 5.5, 0.6);
    g.fillRect(lx + 1.5, ly + 4, 3, 0.6);
    // Keyboard
    g.fillStyle(0x3a3a4a, 0.7);
    g.fillRoundedRect(lx - 1, ly + 6.5, 12, 3, 0.5);
    g.fillStyle(0x4a4a5a, 0.5);
    for (let i = 0; i < 4; i++) {
      g.fillRect(lx + i * 2.8, ly + 7.2, 2, 0.5);
    }

    // Coffee mug
    const cx = x + w - 5;
    const cy = y + 3;
    g.fillStyle(0xf0f0f0, 0.85);
    g.fillRoundedRect(cx, cy, 3.5, 4, 0.8);
    g.fillStyle(0x8B5E3C, 0.5);
    g.fillRect(cx + 0.5, cy + 0.5, 2.5, 1.5);
    // Handle
    g.lineStyle(0.6, 0xe0e0e0, 0.6);
    g.beginPath();
    g.arc(cx + 3.5, cy + 2, 1.5, -Math.PI / 2, Math.PI / 2, false);
    g.strokePath();

    // Notepad / papers
    g.fillStyle(0xf5f5e8, 0.8);
    g.fillRect(x + 2, y + 3, 5, 7);
    g.fillStyle(0xe8e8d8, 0.5);
    g.fillRect(x + 2.5, y + 4, 4, 0.4);
    g.fillRect(x + 2.5, y + 5.2, 3.2, 0.4);
    g.fillRect(x + 2.5, y + 6.4, 3.8, 0.4);
    // Pen
    g.lineStyle(0.5, 0x3355aa, 0.6);
    g.lineBetween(x + 7.5, y + 4, x + 8.5, y + 9);
  }

  private renderLunchRoundTables(): void {
    const lunch = officeZones.find((z) => z.id === 'lunch-area');
    if (!lunch) return;
    const { x, y } = lunch.bounds;

    const tablePositions = [
      [x + 3, y + 3],
      [x + 7, y + 3],
      [x + 3, y + 7],
      [x + 7, y + 7],
    ];

    for (const [tx, ty] of tablePositions) {
      const g = this.add.graphics();
      g.setDepth(2);
      const cx = tx * TILE_SIZE + TILE_SIZE / 2;
      const cy = ty * TILE_SIZE + TILE_SIZE / 2;

      // Table shadow
      g.fillStyle(0x000000, 0.08);
      g.fillEllipse(cx + 1, cy + 2, 18, 12);

      // Table surface
      g.fillStyle(0xd4956a, 0.9);
      g.fillEllipse(cx, cy, 16, 10);

      // Highlight
      g.fillStyle(0xe0a87a, 0.5);
      g.fillEllipse(cx - 2, cy - 1, 8, 5);

      // Rim
      g.lineStyle(0.5, 0xb07848, 0.6);
      g.strokeEllipse(cx, cy, 16, 10);

      // Dishes/items on table
      g.fillStyle(0xf0f0f0, 0.6);
      g.fillCircle(cx - 3, cy - 1, 1.5);
      g.fillCircle(cx + 3, cy, 1.5);
      g.fillStyle(0xdddddd, 0.4);
      g.fillCircle(cx, cy + 1, 1.2);
    }
  }

  private renderMeetingRoomInterior(): void {
    const room = officeZones.find((z) => z.id === 'meeting-room-1');
    if (!room) return;
    const bx = room.bounds.x;
    const by = room.bounds.y;
    const g = this.add.graphics();
    g.setDepth(2.5);

    // Large conference table (3 tiles, already placed in tilemap but let's add detail)
    const cx = (bx + 5) * TILE_SIZE;
    const cy = (by + 4) * TILE_SIZE + TILE_SIZE / 2;

    // Table detail overlay (subtle wood grain on top of the tileset table)
    g.fillStyle(0x7a6a5a, 0.3);
    g.fillRect(cx - TILE_SIZE * 1.5, cy - 4, TILE_SIZE * 3, 8);

    // Large display/TV on the back wall
    const tvX = (bx + 5) * TILE_SIZE;
    const tvY = (by + 1) * TILE_SIZE + 4;

    // TV mount bracket
    g.fillStyle(0x444444, 0.8);
    g.fillRect(tvX - 1, tvY - 2, 2, 3);

    // TV frame
    g.fillStyle(0x222222, 0.95);
    g.fillRect(tvX - 14, tvY, 28, 14);

    // TV screen
    g.fillStyle(0x2255aa, 0.6);
    g.fillRect(tvX - 13, tvY + 1, 26, 12);

    // Screen content (presentation slide)
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(tvX - 11, tvY + 2, 10, 1);
    g.fillRect(tvX - 11, tvY + 4, 14, 0.8);
    g.fillRect(tvX - 11, tvY + 6, 8, 0.8);
    g.fillStyle(0x44cc88, 0.3);
    g.fillRect(tvX + 4, tvY + 3, 8, 8);

    // Whiteboard/easel on the side wall
    const wbX = (bx + 1) * TILE_SIZE + 4;
    const wbY = (by + 3) * TILE_SIZE;

    // Easel legs
    g.fillStyle(0x6a5a4a, 0.7);
    g.fillRect(wbX - 1, wbY + 10, 1, 6);
    g.fillRect(wbX + 9, wbY + 10, 1, 6);

    // Board surface
    g.fillStyle(0xf0f0f0, 0.9);
    g.fillRect(wbX - 2, wbY, 12, 11);
    g.lineStyle(0.4, 0xaaaaaa, 0.5);
    g.strokeRect(wbX - 2, wbY, 12, 11);

    // Content on the board
    g.lineStyle(0.4, 0x333333, 0.3);
    g.lineBetween(wbX, wbY + 2, wbX + 6, wbY + 2);
    g.lineBetween(wbX, wbY + 4, wbX + 8, wbY + 4);
    g.lineStyle(0.4, 0xcc3333, 0.3);
    g.lineBetween(wbX, wbY + 6, wbX + 5, wbY + 6);

    // Marker tray
    g.fillStyle(0x888888, 0.6);
    g.fillRect(wbX - 1, wbY + 11, 10, 1.5);
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(wbX, wbY + 11, 3, 1);
    g.fillStyle(0xcc2222, 0.7);
    g.fillRect(wbX + 4, wbY + 11, 3, 1);

    // Chairs around the table (small circles)
    const chairPositions = [
      [bx + 3, by + 4], [bx + 4, by + 4],
      [bx + 6, by + 4], [bx + 7, by + 4],
      [bx + 5, by + 3], [bx + 5, by + 5],
    ];
    for (const [ccx, ccy] of chairPositions) {
      const px = ccx * TILE_SIZE + TILE_SIZE / 2;
      const py = ccy * TILE_SIZE + TILE_SIZE / 2;
      g.fillStyle(0x4a4a5a, 0.4);
      g.fillCircle(px, py, 3);
      g.fillStyle(0x5a5a6a, 0.3);
      g.fillCircle(px, py - 0.5, 2);
    }
  }

  private renderDecorations(): void {
    const deskArea = officeZones.find((z) => z.id === 'desk-area-1');
    if (!deskArea) return;
    const { x: ax, y: ay, width: aw, height: ah } = deskArea.bounds;

    // Indoor decorations (two whiteboards flanking the door at midX=11)
    this.drawWhiteboard(ax + 2, ay, 4);
    this.drawWhiteboard(ax + 14, ay, 4);
    this.drawWaterDispenser(ax + aw - 3, ay + 1);
    this.drawLargePlant(ax + 2, ay + 8);
    this.drawLargePlant(ax + 18, ay + 8);
    this.drawRug(ax + 7, ay + 7, 8, 3);
    this.drawFilingCabinet(ax + 1, ay + 3);
    this.drawFilingCabinet(ax + 1, ay + 5);
    this.drawCoatRack(ax + aw - 2, ay + ah - 2);
    this.drawTrashBin(ax + 18, ay + 5);
    this.drawTrashBin(ax + 18, ay + 11);

    const coffeeArea = officeZones.find((z) => z.id === 'coffee-area');
    if (coffeeArea) {
      this.drawRug(coffeeArea.bounds.x + 2, coffeeArea.bounds.y + 3, 6, 2);
    }

    const reception = officeZones.find((z) => z.id === 'reception');
    if (reception) {
      this.drawWallClock(
        reception.bounds.x + Math.floor(reception.bounds.width / 2),
        reception.bounds.y,
      );
    }

    // ── Outdoor campus decorations ──

    // Trees around the perimeter
    this.drawTree(2, 2);
    this.drawTree(2, 10);
    this.drawTree(2, 20);
    this.drawTree(2, 30);
    this.drawTree(55, 2);
    this.drawTree(55, 15);
    this.drawTree(55, 28);
    this.drawTree(40, 34);
    this.drawTree(25, 35);
    this.drawTree(50, 34);

    // Benches along paths
    this.drawBench(8, 34);
    this.drawBench(14, 34);

    // Lamp posts
    this.drawLampPost(11, 33);
    this.drawLampPost(12, 33);

    // Fountain in the south garden
    this.drawFountain(20, 34);

    // Bushes near building
    this.drawBush(4, 3);
    this.drawBush(17, 3);
    this.drawBush(27, 3);
    this.drawBush(4, 32);
    this.drawBush(26, 32);
    this.drawBush(53, 12);
    this.drawBush(53, 20);
  }

  private drawTree(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.5);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Trunk
    g.fillStyle(0x6D4C41, 0.9);
    g.fillRect(x - 2, y + 2, 4, 8);
    g.fillStyle(0x5D3C31, 0.7);
    g.fillRect(x - 1, y + 2, 1, 8);

    // Canopy layers (large, lush tree)
    g.fillStyle(0x2E7D32, 0.9);
    g.fillCircle(x, y - 4, 8);
    g.fillCircle(x - 4, y - 1, 6);
    g.fillCircle(x + 4, y - 1, 6);

    g.fillStyle(0x388E3C, 0.8);
    g.fillCircle(x, y - 6, 6);
    g.fillCircle(x - 3, y - 3, 4);

    g.fillStyle(0x43A047, 0.6);
    g.fillCircle(x + 2, y - 7, 3);
    g.fillCircle(x - 2, y - 2, 3);

    // Shadow on ground
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(x, y + 10, 14, 4);
  }

  private drawBench(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.3);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Legs
    g.fillStyle(0x5D4037, 0.8);
    g.fillRect(x - 6, y + 2, 2, 4);
    g.fillRect(x + 4, y + 2, 2, 4);

    // Seat
    g.fillStyle(0x8D6E63, 0.9);
    g.fillRect(x - 7, y, 14, 3);

    // Back rest
    g.fillStyle(0x795548, 0.85);
    g.fillRect(x - 7, y - 3, 14, 2);

    // Highlight
    g.fillStyle(0x9E8E7E, 0.4);
    g.fillRect(x - 6, y, 12, 1);
  }

  private drawLampPost(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.6);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Pole
    g.fillStyle(0x546E7A, 0.9);
    g.fillRect(x - 1, y - 10, 2, 16);

    // Base
    g.fillStyle(0x455A64, 0.8);
    g.fillRect(x - 3, y + 5, 6, 2);

    // Lamp head
    g.fillStyle(0x78909C, 0.9);
    g.fillRect(x - 3, y - 12, 6, 3);

    // Light glow
    g.fillStyle(0xFFEB3B, 0.15);
    g.fillCircle(x, y - 8, 6);
    g.fillStyle(0xFFEB3B, 0.08);
    g.fillCircle(x, y - 6, 10);
  }

  private drawFountain(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.4);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Base pool
    g.fillStyle(0x78909C, 0.8);
    g.fillEllipse(x, y + 2, 22, 10);

    // Water
    g.fillStyle(0x4FC3F7, 0.5);
    g.fillEllipse(x, y + 2, 18, 7);

    // Water shimmer
    g.fillStyle(0xB3E5FC, 0.3);
    g.fillEllipse(x - 3, y + 1, 6, 3);

    // Center column
    g.fillStyle(0x90A4AE, 0.9);
    g.fillRect(x - 2, y - 6, 4, 8);

    // Top basin
    g.fillStyle(0x78909C, 0.85);
    g.fillEllipse(x, y - 5, 8, 4);
    g.fillStyle(0x4FC3F7, 0.4);
    g.fillEllipse(x, y - 5, 6, 3);

    // Water jet particles
    g.fillStyle(0x81D4FA, 0.4);
    g.fillRect(x - 0.5, y - 10, 1, 4);
    g.fillStyle(0xB3E5FC, 0.3);
    g.fillCircle(x - 2, y - 3, 1);
    g.fillCircle(x + 2, y - 2, 1);
  }

  private drawBush(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.2);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    g.fillStyle(0x388E3C, 0.85);
    g.fillEllipse(x, y, 12, 8);
    g.fillStyle(0x43A047, 0.6);
    g.fillEllipse(x - 2, y - 1, 6, 5);
    g.fillStyle(0x4CAF50, 0.4);
    g.fillEllipse(x + 2, y - 2, 4, 3);
  }

  private drawWhiteboard(tileX: number, tileY: number, widthTiles: number): void {
    const g = this.add.graphics();
    g.setDepth(1.8);
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE + 2;
    const w = widthTiles * TILE_SIZE;
    const h = TILE_SIZE - 4;

    // Board frame
    g.fillStyle(0x8a8a8a, 0.9);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);

    // White surface
    g.fillStyle(0xf8f8f8, 0.95);
    g.fillRect(x, y, w, h);

    // Tray at bottom
    g.fillStyle(0x7a7a7a, 0.8);
    g.fillRect(x + 2, y + h - 1, w - 4, 2);

    // Content scribbles (faint colored lines)
    g.lineStyle(0.4, 0x3366cc, 0.3);
    g.lineBetween(x + 4, y + 2, x + 20, y + 2);
    g.lineBetween(x + 4, y + 4, x + 16, y + 4);
    g.lineStyle(0.4, 0xcc3333, 0.25);
    g.lineBetween(x + 30, y + 3, x + 50, y + 3);
    g.lineStyle(0.4, 0x33aa33, 0.2);
    g.fillStyle(0x33aa33, 0.15);
    g.fillRect(x + 60, y + 2, 12, 6);
    g.strokeRect(x + 60, y + 2, 12, 6);

    // Marker on tray
    g.fillStyle(0x2244aa, 0.8);
    g.fillRect(x + 6, y + h, 6, 1.5);
    g.fillStyle(0xcc2222, 0.7);
    g.fillRect(x + 14, y + h, 6, 1.5);
  }

  private drawWaterDispenser(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.5);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Base stand
    g.fillStyle(0x888888, 0.8);
    g.fillRect(x - 3, y + 2, 6, 6);

    // Water bottle (blue transparent)
    g.fillStyle(0x88bbee, 0.45);
    g.fillRoundedRect(x - 2.5, y - 6, 5, 8, 1.5);
    g.fillStyle(0xaaddff, 0.3);
    g.fillRect(x - 1.5, y - 5, 1.2, 6);

    // Cap
    g.fillStyle(0x5588aa, 0.7);
    g.fillRect(x - 1.5, y - 7, 3, 1.5);

    // Spigot
    g.fillStyle(0xaaaaaa, 0.8);
    g.fillRect(x + 2, y + 0, 1.5, 2);
    // Drip tray
    g.fillStyle(0x777777, 0.6);
    g.fillRect(x - 3, y + 8, 6, 1);
  }

  private drawLargePlant(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.5);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Pot
    g.fillStyle(0xb05030, 0.9);
    g.fillRoundedRect(x - 4, y + 2, 8, 5, 1);
    g.fillStyle(0xc06040, 0.6);
    g.fillRect(x - 3.5, y + 2.5, 7, 1);

    // Soil
    g.fillStyle(0x4a3020, 0.7);
    g.fillRect(x - 3, y + 1, 6, 2);

    // Leaves (multiple overlapping circles)
    const leafColor = 0x4a8a3a;
    g.fillStyle(leafColor, 0.85);
    g.fillCircle(x, y - 2, 4);
    g.fillCircle(x - 3, y - 1, 3);
    g.fillCircle(x + 3, y - 1, 3);
    g.fillCircle(x - 1, y - 5, 2.5);
    g.fillCircle(x + 2, y - 4, 2.5);

    // Highlights
    g.fillStyle(0x5aa04a, 0.4);
    g.fillCircle(x - 1, y - 3, 2);
    g.fillCircle(x + 1, y - 5, 1.5);
  }

  private drawRug(tileX: number, tileY: number, widthTiles: number, heightTiles: number): void {
    const g = this.add.graphics();
    g.setDepth(0.3);
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;
    const w = widthTiles * TILE_SIZE;
    const h = heightTiles * TILE_SIZE;

    // Outer rug
    g.fillStyle(0x8b6e5a, 0.2);
    g.fillRoundedRect(x, y, w, h, 3);

    // Inner pattern
    g.fillStyle(0x9a7e6a, 0.15);
    g.fillRoundedRect(x + 3, y + 3, w - 6, h - 6, 2);

    // Pattern border line
    g.lineStyle(0.4, 0x7a5e4a, 0.15);
    g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 1.5);

    // Center diamond pattern
    const cx = x + w / 2;
    const cy = y + h / 2;
    g.fillStyle(0x6a4e3a, 0.12);
    g.beginPath();
    g.moveTo(cx, cy - 8);
    g.lineTo(cx + 12, cy);
    g.lineTo(cx, cy + 8);
    g.lineTo(cx - 12, cy);
    g.closePath();
    g.fill();
  }

  private drawFilingCabinet(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.5);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Cabinet body
    g.fillStyle(0x7a8a9a, 0.9);
    g.fillRect(x - 5, y - 6, 10, 12);

    // Drawers (3 sections)
    for (let i = 0; i < 3; i++) {
      const dy = y - 5 + i * 3.5;
      g.fillStyle(0x8a9aaa, 0.8);
      g.fillRect(x - 4, dy, 8, 3);
      // Handle
      g.fillStyle(0xbbbbbb, 0.8);
      g.fillRect(x - 1, dy + 1, 2, 0.8);
    }

    // Top edge
    g.fillStyle(0x6a7a8a, 0.7);
    g.fillRect(x - 5, y - 6, 10, 1);
  }

  private drawCoatRack(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.5);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Base
    g.fillStyle(0x5a4a3a, 0.7);
    g.fillCircle(x, y + 5, 3);

    // Pole
    g.fillStyle(0x6a5a4a, 0.8);
    g.fillRect(x - 0.8, y - 6, 1.6, 11);

    // Hooks
    g.lineStyle(0.8, 0x7a6a5a, 0.7);
    g.lineBetween(x, y - 5, x - 3, y - 4);
    g.lineBetween(x, y - 5, x + 3, y - 4);
    g.lineBetween(x, y - 3, x - 2.5, y - 2);
    g.lineBetween(x, y - 3, x + 2.5, y - 2);

    // Jacket hanging
    g.fillStyle(0x3a4a5a, 0.5);
    g.beginPath();
    g.moveTo(x - 3, y - 4);
    g.lineTo(x - 4, y - 1);
    g.lineTo(x - 1, y - 1);
    g.lineTo(x, y - 5);
    g.closePath();
    g.fill();
  }

  private drawTrashBin(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(2.3);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Bin body (slightly trapezoidal)
    g.fillStyle(0x6a6a7a, 0.75);
    g.beginPath();
    g.moveTo(x - 3, y - 2);
    g.lineTo(x - 3.5, y + 4);
    g.lineTo(x + 3.5, y + 4);
    g.lineTo(x + 3, y - 2);
    g.closePath();
    g.fill();

    // Rim
    g.fillStyle(0x7a7a8a, 0.8);
    g.fillRect(x - 3.5, y - 3, 7, 1.5);

    // Some crumpled paper inside
    g.fillStyle(0xeeeedd, 0.4);
    g.fillCircle(x - 1, y - 1, 1.5);
    g.fillCircle(x + 1.5, y, 1.2);
  }

  private drawWallClock(tileX: number, tileY: number): void {
    const g = this.add.graphics();
    g.setDepth(1.8);
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + 5;

    // Clock face
    g.fillStyle(0xf0f0f0, 0.9);
    g.fillCircle(x, y, 4);
    g.lineStyle(0.5, 0x555555, 0.8);
    g.strokeCircle(x, y, 4);

    // Hour marks
    g.fillStyle(0x333333, 0.6);
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
      const mx = x + Math.cos(angle) * 3.2;
      const my = y + Math.sin(angle) * 3.2;
      g.fillCircle(mx, my, 0.3);
    }

    // Hour hand
    g.lineStyle(0.6, 0x333333, 0.8);
    g.lineBetween(x, y, x + 1.5, y - 1.2);

    // Minute hand
    g.lineStyle(0.4, 0x555555, 0.7);
    g.lineBetween(x, y, x - 0.5, y - 2.5);

    // Center dot
    g.fillStyle(0x333333, 0.9);
    g.fillCircle(x, y, 0.5);
  }

  private renderZoneLabels(): void {
    const labelMap: Record<string, string> = {
      reception: '前台',
      'desk-area-1': '工位区',
      'meeting-room-1': '会议室',
      supermarket: '超市',
      'coffee-area': '咖啡角',
      'lunch-area': '餐厅',
      'phone-booth': '电话房',
      restroom: '卫生间',
      gym: '健身房',
    };

    for (const zone of officeZones) {
      const label = labelMap[zone.id] ?? zone.type;
      const cx = (zone.bounds.x + zone.bounds.width / 2) * TILE_SIZE;
      const cy = (zone.bounds.y + zone.bounds.height / 2) * TILE_SIZE;

      const text = this.add.text(cx, zone.bounds.y * TILE_SIZE + TILE_SIZE + 3, label, {
        fontSize: '20px',
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#aabbcc',
        stroke: '#000000',
        strokeThickness: 4,
        resolution: 2,
      });
      text.setScale(0.3);
      text.setOrigin(0.5, 0);
      text.setAlpha(0.6);
      text.setDepth(20);
      text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
    // Mouse drag to pan (any button)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.cameraFollowsPlayer = false;
        this.cameras.main.stopFollow();
      }
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
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.003, 1.0, 6);
      this.cameras.main.setZoom(newZoom);
    });

    // Keyboard shortcuts
    if (this.input.keyboard) {
      // Space: re-center camera on player
      this.input.keyboard.on('keydown-SPACE', () => {
        this.cameraFollowsPlayer = true;
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      });

      // +/= : zoom in
      this.input.keyboard.on('keydown-PLUS', () => this.adjustZoom(0.5));
      this.input.keyboard.on('keydown-NUMPAD_ADD', () => this.adjustZoom(0.5));
      // Use key code for '=' key (same physical key as '+' without shift)
      this.input.keyboard.on('keydown-EQUAL', () => this.adjustZoom(0.5));

      // - : zoom out
      this.input.keyboard.on('keydown-MINUS', () => this.adjustZoom(-0.5));
      this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this.adjustZoom(-0.5));

      // 0 : reset zoom
      this.input.keyboard.on('keydown-ZERO', () => {
        this.cameras.main.setZoom(DISPLAY_SCALE);
      });
    }
  }

  private adjustZoom(delta: number): void {
    const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + delta, 1.0, 6);
    this.cameras.main.setZoom(newZoom);
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
          phone_booth: 'phone_call',
          supermarket: 'shopping',
          restroom: 'restroom',
          gym: 'exercising',
        };
        emp.fsm.sendTo((activityMap[zoneType] ?? 'idle') as any, point);
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

    // Update interactive doors
    const visibleEntities = [
      { x: this.player.playerX, y: this.player.playerY },
      ...this.employees
        .filter((e) => e.visible)
        .map((e) => ({ x: e.x, y: e.y })),
    ];
    this.doorManager.update(visibleEntities, officeZones, delta);

    // Update effects
    this.effectsManager.update(delta);

    // Update minimap
    const minimapTargets = [
      { x: this.player.playerX, y: this.player.playerY, isMoving: this.player.isMoving, isPlayer: true },
      ...this.employees.map((e) => ({ x: e.x, y: e.y, isMoving: e.isMoving, isPlayer: false })),
    ];
    this.minimap.update(minimapTargets);
  }
}
