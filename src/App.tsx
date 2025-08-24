import { StrictMode, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SceneRoot } from './scene/scene_root';
import { MarketPanel } from './ui/market_panel';
import { JournalPanel } from './ui/journal_panel';
import { Minimap } from './ui/minimap';
import { useGameStore } from './state/game_state';

export function App() {
  const [active, setActive] = useState<'market' | 'journal'>('market');
  const hasNav = useGameStore(s => !!s.ship.hasNavigationArray);
  const hasChosenStarter = useGameStore(s => s.hasChosenStarter);
  const chooseStarter = useGameStore(s => s.chooseStarter);
  return (
    <StrictMode>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div className="ui-overlay">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setActive('market')} style={{ fontWeight: active==='market'?700:400 }}>Market</button>
            <button onClick={() => setActive('journal')} style={{ fontWeight: active==='journal'?700:400 }}>Journal</button>
          </div>
          {active === 'market' ? <MarketPanel /> : <JournalPanel />}
        </div>
        <div className="vignette" />
        {hasNav && <Minimap />}
        {!hasChosenStarter && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', zIndex: 20,
            }}
          >
            <div style={{ background: 'rgba(12,15,22,0.95)', padding: 20, borderRadius: 12, width: 820, color: '#e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Choose Your Starter Ship</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ background: '#0b1220', padding: 12, borderRadius: 10, border: '1px solid #1f2937' }}>
                  <div style={{ fontWeight: 700, color: '#f5d042', marginBottom: 6 }}>Freighter (Gold)</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                    Slow, high cargo capacity. Starts with 10,000 credits.
                  </div>
                  <ul style={{ fontSize: 12, opacity: 0.9, margin: 0, paddingLeft: 16, marginBottom: 8 }}>
                    <li>Max cargo ~300</li>
                    <li>Acceleration low, top speed modest</li>
                    <li>No mining rig</li>
                  </ul>
                  <button onClick={() => chooseStarter('freighter')} style={{ width: '100%', padding: '8px 10px', background: '#f5d042', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Freighter</button>
                </div>
                <div style={{ background: '#0b1220', padding: 12, borderRadius: 10, border: '1px solid #1f2937' }}>
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Clipper (Red)</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                    Fast, low cargo capacity. Starts with 10,000 credits.
                  </div>
                  <ul style={{ fontSize: 12, opacity: 0.9, margin: 0, paddingLeft: 16, marginBottom: 8 }}>
                    <li>Max cargo ~60</li>
                    <li>High acceleration and top speed</li>
                    <li>No mining rig</li>
                  </ul>
                  <button onClick={() => chooseStarter('clipper')} style={{ width: '100%', padding: '8px 10px', background: '#ef4444', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Clipper</button>
                </div>
                <div style={{ background: '#0b1220', padding: 12, borderRadius: 10, border: '1px solid #1f2937' }}>
                  <div style={{ fontWeight: 700, color: '#a16207', marginBottom: 6 }}>Miner (Brown)</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                    Slow, low acceleration, small cargo. Starts with mining rig and 0 credits.
                  </div>
                  <ul style={{ fontSize: 12, opacity: 0.9, margin: 0, paddingLeft: 16, marginBottom: 8 }}>
                    <li>Max cargo ~80</li>
                    <li>Acceleration low, top speed modest</li>
                    <li>Mining rig installed</li>
                  </ul>
                  <button onClick={() => chooseStarter('miner')} style={{ width: '100%', padding: '8px 10px', background: '#a16207', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Miner</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <Canvas
          camera={{ position: [0, 30, 60], fov: 60 }}
          dpr={[1, 2]}
          shadows
          onCreated={(state) => {
            state.gl.toneMapping = THREE.ACESFilmicToneMapping;
            state.gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={[0x03060b]} />
          <fog attach="fog" args={["#0a0e16", 30, 220]} />
          <ambientLight intensity={0.25} />
          <hemisphereLight args={["#cfe8ff", "#0b1020", 0.5]} />
          <directionalLight
            position={[-30, 40, 20]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0005}
          />
          <pointLight position={[50, 50, 50]} intensity={0.9} distance={200} />
          <Environment preset="city" />
          <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <SceneRoot />
        </Canvas>
      </div>
    </StrictMode>
  );
}


