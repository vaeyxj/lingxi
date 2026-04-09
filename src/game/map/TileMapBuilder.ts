import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '../../shared/constants';
import { officeZones, deskAssignments } from '../../data/mock/officeLayout';

// Tile indices in our generated tileset
export const TILES = {
  EMPTY: 0,
  FLOOR_CARPET: 1,
  FLOOR_TILE: 2,
  FLOOR_WOOD: 3,
  WALL_H: 4,
  WALL_V: 5,
  WALL_CORNER_TL: 6,
  WALL_CORNER_TR: 7,
  WALL_CORNER_BL: 8,
  WALL_CORNER_BR: 9,
  DESK: 10,
  CHAIR: 11,
  MEETING_TABLE: 12,
  COFFEE_MACHINE: 13,
  PLANT: 14,
  BOOKSHELF: 15,
  DOOR: 16,
  WINDOW: 17,
  LUNCH_TABLE: 18,
  RECEPTION_DESK: 19,
} as const;

const ZONE_FLOORS: Record<string, number> = {
  desk_area: TILES.FLOOR_CARPET,
  meeting_room: TILES.FLOOR_WOOD,
  coffee_area: TILES.FLOOR_TILE,
  reception: TILES.FLOOR_TILE,
  lunch_area: TILES.FLOOR_TILE,
};

export function buildFloorLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(TILES.EMPTY)
  );

  for (const zone of officeZones) {
    const floorTile = ZONE_FLOORS[zone.type] ?? TILES.FLOOR_CARPET;
    const { x, y, width, height } = zone.bounds;
    for (let row = y; row < y + height && row < MAP_ROWS; row++) {
      for (let col = x; col < x + width && col < MAP_COLS; col++) {
        grid[row][col] = floorTile;
      }
    }
  }

  // Hallways connecting zones
  // Horizontal hallway between desk area and right zones
  for (let col = 1; col < 48; col++) {
    for (let row = 7; row <= 8; row++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }
  // Vertical hallway on right side
  for (let row = 1; row < 30; row++) {
    for (let col = 24; col <= 25; col++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }
  // Vertical hallway in desk area
  for (let row = 9; row < 23; row++) {
    if (grid[row][20] === TILES.EMPTY) grid[row][20] = TILES.FLOOR_CARPET;
    if (grid[row][21] === TILES.EMPTY) grid[row][21] = TILES.FLOOR_CARPET;
  }

  return grid;
}

export function buildWallLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(-1)
  );

  for (const zone of officeZones) {
    const { x, y, width, height } = zone.bounds;
    // Top wall
    for (let col = x; col < x + width; col++) {
      grid[y][col] = TILES.WALL_H;
    }
    // Bottom wall
    for (let col = x; col < x + width; col++) {
      grid[y + height - 1][col] = TILES.WALL_H;
    }
    // Left wall
    for (let row = y; row < y + height; row++) {
      grid[row][x] = TILES.WALL_V;
    }
    // Right wall
    for (let row = y; row < y + height; row++) {
      grid[row][x + width - 1] = TILES.WALL_V;
    }
    // Corners
    grid[y][x] = TILES.WALL_CORNER_TL;
    grid[y][x + width - 1] = TILES.WALL_CORNER_TR;
    grid[y + height - 1][x] = TILES.WALL_CORNER_BL;
    grid[y + height - 1][x + width - 1] = TILES.WALL_CORNER_BR;

    // Add doors
    if (zone.type === 'reception') {
      grid[y][Math.floor(x + width / 2)] = TILES.DOOR;
    }
    if (zone.type === 'meeting_room' || zone.type === 'coffee_area' || zone.type === 'lunch_area') {
      grid[y + height - 1][Math.floor(x + width / 2)] = TILES.DOOR;
    }
    if (zone.type === 'desk_area') {
      grid[y][Math.floor(x + width / 2)] = TILES.DOOR;
      grid[y + height - 1][Math.floor(x + width / 2)] = TILES.DOOR;
    }
  }

  return grid;
}

export function buildFurnitureLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(-1)
  );

  // Place desks and chairs
  for (const desk of deskAssignments) {
    grid[desk.tileY][desk.tileX] = TILES.DESK;
    grid[desk.chairY][desk.chairX] = TILES.CHAIR;
  }

  // Meeting room tables
  for (const zone of officeZones) {
    if (zone.type === 'meeting_room') {
      const cx = zone.bounds.x + Math.floor(zone.bounds.width / 2);
      const cy = zone.bounds.y + Math.floor(zone.bounds.height / 2);
      grid[cy][cx - 1] = TILES.MEETING_TABLE;
      grid[cy][cx] = TILES.MEETING_TABLE;
      grid[cy][cx + 1] = TILES.MEETING_TABLE;
    }
    if (zone.type === 'coffee_area') {
      grid[zone.bounds.y + 1][zone.bounds.x + 1] = TILES.COFFEE_MACHINE;
      grid[zone.bounds.y + 1][zone.bounds.x + 3] = TILES.PLANT;
    }
    if (zone.type === 'lunch_area') {
      const { x, y } = zone.bounds;
      grid[y + 2][x + 2] = TILES.LUNCH_TABLE;
      grid[y + 2][x + 5] = TILES.LUNCH_TABLE;
      grid[y + 2][x + 8] = TILES.LUNCH_TABLE;
      grid[y + 5][x + 2] = TILES.LUNCH_TABLE;
      grid[y + 5][x + 5] = TILES.LUNCH_TABLE;
      grid[y + 5][x + 8] = TILES.LUNCH_TABLE;
    }
    if (zone.type === 'reception') {
      const { x, y } = zone.bounds;
      grid[y + 2][x + 4] = TILES.RECEPTION_DESK;
      grid[y + 2][x + 5] = TILES.RECEPTION_DESK;
      grid[y + 2][x + 6] = TILES.RECEPTION_DESK;
      grid[y + 1][x + 1] = TILES.PLANT;
      grid[y + 1][x + 10] = TILES.PLANT;
    }
  }

  // Decorative plants along hallway
  grid[7][23] = TILES.PLANT;
  grid[8][0] = TILES.PLANT;

  return grid;
}

export function buildCollisionGrid(): number[][] {
  const walls = buildWallLayer();
  const furniture = buildFurnitureLayer();
  const floor = buildFloorLayer();

  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(1) // 1 = blocked by default
  );

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      // Has floor and no wall/furniture = walkable
      const hasFloor = floor[row][col] !== TILES.EMPTY;
      const hasWall = walls[row][col] !== -1 && walls[row][col] !== TILES.DOOR;
      const hasFurniture = furniture[row][col] !== -1 && furniture[row][col] !== TILES.CHAIR;

      if (hasFloor && !hasWall && !hasFurniture) {
        grid[row][col] = 0; // walkable
      }
      // Doors are walkable
      if (walls[row][col] === TILES.DOOR) {
        grid[row][col] = 0;
      }
      // Chairs are walkable (employees sit there)
      if (furniture[row][col] === TILES.CHAIR) {
        grid[row][col] = 0;
      }
    }
  }

  return grid;
}

// Generate a simple tileset texture at runtime
export function generateTileset(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  const canvas = document.createElement('canvas');
  const tileCount = 20;
  canvas.width = tileCount * TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;

  const colors: Record<number, string> = {
    [TILES.EMPTY]: '#2d2d2d',
    [TILES.FLOOR_CARPET]: '#5b6e7a',
    [TILES.FLOOR_TILE]: '#8a9ba8',
    [TILES.FLOOR_WOOD]: '#a0845c',
    [TILES.WALL_H]: '#4a4a5e',
    [TILES.WALL_V]: '#4a4a5e',
    [TILES.WALL_CORNER_TL]: '#3a3a4e',
    [TILES.WALL_CORNER_TR]: '#3a3a4e',
    [TILES.WALL_CORNER_BL]: '#3a3a4e',
    [TILES.WALL_CORNER_BR]: '#3a3a4e',
    [TILES.DESK]: '#8b6e4e',
    [TILES.CHAIR]: '#6a6a8a',
    [TILES.MEETING_TABLE]: '#7a5c3e',
    [TILES.COFFEE_MACHINE]: '#5a3a2e',
    [TILES.PLANT]: '#4a8a4a',
    [TILES.BOOKSHELF]: '#6a4a2e',
    [TILES.DOOR]: '#9a9ab4',
    [TILES.WINDOW]: '#7ab4d4',
    [TILES.LUNCH_TABLE]: '#8a7a5e',
    [TILES.RECEPTION_DESK]: '#6a8a9a',
  };

  for (let i = 0; i < tileCount; i++) {
    ctx.fillStyle = colors[i] ?? '#ff00ff';
    ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

    // Add pixel details
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    // Border for walls and furniture
    if (i >= TILES.WALL_H && i <= TILES.WALL_CORNER_BR) {
      ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, 2);
      ctx.fillRect(i * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE, 2);
      ctx.fillRect(i * TILE_SIZE, 0, 2, TILE_SIZE);
      ctx.fillRect(i * TILE_SIZE + TILE_SIZE - 2, 0, 2, TILE_SIZE);
    }
    // Floor texture variation
    if (i >= TILES.FLOOR_CARPET && i <= TILES.FLOOR_WOOD) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(i * TILE_SIZE + 2, 2, 4, 4);
      ctx.fillRect(i * TILE_SIZE + 10, 8, 4, 4);
    }
    // Furniture details
    if (i === TILES.DESK) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(i * TILE_SIZE + 1, 1, TILE_SIZE - 2, 3);
    }
    if (i === TILES.PLANT) {
      ctx.fillStyle = '#2a6a2a';
      ctx.fillRect(i * TILE_SIZE + 6, 10, 4, 6);
      ctx.fillStyle = '#5aaa5a';
      ctx.fillRect(i * TILE_SIZE + 3, 2, 10, 8);
    }
    if (i === TILES.COFFEE_MACHINE) {
      ctx.fillStyle = '#8a6a4e';
      ctx.fillRect(i * TILE_SIZE + 4, 2, 8, 12);
      ctx.fillStyle = '#da4a2a';
      ctx.fillRect(i * TILE_SIZE + 6, 4, 4, 2);
    }
  }

  scene.textures.addCanvas('office-tileset', canvas);
  graphics.destroy();
}
