export interface OfficeZone {
  id: string;
  type: 'desk_area' | 'meeting_room' | 'coffee_area' | 'reception' | 'lunch_area' | 'phone_booth' | 'supermarket' | 'restroom' | 'gym';
  bounds: { x: number; y: number; width: number; height: number };
  capacity: number;
  interactionPoints: Array<{ x: number; y: number }>;
}

export interface DeskAssignment {
  deskId: string;
  tileX: number;
  tileY: number;
  chairX: number;
  chairY: number;
}

export const officeZones: OfficeZone[] = [
  {
    id: 'reception',
    type: 'reception',
    bounds: { x: 5, y: 4, width: 12, height: 6 },
    capacity: 10,
    interactionPoints: [{ x: 10, y: 7 }],
  },
  {
    id: 'desk-area-1',
    type: 'desk_area',
    bounds: { x: 5, y: 12, width: 22, height: 14 },
    capacity: 8,
    interactionPoints: [],
  },
  {
    id: 'meeting-room-1',
    type: 'meeting_room',
    bounds: { x: 30, y: 4, width: 10, height: 8 },
    capacity: 6,
    interactionPoints: [
      { x: 32, y: 7 },
      { x: 34, y: 7 },
      { x: 36, y: 7 },
      { x: 32, y: 9 },
      { x: 34, y: 9 },
      { x: 36, y: 9 },
    ],
  },
  {
    id: 'supermarket',
    type: 'supermarket',
    bounds: { x: 42, y: 4, width: 10, height: 8 },
    capacity: 6,
    interactionPoints: [
      { x: 44, y: 7 },
      { x: 46, y: 7 },
      { x: 48, y: 7 },
      { x: 44, y: 9 },
      { x: 46, y: 9 },
      { x: 48, y: 9 },
    ],
  },
  {
    id: 'coffee-area',
    type: 'coffee_area',
    bounds: { x: 30, y: 14, width: 10, height: 6 },
    capacity: 4,
    interactionPoints: [
      { x: 32, y: 17 },
      { x: 34, y: 17 },
      { x: 36, y: 17 },
    ],
  },
  {
    id: 'lunch-area',
    type: 'lunch_area',
    bounds: { x: 30, y: 22, width: 12, height: 10 },
    capacity: 8,
    interactionPoints: [
      { x: 32, y: 25 },
      { x: 35, y: 25 },
      { x: 38, y: 25 },
      { x: 32, y: 28 },
      { x: 35, y: 28 },
      { x: 38, y: 28 },
    ],
  },
  {
    id: 'restroom',
    type: 'restroom',
    bounds: { x: 42, y: 14, width: 8, height: 6 },
    capacity: 3,
    interactionPoints: [
      { x: 44, y: 16 },
      { x: 46, y: 16 },
      { x: 48, y: 16 },
    ],
  },
  {
    id: 'gym',
    type: 'gym',
    bounds: { x: 44, y: 22, width: 8, height: 10 },
    capacity: 4,
    interactionPoints: [
      { x: 46, y: 25 },
      { x: 48, y: 25 },
      { x: 46, y: 28 },
      { x: 48, y: 28 },
    ],
  },
  {
    id: 'phone-booth',
    type: 'phone_booth',
    bounds: { x: 20, y: 4, width: 4, height: 6 },
    capacity: 1,
    interactionPoints: [{ x: 21, y: 6 }],
  },
];

export const deskAssignments: DeskAssignment[] = [
  { deskId: 'desk-01', tileX: 7, tileY: 14, chairX: 7, chairY: 15 },
  { deskId: 'desk-02', tileX: 11, tileY: 14, chairX: 11, chairY: 15 },
  { deskId: 'desk-03', tileX: 15, tileY: 14, chairX: 15, chairY: 15 },
  { deskId: 'desk-04', tileX: 19, tileY: 14, chairX: 19, chairY: 15 },
  { deskId: 'desk-05', tileX: 7, tileY: 20, chairX: 7, chairY: 21 },
  { deskId: 'desk-06', tileX: 11, tileY: 20, chairX: 11, chairY: 21 },
  { deskId: 'desk-07', tileX: 15, tileY: 20, chairX: 15, chairY: 21 },
  { deskId: 'desk-08', tileX: 19, tileY: 20, chairX: 19, chairY: 21 },
];

export const ENTRANCE_TILE = { x: 11, y: 10 };
