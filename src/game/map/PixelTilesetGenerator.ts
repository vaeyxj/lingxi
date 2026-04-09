import { TILE_SIZE } from '../../shared/constants';
import { TILES } from './TileMapBuilder';

/**
 * Generates a detailed pixel-art tileset at runtime using Canvas API.
 * Each tile is 16x16 with hand-crafted pixel patterns.
 */
export function generatePixelTileset(scene: Phaser.Scene): void {
  const tileCount = 20;
  const canvas = document.createElement('canvas');
  canvas.width = tileCount * TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Draw each tile
  drawFloorCarpet(ctx, TILES.FLOOR_CARPET);
  drawFloorTile(ctx, TILES.FLOOR_TILE);
  drawFloorWood(ctx, TILES.FLOOR_WOOD);
  drawWallH(ctx, TILES.WALL_H);
  drawWallV(ctx, TILES.WALL_V);
  drawWallCorner(ctx, TILES.WALL_CORNER_TL, 'tl');
  drawWallCorner(ctx, TILES.WALL_CORNER_TR, 'tr');
  drawWallCorner(ctx, TILES.WALL_CORNER_BL, 'bl');
  drawWallCorner(ctx, TILES.WALL_CORNER_BR, 'br');
  drawDesk(ctx, TILES.DESK);
  drawChair(ctx, TILES.CHAIR);
  drawMeetingTable(ctx, TILES.MEETING_TABLE);
  drawCoffeeMachine(ctx, TILES.COFFEE_MACHINE);
  drawPlant(ctx, TILES.PLANT);
  drawBookshelf(ctx, TILES.BOOKSHELF);
  drawDoor(ctx, TILES.DOOR);
  drawWindow(ctx, TILES.WINDOW);
  drawLunchTable(ctx, TILES.LUNCH_TABLE);
  drawReceptionDesk(ctx, TILES.RECEPTION_DESK);

  scene.textures.addCanvas('pixel-tileset', canvas);
}

function px(ctx: CanvasRenderingContext2D, tileIdx: number, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(tileIdx * TILE_SIZE + x, y, 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, tileIdx: number, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(tileIdx * TILE_SIZE + x, y, w, h);
}

// === Floor tiles ===

function drawFloorCarpet(ctx: CanvasRenderingContext2D, idx: number): void {
  const base = '#5b6e7a';
  const light = '#657888';
  const dark = '#516470';
  rect(ctx, idx, 0, 0, 16, 16, base);
  // Subtle carpet texture
  for (let y = 0; y < 16; y += 2) {
    for (let x = (y % 4 === 0 ? 0 : 1); x < 16; x += 2) {
      px(ctx, idx, x, y, light);
    }
  }
  // Darker edges for depth
  for (let i = 0; i < 16; i++) {
    px(ctx, idx, i, 15, dark);
    px(ctx, idx, 15, i, dark);
  }
}

function drawFloorTile(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#8a9ba8');
  rect(ctx, idx, 0, 0, 16, 1, '#9aabb8');
  rect(ctx, idx, 0, 0, 1, 16, '#9aabb8');
  rect(ctx, idx, 0, 15, 16, 1, '#7a8b98');
  rect(ctx, idx, 15, 0, 1, 16, '#7a8b98');
  // Tile grout lines
  rect(ctx, idx, 7, 0, 1, 16, '#7a8b98');
  rect(ctx, idx, 0, 7, 16, 1, '#7a8b98');
  // Specular highlights
  px(ctx, idx, 3, 3, '#a0b1be');
  px(ctx, idx, 11, 11, '#a0b1be');
}

function drawFloorWood(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#a0845c');
  // Wood grain
  for (let y = 0; y < 16; y++) {
    const shade = y % 3 === 0 ? '#967a54' : y % 3 === 1 ? '#aa8e66' : '#a0845c';
    rect(ctx, idx, 0, y, 16, 1, shade);
  }
  // Plank separations
  rect(ctx, idx, 0, 5, 16, 1, '#8a7044');
  rect(ctx, idx, 0, 11, 16, 1, '#8a7044');
  // Knot
  px(ctx, idx, 6, 8, '#8a6a3c');
  px(ctx, idx, 7, 8, '#8a6a3c');
}

// === Walls ===

function drawWallH(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#4a4a5e');
  // Wall texture - bricks pattern
  rect(ctx, idx, 0, 0, 16, 2, '#3a3a4e'); // top shadow
  rect(ctx, idx, 0, 4, 16, 1, '#404054');
  rect(ctx, idx, 0, 8, 16, 1, '#404054');
  rect(ctx, idx, 0, 12, 16, 1, '#404054');
  // Brick offsets
  rect(ctx, idx, 7, 0, 1, 4, '#404054');
  rect(ctx, idx, 3, 4, 1, 4, '#404054');
  rect(ctx, idx, 11, 4, 1, 4, '#404054');
  rect(ctx, idx, 7, 8, 1, 4, '#404054');
  // Highlight
  rect(ctx, idx, 0, 14, 16, 2, '#555570');
}

function drawWallV(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#4a4a5e');
  rect(ctx, idx, 0, 0, 2, 16, '#3a3a4e');
  rect(ctx, idx, 14, 0, 2, 16, '#555570');
  // Vertical brick pattern
  rect(ctx, idx, 4, 0, 1, 16, '#404054');
  rect(ctx, idx, 8, 0, 1, 16, '#404054');
  rect(ctx, idx, 12, 0, 1, 16, '#404054');
  rect(ctx, idx, 0, 7, 16, 1, '#404054');
}

function drawWallCorner(ctx: CanvasRenderingContext2D, idx: number, pos: string): void {
  rect(ctx, idx, 0, 0, 16, 16, '#3a3a4e');
  // Corner highlight
  if (pos === 'tl') {
    rect(ctx, idx, 2, 2, 14, 14, '#4a4a5e');
    rect(ctx, idx, 0, 0, 2, 16, '#2a2a3e');
    rect(ctx, idx, 0, 0, 16, 2, '#2a2a3e');
  } else if (pos === 'tr') {
    rect(ctx, idx, 0, 2, 14, 14, '#4a4a5e');
    rect(ctx, idx, 14, 0, 2, 16, '#2a2a3e');
    rect(ctx, idx, 0, 0, 16, 2, '#2a2a3e');
  } else if (pos === 'bl') {
    rect(ctx, idx, 2, 0, 14, 14, '#4a4a5e');
    rect(ctx, idx, 0, 0, 2, 16, '#2a2a3e');
    rect(ctx, idx, 0, 14, 16, 2, '#2a2a3e');
  } else {
    rect(ctx, idx, 0, 0, 14, 14, '#4a4a5e');
    rect(ctx, idx, 14, 0, 2, 16, '#2a2a3e');
    rect(ctx, idx, 0, 14, 16, 2, '#2a2a3e');
  }
}

// === Furniture ===

function drawDesk(ctx: CanvasRenderingContext2D, idx: number): void {
  // Desk surface
  rect(ctx, idx, 1, 2, 14, 10, '#8b6e4e');
  rect(ctx, idx, 1, 2, 14, 2, '#9a7e5e'); // top edge highlight
  rect(ctx, idx, 1, 10, 14, 2, '#7a5e3e'); // bottom shadow
  // Desk legs
  rect(ctx, idx, 2, 12, 2, 4, '#6a5030');
  rect(ctx, idx, 12, 12, 2, 4, '#6a5030');
  // Monitor
  rect(ctx, idx, 5, 3, 6, 5, '#222233');
  rect(ctx, idx, 6, 4, 4, 3, '#4488cc'); // screen
  rect(ctx, idx, 7, 8, 2, 1, '#333344'); // stand
  // Keyboard
  rect(ctx, idx, 4, 10, 8, 2, '#444455');
  px(ctx, idx, 5, 10, '#555566');
  px(ctx, idx, 7, 10, '#555566');
  px(ctx, idx, 9, 10, '#555566');
}

function drawChair(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, 'transparent');
  // Seat
  rect(ctx, idx, 3, 6, 10, 8, '#5a5a7a');
  rect(ctx, idx, 3, 6, 10, 2, '#6a6a8a'); // highlight
  // Back
  rect(ctx, idx, 4, 2, 8, 5, '#4a4a6a');
  rect(ctx, idx, 4, 2, 8, 1, '#5a5a7a');
  // Wheels
  px(ctx, idx, 4, 14, '#333344');
  px(ctx, idx, 11, 14, '#333344');
  px(ctx, idx, 7, 15, '#333344');
}

function drawMeetingTable(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 3, 16, 10, '#7a5c3e');
  rect(ctx, idx, 0, 3, 16, 2, '#8a6c4e'); // highlight
  rect(ctx, idx, 0, 11, 16, 2, '#6a4c2e'); // shadow
  // Legs
  rect(ctx, idx, 1, 13, 2, 3, '#5a3c1e');
  rect(ctx, idx, 13, 13, 2, 3, '#5a3c1e');
  // Papers on table
  rect(ctx, idx, 3, 5, 4, 3, '#e8e8e0');
  rect(ctx, idx, 9, 6, 3, 2, '#d8d8d0');
}

function drawCoffeeMachine(ctx: CanvasRenderingContext2D, idx: number): void {
  // Machine body
  rect(ctx, idx, 3, 1, 10, 12, '#5a3a2e');
  rect(ctx, idx, 3, 1, 10, 2, '#6a4a3e'); // top highlight
  // Display
  rect(ctx, idx, 5, 4, 6, 3, '#225522');
  px(ctx, idx, 6, 5, '#44aa44'); // LED
  // Nozzle
  rect(ctx, idx, 6, 8, 4, 2, '#3a2a1e');
  // Cup
  rect(ctx, idx, 6, 11, 4, 4, '#e8e0d0');
  rect(ctx, idx, 6, 11, 4, 1, '#f0e8e0');
  // Steam
  px(ctx, idx, 7, 10, '#cccccc');
  px(ctx, idx, 8, 9, '#bbbbbb');
  // Drip tray
  rect(ctx, idx, 4, 15, 8, 1, '#4a3a2e');
}

function drawPlant(ctx: CanvasRenderingContext2D, idx: number): void {
  // Pot
  rect(ctx, idx, 5, 10, 6, 5, '#8a5a3a');
  rect(ctx, idx, 4, 10, 8, 1, '#9a6a4a'); // rim
  rect(ctx, idx, 6, 15, 4, 1, '#7a4a2a'); // base
  // Stem
  rect(ctx, idx, 7, 5, 2, 5, '#3a6a2a');
  // Leaves - circular canopy
  rect(ctx, idx, 3, 1, 10, 8, '#4a8a4a');
  rect(ctx, idx, 2, 3, 12, 4, '#4a8a4a');
  // Leaf highlights
  rect(ctx, idx, 4, 2, 3, 2, '#5aaa5a');
  rect(ctx, idx, 9, 4, 3, 2, '#5aaa5a');
  px(ctx, idx, 6, 5, '#3a7a3a'); // shadow
  px(ctx, idx, 10, 2, '#3a7a3a');
  // Berries/flowers
  px(ctx, idx, 5, 3, '#ea6a6a');
  px(ctx, idx, 10, 5, '#eaaa4a');
}

function drawBookshelf(ctx: CanvasRenderingContext2D, idx: number): void {
  // Frame
  rect(ctx, idx, 1, 0, 14, 16, '#6a4a2e');
  rect(ctx, idx, 1, 0, 14, 1, '#7a5a3e');
  // Shelves
  rect(ctx, idx, 2, 5, 12, 1, '#5a3a1e');
  rect(ctx, idx, 2, 10, 12, 1, '#5a3a1e');
  // Books row 1
  rect(ctx, idx, 2, 1, 2, 4, '#4a6aaa');
  rect(ctx, idx, 4, 1, 2, 4, '#aa4a4a');
  rect(ctx, idx, 6, 2, 2, 3, '#4aaa6a');
  rect(ctx, idx, 8, 1, 3, 4, '#aaaa4a');
  rect(ctx, idx, 11, 1, 2, 4, '#8a4aaa');
  // Books row 2
  rect(ctx, idx, 2, 6, 3, 4, '#aa6a4a');
  rect(ctx, idx, 5, 6, 2, 4, '#4a8aaa');
  rect(ctx, idx, 7, 7, 3, 3, '#6aaa8a');
  rect(ctx, idx, 10, 6, 3, 4, '#aa4a8a');
  // Books row 3
  rect(ctx, idx, 2, 11, 2, 4, '#6a6a6a');
  rect(ctx, idx, 4, 11, 3, 4, '#4a6a4a');
  rect(ctx, idx, 8, 12, 2, 3, '#8a8a4a');
  rect(ctx, idx, 11, 11, 2, 4, '#4a4a8a');
}

function drawDoor(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#9a9ab4');
  // Door frame
  rect(ctx, idx, 0, 0, 2, 16, '#7a7a94');
  rect(ctx, idx, 14, 0, 2, 16, '#7a7a94');
  rect(ctx, idx, 0, 0, 16, 2, '#7a7a94');
  // Door panels
  rect(ctx, idx, 3, 3, 10, 6, '#aaaaC4');
  rect(ctx, idx, 3, 10, 10, 5, '#aaaaC4');
  // Handle
  rect(ctx, idx, 11, 8, 2, 2, '#daa520');
  // Light strip under door
  rect(ctx, idx, 2, 15, 12, 1, '#ccccdd');
}

function drawWindow(ctx: CanvasRenderingContext2D, idx: number): void {
  rect(ctx, idx, 0, 0, 16, 16, '#4a4a5e');
  // Glass
  rect(ctx, idx, 2, 2, 12, 12, '#7ab4d4');
  // Sky gradient
  rect(ctx, idx, 2, 2, 12, 4, '#8ac4e4');
  rect(ctx, idx, 2, 6, 12, 4, '#7ab4d4');
  rect(ctx, idx, 2, 10, 12, 4, '#6aa4c4');
  // Cross frame
  rect(ctx, idx, 7, 2, 2, 12, '#5a5a6e');
  rect(ctx, idx, 2, 7, 12, 2, '#5a5a6e');
  // Glare
  px(ctx, idx, 3, 3, '#aaddff');
  px(ctx, idx, 4, 3, '#aaddff');
  px(ctx, idx, 3, 4, '#aaddff');
}

function drawLunchTable(ctx: CanvasRenderingContext2D, idx: number): void {
  // Round table
  rect(ctx, idx, 2, 2, 12, 12, '#8a7a5e');
  rect(ctx, idx, 3, 1, 10, 1, '#8a7a5e');
  rect(ctx, idx, 3, 14, 10, 1, '#8a7a5e');
  rect(ctx, idx, 1, 3, 1, 10, '#8a7a5e');
  rect(ctx, idx, 14, 3, 1, 10, '#8a7a5e');
  // Highlight
  rect(ctx, idx, 3, 2, 10, 2, '#9a8a6e');
  // Shadow
  rect(ctx, idx, 3, 12, 10, 2, '#7a6a4e');
  // Plates
  rect(ctx, idx, 4, 5, 3, 3, '#e8e8e0');
  px(ctx, idx, 5, 6, '#ddddcc');
  rect(ctx, idx, 9, 5, 3, 3, '#e8e8e0');
  px(ctx, idx, 10, 6, '#ddddcc');
  // Legs (peek out)
  px(ctx, idx, 2, 15, '#5a4a2e');
  px(ctx, idx, 13, 15, '#5a4a2e');
}

function drawReceptionDesk(ctx: CanvasRenderingContext2D, idx: number): void {
  // Counter front
  rect(ctx, idx, 0, 3, 16, 10, '#6a8a9a');
  rect(ctx, idx, 0, 3, 16, 2, '#7a9aaa'); // top surface
  rect(ctx, idx, 0, 11, 16, 2, '#5a7a8a'); // shadow
  // Top surface accent
  rect(ctx, idx, 1, 4, 14, 1, '#8aaaba');
  // Logo/sign
  rect(ctx, idx, 4, 7, 8, 3, '#4a7a8a');
  rect(ctx, idx, 5, 8, 6, 1, '#8acade'); // text line
  // Legs
  rect(ctx, idx, 1, 13, 2, 3, '#4a6a7a');
  rect(ctx, idx, 13, 13, 2, 3, '#4a6a7a');
}
