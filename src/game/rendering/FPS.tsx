import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Input } from '../engine/Input';
import { useGameStore } from '../../state/useGameStore';
import { generateLevel } from '../level/Generator';

type Enemy = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
};

type Bullet = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  ttl: number; // seconds
};

export function FPSController() {
  const { camera, gl } = useThree();
  const inputRef = useRef<Input | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const seed = useGameStore((s) => s.seed);
  const ammo = useGameStore((s) => s.ammo);
  const addScore = useGameStore((s) => s.addScore);
  const damagePlayer = useGameStore((s) => s.damage);
  // direct setter without capturing unused state arg to satisfy eslint
  const setAmmoDirect = (ammoVal: number) => {
    useGameStore.setState({ ammo: ammoVal });
  };

  // Level collision grid for bullets/enemies (walls)
  const level = useMemo(() => generateLevel(seed, { cols: 15, rows: 15 }, 2), [seed]);
  // Occupancy check at world position
  const isWall = (x: number, y: number) => {
    const gx = Math.round(x / level.tileSize);
    const gy = Math.round(y / level.tileSize);
    if (gx < 0 || gy < 0 || gx >= level.width || gy >= level.height) return true;
    const idx = gy * level.width + gx;
    return level.grid[idx].type === 'wall';
  };

  // Capsule-based collision check for player/enemy with radius
  const collides = (x: number, z: number, radius = 0.3) => {
    // sample 4 corners around the circle to avoid grazing into walls
    return (
      isWall(x + radius, z) ||
      isWall(x - radius, z) ||
      isWall(x, z + radius) ||
      isWall(x, z - radius)
    );
  };

  // Entities
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const nextEnemyId = useRef(1);
  const nextBulletId = useRef(1);
  const shootCooldownRef = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    inputRef.current = new Input(el);
    // Spawn enemies at provided spawns
    enemiesRef.current = level.enemySpawns.slice(0, 8).map((p) => ({
      id: nextEnemyId.current++,
      pos: new THREE.Vector3(p.x, 1, p.y),
      vel: new THREE.Vector3(),
      hp: 30,
    }));
    // Place player at spawn, ensure starting inside a floor cell center
    camera.position.set(level.playerSpawn.x, 1.6, level.playerSpawn.y);
    yawRef.current = 0;
    pitchRef.current = 0;

    return () => {
      inputRef.current?.dispose();
      inputRef.current = null;
      enemiesRef.current = [];
      bulletsRef.current = [];
    };
  }, [gl, level, camera]);

  // local real-time refs so R3F can animate entities each frame
  const bulletsRenderRef = useRef<Bullet[]>([]);
  const enemiesRenderRef = useRef<Enemy[]>([]);

  // Instanced bullets for smooth GPU-side animation
  const bulletMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const MAX_BULLETS = 256;

  useFrame((_, dt) => {
    const input = inputRef.current;
    if (!input) return;

    // clamp dt to avoid huge steps when tab inactive
    dt = Math.min(dt, 0.05);

    // Mouse look
    const { dx, dy } = input.consumeMouseDelta();
    yawRef.current -= dx * input.sensitivity;
    pitchRef.current -= dy * input.sensitivity;

    const maxPitch = Math.PI / 2 - 0.01;
    pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

    // Movement with axis-aligned collision against walls
    // Recompute forward/right from camera quaternion to ensure WASD matches view yaw
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const wish = new THREE.Vector3();
    if (input.isDown('w')) wish.add(forward);
    if (input.isDown('s')) wish.addScaledVector(forward, -1);
    if (input.isDown('a')) wish.addScaledVector(right, -1);
    if (input.isDown('d')) wish.add(right);

    if (wish.lengthSq() > 0) {
      wish.normalize().multiplyScalar(4 * dt); // 4 m/s
      const r = 0.3;

      // Try move X with radius collision
      const tryX = camera.position.x + wish.x;
      if (!collides(tryX, camera.position.z, r)) {
        camera.position.x = tryX;
      }
      // Try move Z with radius collision
      const tryZ = camera.position.z + wish.z;
      if (!collides(camera.position.x, tryZ, r)) {
        camera.position.z = tryZ;
      }
    }

    // Apply rotation
    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ'));
    camera.quaternion.copy(q);

    // Shooting (Space to shoot)
    shootCooldownRef.current = Math.max(0, shootCooldownRef.current - dt);
    const wantsShoot = input.isDown(' '); // space only as requested
    if (wantsShoot && shootCooldownRef.current === 0 && ammo > 0) {
      shootCooldownRef.current = 0.15; // 400 RPM
      setAmmoDirect(ammo - 1);

      // compute forward direction strictly from camera quaternion each frame
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      // spawn slightly in front of the camera to avoid immediate wall/self collision
      const muzzle = camera.position.clone().addScaledVector(dir, 0.35);
      bulletsRef.current.push({
        id: nextBulletId.current++,
        pos: muzzle.clone(), // ensure independent vector instance
        vel: dir.clone().multiplyScalar(32), // slightly faster to be visible
        ttl: 1.2,
      });
    }

    // Update bullets (raycast-like small steps to avoid tunneling on thin walls)
    const newBullets: Bullet[] = [];
    for (const b of bulletsRef.current) {
      b.ttl -= dt;
      if (b.ttl <= 0) continue;

      const subSteps = 4;
      let alive = true;
      for (let i = 0; i < subSteps; i++) {
        const step = dt / subSteps;
        const nx = b.pos.x + b.vel.x * step;
        const nz = b.pos.z + b.vel.z * step;
        // check at a small radius to avoid grazing through corners
        if (collides(nx, nz, 0.05)) {
          alive = false;
          break;
        }
        b.pos.set(nx, b.pos.y, nz);
      }
      if (alive) newBullets.push(b);
    }
    bulletsRef.current = newBullets;
    bulletsRenderRef.current = newBullets;

    // Update instanced mesh matrices for smooth animation
    if (bulletMeshRef.current) {
      const mesh = bulletMeshRef.current;
      const dummy = new THREE.Object3D();
      const count = Math.min(newBullets.length, MAX_BULLETS);
      mesh.count = count;
      for (let i = 0; i < count; i++) {
        const b = newBullets[i];
        dummy.position.copy(b.pos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Update enemies (basic chase) with radius collision
    const playerPos = camera.position.clone();
    const newEnemies: Enemy[] = [];
    for (const e of enemiesRef.current) {
      const toPlayer = playerPos.clone().sub(e.pos);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      // chase direction
      const dir = dist > 0.001 ? toPlayer.clone().normalize() : new THREE.Vector3(0, 0, 0);

      // desired speed
      const speed = 1.3;
      const desired = dir.multiplyScalar(speed);
      e.vel.lerp(desired, 0.2);

      // integrate with substeps and radius collision
      const subSteps = 2;
      const r = 0.3;
      for (let i = 0; i < subSteps; i++) {
        const step = dt / subSteps;

        const nx = e.pos.x + e.vel.x * step;
        if (!collides(nx, e.pos.z, r)) {
          e.pos.x = nx;
        } else {
          e.vel.x = 0;
        }

        const nz = e.pos.z + e.vel.z * step;
        if (!collides(e.pos.x, nz, r)) {
          e.pos.z = nz;
        } else {
          e.vel.z = 0;
        }
      }

      // Attack if very close
      if (dist < 0.8) {
        damagePlayer(5);
      }

      // Bullet hits
      let alive = e.hp > 0;
      for (const b of bulletsRef.current) {
        if (!alive) break;
        if (b.pos.distanceTo(e.pos) < 0.35) {
          e.hp -= 20;
          b.ttl = 0;
          if (e.hp <= 0) {
            addScore(10);
            alive = false;
          }
        }
      }

      if (alive) newEnemies.push(e);
    }
    enemiesRef.current = newEnemies;
    enemiesRenderRef.current = newEnemies;
  });

  // Simple debug visuals for bullets and enemies
  return (
    <>
      {/* Bullets - GPU instanced for smooth animation */}
      <instancedMesh ref={bulletMeshRef} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, MAX_BULLETS]} castShadow>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffcc66" emissiveIntensity={0.5} />
      </instancedMesh>
      {/* Enemies */}
      {enemiesRenderRef.current.map((e) => (
        <mesh key={`e-${e.id}`} position={e.pos} castShadow>
          <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      ))}
    </>
  );
}
