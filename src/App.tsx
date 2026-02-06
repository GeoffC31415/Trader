import { useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SceneRoot } from './scene/scene_root';
import { MarketPanel } from './ui/market_panel';
import { JournalPanel } from './ui/journal_panel';
import { TradersPanel } from './ui/traders_panel';
import { DebugPanel } from './ui/debug_panel';
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
import { StealthIndicator } from './ui/components/hud/StealthIndicator';
import { DeathScreen } from './ui/components/hud/DeathScreen';
import { DamageVignette } from './ui/components/hud/DamageVignette';
import { TargetIndicator } from './ui/components/hud/TargetIndicator';

export function App() {
  const [active, setActive] = useState<'market' | 'journal' | 'traders' | 'debug'>('market');
  const hasNav = useGameStore(s => !!s.ship.hasNavigationArray);
  const hasChosenStarter = useGameStore(s => s.hasChosenStarter);
  const isTestMode = useGameStore(s => s.isTestMode);
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

  const tabs = useMemo(() => {
    const base = [
      { key: 'market' as const, label: 'Market', icon: 'tab_market' as const, disabled: false, title: undefined },
      { key: 'journal' as const, label: 'Journal', icon: 'tab_journal' as const, disabled: false, title: undefined },
      { key: 'traders' as const, label: 'Traders', icon: 'tab_traders' as const, disabled: !hasIntel, title: !hasIntel ? 'Requires Mercantile Data Nexus upgrade' : undefined },
    ];
    if (isTestMode) base.push({ key: 'debug' as const, label: 'Debug', icon: undefined, disabled: false, title: undefined });
    return base;
  }, [hasIntel, isTestMode]);

  const tabTheme = useMemo(() => {
    return {
      market: { accent: '#3b82f6', accentSoft: 'rgba(59,130,246,0.25)', accentGlow: 'rgba(59,130,246,0.55)' },
      journal: { accent: '#60a5fa', accentSoft: 'rgba(96,165,250,0.22)', accentGlow: 'rgba(96,165,250,0.50)' },
      traders: { accent: '#22d3ee', accentSoft: 'rgba(34,211,238,0.22)', accentGlow: 'rgba(34,211,238,0.50)' },
      debug: { accent: '#f59e0b', accentSoft: 'rgba(245,158,11,0.22)', accentGlow: 'rgba(245,158,11,0.50)' },
    } satisfies Record<'market' | 'journal' | 'traders' | 'debug', { accent: string; accentSoft: string; accentGlow: string }>;
  }, []);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<'market' | 'journal' | 'traders' | 'debug', HTMLButtonElement | null>>({
    market: null,
    journal: null,
    traders: null,
    debug: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({ left: 0, width: 0, opacity: 0 });

  const updateIndicator = () => {
    const container = tabsRef.current;
    const btn = tabButtonRefs.current[active];
    if (!container || !btn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicatorStyle({
      left: Math.max(0, btnRect.left - containerRect.left),
      width: Math.max(0, btnRect.width),
      opacity: 1,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hasIntel, isTestMode]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div className={`ui-overlay${hasNav ? ' has-minimap' : ''}`}>
          <div
            ref={tabsRef}
            className="top-tabs"
            role="tablist"
            aria-label="Main panels"
          >
            <div
              className="top-tabs-indicator"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                background: `linear-gradient(90deg, transparent, ${tabTheme[active].accent}, transparent)`,
                boxShadow: `0 0 12px ${tabTheme[active].accentGlow}`,
              }}
            />
            {tabs.map((t) => (
              <button
                key={t.key}
                ref={(el) => { tabButtonRefs.current[t.key] = el; }}
                role="tab"
                aria-selected={active === t.key}
                data-active={active === t.key}
                className="top-tab"
                disabled={t.disabled}
                title={t.title}
                style={{
                  // Per-tab accent theme (used by CSS)
                  ['--tab-accent' as any]: tabTheme[t.key].accent,
                  ['--tab-accent-soft' as any]: tabTheme[t.key].accentSoft,
                  ['--tab-accent-glow' as any]: tabTheme[t.key].accentGlow,
                }}
                onClick={() => setActive(t.key)}
              >
                {t.icon ? <UIIcon name={t.icon} size={14} /> : <span style={{ fontSize: 14 }}>🛠️</span>}
                <span className="top-tab-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="panel-switch">
            <div key={active} className="panel-switch-content">
              {active === 'market' ? <MarketPanel /> : active === 'journal' ? <JournalPanel /> : active === 'traders' ? <TradersPanel /> : <DebugPanel />}
            </div>
          </div>
        </div>
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
        <div className="vignette" />
        <DamageVignette />
        <DeathScreen />
        <TargetIndicator />
        <TargetArrows />
        <StealthIndicator />
        
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
  );
}
