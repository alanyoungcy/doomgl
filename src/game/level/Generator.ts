import seedrandom from 'seedrandom';

export type Cell = { x: number; y: number; type: 'room' };
export type Level = { cells: Cell[] };

/**
 * Very simple seeded generator that performs a random walk to add N rooms,
 * ensuring all rooms are connected on a 2D grid.
 */
export function generateLevel(seed: string, rooms = 12): Level {
  const rng = seedrandom(seed);
  const key = (x: number, y: number) => `${x},${y}`;
  const set = new Set<string>();
  const cells: Cell[] = [];

  let cx = 0;
  let cy = 0;
  set.add(key(cx, cy));
  cells.push({ x: cx, y: cy, type: 'room' });

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (cells.length < rooms) {
    const [dx, dy] = dirs[Math.floor(rng() * dirs.length)];
    const nx = cx + dx;
    const ny = cy + dy;
    const k = key(nx, ny);
    if (!set.has(k)) {
      set.add(k);
      cells.push({ x: nx, y: ny, type: 'room' });
    }
    // continue walking from the new position
    cx = nx;
    cy = ny;
  }

  return { cells };
}
