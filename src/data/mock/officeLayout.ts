export interface OfficeZone {
  id: string;
  type: 'desk_area' | 'meeting_room' | 'coffee_area' | 'reception' | 'lunch_area';
  bounds: { x: number; y: number; width: number; height: number }; // in tiles
  capacity: number;
  interactionPoints: Array<{ x: number; y: number }>; // tiles employees walk to
}

export interface DeskAssignment {
  deskId: string;
  tileX: number;
  tileY: number;
  chairX: number; // where employee sits
  chairY: number;
}

export const officeZones: OfficeZone[] = [
  {
    id: 'reception',
    type: 'reception',
    bounds: { x: 1, y: 1, width: 12, height: 6 },
    capacity: 10,
    interactionPoints: [{ x: 6, y: 4 }],
  },
  {
    id: 'desk-area-1',
    type: 'desk_area',
    bounds: { x: 1, y: 9, width: 22, height: 14 },
    capacity: 8,
    interactionPoints: [],
  },
  {
    id: 'meeting-room-1',
    type: 'meeting_room',
    bounds: { x: 26, y: 1, width: 10, height: 8 },
    capacity: 6,
    interactionPoints: [
      { x: 28, y: 4 },
      { x: 30, y: 4 },
      { x: 32, y: 4 },
      { x: 28, y: 6 },
      { x: 30, y: 6 },
      { x: 32, y: 6 },
    ],
  },
  {
    id: 'meeting-room-2',
    type: 'meeting_room',
    bounds: { x: 38, y: 1, width: 10, height: 8 },
    capacity: 6,
    interactionPoints: [
      { x: 40, y: 4 },
      { x: 42, y: 4 },
      { x: 44, y: 4 },
      { x: 40, y: 6 },
      { x: 42, y: 6 },
      { x: 44, y: 6 },
    ],
  },
  {
    id: 'coffee-area',
    type: 'coffee_area',
    bounds: { x: 26, y: 11, width: 10, height: 6 },
    capacity: 4,
    interactionPoints: [
      { x: 28, y: 14 },
      { x: 30, y: 14 },
      { x: 32, y: 14 },
    ],
  },
  {
    id: 'lunch-area',
    type: 'lunch_area',
    bounds: { x: 26, y: 19, width: 22, height: 10 },
    capacity: 12,
    interactionPoints: [
      { x: 28, y: 22 },
      { x: 31, y: 22 },
      { x: 34, y: 22 },
      { x: 37, y: 22 },
      { x: 28, y: 25 },
      { x: 31, y: 25 },
      { x: 34, y: 25 },
      { x: 37, y: 25 },
    ],
  },
];

export const deskAssignments: DeskAssignment[] = [
  { deskId: 'desk-01', tileX: 3, tileY: 11, chairX: 3, chairY: 12 },
  { deskId: 'desk-02', tileX: 7, tileY: 11, chairX: 7, chairY: 12 },
  { deskId: 'desk-03', tileX: 11, tileY: 11, chairX: 11, chairY: 12 },
  { deskId: 'desk-04', tileX: 15, tileY: 11, chairX: 15, chairY: 12 },
  { deskId: 'desk-05', tileX: 3, tileY: 17, chairX: 3, chairY: 18 },
  { deskId: 'desk-06', tileX: 7, tileY: 17, chairX: 7, chairY: 18 },
  { deskId: 'desk-07', tileX: 11, tileY: 17, chairX: 11, chairY: 18 },
  { deskId: 'desk-08', tileX: 15, tileY: 17, chairX: 15, chairY: 18 },
];

// Entrance point where employees spawn
export const ENTRANCE_TILE = { x: 6, y: 1 };
