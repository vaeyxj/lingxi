import Phaser from 'phaser';
import { MAP_WIDTH_PX, MAP_HEIGHT_PX, DISPLAY_SCALE } from '../shared/constants';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 512,
  pixelArt: true,
  backgroundColor: '#0e0e1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [], // scenes added dynamically
};
