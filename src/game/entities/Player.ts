import Phaser from 'phaser';
import { TILE_SIZE } from '../../shared/constants';

const PLAYER_SPEED = 80; // pixels per second
const PLAYER_WIDTH = 10;
const PLAYER_HEIGHT = 6; // collision box height (feet only)

export type PlayerDirection = 'down' | 'up' | 'left' | 'right';

export class Player extends Phaser.GameObjects.Container {
  private characterSprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private nameLabel: Phaser.GameObjects.Text;
  private indicator: Phaser.GameObjects.Graphics;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private collisionGrid: number[][] = [];

  private walkBobTime = 0;
  direction: PlayerDirection = 'down';
  isMoving = false;

  // Pixel-level position (not tile-snapped)
  playerX: number;
  playerY: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    const px = tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = tileY * TILE_SIZE + TILE_SIZE / 2;
    super(scene, px, py);

    this.playerX = px;
    this.playerY = py;

    // Character sprite (frame 0 = player)
    this.characterSprite = scene.add.image(0, -2, 'characters', 0);
    this.characterSprite.setScale(0.35);
    this.add(this.characterSprite);

    // Shadow - right under feet
    this.shadow = scene.add.ellipse(0, 6, 10, 4, 0x000000, 0.3);
    this.add(this.characterSprite);

    // Name label
    this.nameLabel = scene.add.text(0, 14, '我', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
    });
    this.nameLabel.setOrigin(0.5, 0);
    this.add(this.nameLabel);

    // Player indicator arrow
    this.indicator = scene.add.graphics();
    this.indicator.fillStyle(0xffdd44, 0.8);
    this.indicator.fillTriangle(-4, -22, 4, -22, 0, -18);
    this.add(this.indicator);

    // Pulsing indicator animation
    scene.tweens.add({
      targets: this.indicator,
      y: -3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.add.existing(this);
    this.setDepth(11);

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  setCollisionGrid(grid: number[][]): void {
    this.collisionGrid = grid;
  }

  private isBlocked(pixelX: number, pixelY: number): boolean {
    // Check collision box corners (feet area only for top-down perspective)
    const halfW = PLAYER_WIDTH / 2;
    const halfH = PLAYER_HEIGHT / 2;
    const feetY = pixelY + 6; // offset to feet

    const corners = [
      { x: pixelX - halfW, y: feetY - halfH },
      { x: pixelX + halfW, y: feetY - halfH },
      { x: pixelX - halfW, y: feetY + halfH },
      { x: pixelX + halfW, y: feetY + halfH },
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x / TILE_SIZE);
      const tileY = Math.floor(corner.y / TILE_SIZE);

      if (tileY < 0 || tileY >= this.collisionGrid.length ||
          tileX < 0 || tileX >= this.collisionGrid[0].length) {
        return true; // Out of bounds = blocked
      }

      if (this.collisionGrid[tileY][tileX] !== 0) {
        return true; // Blocked tile
      }
    }

    return false;
  }

  update(_time: number, delta: number): void {
    if (!this.cursors) return;

    const speed = PLAYER_SPEED * (delta / 1000);
    let dx = 0;
    let dy = 0;
    let moving = false;

    // Read input
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;

    if (up) { dy = -speed; this.direction = 'up'; moving = true; }
    if (down) { dy = speed; this.direction = 'down'; moving = true; }
    if (left) { dx = -speed; this.direction = 'left'; moving = true; }
    if (right) { dx = speed; this.direction = 'right'; moving = true; }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = 1 / Math.SQRT2;
      dx *= factor;
      dy *= factor;
    }

    // Try X movement separately from Y (sliding along walls)
    let newX = this.playerX;
    let newY = this.playerY;

    if (dx !== 0) {
      const testX = this.playerX + dx;
      if (!this.isBlocked(testX, this.playerY)) {
        newX = testX;
      }
    }

    if (dy !== 0) {
      const testY = this.playerY + dy;
      if (!this.isBlocked(newX, testY)) {
        newY = testY;
      }
    }

    this.playerX = newX;
    this.playerY = newY;
    this.x = this.playerX;
    this.y = this.playerY;

    // Walking animation
    this.isMoving = moving;
    if (moving) {
      this.walkBobTime += delta * 0.012;
      const bobY = Math.sin(this.walkBobTime) * 2;
      this.characterSprite.y = -2 + bobY;

      // Slight horizontal sway
      const swayX = Math.sin(this.walkBobTime * 0.5) * 0.5;
      this.characterSprite.x = swayX;
    } else {
      this.characterSprite.y = -4;
      this.characterSprite.x = 0;
      this.walkBobTime = 0;
    }

    // Y-sort depth
    this.setDepth(11 + this.y / 1000);
  }

  getTilePos(): { x: number; y: number } {
    return {
      x: Math.floor(this.playerX / TILE_SIZE),
      y: Math.floor(this.playerY / TILE_SIZE),
    };
  }
}
