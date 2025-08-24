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
        <Canvas
          camera={{ position: [0, 30, 60], fov: 60 }}
          dpr={[1, 2]}
          shadows
          onCreated={(state) => {
            state.gl.toneMapping = THREE.ACESFilmicToneMapping;
            // @ts-expect-error - three typings still allow outputEncoding on some versions
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
          <Environment preset="city" intensity={0.3} />
          <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <SceneRoot />
        </Canvas>
      </div>
    </StrictMode>
  );
}


