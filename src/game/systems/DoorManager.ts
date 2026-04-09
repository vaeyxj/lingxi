import Phaser from 'phaser';
import { TILE_SIZE } from '../../shared/constants';
import type { OfficeZone } from '../../data/mock/officeLayout';

export type RoomDoorStyle = 'meeting' | 'phone-booth' | 'supermarket' | 'restroom' | 'gym' | 'coffee' | 'lunch' | 'desk';

interface DoorState {
  tileX: number;
  tileY: number;
  type: 'glass_auto' | 'room_door';
  roomStyle?: RoomDoorStyle;
  isOpen: boolean;
  targetOpen: boolean;
  panels: Phaser.GameObjects.Container[];
  originPositions: Array<{ x: number; y: number }>;
  slideAxis: 'x' | 'y';
  slideAmounts: number[];
  triggerDistance: number;
  closesWhenOccupied?: string;
  indicator?: Phaser.GameObjects.Graphics;
  statusSign?: {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
  };
  sensorBeam?: Phaser.GameObjects.Graphics;
  reflectionGraphics?: Phaser.GameObjects.Graphics[];
  isOccupied: boolean;
}

export class DoorManager {
  private scene: Phaser.Scene;
  private doors: DoorState[] = [];
  private managedPositions = new Set<string>();
  private time = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addGlassDoor(tileX: number, tileY: number): void {
    this.managedPositions.add(`${tileY},${tileX}`);

    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const slideAmount = TILE_SIZE / 2 + 2;

    this.createDoorFrame(worldX, worldY, 'horizontal', true);
    this.createDoorRails(worldX, worldY);

    const leftX = worldX - TILE_SIZE / 4;
    const leftPanel = this.scene.add.container(leftX, worldY);
    const leftGlass = this.createGlassPanel();
    const leftReflection = this.createReflectionStrip();
    leftPanel.add(leftGlass);
    leftPanel.add(leftReflection);
    leftPanel.setDepth(3);

    const rightX = worldX + TILE_SIZE / 4;
    const rightPanel = this.scene.add.container(rightX, worldY);
    const rightGlass = this.createGlassPanel();
    const rightReflection = this.createReflectionStrip();
    rightPanel.add(rightGlass);
    rightPanel.add(rightReflection);
    rightPanel.setDepth(3);

    const indicator = this.createIndicatorLight(worldX, worldY - TILE_SIZE / 2 - 2);
    const sensorBeam = this.createSensorBeam(worldX, worldY + TILE_SIZE);

    this.createFloorMat(worldX, worldY + TILE_SIZE);
    this.createDoorShadow(worldX, worldY, 'horizontal');

    this.startReflectionAnimation(leftReflection, rightReflection);

    this.doors.push({
      tileX,
      tileY,
      type: 'glass_auto',
      isOpen: false,
      targetOpen: false,
      panels: [leftPanel, rightPanel],
      originPositions: [
        { x: leftX, y: worldY },
        { x: rightX, y: worldY },
      ],
      slideAxis: 'x',
      slideAmounts: [-slideAmount, slideAmount],
      triggerDistance: TILE_SIZE * 2.5,
      indicator,
      sensorBeam,
      reflectionGraphics: [leftReflection, rightReflection],
      isOccupied: false,
    });
  }

  addRoomDoor(
    tileX: number,
    tileY: number,
    slideAxis: 'x' | 'y',
    slideAmount: number,
    closesWhenOccupied?: string,
    roomStyle: RoomDoorStyle = 'meeting',
  ): void {
    this.managedPositions.add(`${tileY},${tileX}`);

    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;

    const orientation = slideAxis === 'x' ? 'horizontal' : 'vertical';
    const isGlassStyle = roomStyle === 'supermarket';
    this.createDoorFrame(worldX, worldY, orientation, isGlassStyle);

    const panel = this.scene.add.container(worldX, worldY);
    const doorGraphic = this.createStyledDoorPanel(roomStyle);
    panel.add(doorGraphic);
    panel.setDepth(3);

    this.createDoorShadow(worldX, worldY, orientation);

    let statusSign: DoorState['statusSign'];
    if (closesWhenOccupied) {
      statusSign = this.createStatusSign(worldX, worldY, orientation, closesWhenOccupied);
    }

    this.doors.push({
      tileX,
      tileY,
      type: 'room_door',
      roomStyle,
      isOpen: false,
      targetOpen: false,
      panels: [panel],
      originPositions: [{ x: worldX, y: worldY }],
      slideAxis,
      slideAmounts: [slideAmount],
      triggerDistance: TILE_SIZE * 1.8,
      closesWhenOccupied,
      statusSign,
      isOccupied: false,
    });
  }

  shouldSkipTile(row: number, col: number): boolean {
    return this.managedPositions.has(`${row},${col}`);
  }

  update(
    entityPositions: Array<{ x: number; y: number }>,
    zones: OfficeZone[],
    delta?: number,
  ): void {
    if (delta) this.time += delta;

    for (const door of this.doors) {
      const doorWorldX = door.tileX * TILE_SIZE + TILE_SIZE / 2;
      const doorWorldY = door.tileY * TILE_SIZE + TILE_SIZE / 2;

      let minDist = Infinity;
      for (const entity of entityPositions) {
        const dx = entity.x - doorWorldX;
        const dy = entity.y - doorWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        minDist = Math.min(minDist, dist);
      }

      let shouldOpen = minDist < door.triggerDistance;
      let isOccupied = false;

      if (door.closesWhenOccupied) {
        const zone = zones.find((z) => z.id === door.closesWhenOccupied);
        if (zone) {
          const b = zone.bounds;
          isOccupied = entityPositions.some((e) => {
            const tx = Math.floor(e.x / TILE_SIZE);
            const ty = Math.floor(e.y / TILE_SIZE);
            return (
              tx > b.x &&
              tx < b.x + b.width - 1 &&
              ty > b.y &&
              ty < b.y + b.height - 1
            );
          });

          if (isOccupied && minDist > TILE_SIZE * 1.3) {
            shouldOpen = false;
          }
        }
      }

      if (isOccupied !== door.isOccupied) {
        door.isOccupied = isOccupied;
        this.updateStatusSign(door, isOccupied);
      }

      if (door.type === 'glass_auto') {
        this.updateSensorBeam(door, minDist);
      }

      if (shouldOpen !== door.targetOpen) {
        door.targetOpen = shouldOpen;
        this.animateDoor(door, shouldOpen);
      }
    }
  }

  private animateDoor(door: DoorState, open: boolean): void {
    const duration = door.type === 'glass_auto' ? 380 : 300;
    const ease = open ? 'Back.easeOut' : 'Cubic.easeIn';

    for (let i = 0; i < door.panels.length; i++) {
      const panel = door.panels[i];
      const origin = door.originPositions[i];
      const amount = door.slideAmounts[i];

      this.scene.tweens.killTweensOf(panel);

      const prop = door.slideAxis;
      const targetValue = open ? origin[prop] + amount : origin[prop];

      this.scene.tweens.add({
        targets: panel,
        [prop]: targetValue,
        duration,
        ease,
        onStart: () => {
          if (door.type === 'glass_auto' && open) {
            this.emitGlassOpenParticles(door);
          }
        },
        onComplete: () => {
          door.isOpen = open;
          this.updateIndicator(door);
          if (door.type === 'room_door' && !open) {
            this.emitDoorCloseEffect(door);
          }
        },
      });
    }
  }

  private emitGlassOpenParticles(door: DoorState): void {
    const worldX = door.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = door.tileY * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.graphics();
      const px = worldX + (Math.random() - 0.5) * TILE_SIZE * 1.2;
      const py = worldY + (Math.random() - 0.5) * TILE_SIZE * 0.5;
      const size = 0.5 + Math.random() * 0.8;

      particle.fillStyle(0xaaddff, 0.7);
      particle.fillCircle(px, py, size);

      particle.fillStyle(0xffffff, 0.3);
      particle.fillCircle(px - size * 0.3, py - size * 0.3, size * 0.4);

      particle.setDepth(4);

      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        y: py - 6 - Math.random() * 4,
        x: px + (Math.random() - 0.5) * 8,
        duration: 350 + Math.random() * 250,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    const flash = this.scene.add.graphics();
    flash.fillStyle(0xbbddff, 0.15);
    flash.fillRect(worldX - TILE_SIZE, worldY - 2, TILE_SIZE * 2, 4);
    flash.setDepth(3.5);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  private emitDoorCloseEffect(door: DoorState): void {
    const worldX = door.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = door.tileY * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 3; i++) {
      const dust = this.scene.add.graphics();
      const px = worldX + (Math.random() - 0.5) * TILE_SIZE * 0.6;
      const py = worldY + TILE_SIZE / 2 - Math.random() * 2;
      dust.fillStyle(0xbbbbbb, 0.3);
      dust.fillCircle(px, py, 0.6 + Math.random() * 0.4);
      dust.setDepth(3.5);

      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        y: py + 2 + Math.random() * 2,
        duration: 250 + Math.random() * 150,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }

  // --- Glass panel graphics ---

  private createGlassPanel(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const hw = TILE_SIZE / 4;
    const hh = TILE_SIZE / 2;

    g.fillStyle(0x88ccee, 0.18);
    g.fillRect(-hw, -hh, hw * 2, hh * 2);

    g.fillStyle(0x99ddff, 0.12);
    g.fillRect(-hw, -hh, hw * 2, hh);

    g.lineStyle(0.6, 0xbbddff, 0.45);
    g.strokeRect(-hw, -hh, hw * 2, hh * 2);

    g.fillStyle(0xffffff, 0.2);
    g.fillRect(-hw + 0.8, -hh + 1, 1.2, hh * 2 - 2);

    g.fillStyle(0xffffff, 0.08);
    g.fillRect(-hw + 0.8, -hh + 1, hw - 1, hh - 1);

    g.lineStyle(0.3, 0x99bbdd, 0.2);
    g.lineBetween(hw - 0.5, -hh + 2, hw - 0.5, hh - 2);

    return g;
  }

  private createReflectionStrip(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const hw = TILE_SIZE / 4;
    const hh = TILE_SIZE / 2;

    g.fillStyle(0xffffff, 0.15);
    g.beginPath();
    g.moveTo(-hw + 1, -hh + 1);
    g.lineTo(-hw + 3, -hh + 1);
    g.lineTo(-hw + 1, hh - 1);
    g.lineTo(-hw + 0.5, hh - 1);
    g.closePath();
    g.fill();

    return g;
  }

  private startReflectionAnimation(
    leftRefl: Phaser.GameObjects.Graphics,
    rightRefl: Phaser.GameObjects.Graphics,
  ): void {
    this.scene.tweens.add({
      targets: { alpha: 0.15 },
      alpha: 0.35,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const a = tween.getValue() as number;
        leftRefl.setAlpha(a / 0.15);
        rightRefl.setAlpha(a / 0.15);
      },
    });
  }

  // --- Styled door panels for each room type ---

  private createStyledDoorPanel(style: RoomDoorStyle): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const hs = TILE_SIZE / 2;

    switch (style) {
      case 'phone-booth': {
        g.fillStyle(0x5a6a7a, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x88ccee, 0.25);
        g.fillRect(-hs + 3, -hs + 2, TILE_SIZE - 6, TILE_SIZE / 2 - 2);
        g.lineStyle(0.5, 0x4a5a6a, 0.8);
        g.strokeRect(-hs + 3, -hs + 2, TILE_SIZE - 6, TILE_SIZE / 2 - 2);
        g.fillStyle(0xffffff, 0.12);
        g.fillRect(-hs + 3.5, -hs + 2.5, 2, TILE_SIZE / 2 - 3);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 0, 1.3);
        g.lineStyle(0.5, 0x4a5a6a, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      case 'supermarket': {
        g.fillStyle(0x88ccee, 0.3);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.lineStyle(0.6, 0xaaddff, 0.5);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0xffffff, 0.15);
        g.fillRect(-hs + 1, -hs + 1, 1.5, TILE_SIZE - 2);
        g.fillStyle(0x33aa55, 0.9);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, 3);
        g.fillStyle(0xffffff, 0.9);
        g.fillRect(-hs + 3, -hs + 2.5, 1, 2);
        g.fillRect(-hs + 5, -hs + 2.5, 1, 2);
        g.fillRect(-hs + 7, -hs + 2.5, 1, 2);
        break;
      }
      case 'restroom': {
        g.fillStyle(0xe8e8ee, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0xd0d0d8, 0.8);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillRect(-hs + 2, 1, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillStyle(0x3388cc, 0.8);
        g.fillCircle(0, -2, 2.5);
        g.fillRect(-1, -1, 2, 3);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 0, 1.3);
        g.lineStyle(0.5, 0xbbbbcc, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      case 'gym': {
        g.fillStyle(0x3a3a4a, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x4a4a5a, 0.85);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.fillStyle(0xff6644, 0.9);
        g.fillRect(-3, -3, 6, 1.5);
        g.fillRect(-3, -3, 1.5, 6);
        g.fillRect(1.5, -3, 1.5, 6);
        g.fillRect(-1.5, -1, 3, 1);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 2, 1.3);
        g.lineStyle(0.5, 0x2a2a3a, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      case 'coffee': {
        g.fillStyle(0x8B6E56, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x9B7E66, 0.85);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.fillStyle(0xf0f0f0, 0.85);
        g.fillRect(-2, -3, 3.5, 4);
        g.fillStyle(0x8B5E3C, 0.5);
        g.fillRect(-1.5, -2.5, 2.5, 1.5);
        g.lineStyle(0.5, 0xe0e0e0, 0.5);
        g.beginPath();
        g.arc(1.5, -1, 1.5, -Math.PI / 2, Math.PI / 2, false);
        g.strokePath();
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 2, 1.3);
        g.lineStyle(0.5, 0x6a5a4a, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      case 'lunch': {
        g.fillStyle(0x7a8a6a, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x8a9a7a, 0.85);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.fillStyle(0xf0f0e8, 0.8);
        g.fillCircle(0, -1, 2.5);
        g.fillStyle(0xaaaaaa, 0.7);
        g.fillRect(-3, 0, 1, 3);
        g.fillRect(2, 0, 1, 3);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 2, 1.3);
        g.lineStyle(0.5, 0x6a7a5a, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      case 'desk': {
        g.fillStyle(0x8899aa, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x99aabb, 0.85);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillRect(-hs + 2, 1, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 0, 1.3);
        g.lineStyle(0.5, 0x7788aa, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
      default: {
        // 'meeting' - wood door with small window
        g.fillStyle(0x6a5a4a, 0.95);
        g.fillRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x7a6a5a, 0.85);
        g.fillRect(-hs + 2, -hs + 2, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillRect(-hs + 2, 1, TILE_SIZE - 4, TILE_SIZE / 2 - 3);
        g.fillStyle(0x88ccee, 0.2);
        g.fillRect(-hs + 3, -hs + 3, TILE_SIZE - 6, TILE_SIZE / 3 - 3);
        g.lineStyle(0.3, 0x5a4a3a, 0.5);
        g.strokeRect(-hs + 3, -hs + 3, TILE_SIZE - 6, TILE_SIZE / 3 - 3);
        g.fillStyle(0xccaa44, 1);
        g.fillCircle(hs - 3.5, 0, 1.3);
        g.lineStyle(0.5, 0x5a4a3a, 0.7);
        g.strokeRect(-hs, -hs, TILE_SIZE, TILE_SIZE);
        break;
      }
    }

    return g;
  }

  // --- Door frame ---

  private createDoorFrame(
    worldX: number,
    worldY: number,
    orientation: 'horizontal' | 'vertical',
    isGlass: boolean,
  ): void {
    const frame = this.scene.add.graphics();
    frame.setDepth(1.5);
    const hs = TILE_SIZE / 2;

    const frameColor = isGlass ? 0x8899aa : 0x5a5a6e;
    const highlightColor = isGlass ? 0xaabbcc : 0x6a6a7e;

    if (orientation === 'horizontal') {
      frame.fillStyle(frameColor, 1);
      frame.fillRect(worldX - hs - 0.5, worldY - hs, 2, TILE_SIZE);
      frame.fillRect(worldX + hs - 1.5, worldY - hs, 2, TILE_SIZE);

      frame.fillStyle(highlightColor, 0.6);
      frame.fillRect(worldX - hs - 0.5, worldY - hs, 0.8, TILE_SIZE);
      frame.fillRect(worldX + hs - 1.5, worldY - hs, 0.8, TILE_SIZE);

      if (isGlass) {
        frame.fillStyle(frameColor, 1);
        frame.fillRect(worldX - hs, worldY - hs, TILE_SIZE, 1.5);
        frame.fillStyle(highlightColor, 0.5);
        frame.fillRect(worldX - hs, worldY - hs, TILE_SIZE, 0.5);
      }
    } else {
      frame.fillStyle(frameColor, 1);
      frame.fillRect(worldX - hs, worldY - hs - 0.5, TILE_SIZE, 2);
      frame.fillRect(worldX - hs, worldY + hs - 1.5, TILE_SIZE, 2);

      frame.fillStyle(highlightColor, 0.6);
      frame.fillRect(worldX - hs, worldY - hs - 0.5, TILE_SIZE, 0.8);
      frame.fillRect(worldX - hs, worldY + hs - 1.5, TILE_SIZE, 0.8);
    }
  }

  // --- Sensor and indicator ---

  private createIndicatorLight(
    worldX: number,
    worldY: number,
  ): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setDepth(3.5);

    g.fillStyle(0x44cc44, 0.2);
    g.fillCircle(worldX, worldY, 3);

    g.fillStyle(0x44cc44, 0.7);
    g.fillCircle(worldX, worldY, 1.2);

    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(worldX - 0.3, worldY - 0.3, 0.4);

    return g;
  }

  private updateIndicator(door: DoorState): void {
    if (!door.indicator) return;
    door.indicator.clear();
    const worldX = door.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = door.tileY * TILE_SIZE - 2;

    const color = door.isOpen ? 0x44cc44 : 0xcc4444;
    const alpha = door.isOpen ? 0.7 : 0.5;
    const glowAlpha = door.isOpen ? 0.2 : 0.1;

    door.indicator.fillStyle(color, glowAlpha);
    door.indicator.fillCircle(worldX, worldY, 3);

    door.indicator.fillStyle(color, alpha);
    door.indicator.fillCircle(worldX, worldY, 1.2);

    door.indicator.fillStyle(0xffffff, 0.3);
    door.indicator.fillCircle(worldX - 0.3, worldY - 0.3, 0.4);
  }

  private createSensorBeam(worldX: number, worldY: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setDepth(0.6);

    g.fillStyle(0x44cc44, 0.12);
    g.fillRect(worldX - TILE_SIZE / 2, worldY - 1.5, TILE_SIZE, 3);

    g.fillStyle(0x66ff66, 0.08);
    g.fillRect(worldX - TILE_SIZE / 2 + 1, worldY - 0.5, TILE_SIZE - 2, 1);

    return g;
  }

  private updateSensorBeam(door: DoorState, distance: number): void {
    if (!door.sensorBeam) return;
    const inRange = distance < door.triggerDistance;
    const worldX = door.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = door.tileY * TILE_SIZE + TILE_SIZE + TILE_SIZE / 2;

    door.sensorBeam.clear();

    const color = inRange ? 0x44ff44 : 0x44cc44;
    const alpha = inRange ? 0.25 : 0.12;
    const innerAlpha = inRange ? 0.15 : 0.08;

    door.sensorBeam.fillStyle(color, alpha);
    door.sensorBeam.fillRect(worldX - TILE_SIZE / 2, worldY - 1.5, TILE_SIZE, 3);

    door.sensorBeam.fillStyle(0x66ff66, innerAlpha);
    door.sensorBeam.fillRect(worldX - TILE_SIZE / 2 + 1, worldY - 0.5, TILE_SIZE - 2, 1);

    if (inRange) {
      const pulse = Math.sin(this.time * 0.005) * 0.08 + 0.08;
      door.sensorBeam.fillStyle(0xaaffaa, pulse);
      door.sensorBeam.fillRect(worldX - TILE_SIZE / 2, worldY - 2, TILE_SIZE, 4);
    }
  }

  // --- Status sign for occupied rooms ---

  private createStatusSign(
    worldX: number,
    worldY: number,
    orientation: 'horizontal' | 'vertical',
    _roomId: string,
  ): DoorState['statusSign'] {
    const signOffsetX = orientation === 'horizontal' ? TILE_SIZE + 2 : TILE_SIZE / 2 + 4;
    const signOffsetY = orientation === 'horizontal' ? -TILE_SIZE / 2 : -TILE_SIZE - 2;
    const signX = worldX + signOffsetX;
    const signY = worldY + signOffsetY;

    const container = this.scene.add.container(signX, signY);
    container.setDepth(3.8);

    const bg = this.scene.add.graphics();
    const signW = 28;
    const signH = 8;
    bg.fillStyle(0x2a8a3a, 0.85);
    bg.fillRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);
    bg.lineStyle(0.3, 0x1a6a2a, 0.6);
    bg.strokeRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);

    const label = this.scene.add.text(0, 0, '空闲', {
      fontSize: '14px',
      fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#ccffcc',
      resolution: 2,
    });
    label.setScale(0.3);
    label.setOrigin(0.5, 0.5);
    label.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    container.add(bg);
    container.add(label);

    return { container, bg, label };
  }

  private getOccupiedLabel(roomId: string): string {
    const labels: Record<string, string> = {
      'phone-booth': '通话中',
      'meeting-room-1': '会议中',
      'supermarket': '营业中',
      'restroom': '使用中',
      'gym': '运动中',
    };
    return labels[roomId] ?? '使用中';
  }

  private updateStatusSign(door: DoorState, occupied: boolean): void {
    if (!door.statusSign) return;
    const { bg, label } = door.statusSign;

    bg.clear();
    const signW = 28;
    const signH = 8;

    if (occupied) {
      bg.fillStyle(0xaa3333, 0.85);
      bg.fillRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);
      bg.lineStyle(0.3, 0x882222, 0.6);
      bg.strokeRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);
      label.setText(this.getOccupiedLabel(door.closesWhenOccupied ?? ''));
      label.setColor('#ffcccc');
    } else {
      bg.fillStyle(0x2a8a3a, 0.85);
      bg.fillRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);
      bg.lineStyle(0.3, 0x1a6a2a, 0.6);
      bg.strokeRoundedRect(-signW / 2, -signH / 2, signW, signH, 1.5);
      label.setText('空闲');
      label.setColor('#ccffcc');
    }

    this.scene.tweens.add({
      targets: door.statusSign.container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  // --- Decorative elements ---

  private createDoorRails(worldX: number, worldY: number): void {
    const rails = this.scene.add.graphics();
    rails.setDepth(0.7);
    const hs = TILE_SIZE / 2;

    rails.fillStyle(0x7a8a9a, 0.35);
    rails.fillRect(worldX - hs - 2, worldY + hs - 0.5, TILE_SIZE + 4, 1);

    rails.fillStyle(0x8a9aaa, 0.25);
    rails.fillRect(worldX - hs - 2, worldY - hs, TILE_SIZE + 4, 0.8);

    for (let i = 0; i < 3; i++) {
      const notchX = worldX - hs + 2 + i * (TILE_SIZE / 3);
      rails.fillStyle(0x6a7a8a, 0.2);
      rails.fillRect(notchX, worldY + hs - 0.3, 2, 0.6);
    }
  }

  private createFloorMat(worldX: number, worldY: number): void {
    const mat = this.scene.add.graphics();
    mat.setDepth(0.5);

    mat.fillStyle(0x556666, 0.35);
    mat.fillRoundedRect(worldX - TILE_SIZE / 2 + 1, worldY - 4, TILE_SIZE - 2, 7, 1);

    mat.fillStyle(0x667777, 0.25);
    mat.fillRoundedRect(worldX - TILE_SIZE / 2 + 2, worldY - 3, TILE_SIZE - 4, 5, 0.8);

    mat.fillStyle(0x778888, 0.15);
    mat.fillRoundedRect(worldX - TILE_SIZE / 2 + 3, worldY - 2, TILE_SIZE - 6, 3, 0.5);
  }

  private createDoorShadow(
    worldX: number,
    worldY: number,
    orientation: 'horizontal' | 'vertical',
  ): void {
    const shadow = this.scene.add.graphics();
    shadow.setDepth(0.4);

    if (orientation === 'horizontal') {
      shadow.fillStyle(0x000000, 0.08);
      shadow.fillRect(worldX - TILE_SIZE / 2 - 1, worldY + TILE_SIZE / 2, TILE_SIZE + 2, 2);
      shadow.fillStyle(0x000000, 0.04);
      shadow.fillRect(worldX - TILE_SIZE / 2, worldY + TILE_SIZE / 2 + 2, TILE_SIZE, 1);
    } else {
      shadow.fillStyle(0x000000, 0.08);
      shadow.fillRect(worldX + TILE_SIZE / 2, worldY - TILE_SIZE / 2 - 1, 2, TILE_SIZE + 2);
      shadow.fillStyle(0x000000, 0.04);
      shadow.fillRect(worldX + TILE_SIZE / 2 + 2, worldY - TILE_SIZE / 2, 1, TILE_SIZE);
    }
  }
}
