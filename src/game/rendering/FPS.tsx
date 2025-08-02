import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Input } from '../engine/Input';

export function FPSController() {
  const { camera, gl } = useThree();
  const inputRef = useRef<Input | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    inputRef.current = new Input(el);
    return () => {
      inputRef.current?.dispose();
      inputRef.current = null;
    };
  }, [gl]);

  useFrame((_, dt) => {
    const input = inputRef.current;
    if (!input) return;

    // Mouse look
    const { dx, dy } = input.consumeMouseDelta();
    yawRef.current -= dx * input.sensitivity;
    pitchRef.current -= dy * input.sensitivity;

    const maxPitch = Math.PI / 2 - 0.01;
    pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

    // Movement
    const forward = new THREE.Vector3(Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const move = new THREE.Vector3();

    if (input.isDown('w')) move.add(forward);
    if (input.isDown('s')) move.addScaledVector(forward, -1);
    if (input.isDown('a')) move.addScaledVector(right, -1);
    if (input.isDown('d')) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(4 * dt); // 4 m/s
      camera.position.add(move);
    }

    // Apply rotation
    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ'));
    camera.quaternion.copy(q);
  });

  return null;
}
