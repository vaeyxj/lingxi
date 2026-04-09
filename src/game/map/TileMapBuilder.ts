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

  // === Hallways connecting all zones ===
  // Main horizontal hallway (rows 7-8, full width)
  for (let col = 1; col < 48; col++) {
    for (let row = 7; row <= 8; row++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }
  // Main vertical corridor (cols 24-25, full height)
  for (let row = 1; row < 30; row++) {
    for (let col = 24; col <= 25; col++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }
  // Secondary vertical hallway in desk area
  for (let row = 9; row < 23; row++) {
    if (grid[row][20] === TILES.EMPTY) grid[row][20] = TILES.FLOOR_CARPET;
    if (grid[row][21] === TILES.EMPTY) grid[row][21] = TILES.FLOOR_CARPET;
  }
  // Corridor extensions to reach left-side doors of right zones
  // Connect vertical corridor (col 25) to meeting rooms, coffee area, lunch area
  for (const zone of officeZones) {
    if (zone.bounds.x > 24) {
      const midY = Math.floor(zone.bounds.y + zone.bounds.height / 2);
      // Ensure floor tile from corridor to zone left wall
      for (let col = 24; col <= zone.bounds.x; col++) {
        if (grid[midY][col] === TILES.EMPTY) {
          grid[midY][col] = TILES.FLOOR_TILE;
        }
      }
    }
  }
  // Connect reception bottom to hallway
  for (let col = 1; col < 13; col++) {
    if (grid[6][col] === TILES.EMPTY) grid[6][col] = TILES.FLOOR_TILE;
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

    // Add doors connecting to corridors
    // Horizontal hallway is at rows 7-8, vertical corridor at cols 24-25
    const midX = Math.floor(x + width / 2);
    const midY = Math.floor(y + height / 2);

    if (zone.type === 'reception') {
      // Bottom door → connects to horizontal hallway at row 7
      grid[y + height - 1][midX] = TILES.DOOR;
    }
    if (zone.type === 'desk_area') {
      // Top door → connects to horizontal hallway at row 8
      grid[y][midX] = TILES.DOOR;
      // Bottom door for internal circulation
      grid[y + height - 1][midX] = TILES.DOOR;
    }
    if (zone.type === 'meeting_room' || zone.type === 'coffee_area' || zone.type === 'lunch_area') {
      // Left door → connects to vertical corridor at cols 24-25
      if (x > 24) {
        grid[midY][x] = TILES.DOOR;
      }
      // Also bottom/top door for hallway connection
      if (zone.type === 'meeting_room') {
        grid[y + height - 1][midX] = TILES.DOOR;
      }
      if (zone.type === 'lunch_area') {
        grid[y][midX] = TILES.DOOR;
      }
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
