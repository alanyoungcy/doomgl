import { useMemo } from 'react';
import { generateLevel } from '../level/Generator';
import { useGameStore } from '../../state/useGameStore';

function FloorTile({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <mesh position={[x, 0, y]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial color="#2e7d32" roughness={1} metalness={0} />
    </mesh>
  );
}

function WallTile({ x, y, size, height = 2.5 }: { x: number; y: number; size: number; height?: number }) {
  return (
    <group position={[x, 0, y]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, height, size]} />
        <meshStandardMaterial color="#455a64" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

export function LevelMesh() {
  const seed = useGameStore((s) => s.seed);
  const level = useMemo(() => generateLevel(seed, { cols: 15, rows: 15 }, 2), [seed]);

  // Build meshes for floor and walls
  const floorTiles: React.ReactNode[] = [];
  const wallTiles: React.ReactNode[] = [];
  for (const c of level.grid) {
    const wx = c.x * level.tileSize;
    const wy = c.y * level.tileSize;
    if (c.type === 'floor') {
      floorTiles.push(<FloorTile key={`f-${c.x}-${c.y}`} x={wx} y={wy} size={level.tileSize} />);
    } else if (c.type === 'wall') {
      wallTiles.push(<WallTile key={`w-${c.x}-${c.y}`} x={wx} y={wy} size={level.tileSize} />);
    }
  }

  return (
    <group>
      {floorTiles}
      {wallTiles}
    </group>
  );
}
