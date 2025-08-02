import { create } from 'zustand';
import seedrandom from 'seedrandom';

export type GamePhase = 'loading' | 'playing' | 'paused';

export interface GameState {
  seed: string;
  rng: () => number;
  health: number;
  ammo: number;
  score: number;
  phase: GamePhase;
  setSeed: (seed: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  damage: (amount: number) => void;
  addAmmo: (amount: number) => void;
  addScore: (amount: number) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  seed: 'DOOMGL-001',
  rng: seedrandom('DOOMGL-001'),
  health: 100,
  ammo: 30,
  score: 0,
  phase: 'loading',
  setSeed: (seed: string) => set(() => ({ seed, rng: seedrandom(seed) })),
  start: () => set(() => ({ phase: 'playing' })),
  pause: () => set(() => ({ phase: 'paused' })),
  resume: () => set(() => ({ phase: 'playing' })),
  damage: (amount: number) => set((s: GameState) => ({ health: Math.max(0, s.health - amount) })),
  addAmmo: (amount: number) => set((s: GameState) => ({ ammo: s.ammo + amount })),
  // expose a typed setter for ammo to avoid StoreApi typing friction at call sites
  setAmmo: (ammo: number) => set(() => ({ ammo })),
  addScore: (amount: number) => set((s: GameState) => ({ score: s.score + amount })),
}));
