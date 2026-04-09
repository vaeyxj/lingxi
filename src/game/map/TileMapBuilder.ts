import { MAP_COLS, MAP_ROWS } from '../../shared/constants';
import { officeZones, deskAssignments } from '../../data/mock/officeLayout';

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
  GRASS: 20,
  STONE_PATH: 21,
  GRASS_ALT: 22,
  FLOWER_BED: 23,
} as const;

const ZONE_FLOORS: Record<string, number> = {
  desk_area: TILES.FLOOR_CARPET,
  meeting_room: TILES.FLOOR_WOOD,
  coffee_area: TILES.FLOOR_TILE,
  reception: TILES.FLOOR_TILE,
  lunch_area: TILES.FLOOR_TILE,
  phone_booth: TILES.FLOOR_WOOD,
  supermarket: TILES.FLOOR_TILE,
  restroom: TILES.FLOOR_TILE,
  gym: TILES.FLOOR_WOOD,
};

export function buildFloorLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(TILES.EMPTY)
  );

  // Zone floors
  for (const zone of officeZones) {
    const floorTile = ZONE_FLOORS[zone.type] ?? TILES.FLOOR_CARPET;
    const { x, y, width, height } = zone.bounds;
    for (let row = y; row < y + height && row < MAP_ROWS; row++) {
      for (let col = x; col < x + width && col < MAP_COLS; col++) {
        grid[row][col] = floorTile;
      }
    }
  }

  // Main horizontal hallway (rows 10-11)
  for (let col = 5; col < 52; col++) {
    for (let row = 10; row <= 11; row++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }

  // Main vertical corridor (cols 28-29)
  for (let row = 4; row < 33; row++) {
    for (let col = 28; col <= 29; col++) {
      if (grid[row][col] === TILES.EMPTY) {
        grid[row][col] = TILES.FLOOR_TILE;
      }
    }
  }

  // Secondary vertical hallway inside desk area
  for (let row = 12; row < 26; row++) {
    if (grid[row][24] === TILES.EMPTY) grid[row][24] = TILES.FLOOR_CARPET;
    if (grid[row][25] === TILES.EMPTY) grid[row][25] = TILES.FLOOR_CARPET;
  }

  // Corridor extensions to right-side zones
  for (const zone of officeZones) {
    if (zone.bounds.x > 28) {
      const midY = Math.floor(zone.bounds.y + zone.bounds.height / 2);
      for (let col = 28; col <= zone.bounds.x; col++) {
        if (grid[midY][col] === TILES.EMPTY) {
          grid[midY][col] = TILES.FLOOR_TILE;
        }
      }
    }
  }

  // Connect reception bottom to hallway
  for (let col = 5; col < 17; col++) {
    if (grid[9][col] === TILES.EMPTY) grid[9][col] = TILES.FLOOR_TILE;
  }

  // Fill outdoor areas with grass (everything that's still EMPTY within the campus)
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      if (grid[row][col] === TILES.EMPTY) {
        const useAlt = ((row * 7 + col * 13) % 5) === 0;
        grid[row][col] = useAlt ? TILES.GRASS_ALT : TILES.GRASS;
      }
    }
  }

  // Outdoor winding trail for walking / sightseeing
  const trail: [number, number][] = [
    // South garden loop
    [33, 8], [33, 9], [33, 10], [33, 11], [33, 12], [33, 13], [33, 14],
    [34, 14], [34, 15], [34, 16], [34, 17], [34, 18], [34, 19], [34, 20],
    [33, 20], [33, 21], [33, 22], [33, 23], [33, 24], [33, 25],
    [34, 25], [34, 26], [34, 27], [34, 28], [34, 29], [34, 30],
    [33, 30], [33, 31], [33, 32], [33, 33], [33, 34],
    [34, 34], [34, 35], [34, 36], [35, 36], [35, 35],
    [35, 34], [35, 33], [35, 32], [35, 31], [35, 30],
    [35, 29], [35, 28], [35, 27], [35, 26], [35, 25],
    [35, 24], [35, 23], [35, 22], [35, 21], [35, 20],
    [35, 19], [35, 18], [35, 17], [35, 16], [35, 15],
    [35, 14], [35, 13], [35, 12], [35, 11], [35, 10],
    [35, 9], [35, 8], [34, 8],
    // Left side path
    [32, 3], [33, 3], [34, 3], [35, 3],
    [32, 4], [33, 4], [34, 4], [35, 4],
    // Right side path
    [33, 53], [33, 54], [34, 53], [34, 54],
    [35, 53], [35, 54], [32, 53], [32, 54],
    // Top garden path
    [2, 8], [2, 9], [2, 10], [2, 11], [2, 12], [2, 13], [2, 14],
    [2, 15], [2, 16], [2, 17], [2, 18], [2, 19],
    [2, 25], [2, 26], [2, 27], [2, 28],
    [2, 50], [2, 51], [2, 52], [2, 53],
    [3, 53], [3, 52],
  ];
  for (const [r, c] of trail) {
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
      if (grid[r][c] === TILES.GRASS || grid[r][c] === TILES.GRASS_ALT) {
        grid[r][c] = TILES.STONE_PATH;
      }
    }
  }

  // Flower beds along the trails
  const flowers: [number, number][] = [
    [32, 9], [32, 13], [32, 20], [32, 25], [32, 30],
    [36, 10], [36, 15], [36, 20], [36, 25], [36, 30], [36, 35],
    [3, 4], [3, 17], [3, 27],
    [1, 10], [1, 15], [1, 26],
    [33, 37], [33, 42], [33, 48],
  ];
  for (const [r, c] of flowers) {
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
      if (grid[r][c] === TILES.GRASS || grid[r][c] === TILES.GRASS_ALT) {
        grid[r][c] = TILES.FLOWER_BED;
      }
    }
  }

  return grid;
}

export function buildWallLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(-1)
  );

  for (const zone of officeZones) {
    const { x, y, width, height } = zone.bounds;
    for (let col = x; col < x + width; col++) {
      grid[y][col] = TILES.WALL_H;
    }
    for (let col = x; col < x + width; col++) {
      grid[y + height - 1][col] = TILES.WALL_H;
    }
    for (let row = y; row < y + height; row++) {
      grid[row][x] = TILES.WALL_V;
    }
    for (let row = y; row < y + height; row++) {
      grid[row][x + width - 1] = TILES.WALL_V;
    }
    grid[y][x] = TILES.WALL_CORNER_TL;
    grid[y][x + width - 1] = TILES.WALL_CORNER_TR;
    grid[y + height - 1][x] = TILES.WALL_CORNER_BL;
    grid[y + height - 1][x + width - 1] = TILES.WALL_CORNER_BR;

    const midX = Math.floor(x + width / 2);
    const midY = Math.floor(y + height / 2);

    if (zone.type === 'reception') {
      grid[y + height - 1][midX] = TILES.DOOR;
    }
    if (zone.type === 'desk_area') {
      grid[y][midX] = TILES.DOOR;
      grid[y + height - 1][midX] = TILES.DOOR;
    }
    const rightSideTypes = ['meeting_room', 'coffee_area', 'lunch_area', 'supermarket', 'restroom', 'gym'];
    if (rightSideTypes.includes(zone.type)) {
      if (x > 28) {
        grid[midY][x] = TILES.DOOR;
      }
      if (zone.type === 'meeting_room' || zone.type === 'supermarket') {
        grid[y + height - 1][midX] = TILES.DOOR;
      }
      if (zone.type === 'lunch_area' || zone.type === 'gym') {
        grid[y][midX] = TILES.DOOR;
      }
    }
    if (zone.type === 'phone_booth') {
      grid[y + height - 1][midX] = TILES.DOOR;
    }
  }

  return grid;
}

export function buildFurnitureLayer(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(-1)
  );

  // Desks (2 tiles wide) and chairs
  for (const desk of deskAssignments) {
    grid[desk.tileY][desk.tileX] = TILES.DESK;
    if (desk.tileX + 1 < MAP_COLS) {
      grid[desk.tileY][desk.tileX + 1] = TILES.DESK;
    }
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
      grid[y + 3][x + 3] = TILES.LUNCH_TABLE;
      grid[y + 3][x + 7] = TILES.LUNCH_TABLE;
      grid[y + 7][x + 3] = TILES.LUNCH_TABLE;
      grid[y + 7][x + 7] = TILES.LUNCH_TABLE;
    }
    if (zone.type === 'supermarket') {
      const { x, y } = zone.bounds;
      grid[y + 2][x + 2] = TILES.BOOKSHELF;
      grid[y + 2][x + 5] = TILES.BOOKSHELF;
      grid[y + 4][x + 2] = TILES.BOOKSHELF;
      grid[y + 4][x + 5] = TILES.BOOKSHELF;
      grid[y + 1][x + 7] = TILES.PLANT;
    }
    if (zone.type === 'gym') {
      const { x, y } = zone.bounds;
      grid[y + 1][x + 1] = TILES.PLANT;
      grid[y + 1][x + 5] = TILES.PLANT;
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

  // Outdoor plants / trees along perimeter
  grid[10][27] = TILES.PLANT;
  grid[3][8] = TILES.PLANT;
  grid[3][50] = TILES.PLANT;
  grid[35][8] = TILES.PLANT;
  grid[35][20] = TILES.PLANT;
  grid[35][40] = TILES.PLANT;
  grid[35][50] = TILES.PLANT;
  grid[2][2] = TILES.PLANT;
  grid[2][55] = TILES.PLANT;
  grid[36][2] = TILES.PLANT;
  grid[36][55] = TILES.PLANT;

  return grid;
}

export function buildCollisionGrid(): number[][] {
  const walls = buildWallLayer();
  const furniture = buildFurnitureLayer();
  const floor = buildFloorLayer();

  const grid: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(1)
  );

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const hasFloor = floor[row][col] !== TILES.EMPTY;
      const hasWall = walls[row][col] !== -1 && walls[row][col] !== TILES.DOOR;
      const hasFurniture = furniture[row][col] !== -1 && furniture[row][col] !== TILES.CHAIR;

      if (hasFloor && !hasWall && !hasFurniture) {
        grid[row][col] = 0;
      }
      if (walls[row][col] === TILES.DOOR) {
        grid[row][col] = 0;
      }
      if (furniture[row][col] === TILES.CHAIR) {
        grid[row][col] = 0;
      }
    }
  }

  return grid;
}
