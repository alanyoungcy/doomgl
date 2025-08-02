import { Canvas } from '@react-three/fiber';
import { StatsGl } from '@react-three/drei';
import { Suspense } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { LevelMesh } from './LevelMesh';
import { FPSController } from './FPS';

function PointerLockControls() {
  return <FPSController />;
}

export function SceneRoot() {
  useGameStore((s) => s.phase); // subscribe to phase to trigger re-render on changes
  return (
    <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 75 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
        <LevelMesh />
      </Suspense>
      <PointerLockControls />
      <StatsGl />
    </Canvas>
  );
}
