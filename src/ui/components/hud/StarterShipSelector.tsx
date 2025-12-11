import type { ShipKind } from '../../../domain/constants/ship_kinds';

interface StarterShipSelectorProps {
  tutorialActive: boolean;
  onSetTutorialActive: (active: boolean) => void;
  onChooseStarter: (kind: ShipKind | 'test', opts?: { tutorial?: boolean }) => void;
}

export function StarterShipSelector({
  tutorialActive,
  onSetTutorialActive,
  onChooseStarter,
}: StarterShipSelectorProps) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', zIndex: 20,
      }}
    >
      <div style={{ background: 'rgba(12,15,22,0.95)', padding: 20, borderRadius: 12, width: 820, color: '#e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Choose Your Starter Ship</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, opacity: 0.9 }}>
          <input type="checkbox" checked={tutorialActive} onChange={(e) => onSetTutorialActive(e.target.checked)} />
          Start with tutorial (recommended for new players)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
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
            <button onClick={() => onChooseStarter('freighter', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#f5d042', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Freighter</button>
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
            <button onClick={() => onChooseStarter('clipper', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#ef4444', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Clipper</button>
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
            <button onClick={() => onChooseStarter('miner', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#a16207', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Miner</button>
          </div>
          <div style={{ background: '#0b1220', padding: 12, borderRadius: 10, border: '1px solid #1f2937' }}>
            <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Test Ship (Dev)</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
              Fast racer with all upgrades enabled. High credits for testing.
            </div>
            <ul style={{ fontSize: 12, opacity: 0.9, margin: 0, paddingLeft: 16, marginBottom: 8 }}>
              <li>Kind: Racer, max acceleration and top speed</li>
              <li>Mining rig, Navigation, Intel, Union enabled</li>
              <li>Max cargo capacity</li>
            </ul>
            <button onClick={() => onChooseStarter('test', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#22c55e', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Test Ship</button>
          </div>
        </div>
      </div>
    </div>
  );
}

