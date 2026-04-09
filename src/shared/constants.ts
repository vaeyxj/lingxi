export const TILE_SIZE = 16;
export const MAP_COLS = 50;
export const MAP_ROWS = 32;
export const DISPLAY_SCALE = 4;

export const MAP_WIDTH_PX = MAP_COLS * TILE_SIZE;
export const MAP_HEIGHT_PX = MAP_ROWS * TILE_SIZE;

// Day cycle: real-time (1 real minute = 1 game minute)
export const GAME_MINUTES_PER_SECOND = 1 / 60;
export const DAY_START_HOUR = 8; // 08:00
export const DAY_END_HOUR = 19; // 19:00
export const LUNCH_START_HOUR = 12;
export const LUNCH_END_HOUR = 13;

// Employee
export const EMPLOYEE_SPRITE_WIDTH = 16;
export const EMPLOYEE_SPRITE_HEIGHT = 24;

// Attribute ranges
export const ATTR_MIN = 0;
export const ATTR_MAX = 100;

// Colors for zones
export const ZONE_COLORS: Record<string, number> = {
  desk_area: 0x8b9bb4,
  meeting_room: 0x6b8cce,
  coffee_area: 0xc4a35a,
  reception: 0x7bc67e,
  lunch_area: 0xd4956a,
};
