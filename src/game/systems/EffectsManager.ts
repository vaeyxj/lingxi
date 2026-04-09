import Phaser from 'phaser';
import { TILE_SIZE } from '../../shared/constants';
import type { OfficeZone } from '../../data/mock/officeLayout';

export class EffectsManager {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Graphics[] = [];
  private lightOverlay!: Phaser.GameObjects.Graphics;
  private ambientParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    life: number;
    maxLife: number;
    color: number;
    type: string;
  }> = [];
  private time = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupZoneLighting(zones: OfficeZone[]): void {
    // Create ambient light overlay
    this.lightOverlay = this.scene.add.graphics();
    this.lightOverlay.setDepth(15);
    this.lightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.renderLighting(zones);
  }

  private renderLighting(zones: OfficeZone[]): void {
    this.lightOverlay.clear();

    // Warm ambient tints matching reference art style
    const zoneAmbient: Record<string, { color: number; alpha: number }> = {
      desk_area: { color: 0xfff8f0, alpha: 0.93 },
      meeting_room: { color: 0xfff4e5, alpha: 0.92 },
      coffee_area: { color: 0xffedda, alpha: 0.90 },
      reception: { color: 0xfff6ee, alpha: 0.93 },
      lunch_area: { color: 0xfff2e2, alpha: 0.92 },
      phone_booth: { color: 0xfff4dc, alpha: 0.90 },
      supermarket: { color: 0xffffff, alpha: 0.95 },
      restroom: { color: 0xf0f4ff, alpha: 0.94 },
      gym: { color: 0xfff0e0, alpha: 0.92 },
    };

    for (const zone of zones) {
      const ambient = zoneAmbient[zone.type] ?? { color: 0xe0e0e0, alpha: 0.9 };
      const { x, y, width, height } = zone.bounds;

      this.lightOverlay.fillStyle(ambient.color, ambient.alpha);
      this.lightOverlay.fillRect(
        (x + 1) * TILE_SIZE,
        (y + 1) * TILE_SIZE,
        (width - 2) * TILE_SIZE,
        (height - 2) * TILE_SIZE
      );
    }
  }

  setupZoneParticles(zones: OfficeZone[]): void {
    for (const zone of zones) {
      if (zone.type === 'coffee_area') {
        const { x, y } = zone.bounds;
        this.addParticleEmitter(
          (x + 2) * TILE_SIZE,
          (y + 1) * TILE_SIZE,
          'steam',
          zone
        );
      }
      if (zone.type === 'meeting_room') {
        this.addMeetingRoomAmbience(zone);
      }
      if (zone.type === 'phone_booth') {
        this.addPhoneBoothAmbience(zone);
      }
      if (zone.type === 'supermarket') {
        this.addSupermarketAmbience(zone);
      }
      if (zone.type === 'gym') {
        this.addGymAmbience(zone);
      }
    }
  }

  private addSupermarketAmbience(zone: OfficeZone): void {
    const { x, y, width } = zone.bounds;
    const cx = (x + width / 2) * TILE_SIZE;
    const cy = (y + 1) * TILE_SIZE;

    const light = this.scene.add.graphics();
    light.setDepth(2.2);

    this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        light.clear();
        const v = tween.getValue() as number;
        light.fillStyle(0xffffff, 0.04 + v * 0.02);
        light.fillCircle(cx, cy + 8, 18 + v * 3);
      },
    });
  }

  private addGymAmbience(zone: OfficeZone): void {
    const { x, y, width, height } = zone.bounds;
    const cx = (x + width / 2) * TILE_SIZE;
    const cy = (y + height / 2) * TILE_SIZE;

    const glow = this.scene.add.graphics();
    glow.setDepth(2.2);

    this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        glow.clear();
        const v = tween.getValue() as number;
        glow.fillStyle(0xffaa44, 0.03 + v * 0.02);
        glow.fillCircle(cx, cy, 16 + v * 4);
      },
    });
  }

  private addMeetingRoomAmbience(zone: OfficeZone): void {
    const { x, y, width, height } = zone.bounds;
    const cx = (x + width / 2) * TILE_SIZE;
    const cy = (y + height / 2) * TILE_SIZE;

    const glow = this.scene.add.graphics();
    glow.setDepth(2.2);

    this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 3000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        glow.clear();
        const v = tween.getValue() as number;
        glow.fillStyle(0x6688cc, 0.03 + v * 0.02);
        glow.fillCircle(cx, cy - 4, 20 + v * 4);
      },
    });
  }

  private addPhoneBoothAmbience(zone: OfficeZone): void {
    const { x, y, width } = zone.bounds;
    const cx = (x + width / 2) * TILE_SIZE;
    const cy = (y + 1) * TILE_SIZE;

    const indicator = this.scene.add.graphics();
    indicator.setDepth(2.8);

    this.scene.tweens.add({
      targets: { val: 0 },
      val: 1,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        indicator.clear();
        const v = tween.getValue() as number;
        indicator.fillStyle(0x44aa44, 0.3 + v * 0.2);
        indicator.fillCircle(cx, cy + 4, 1 + v * 0.3);
      },
    });
  }

  private addParticleEmitter(px: number, py: number, type: string, _zone: OfficeZone): void {
    // We'll spawn particles in update
    // Store emitter config
    (this as any)[`emitter_${type}_${px}_${py}`] = { x: px, y: py, type };
  }

  addDeskGlow(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + 4;

    // Monitor glow effect
    const glow = this.scene.add.graphics();
    glow.setDepth(2.5);

    // Animated glow
    this.scene.tweens.add({
      targets: { alpha: 0.3 },
      alpha: 0.6,
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        glow.clear();
        const a = tween.getValue() as number;
        // Screen glow
        glow.fillStyle(0x66aaff, a * 0.3);
        glow.fillCircle(x, y, 12);
        glow.fillStyle(0x88ccff, a * 0.5);
        glow.fillCircle(x, y, 6);
      },
    });
  }

  addCoffeeSteam(tileX: number, tileY: number): void {
    // Continuously spawn steam particles
    const baseX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const baseY = tileY * TILE_SIZE;

    setInterval(() => {
      this.spawnParticle(
        baseX + (Math.random() - 0.5) * 6,
        baseY,
        0xcccccc,
        'steam'
      );
    }, 300);
  }

  addWindowLight(tileX: number, tileY: number, width: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    const light = this.scene.add.graphics();
    light.setDepth(0.8);
    light.setBlendMode(Phaser.BlendModes.ADD);

    // Sunlight beam through window
    light.fillStyle(0xffeecc, 0.06);
    light.beginPath();
    light.moveTo(x, y);
    light.lineTo(x + width * TILE_SIZE, y);
    light.lineTo(x + width * TILE_SIZE + 32, y + 64);
    light.lineTo(x - 16, y + 64);
    light.closePath();
    light.fill();

    // Animated dust motes in sunbeam
    for (let i = 0; i < 3; i++) {
      const dustX = x + Math.random() * width * TILE_SIZE;
      const dustY = y + Math.random() * 48;
      this.spawnParticle(dustX, dustY, 0xffeedd, 'dust');
    }
  }

  private spawnParticle(x: number, y: number, color: number, type: string): void {
    const maxLife = type === 'steam' ? 60 : type === 'dust' ? 120 : type === 'sparkle' ? 30 : 80;

    this.ambientParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * (type === 'dust' ? 0.1 : 0.3),
      vy: type === 'steam' ? -0.3 - Math.random() * 0.2 : (Math.random() - 0.5) * 0.1,
      alpha: 0.6 + Math.random() * 0.4,
      size: type === 'steam' ? 1.5 + Math.random() : type === 'dust' ? 0.5 + Math.random() * 0.5 : 1,
      life: 0,
      maxLife,
      color,
      type,
    });
  }

  update(delta: number): void {
    this.time += delta;

    // Update particles
    const graphics = this.scene.add.graphics();
    graphics.setDepth(16);

    // Remove old particle graphics
    for (const g of this.particles) {
      g.destroy();
    }
    this.particles = [graphics];

    // Spawn ambient particles periodically
    if (Math.random() < 0.05) {
      // Random dust mote
      const zones = (this.scene as any).zoneManager?.getAll?.() ?? [];
      if (zones.length > 0) {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const px = (zone.bounds.x + 1 + Math.random() * (zone.bounds.width - 2)) * TILE_SIZE;
        const py = (zone.bounds.y + 1 + Math.random() * (zone.bounds.height - 2)) * TILE_SIZE;
        this.spawnParticle(px, py, 0xffffff, 'dust');
      }
    }

    // Update and draw particles
    this.ambientParticles = this.ambientParticles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio >= 1) return false;

      // Fade in and out
      const fadeAlpha = lifeRatio < 0.2
        ? lifeRatio / 0.2
        : lifeRatio > 0.7
          ? (1 - lifeRatio) / 0.3
          : 1;

      const alpha = p.alpha * fadeAlpha;

      if (p.type === 'steam') {
        // Steam grows and fades
        const size = p.size * (1 + lifeRatio * 0.8);
        graphics.fillStyle(p.color, alpha * 0.4);
        graphics.fillCircle(p.x, p.y, size);
      } else if (p.type === 'dust') {
        // Floating dust motes
        graphics.fillStyle(p.color, alpha * 0.2);
        graphics.fillCircle(p.x, p.y, p.size);
      } else if (p.type === 'sparkle') {
        // Sparkle effect
        graphics.fillStyle(p.color, alpha * 0.8);
        graphics.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
      }

      return true;
    });
  }

  // Create footstep dust when player moves
  playerFootstep(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      this.spawnParticle(
        x + (Math.random() - 0.5) * 6,
        y + 8 + Math.random() * 2,
        0x999999,
        'dust'
      );
    }
  }

  // Sparkle when employee starts activity
  activitySparkle(x: number, y: number, color: number = 0xffdd44): void {
    for (let i = 0; i < 5; i++) {
      this.ambientParticles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y - 8 + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1,
        alpha: 1,
        size: 1 + Math.random(),
        life: 0,
        maxLife: 20 + Math.random() * 15,
        color,
        type: 'sparkle',
      });
    }
  }

  destroy(): void {
    this.lightOverlay?.destroy();
    for (const g of this.particles) {
      g.destroy();
    }
  }
}
