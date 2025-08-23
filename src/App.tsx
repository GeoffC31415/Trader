import { StrictMode, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { SceneRoot } from './scene/scene_root';
import { MarketPanel } from './ui/market_panel';
import { JournalPanel } from './ui/journal_panel';
import { Minimap } from './ui/minimap';

export function App() {
  const [active, setActive] = useState<'market' | 'journal'>('market');
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
        <Minimap />
        <Canvas camera={{ position: [0, 30, 60], fov: 60 }}>
          <color attach="background" args={[0x03060b]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[50, 50, 50]} intensity={1.5} />
          <Stars radius={200} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <SceneRoot />
        </Canvas>
      </div>
    </StrictMode>
  );
}


