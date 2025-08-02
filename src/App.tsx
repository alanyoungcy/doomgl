import './App.css';
import { SceneRoot } from './game/rendering/Scene';
import { useGameStore } from './state/useGameStore';

function HUD() {
  const { health, ammo, score, seed, setSeed, start, phase } = useGameStore((s) => ({
    health: s.health,
    ammo: s.ammo,
    score: s.score,
    seed: s.seed,
    setSeed: s.setSeed,
    start: s.start,
    phase: s.phase,
  }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
        color: '#fff',
      }}
    >
      {/* Top-left status */}
      <div style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'auto' }}>
        <div>Health: {health}</div>
        <div>Ammo: {ammo}</div>
        <div>Score: {score}</div>
      </div>

      {/* Center crosshair */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 12,
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          placeItems: 'center',
          opacity: 0.8,
        }}
      >
        <div
          style={{
            width: 2,
            height: 2,
            background: '#fff',
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
          }}
        />
      </div>

      {/* Bottom seed + start */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.4)',
          padding: '8px 12px',
          borderRadius: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <label style={{ fontSize: 12, opacity: 0.9 }}>Seed</label>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            padding: '4px 8px',
            outline: 'none',
          }}
        />
        {phase !== 'playing' && (
          <button
            onClick={() => start()}
            style={{
              pointerEvents: 'auto',
              background: '#0ea5e9',
              border: 'none',
              borderRadius: 4,
              padding: '6px 10px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <SceneRoot />
      <HUD />
    </div>
  );
}

export default App;
