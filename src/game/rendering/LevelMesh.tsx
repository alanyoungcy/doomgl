import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { generateLevel } from '../level/Generator';
import { useGameStore } from '../../state/useGameStore';

const FLOOR_DIFF =
  'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const undefined  'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const undefined  'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';

export function LevelMesh() {
  const seed = useGameStore((s) => s.seed);
  const { cells, tile } = useMemo(() => {
    const lvl = generateLevel(seed, 12);
    return { cells: lvl.cells, tile: 8 };
  }, [seed]);

  const [fd, fn, fr] = useTexture([FLOOR_DIFF, undefined
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
