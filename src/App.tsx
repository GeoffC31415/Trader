import { StrictMode, useState, Suspense, useEffect } from 'react';
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
import { UIIcon } from './ui/components/ui_icon';
import { ShipStatusPanel } from './ui/components/hud/ShipStatusPanel';
import { TutorialOverlay } from './ui/components/hud/TutorialOverlay';
import { ObjectiveHUD } from './ui/components/hud/ObjectiveHUD';
import { StarterShipSelector } from './ui/components/hud/StarterShipSelector';
import { Notifications } from './ui/components/Notifications';
import { useMusicController, initializeMusicOnInteraction } from './shared/audio/use_music';
import { useMissionAudioController, preloadMissionAudio } from './shared/audio/use_mission_audio';
import { TargetArrows } from './ui/components/target_arrows';

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
  const activeObj = (objectives.find(o => o.id === activeObjectiveId) || objectives.find(o => o.status === 'active'));
  
  // Get active story mission
  const activeMissions = missions.filter(m => m.status === 'active');
  const primaryMission = activeMissions[0]; // Show first active mission
  
  // Get active contract for progress display
  const activeContract = activeObj?.kind === 'contract' 
    ? contracts.find(c => c.id === activeObj.id.replace('obj:', ''))
    : undefined;
  
  const activeEscorts = npcTraders.filter(n => n.isEscort && activeContract && n.escortingContract === activeContract.id);
  
  // Initialize music system (call hook to manage music based on game state)
  useMusicController();
  
  // Initialize mission audio controller (handles completion audio)
  useMissionAudioController();
  
  // Initialize audio systems on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeMusicOnInteraction();
      preloadMissionAudio();
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);
  
  return (
    <StrictMode>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div className={`ui-overlay${hasNav ? ' has-minimap' : ''}`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setActive('market')} style={{ fontWeight: active==='market'?700:400, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UIIcon name="tab_market" size={14} />
              Market
            </button>
            <button onClick={() => setActive('journal')} style={{ fontWeight: active==='journal'?700:400, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UIIcon name="tab_journal" size={14} />
              Journal
            </button>
            <button onClick={() => setActive('traders')} disabled={!hasIntel} title={!hasIntel ? 'Requires Mercantile Data Nexus upgrade' : undefined} style={{ fontWeight: active==='traders'?700:400, opacity: hasIntel ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UIIcon name="tab_traders" size={14} />
              Traders
            </button>
          </div>
          {active === 'market' ? <MarketPanel /> : active === 'journal' ? <JournalPanel /> : <TradersPanel />}
        </div>
        <div className="vignette" />
        {hasNav && <Minimap />}
        
        {hasChosenStarter && (
          <ShipStatusPanel
            ship={ship}
            stations={stations}
            contracts={contracts}
            hasNav={hasNav}
          />
        )}
        
        <DockIntro />
        <Celebration />
        <MissionCelebration />
        <Notifications />
        <TargetArrows />
        
        {!hasChosenStarter && (
          <StarterShipSelector
            tutorialActive={tutorialActive}
            onSetTutorialActive={setTutorialActive}
            onChooseStarter={chooseStarter}
          />
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
        
        <TutorialOverlay
          tutorialActive={tutorialActive}
          tutorialStep={tutorialStep}
          onSetTutorialActive={setTutorialActive}
        />
        
        {hasChosenStarter && (
          <ObjectiveHUD
            activeObj={activeObj}
            primaryMission={primaryMission}
            activeContract={activeContract}
            activeEscorts={activeEscorts}
            trackedStationId={trackedStationId}
            stations={stations}
            ship={ship}
            onSetTrackedStation={setTrackedStation}
          />
        )}
      </div>
    </StrictMode>
  );
}
