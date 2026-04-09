import Phaser from 'phaser';

const TPX = 32;
const CPX_W = 32;
const CPX_H = 48;
const TILE_COUNT = 24;

interface CharColors {
  skin: string; skinShade: string;
  hair: string; hairDark: string;
  shirt: string; shirtLight: string;
  pants: string; pantsShade: string;
  shoes: string; shoesSole: string;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '加载中...',
      {
        fontSize: '24px',
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#ffffff',
      }
    ).setOrigin(0.5);

    const tileCanvas = this.buildTileset();
    this.load.spritesheet('tileset', tileCanvas.toDataURL(), {
      frameWidth: TPX,
      frameHeight: TPX,
    });

    const charCanvas = this.buildCharacters();
    this.load.spritesheet('characters', charCanvas.toDataURL(), {
      frameWidth: CPX_W,
      frameHeight: CPX_H,
    });
  }

  create(): void {
    this.scene.start('OfficeScene');
  }

  // ───── Tileset Generation ─────

  private buildTileset(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = TILE_COUNT * TPX;
    c.height = TPX;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.tEmpty(ctx, 0);
    this.tCarpet(ctx, 1);
    this.tFloorTile(ctx, 2);
    this.tWood(ctx, 3);
    this.tWallH(ctx, 4);
    this.tWallV(ctx, 5);
    this.tCorner(ctx, 6, 'tl');
    this.tCorner(ctx, 7, 'tr');
    this.tCorner(ctx, 8, 'bl');
    this.tCorner(ctx, 9, 'br');
    this.tDesk(ctx, 10);
    this.tChair(ctx, 11);
    this.tMeetTable(ctx, 12);
    this.tCoffeeMachine(ctx, 13);
    this.tPlant(ctx, 14);
    this.tBookshelf(ctx, 15);
    this.tDoor(ctx, 16);
    this.tWindow(ctx, 17);
    this.tLunchTable(ctx, 18);
    this.tReception(ctx, 19);
    this.tGrass(ctx, 20);
    this.tStonePath(ctx, 21);
    this.tGrassAlt(ctx, 22);
    this.tFlowerBed(ctx, 23);

    return c;
  }

  private fill(ctx: CanvasRenderingContext2D, idx: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(idx * TPX, 0, TPX, TPX);
  }

  private px(ctx: CanvasRenderingContext2D, ox: number, x: number, y: number, c: string): void {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, y, 1, 1);
  }

  private tEmpty(ctx: CanvasRenderingContext2D, i: number): void {
    this.fill(ctx, i, '#2E3440');
  }

  private tCarpet(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#C4A87C');
    ctx.fillStyle = '#B89870';
    for (let y = 0; y < 32; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 2); x < 32; x += 4) {
        ctx.fillRect(ox + x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#D0B88C';
    for (let y = 2; y < 32; y += 8) {
      for (let x = 1; x < 32; x += 8) {
        ctx.fillRect(ox + x, y, 1, 1);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(ox + 31, 0, 1, 32);
    ctx.fillRect(ox, 31, 32, 1);
  }

  private tFloorTile(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#B8C5CC');
    ctx.fillStyle = '#A4B3BB';
    for (let y = 0; y < 32; y += 8) {
      ctx.fillRect(ox, y, 32, 1);
    }
    for (let x = 0; x < 32; x += 8) {
      ctx.fillRect(ox + x, 0, 1, 32);
    }
    ctx.fillStyle = '#C5D1D8';
    for (let y = 1; y < 32; y += 8) {
      ctx.fillRect(ox + 1, y, 6, 1);
    }
    for (let x = 1; x < 32; x += 8) {
      ctx.fillRect(ox + x, 1, 1, 6);
    }
  }

  private tWood(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#9E7E5A');
    ctx.fillStyle = '#8A6C4A';
    for (let y = 0; y < 32; y += 8) {
      ctx.fillRect(ox, y, 32, 1);
    }
    ctx.fillStyle = '#B08E6A';
    ctx.fillRect(ox + 3, 2, 26, 1);
    ctx.fillRect(ox + 5, 12, 22, 1);
    ctx.fillRect(ox + 2, 20, 28, 1);
    ctx.fillRect(ox + 8, 28, 18, 1);
    ctx.fillStyle = '#907050';
    ctx.fillRect(ox + 16, 0, 1, 32);
  }

  private tWallH(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#4A5C6A');
    for (let row = 0; row < 4; row++) {
      const y = row * 8;
      const off = row % 2 === 0 ? 0 : 4;
      ctx.fillStyle = '#566E7E';
      for (let col = 0; col <= 4; col++) {
        const bx = col * 8 + off;
        if (bx < 32) ctx.fillRect(ox + bx, y + 1, Math.min(7, 32 - bx), 6);
      }
    }
    ctx.fillStyle = '#6A8090';
    ctx.fillRect(ox, 0, 32, 2);
    ctx.fillStyle = '#3A4C5A';
    ctx.fillRect(ox, 30, 32, 2);
  }

  private tWallV(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#4A5C6A');
    for (let col = 0; col < 4; col++) {
      const x = col * 8;
      const off = col % 2 === 0 ? 0 : 4;
      ctx.fillStyle = '#566E7E';
      for (let row = 0; row <= 4; row++) {
        const by = row * 8 + off;
        if (by < 32) ctx.fillRect(ox + x + 1, by, 6, Math.min(7, 32 - by));
      }
    }
    ctx.fillStyle = '#6A8090';
    ctx.fillRect(ox, 0, 2, 32);
    ctx.fillStyle = '#3A4C5A';
    ctx.fillRect(ox + 30, 0, 2, 32);
  }

  private tCorner(ctx: CanvasRenderingContext2D, i: number, pos: string): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#4A5C6A');
    ctx.fillStyle = '#566E7E';
    ctx.fillRect(ox + 4, 4, 24, 24);
    ctx.fillStyle = '#6A8090';
    if (pos.includes('t')) ctx.fillRect(ox, 0, 32, 3);
    if (pos.includes('b')) ctx.fillRect(ox, 29, 32, 3);
    if (pos.includes('l')) ctx.fillRect(ox, 0, 3, 32);
    if (pos.includes('r')) ctx.fillRect(ox + 29, 0, 3, 32);
    ctx.fillStyle = '#3A4C5A';
    if (pos === 'tl') { ctx.fillRect(ox + 29, 0, 3, 32); ctx.fillRect(ox, 29, 32, 3); }
    if (pos === 'tr') { ctx.fillRect(ox, 0, 3, 32); ctx.fillRect(ox, 29, 32, 3); }
    if (pos === 'bl') { ctx.fillRect(ox + 29, 0, 3, 32); ctx.fillRect(ox, 0, 32, 3); }
    if (pos === 'br') { ctx.fillRect(ox, 0, 3, 32); ctx.fillRect(ox, 0, 32, 3); }
  }

  private tDesk(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#9B7E56';
    ctx.fillRect(ox + 2, 4, 28, 24);
    ctx.fillStyle = '#8A6E48';
    ctx.fillRect(ox + 2, 26, 28, 2);
    ctx.fillStyle = '#A88E66';
    ctx.fillRect(ox + 3, 5, 26, 2);
  }

  private tChair(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#5A5A6A';
    ctx.fillRect(ox + 8, 6, 16, 20);
    ctx.fillStyle = '#4A4A5A';
    ctx.fillRect(ox + 10, 8, 12, 16);
    ctx.fillStyle = '#6A6A7A';
    ctx.fillRect(ox + 10, 8, 12, 2);
  }

  private tMeetTable(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#6A5A4A';
    ctx.fillRect(ox + 2, 8, 28, 16);
    ctx.fillStyle = '#7A6A5A';
    ctx.fillRect(ox + 3, 9, 26, 2);
    ctx.fillStyle = '#5A4A3A';
    ctx.fillRect(ox + 2, 22, 28, 2);
  }

  private tCoffeeMachine(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#555555';
    ctx.fillRect(ox + 8, 4, 16, 24);
    ctx.fillStyle = '#333333';
    ctx.fillRect(ox + 10, 6, 12, 8);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(ox + 12, 16, 8, 4);
    ctx.fillStyle = '#CC4444';
    ctx.fillRect(ox + 20, 8, 2, 2);
  }

  private tPlant(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#A0603C';
    ctx.fillRect(ox + 10, 18, 12, 10);
    ctx.fillStyle = '#B07048';
    ctx.fillRect(ox + 10, 18, 12, 2);
    ctx.fillStyle = '#4A9A3A';
    const leaves = [[16, 6], [10, 10], [22, 10], [13, 8], [19, 8], [16, 4]];
    for (const [lx, ly] of leaves) {
      ctx.beginPath();
      ctx.arc(ox + lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5AAA4A';
    ctx.beginPath();
    ctx.arc(ox + 16, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox + 13, 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private tBookshelf(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#6A5040';
    ctx.fillRect(ox + 4, 2, 24, 28);
    const colors = ['#CC4444', '#4488CC', '#44AA44', '#DDAA33', '#8844AA', '#DD7744'];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = colors[(row * 3 + col) % colors.length];
        ctx.fillRect(ox + 6 + col * 7, 4 + row * 9, 5, 7);
      }
    }
  }

  private tDoor(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#8A7A6A';
    ctx.fillRect(ox + 6, 2, 20, 28);
    ctx.fillStyle = '#9A8A7A';
    ctx.fillRect(ox + 8, 4, 16, 12);
    ctx.fillRect(ox + 8, 18, 16, 10);
    ctx.fillStyle = '#CCAA44';
    ctx.fillRect(ox + 22, 14, 3, 3);
  }

  private tWindow(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#4A5C6A');
    ctx.fillStyle = '#88CCEE';
    ctx.fillRect(ox + 6, 6, 20, 20);
    ctx.fillStyle = '#AADDFF';
    ctx.fillRect(ox + 7, 7, 8, 8);
    ctx.fillStyle = '#6A8A9A';
    ctx.fillRect(ox + 6, 15, 20, 2);
    ctx.fillRect(ox + 15, 6, 2, 20);
  }

  private tLunchTable(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(ox + 4, 6, 24, 20);
    ctx.fillStyle = '#D8D0C0';
    ctx.fillRect(ox + 4, 24, 24, 2);
    ctx.fillStyle = '#EAE2D2';
    ctx.fillRect(ox + 5, 7, 22, 2);
  }

  private tReception(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    ctx.fillStyle = '#5A7A9A';
    ctx.fillRect(ox + 2, 8, 28, 18);
    ctx.fillStyle = '#6A8AAA';
    ctx.fillRect(ox + 3, 9, 26, 3);
    ctx.fillStyle = '#4A6A8A';
    ctx.fillRect(ox + 2, 24, 28, 2);
    ctx.fillStyle = '#CCAA44';
    ctx.fillRect(ox + 12, 14, 8, 2);
  }

  private tGrass(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#5B9F4A');
    ctx.fillStyle = '#4E8F3E';
    const dark = [[3,5],[12,2],[25,8],[7,18],[20,22],[15,28],[28,15],[4,27],[22,4],[10,14]];
    for (const [x, y] of dark) {
      ctx.fillRect(ox + x, y, 2, 1);
    }
    ctx.fillStyle = '#6DB05A';
    const light = [[8,3],[18,9],[5,22],[26,18],[14,12],[2,14],[22,28],[30,6]];
    for (const [x, y] of light) {
      ctx.fillRect(ox + x, y, 1, 2);
    }
    ctx.fillStyle = '#E8D44D';
    ctx.fillRect(ox + 5, 12, 1, 1);
    ctx.fillRect(ox + 24, 26, 1, 1);
  }

  private tStonePath(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#A0A0A0');
    ctx.fillStyle = '#8E8E8E';
    ctx.fillRect(ox + 2, 2, 12, 14);
    ctx.fillRect(ox + 16, 4, 14, 12);
    ctx.fillRect(ox + 4, 18, 10, 12);
    ctx.fillRect(ox + 18, 18, 12, 12);
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(ox + 3, 3, 4, 4);
    ctx.fillRect(ox + 20, 6, 4, 4);
    ctx.fillRect(ox + 6, 20, 4, 4);
    ctx.fillStyle = '#969696';
    ctx.fillRect(ox, 0, 32, 1);
    ctx.fillRect(ox, 15, 32, 1);
    ctx.fillRect(ox + 14, 0, 1, 32);
  }

  private tGrassAlt(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#52964A');
    ctx.fillStyle = '#488A3E';
    const dots = [[6,4],[18,8],[10,20],[26,24],[3,28],[22,12],[14,16],[28,4]];
    for (const [x, y] of dots) {
      ctx.fillRect(ox + x, y, 2, 2);
    }
    ctx.fillStyle = '#62A65A';
    const tufts = [[4,10],[16,6],[24,20],[8,26],[20,30]];
    for (const [x, y] of tufts) {
      ctx.fillRect(ox + x, y, 1, 3);
    }
  }

  private tFlowerBed(ctx: CanvasRenderingContext2D, i: number): void {
    const ox = i * TPX;
    this.fill(ctx, i, '#4A7A3A');
    ctx.fillStyle = '#3A5A2A';
    ctx.fillRect(ox + 1, 1, 30, 30);
    ctx.fillStyle = '#5A8A4A';
    ctx.fillRect(ox + 2, 2, 28, 28);
    const flowers: [number, number, string][] = [
      [8, 8, '#FF6B6B'], [16, 6, '#FFD93D'], [24, 10, '#FF6B6B'],
      [6, 18, '#C084FC'], [14, 22, '#FF6B6B'], [22, 20, '#FFD93D'],
      [10, 14, '#FFD93D'], [20, 16, '#C084FC'], [28, 26, '#FF6B6B'],
    ];
    for (const [fx, fy, fc] of flowers) {
      ctx.fillStyle = '#4A9A3A';
      ctx.fillRect(ox + fx - 2, fy - 2, 4, 4);
      ctx.fillStyle = fc;
      ctx.fillRect(ox + fx - 1, fy - 1, 2, 2);
    }
  }

  // ───── Character Generation ─────

  private buildCharacters(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 6 * CPX_W;
    c.height = CPX_H;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 0: Player
    this.drawChar(ctx, 0, {
      skin: '#F5D0A9', skinShade: '#D4A574',
      hair: '#5C4033', hairDark: '#3E2723',
      shirt: '#1E88E5', shirtLight: '#42A5F5',
      pants: '#1A237E', pantsShade: '#0D1642',
      shoes: '#5D4037', shoesSole: '#3E2723',
    });

    // 1: Engineer
    this.drawChar(ctx, 1, {
      skin: '#FFE0BD', skinShade: '#D4B896',
      hair: '#212121', hairDark: '#111111',
      shirt: '#424242', shirtLight: '#616161',
      pants: '#1565C0', pantsShade: '#0D47A1',
      shoes: '#E0E0E0', shoesSole: '#9E9E9E',
    });

    // 2: Designer
    this.drawChar(ctx, 2, {
      skin: '#D4A574', skinShade: '#B8865A',
      hair: '#E91E63', hairDark: '#AD1457',
      shirt: '#7B1FA2', shirtLight: '#9C27B0',
      pants: '#212121', pantsShade: '#111111',
      shoes: '#6D4C41', shoesSole: '#4E342E',
    });

    // 3: PM
    this.drawChar(ctx, 3, {
      skin: '#FFCCAA', skinShade: '#D4A080',
      hair: '#6D4C41', hairDark: '#4E342E',
      shirt: '#388E3C', shirtLight: '#4CAF50',
      pants: '#A69577', pantsShade: '#8D7B5F',
      shoes: '#795548', shoesSole: '#5D4037',
    });

    // 4: Manager
    this.drawChar(ctx, 4, {
      skin: '#FFE0BD', skinShade: '#D4B896',
      hair: '#616161', hairDark: '#424242',
      shirt: '#263238', shirtLight: '#37474F',
      pants: '#37474F', pantsShade: '#263238',
      shoes: '#212121', shoesSole: '#111111',
    });

    // 5: Intern
    this.drawChar(ctx, 5, {
      skin: '#FFE8CC', skinShade: '#D4C0A0',
      hair: '#D84315', hairDark: '#BF360C',
      shirt: '#F57C00', shirtLight: '#FF9800',
      pants: '#D7CCC8', pantsShade: '#BCAAA4',
      shoes: '#1E88E5', shoesSole: '#1565C0',
    });

    return c;
  }

  private drawChar(ctx: CanvasRenderingContext2D, index: number, c: CharColors): void {
    const ox = index * CPX_W;
    const r = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, y, w, h);
    };

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(ox + 16, 44, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair top
    r(12, 2, 8, 2, c.hair);
    r(11, 4, 10, 4, c.hair);
    r(10, 6, 12, 2, c.hair);

    // Hair sides
    r(9, 7, 2, 6, c.hairDark);
    r(21, 7, 2, 6, c.hairDark);

    // Head / face
    r(11, 8, 10, 8, c.skin);
    r(10, 9, 1, 5, c.skin);
    r(21, 9, 1, 5, c.skin);

    // Face shading
    r(19, 9, 2, 6, c.skinShade);
    r(12, 15, 8, 1, c.skinShade);

    // Eyes
    r(13, 10, 2, 2, '#FFFFFF');
    r(17, 10, 2, 2, '#FFFFFF');
    r(14, 11, 1, 1, '#333333');
    r(18, 11, 1, 1, '#333333');

    // Eyebrows
    r(13, 9, 2, 1, c.hairDark);
    r(17, 9, 2, 1, c.hairDark);

    // Mouth
    r(15, 13, 2, 1, '#C97E6B');

    // Neck
    r(14, 16, 4, 2, c.skin);

    // Body / shirt
    r(9, 18, 14, 11, c.shirt);
    r(12, 19, 8, 7, c.shirtLight);

    // Collar
    r(13, 18, 6, 1, c.shirtLight);

    // Arms
    r(7, 19, 2, 9, c.shirt);
    r(23, 19, 2, 9, c.shirt);

    // Hands
    r(7, 28, 2, 2, c.skin);
    r(23, 28, 2, 2, c.skin);

    // Legs
    r(10, 29, 5, 9, c.pants);
    r(17, 29, 5, 9, c.pants);
    // Inner shadow
    r(14, 30, 1, 8, c.pantsShade);
    r(17, 30, 1, 8, c.pantsShade);

    // Shoes
    r(9, 38, 6, 3, c.shoes);
    r(17, 38, 6, 3, c.shoes);
    // Sole
    r(9, 40, 6, 1, c.shoesSole);
    r(17, 40, 6, 1, c.shoesSole);
    // Highlight
    r(10, 38, 2, 1, c.shirtLight);
    r(18, 38, 2, 1, c.shirtLight);
  }
}
