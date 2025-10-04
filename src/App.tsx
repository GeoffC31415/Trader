import { StrictMode, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SceneRoot } from './scene/scene_root';
import { MarketPanel } from './ui/market_panel';
import { JournalPanel } from './ui/journal_panel';
import { TradersPanel } from './ui/traders_panel';
import { Minimap } from './ui/minimap';
import { useGameStore } from './state';
import { DockIntro } from './ui/dock_intro';
import { Celebration } from './ui/celebration';
import { MissionCelebration } from './ui/mission_celebration';

export function App() {
  const [active, setActive] = useState<'market' | 'journal' | 'traders'>('market');
  const hasNav = useGameStore(s => !!s.ship.hasNavigationArray);
  const hasChosenStarter = useGameStore(s => s.hasChosenStarter);
  const chooseStarter = useGameStore(s => s.chooseStarter);
  const tutorialActive = useGameStore(s => s.tutorialActive);
  const setTutorialActive = useGameStore(s => s.setTutorialActive);
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const hasIntel = useGameStore(s => !!s.ship.hasMarketIntel);
  const objectives = useGameStore(s => s.objectives || []);
  const activeObjectiveId = useGameStore(s => s.activeObjectiveId);
  const trackedStationId = useGameStore(s => s.trackedStationId);
  const stations = useGameStore(s => s.stations);
  const setTrackedStation = useGameStore(s => s.setTrackedStation);
  const ship = useGameStore(s => s.ship);
  const contracts = useGameStore(s => s.contracts || []);
  const npcTraders = useGameStore(s => s.npcTraders);
  const missions = useGameStore(s => s.missions);
  const missionArcs = useGameStore(s => s.missionArcs);
  const activeObj = (objectives.find(o => o.id === activeObjectiveId) || objectives.find(o => o.status === 'active'));
  
  // Get active story mission
  const activeMissions = missions.filter(m => m.status === 'active');
  const primaryMission = activeMissions[0]; // Show first active mission
  
  // Get active contract for progress display
  const activeContract = activeObj?.kind === 'contract' 
    ? contracts.find(c => c.id === activeObj.id.replace('obj:', ''))
    : undefined;
  
  const activeEscorts = npcTraders.filter(n => n.isEscort && activeContract && n.escortingContract === activeContract.id);
  const escortCargo = activeEscorts.reduce((sum, e) => sum + (e.escortCargoUsed || 0), 0);
  const totalEscortCapacity = activeEscorts.reduce((sum, e) => sum + (e.escortCargoCapacity || 0), 0);
  return (
    <StrictMode>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div className="ui-overlay">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setActive('market')} style={{ fontWeight: active==='market'?700:400 }}>Market</button>
            <button onClick={() => setActive('journal')} style={{ fontWeight: active==='journal'?700:400 }}>Journal</button>
            <button onClick={() => setActive('traders')} disabled={!hasIntel} title={!hasIntel ? 'Requires Mercantile Data Nexus upgrade' : undefined} style={{ fontWeight: active==='traders'?700:400, opacity: hasIntel ? 1 : 0.6 }}>Traders</button>
          </div>
          {active === 'market' ? <MarketPanel /> : active === 'journal' ? <JournalPanel /> : <TradersPanel />}
        </div>
        <div className="vignette" />
        {hasNav && <Minimap />}
        <DockIntro />
        <Celebration />
        <MissionCelebration />
        {!hasChosenStarter && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', zIndex: 20,
            }}
          >
            <div style={{ background: 'rgba(12,15,22,0.95)', padding: 20, borderRadius: 12, width: 820, color: '#e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Choose Your Starter Ship</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, opacity: 0.9 }}>
                <input type="checkbox" checked={tutorialActive} onChange={(e) => setTutorialActive(e.target.checked)} />
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
                  <button onClick={() => chooseStarter('freighter', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#f5d042', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Freighter</button>
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
                  <button onClick={() => chooseStarter('clipper', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#ef4444', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Clipper</button>
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
                  <button onClick={() => chooseStarter('miner', { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#a16207', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Miner</button>
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
                  <button onClick={() => chooseStarter('test' as any, { tutorial: tutorialActive })} style={{ width: '100%', padding: '8px 10px', background: '#22c55e', color: '#111827', borderRadius: 8, fontWeight: 700 }}>Select Test Ship</button>
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
          <fog attach="fog" args={["#0a0e16", 300, 2200]} />
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
          <pointLight position={[500, 500, 500]} intensity={0.9} distance={2000} />
          <Environment preset="city" />
          <Stars radius={2000} depth={500} count={4000} factor={4} saturation={0} fade speed={1} />
          <Suspense fallback={null}>
            <SceneRoot />
          </Suspense>
        </Canvas>
        {/* Tutorial overlay */}
        {tutorialActive && hasChosenStarter && (
          <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 30, maxWidth: 460 }}>
            <div style={{ background: 'rgba(11,18,32,0.92)', color: '#e5e7eb', padding: 12, borderRadius: 10, border: '1px solid #1f2937', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Tutorial Mission</div>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                {tutorialStep === 'dock_city' && 'Fly to Sol City (the large structure to the northeast) and press E to dock.'}
                {tutorialStep === 'accept_mission' && 'Scroll down in the Market panel to "Hall Contracts" section. Find a mission to deliver Refined Fuel and click Accept.'}
                {tutorialStep === 'goto_refinery' && 'Undock (press Q) and fly to Helios Refinery (south) where fuel is cheap. Dock there (press E when close).'}
                {tutorialStep === 'buy_fuel' && 'In the Market panel, buy the Refined Fuel needed for your mission. The mission objective shows your progress.'}
                {tutorialStep === 'deliver_fuel' && 'Undock and return to Sol City. Dock there, then sell your Refined Fuel in the Market to complete the mission!'}
                {tutorialStep === 'done' && "Tutorial complete! You've completed your first contract. Keep trading, taking missions, and upgrading your ship."}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setTutorialActive(false)} style={{ opacity: 0.9 }}>Skip tutorial</button>
              </div>
            </div>
          </div>
        )}
        {/* Next Objective HUD */}
        {hasChosenStarter && (trackedStationId || activeObj || primaryMission) && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, maxWidth: 640 }}>
            <div style={{ background: 'rgba(11,18,32,0.9)', color: '#e5e7eb', padding: 12, borderRadius: 10, border: '1px solid #1f2937', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              {/* Show active mission if present */}
              {primaryMission && (
                <div style={{ marginBottom: activeObj ? 12 : 0, paddingBottom: activeObj ? 12 : 0, borderBottom: activeObj ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>Story Mission</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                        {primaryMission.title}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      Stage {primaryMission.stage}
                    </div>
                  </div>
                  
                  {/* Mission objectives */}
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    {primaryMission.objectives.filter(obj => !obj.optional).map(obj => (
                      <div key={obj.id} style={{ 
                        marginBottom: 4, 
                        opacity: obj.completed ? 0.6 : 1,
                        textDecoration: obj.completed ? 'line-through' : 'none',
                      }}>
                        {obj.completed ? '✓' : '○'} {obj.description}
                        {obj.quantity && obj.quantity > 1 && (
                          <span style={{ marginLeft: 8, opacity: 0.8, fontFamily: 'monospace' }}>
                            ({obj.current}/{obj.quantity})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (primaryMission.objectives.filter(o => o.completed).length / primaryMission.objectives.filter(o => !o.optional).length) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 10px #8b5cf680'
                    }} />
                  </div>
                </div>
              )}
              
              {/* Contract objective */}
              {activeObj && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Contract</div>
                  <div style={{ fontSize: 13 }}>
                    {activeObj.label}
                  </div>
                  {activeContract && (
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                      Progress: {activeContract.deliveredUnits || 0} / {activeContract.units} {activeContract.commodityId.replace(/_/g, ' ')}
                      {activeEscorts.length > 0 && (
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                          🚀 {activeEscorts.length} Escort{activeEscorts.length > 1 ? 's' : ''}: {escortCargo} / {totalEscortCapacity} cargo
                        </div>
                      )}
                      <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, ((activeContract.deliveredUnits || 0) / activeContract.units) * 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981, #22c55e)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Waypoint controls - shown for both contracts and missions */}
              <div style={{ display: 'flex', gap: 8, marginTop: (activeObj || primaryMission) ? 8 : 0 }}>
                <button
                  onClick={() => {
                    const target = activeObj?.targetStationId;
                    if (target) {
                      setTrackedStation(target);
                      return;
                    }
                    // Fallback: set nearest station if no active objective
                    let best: { id: string; d: number } | undefined;
                    for (const st of stations) {
                      const dx = st.position[0] - ship.position[0];
                      const dy = st.position[1] - ship.position[1];
                      const dz = st.position[2] - ship.position[2];
                      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
                      if (!best || d < best.d) best = { id: st.id, d };
                    }
                    if (best) setTrackedStation(best.id);
                  }}
                >Set waypoint</button>
                {trackedStationId && (
                  <button onClick={() => setTrackedStation(undefined)}>Clear waypoint</button>
                )}
              </div>
              {trackedStationId && (() => {
                const st = stations.find(s => s.id === trackedStationId);
                if (!st) return null as any;
                const dx = st.position[0] - ship.position[0];
                const dy = st.position[1] - ship.position[1];
                const dz = st.position[2] - ship.position[2];
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                return (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                    Waypoint: {st.name} — Distance: {dist.toFixed(1)}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </StrictMode>
  );
}


