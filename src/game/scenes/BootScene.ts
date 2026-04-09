import Phaser from 'phaser';

const SPRITE_TILE_SIZE = 32;
const CHARACTER_FRAME_W = 32;
const CHARACTER_FRAME_H = 48;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '加载中...',
      {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }
    );
    text.setOrigin(0.5);

    // Load tileset spritesheet (20 frames, 32x32 each)
    this.load.spritesheet('tileset', 'assets/tileset.png', {
      frameWidth: SPRITE_TILE_SIZE,
      frameHeight: SPRITE_TILE_SIZE,
    });

    // Load character spritesheet (6 frames, 32x48 each)
    // Order: player, engineer, designer, pm, manager, intern
    this.load.spritesheet('characters', 'assets/characters_sheet.png', {
      frameWidth: CHARACTER_FRAME_W,
      frameHeight: CHARACTER_FRAME_H,
    });
  }

  create(): void {
    this.scene.start('OfficeScene');
  }
}
