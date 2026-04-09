import Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, ZONE_COLORS } from '../../shared/constants';
import type { OfficeZone } from '../../data/mock/officeLayout';

const MINIMAP_WIDTH = 150;
const MINIMAP_HEIGHT = Math.round(MINIMAP_WIDTH * (MAP_ROWS / MAP_COLS));
const MINIMAP_PADDING = 8;
const MINIMAP_BG = 0x2a2a32;
const MINIMAP_BORDER = 0x556677;
const VIEWPORT_COLOR = 0xffffff;
const PLAYER_COLOR = 0xffdd44;
const EMPLOYEE_COLOR = 0x88ccff;
const EMPLOYEE_MOVING_COLOR = 0xff8866;

interface MinimapTarget {
  x: number;
  y: number;
  isMoving: boolean;
  isPlayer?: boolean;
}

export class Minimap {
  private graphics: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private zones: OfficeZone[];

  // Scale factor: world pixels → minimap pixels
  private readonly scaleX: number;
  private readonly scaleY: number;
  private readonly originX: number;
  private readonly originY: number;

  constructor(scene: Phaser.Scene, zones: OfficeZone[]) {
    this.scene = scene;
    this.zones = zones;

    const cam = scene.cameras.main;
    this.originX = cam.width - MINIMAP_WIDTH - MINIMAP_PADDING;
    this.originY = cam.height - MINIMAP_HEIGHT - MINIMAP_PADDING;
    this.scaleX = MINIMAP_WIDTH / (MAP_COLS * TILE_SIZE);
    this.scaleY = MINIMAP_HEIGHT / (MAP_ROWS * TILE_SIZE);

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(200);
  }

  update(targets: MinimapTarget[]): void {
    const g = this.graphics;
    const cam = this.scene.cameras.main;
    const ox = this.originX;
    const oy = this.originY;

    g.clear();

    // Background with rounded rect effect
    g.fillStyle(MINIMAP_BG, 0.85);
    g.fillRoundedRect(ox - 2, oy - 2, MINIMAP_WIDTH + 4, MINIMAP_HEIGHT + 4, 4);

    // Zone areas
    for (const zone of this.zones) {
      const color = ZONE_COLORS[zone.type] ?? 0x555566;
      g.fillStyle(color, 0.4);
      g.fillRect(
        ox + zone.bounds.x * TILE_SIZE * this.scaleX,
        oy + zone.bounds.y * TILE_SIZE * this.scaleY,
        zone.bounds.width * TILE_SIZE * this.scaleX,
        zone.bounds.height * TILE_SIZE * this.scaleY,
      );
    }

    // Viewport rectangle (current camera view)
    const viewLeft = cam.scrollX * this.scaleX;
    const viewTop = cam.scrollY * this.scaleY;
    const viewW = (cam.width / cam.zoom) * this.scaleX;
    const viewH = (cam.height / cam.zoom) * this.scaleY;

    g.lineStyle(1, VIEWPORT_COLOR, 0.6);
    g.strokeRect(ox + viewLeft, oy + viewTop, viewW, viewH);

    // Draw targets (employees first, player on top)
    const sorted = [...targets].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));

    for (const t of sorted) {
      const mx = ox + t.x * this.scaleX;
      const my = oy + t.y * this.scaleY;

      if (t.isPlayer) {
        // Player: larger yellow dot
        g.fillStyle(PLAYER_COLOR, 1);
        g.fillCircle(mx, my, 3);
      } else {
        // Employee: small dot, color indicates movement
        const color = t.isMoving ? EMPLOYEE_MOVING_COLOR : EMPLOYEE_COLOR;
        g.fillStyle(color, 0.9);
        g.fillCircle(mx, my, 2);
      }
    }

    // Border
    g.lineStyle(1, MINIMAP_BORDER, 0.7);
    g.strokeRoundedRect(ox - 2, oy - 2, MINIMAP_WIDTH + 4, MINIMAP_HEIGHT + 4, 4);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
