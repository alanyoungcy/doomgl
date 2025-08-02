import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { generateLevel } from '../level/Generator';
import { useGameStore } from '../../state/useGameStore';

const FLOOR_DIFF =
  'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_Color.jpg';
const FLOOR_NORM =
  'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_NormalGL.jpg';
const FLOOR_ROUGH =
  'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_Roughness.jpg';

export function LevelMesh() {
  const seed = useGameStore((s) => s.seed);
  const { cells, tile } = useMemo(() => {
    const lvl = generateLevel(seed, 12);
    return { cells: lvl.cells, tile: 8 };
  }, [seed]);

  const [fd, fn, fr] = useTexture([FLOOR_DIFF, FLOOR_NORM, FLOOR_ROUGH]);

  return (
    <group>
      {cells.map((c, i) => (
        <mesh
          key={i}
          position={[c.x * tile, 0, c.y * tile]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[tile, tile, 1, 1]} />
          <meshStandardMaterial map={fd} normalMap={fn} roughnessMap={fr} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
