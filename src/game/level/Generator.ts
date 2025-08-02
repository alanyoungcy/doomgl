import seedrandom from 'seedrandom';

export type Cell = { x: number; y: number; type: 'floor' | 'wall' | 'spawn' };
export type Level = {
  width: number;
  height: number;
  grid: Cell[]; // width*height entries
  tileSize: number;
  playerSpawn: { x: number; y: number };
  enemySpawns: { x: number; y: number }[];
};

/**
 * Maze generation via seeded recursive backtracker (depth-first search).
 * Produces a perfect maze with outer walls and carved corridors.
 * Grid uses odd indices as cells, even indices as walls for a classic 2N+1 layout.
 */
export function generateLevel(seed: string, mazeCells = { cols: 15, rows: 15 }, tileSize = 2): Level {
  const rng = seedrandom(seed);
  const randInt = (n: number) => Math.floor(rng() * n);

  // Ensure odd dimensions for walls framing
  const cols = Math.max(3, mazeCells.cols | 1);
  const rows = Math.max(3, mazeCells.rows | 1);

  // Grid in "maze space" (cells + walls). Convert to render grid later.
  const W = cols * 2 + 1;
  const H = rows * 2 + 1;

  const maze = Array.from({ length: H }, () => Array(W).fill(1)); // 1 = wall, 0 = floor

  // Carve start
  const startCellX = 1;
  const startCellY = 1;

  // Directions (dx,dy) in cell space
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  function carve(cx: number, cy: number) {
    visited[cy][cx] = true;
    maze[cy * 2 + 1][cx * 2 + 1] = 0;

    const order = [...dirs];
    // shuffle deterministically
    for (let i = order.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const [dx, dy] of order) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (!visited[ny][nx]) {
        // knock down wall between cells
        maze[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(startCellX - 1 + 1, startCellY - 1 + 1); // effectively (1,1) in cell coords

  // Convert to Level grid
  const grid: Cell[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      grid.push({
        x,
        y,
        type: maze[y][x] === 0 ? 'floor' : 'wall',
      });
    }
  }

  // Determine spawn positions: player at (1,1) cell; enemies at some dead-ends
  const cellToWorld = (cx: number, cy: number) => ({
    x: cx * tileSize,
    y: cy * tileSize,
  });

  const playerSpawn = cellToWorld(3, 3);

  // Collect floor cells that are dead-ends (3 surrounding walls)
  const enemySpawns: { x: number; y: number }[] = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (maze[y][x] !== 0) continue;
      const wallsAround =
        (maze[y + 1][x] === 1 ? 1 : 0) +
        (maze[y - 1][x] === 1 ? 1 : 0) +
        (maze[y][x + 1] === 1 ? 1 : 0) +
        (maze[y][x - 1] === 1 ? 1 : 0);
      if (wallsAround === 3) {
        enemySpawns.push(cellToWorld(x, y));
      }
    }
  }

  // Fallback: if none found, random floors
  if (enemySpawns.length < 4) {
    const floors: { x: number; y: number }[] = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (maze[y][x] === 0) floors.push(cellToWorld(x, y));
      }
    }
    for (let i = 0; i < Math.min(5, floors.length); i++) {
      const k = randInt(floors.length);
      enemySpawns.push(floors.splice(k, 1)[0]);
    }
  }

  return {
    width: W,
    height: H,
    grid,
    tileSize,
    playerSpawn,
    enemySpawns,
  };
}
