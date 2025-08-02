import { Canvas } from '@react-three/fiber';
import { OrbitControls, StatsGl, useTexture } from '@react-three/drei';
import { Suspense } from 'react';
import { useGameStore } from '../../state/useGameStore';

// Simple floor/wall materials from AmbientCG (CC0) via direct URLs
// Using 2K textures to balance quality/perf; can be tuned later.
const FLOOR_DIFF = 'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_Color.jpg';
const FLOOR_NORM = 'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_NormalGL.jpg';
const FLOOR_ROUGH = 'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_Roughness.jpg';
const FLOOR_AO = 'https://ambientcg.com/get?file=FloorTileBare001_2K-JPG/FloorTileBare001_2K_AmbientOcclusion.jpg';

const WALL_DIFF = 'https://ambientcg.com/get?file=Concrete027_2K-JPG/Concrete027_2K_Color.jpg';
const WALL_NORM = 'https://ambientcg.com/get?file=Concrete027_2K-JPG/Concrete027_2K_NormalGL.jpg';
const WALL_ROUGH = 'https://ambientcg.com/get?file=Concrete027_2K-JPG/Concrete027_2K_Roughness.jpg';
const WALL_AO = 'https://ambientcg.com/get?file=Concrete027_2K-JPG/Concrete027_2K_AmbientOcclusion.jpg';

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


function PointerLockControls() {
  // Minimal first-person look using pointer lock and manual camera rotation.
  // For MVP, use OrbitControls restricted; will replace with real FPS lock next step.
  return <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={0} />;
}

export function SceneRoot() {
  useGameStore((s) => s.phase); // subscribe to phase to trigger re-render on changes
  return (
    <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 75 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
        <Room />
      </Suspense>
      <PointerLockControls />
      <StatsGl />
    </Canvas>
  );
}
