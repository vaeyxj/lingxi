import type { OfficeZone, DeskAssignment } from '../mock/officeLayout';
import { officeZones, deskAssignments, ENTRANCE_TILE } from '../mock/officeLayout';

export interface IOfficeService {
  getZones(): Promise<OfficeZone[]>;
  getDesks(): Promise<DeskAssignment[]>;
  getEntrance(): Promise<{ x: number; y: number }>;
}

class MockOfficeService implements IOfficeService {
  async getZones(): Promise<OfficeZone[]> {
    return officeZones;
  }

  async getDesks(): Promise<DeskAssignment[]> {
    return deskAssignments;
  }

  async getEntrance(): Promise<{ x: number; y: number }> {
    return ENTRANCE_TILE;
  }
}

export const officeService: IOfficeService = new MockOfficeService();
