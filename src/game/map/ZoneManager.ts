import type { OfficeZone } from '../../data/mock/officeLayout';
import { TILE_SIZE } from '../../shared/constants';

export class ZoneManager {
  private zones: OfficeZone[] = [];

  load(zones: OfficeZone[]): void {
    this.zones = zones;
  }

  getAll(): OfficeZone[] {
    return this.zones;
  }

  getById(id: string): OfficeZone | undefined {
    return this.zones.find((z) => z.id === id);
  }

  getByType(type: string): OfficeZone[] {
    return this.zones.filter((z) => z.type === type);
  }

  getZoneAt(tileX: number, tileY: number): OfficeZone | undefined {
    return this.zones.find((z) => {
      const { x, y, width, height } = z.bounds;
      return tileX >= x && tileX < x + width && tileY >= y && tileY < y + height;
    });
  }

  getRandomInteractionPoint(zoneType: string): { x: number; y: number } | undefined {
    const zones = this.getByType(zoneType);
    const allPoints = zones.flatMap((z) => z.interactionPoints);
    if (allPoints.length === 0) return undefined;
    return allPoints[Math.floor(Math.random() * allPoints.length)];
  }

  getWorldBounds(zone: OfficeZone): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      zone.bounds.x * TILE_SIZE,
      zone.bounds.y * TILE_SIZE,
      zone.bounds.width * TILE_SIZE,
      zone.bounds.height * TILE_SIZE
    );
  }
}
