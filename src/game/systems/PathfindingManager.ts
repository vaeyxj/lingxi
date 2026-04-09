import EasyStar from 'easystarjs';

export interface PathPoint {
  x: number;
  y: number;
}

export class PathfindingManager {
  private easystar: EasyStar.js;
  private grid: number[][] = [];

  constructor() {
    this.easystar = new EasyStar.js();
    this.easystar.setAcceptableTiles([0]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
    this.easystar.setIterationsPerCalculation(200);
  }

  setGrid(grid: number[][]): void {
    this.grid = grid;
    this.easystar.setGrid(grid);
  }

  isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[0].length) {
      return false;
    }
    return this.grid[y][x] === 0;
  }

  findPath(fromX: number, fromY: number, toX: number, toY: number): Promise<PathPoint[] | null> {
    return new Promise((resolve) => {
      if (!this.isWalkable(toX, toY)) {
        // Find nearest walkable tile
        const nearest = this.findNearestWalkable(toX, toY);
        if (!nearest) {
          resolve(null);
          return;
        }
        toX = nearest.x;
        toY = nearest.y;
      }

      if (!this.isWalkable(fromX, fromY)) {
        const nearest = this.findNearestWalkable(fromX, fromY);
        if (!nearest) {
          resolve(null);
          return;
        }
        fromX = nearest.x;
        fromY = nearest.y;
      }

      this.easystar.findPath(fromX, fromY, toX, toY, (path) => {
        resolve(path);
      });
    });
  }

  private findNearestWalkable(x: number, y: number, radius: number = 5): PathPoint | null {
    for (let r = 1; r <= radius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (this.isWalkable(x + dx, y + dy)) {
            return { x: x + dx, y: y + dy };
          }
        }
      }
    }
    return null;
  }

  update(): void {
    this.easystar.calculate();
  }
}
