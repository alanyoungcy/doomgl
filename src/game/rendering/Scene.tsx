import { Canvas } from '@react-three/fiber';
import { StatsGl, useTexture } from '@react-three/drei';
import { Suspense } from 'react';
import { useGameStore } from '../../state/useGameStore';

// Simple floor/wall materials from AmbientCG (CC0) via direct URLs
// Using 2K textures to balance quality/perf; can be tuned later.
const FLOOR_DIFF = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const FLOOR_NORM = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const FLOOR_ROUGH = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const FLOOR_AO = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';

const WALL_DIFF = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const WALL_NORM = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const WALL_ROUGH = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';
const WALL_AO = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments@master/textures/papermill_1k/papermill_1k_diffuse.png';

function Room() {
  const [fd, fn, fr, fao] = useTexture([FLOOR_DIFF, FLOOR_NORM, FLOOR_ROUGH, FLOOR_AO]);
  const [wd, wn, wr, wao] = useTexture([WALL_DIFF, WALL_NORM, WALL_ROUGH, WALL_AO]);
  const size = 10; // 10x10m room box

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size, 1, 1]} />
        <meshStandardMaterial
          map={fd}
          normalMap={fn}
          roughnessMap={fr}
          aoMap={fao}
          roughness={1}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size, 1, 1]} />
        <meshStandardMaterial color="#333" roughness={1} metalness={0} />
      </mesh>

      {/* Walls (4 sides) */}
      <group>
        <mesh position={[0, 1.5, -size / 2]} receiveShadow castShadow>
          <planeGeometry args={[size, 3]} />
          <meshStandardMaterial map={wd} normalMap={wn} roughnessMap={wr} aoMap={wao} roughness={1} />
        </mesh>
        <mesh position={[0, 1.5, size / 2]} rotation={[0, Math.PI, 0]} receiveShadow castShadow>
          <planeGeometry args={[size, 3]} />
          <meshStandardMaterial map={wd} normalMap={wn} roughnessMap={wr} aoMap={wao} roughness={1} />
        </mesh>
        <mesh position={[-size / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <planeGeometry args={[size, 3]} />
          <meshStandardMaterial map={wd} normalMap={wn} roughnessMap={wr} aoMap={wao} roughness={1} />
        </mesh>
        <mesh position={[size / 2, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
          <planeGeometry args={[size, 3]} />
          <meshStandardMaterial map={wd} normalMap={wn} roughnessMap={wr} aoMap={wao} roughness={1} />
        </mesh>
      </group>

      {/* Simple light */}
      <pointLight position={[0, 2.5, 0]} intensity={30} distance={20} decay={2} castShadow />
    </group>
  );
}


import { FPSController } from './FPS';

function PointerLockControls() {
  // Replace OrbitControls with our FPS controller
  return <FPSController />;
}

export function SceneRoot() {
  useGameStore((s) => s.phase); // subscribe to phase to trigger re-render on changes
  return (
    <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 75 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
        {/* Procedural level floors for MVP */}
        <Room />
      </Suspense>
      <PointerLockControls />
      <StatsGl />
    </Canvas>
  );
}
