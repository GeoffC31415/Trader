import { useMemo, useEffect, useState, useRef } from 'react';
import { useGameStore } from '../state';
import { ReputationBadge } from './components/reputation_badge';
import { formatNumber } from './utils/number_format';
import { getReputationTier, getTierDisplay, getTierPerks } from '../state/helpers/reputation_helpers';
import { processRecipes } from '../systems/economy/recipes';
import { generateCommodities } from '../systems/economy/commodities';
import { getTargetStock, getStockPriceEffect, getPriceBiasForStation } from '../systems/economy/pricing';
import type { StationType } from '../domain/types/economy_types';
import { getPlayerRelationshipTier, RELATIONSHIP_TIER_DISPLAY, createEmptyMemory } from '../domain/types/character_types';
import { selectDialoguePair, resolveDialoguePairAudio } from '../systems/dialogue/dialogue_selector';
import { getCharacterDialogue } from '../domain/constants/character_dialogue';
import { getCharacterRelationships, CHARACTER_NAMES } from '../domain/constants/character_relationships';
import type { DialogueContext, DialogueResult } from '../domain/types/character_types';
import { preloadManifest } from '../shared/audio/dialogue_audio';

// Import all generated avatars as URLs via Vite's glob import
const avatarModules = import.meta.glob('../../generated_avatars/*.png', { eager: true, as: 'url' }) as Record<string, string>;

function toSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_\.\s]/gi, '_').replace(/\s+/g, ' ').trim();
}

const stationTypeColors: Record<StationType, { primary: string; secondary: string; glow: string }> = {
  city: { primary: '#3b82f6', secondary: '#60a5fa', glow: '#3b82f680' },
  refinery: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#f59e0b80' },
  fabricator: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#8b5cf680' },
  farm: { primary: '#10b981', secondary: '#34d399', glow: '#10b98180' },
  power_plant: { primary: '#eab308', secondary: '#fde047', glow: '#eab30880' },
  trading_post: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#06b6d480' },
  shipyard: { primary: '#ec4899', secondary: '#f472b6', glow: '#ec489980' },
  pirate: { primary: '#ef4444', secondary: '#f87171', glow: '#ef444480' },
  mine: { primary: '#78716c', secondary: '#a8a29e', glow: '#78716c80' },
  research: { primary: '#06b6d4', secondary: '#67e8f9', glow: '#06b6d480' },
  orbital_hab: { primary: '#a855f7', secondary: '#c084fc', glow: '#a855f780' },
};

const stationTypeIcons: Record<StationType, string> = {
  city: '🏙️',
  refinery: '⚗️',
  fabricator: '⚙️',
  farm: '🌾',
  power_plant: '⚡',
  trading_post: '🏪',
  shipyard: '🚀',
  pirate: '☠️',
  mine: '⛏️',
  research: '🔬',
  orbital_hab: '🛰️',
};

export function DockIntro() {
  const stationId = useGameStore(s => s.dockIntroVisibleId);
  const stations = useGameStore(s => s.stations);
  const contracts = useGameStore(s => s.contracts || []);
  const ship = useGameStore(s => s.ship);
  const dismiss = useGameStore(s => s.dismissDockIntro);
  // Stabilize station reference - only recalculate when stationId changes
  const station = useMemo(() => {
    if (!stationId) return undefined;
    return stations.find(s => s.id === stationId);
  }, [stationId, stations.length]); // Only depend on stationId and array length, not the array itself
  const persona = station?.persona;
  const [scanlineOffset, setScanlineOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Track when we first docked to prevent dialogue re-selection
  const dockTimeRef = useRef<number | null>(null);
  
  // Reset dock time when station changes
  useEffect(() => {
    if (stationId) {
      dockTimeRef.current = Date.now() / 1000;
    } else {
      dockTimeRef.current = null;
    }
  }, [stationId]);
  
  // Get mission arc state for dialogue context
  const missionArcs = useGameStore(s => s.missionArcs);
  const completedArcs = useMemo(() => 
    missionArcs.filter(a => a.status === 'completed').map(a => a.id), 
    [missionArcs]
  );
  const activeArcs = useMemo(() => 
    missionArcs.filter(a => a.status === 'in_progress').map(a => a.id), 
    [missionArcs]
  );
  
  // Select dialogue ONCE per dock session - use useState + useEffect instead of useMemo
  // This prevents constant re-selection on every render
  const [dialogueLinesBase, setDialogueLinesBase] = useState<{ greeting: DialogueResult | null; contextual: DialogueResult | null }>({ greeting: null, contextual: null });
  const lastDockKeyRef = useRef<string | null>(null);
  const hasSelectedForStationRef = useRef<string | null>(null);

  // Select dialogue when docking (only runs once per dock session)
  useEffect(() => {
    // Reset if station changed
    if (lastDockKeyRef.current !== stationId) {
      hasSelectedForStationRef.current = null;
      lastDockKeyRef.current = stationId ?? null;
    }
    
    if (!station || !persona) {
      setDialogueLinesBase({ greeting: null, contextual: null });
      hasSelectedForStationRef.current = null;
      return;
    }
    
    // Only select if we haven't selected for this station yet
    if (hasSelectedForStationRef.current === stationId) {
      return; // Already selected for this dock session - don't re-select
    }
    
    hasSelectedForStationRef.current = stationId ?? null;
    
    // Get conditional dialogue for this character
    const characterDialogue = getCharacterDialogue(station.id);
    
    // If no conditional dialogue, fall back to legacy system
    if (characterDialogue.length === 0) {
      const rep = station?.reputation || 0;
      const tier = rep >= 70 ? 'high' : rep >= 30 ? 'mid' : 'low';
      const lines = tier === 'high' ? (persona.lines_high || []) : tier === 'mid' ? (persona.lines_mid || []) : (persona.lines_low || []);
      const tips = tier === 'high' ? (persona.tips_high || []) : tier === 'mid' ? (persona.tips_mid || []) : (persona.tips_low || []);
      const fallback = [...(persona.lines || []), ...(persona.tips || [])];
      const pool = [...lines, ...tips, ...fallback];
      if (pool.length === 0) {
        setDialogueLinesBase({ greeting: null, contextual: null });
        return;
      }
      // Use deterministic selection based on dock time
      const seed = Math.floor((dockTimeRef.current ?? Date.now() / 1000) * 1000) % pool.length;
      const selectedLine = pool[seed];
      setDialogueLinesBase({ 
        greeting: { line: { id: 'legacy', text: selectedLine, category: 'greeting' } },
        contextual: null 
      });
      return;
    }
    
    // Build dialogue context
    const memory = station.characterMemory ?? createEmptyMemory();
    const context: DialogueContext = {
      stationId: station.id,
      playerRep: station.reputation ?? 0,
      playerRelationshipTier: getPlayerRelationshipTier(station.reputation ?? 0),
      characterMemory: memory,
      knownPlayerActions: memory.knownActions,
      completedArcs,
      activeArcs,
      worldState: {},
      currentGameTime: dockTimeRef.current ?? Date.now() / 1000, // Use stable dock time
    };
    
    const result = selectDialoguePair(characterDialogue, context);
    setDialogueLinesBase(result);
    
    // Record shown dialogue to prevent repetition on future visits
    const shownLineIds: string[] = [];
    if (result.greeting?.line.id) shownLineIds.push(result.greeting.line.id);
    if (result.contextual?.line.id) shownLineIds.push(result.contextual.line.id);
    if (shownLineIds.length > 0) {
      useGameStore.getState().recordDialogueShown(station.id, shownLineIds);
    }
  }, [stationId]); // Only re-select when stationId changes (i.e., when docking at a new station)

  // Resolve audio URLs asynchronously - only when dialogue actually changes
  const [dialogueLines, setDialogueLines] = useState<{ greeting: DialogueResult | null; contextual: DialogueResult | null }>(dialogueLinesBase);
  const previousDialogueIdsRef = useRef<{ greeting: string | null; contextual: string | null }>({ greeting: null, contextual: null });
  
  // Sync dialogueLines when dialogueLinesBase changes (but only if IDs actually changed)
  useEffect(() => {
    if (!station) {
      setDialogueLines({ greeting: null, contextual: null });
      previousDialogueIdsRef.current = { greeting: null, contextual: null };
      return;
    }
    
    // Only resolve if dialogue IDs actually changed
    const greetingId = dialogueLinesBase.greeting?.line.id ?? null;
    const contextualId = dialogueLinesBase.contextual?.line.id ?? null;
    
    const idsChanged = 
      greetingId !== previousDialogueIdsRef.current.greeting ||
      contextualId !== previousDialogueIdsRef.current.contextual;
    
    if (!idsChanged) {
      // Dialogue hasn't changed, don't re-resolve
      return;
    }
    
    // Update ref immediately to prevent duplicate resolutions
    previousDialogueIdsRef.current = { greeting: greetingId, contextual: contextualId };
    
    // Set base dialogue immediately (without audio) to prevent UI flicker
    setDialogueLines(dialogueLinesBase);
    
    // Resolve audio paths asynchronously
    resolveDialoguePairAudio(dialogueLinesBase, station.id).then(resolved => {
      // Double-check IDs still match (in case dialogue changed during async operation)
      const currentGreetingId = dialogueLinesBase.greeting?.line.id ?? null;
      const currentContextualId = dialogueLinesBase.contextual?.line.id ?? null;
      
      if (currentGreetingId === greetingId && currentContextualId === contextualId) {
        setDialogueLines(resolved);
      }
    });
  }, [dialogueLinesBase.greeting?.line.id, dialogueLinesBase.contextual?.line.id, station?.id]);

  // Audio playback refs
  const greetingAudioRef = useRef<HTMLAudioElement | null>(null);
  const contextualAudioRef = useRef<HTMLAudioElement | null>(null);

  // Track currently playing audio URL to prevent restarting
  const playingGreetingUrlRef = useRef<string | null>(null);
  
  // Play greeting audio when it changes
  useEffect(() => {
    if (!dialogueLines.greeting?.audioUrl) {
      playingGreetingUrlRef.current = null;
      return;
    }
    
    // Don't restart if already playing the same audio
    if (playingGreetingUrlRef.current === dialogueLines.greeting.audioUrl) {
      return;
    }
    
    // Stop any existing audio
    if (greetingAudioRef.current) {
      greetingAudioRef.current.pause();
      greetingAudioRef.current = null;
    }
    
    // Create and play new audio
    const audio = new Audio(dialogueLines.greeting.audioUrl);
    audio.volume = 0.7; // Slightly quieter so it doesn't overpower UI sounds
    greetingAudioRef.current = audio;
    playingGreetingUrlRef.current = dialogueLines.greeting.audioUrl;
    
    audio.play().catch(error => {
      // Silently fail if audio can't play (e.g., user hasn't interacted yet)
      console.debug('Could not play dialogue audio:', error);
      playingGreetingUrlRef.current = null;
    });
    
    // Don't cleanup on unmount - let audio continue playing even when dock intro is dismissed
    // Audio will only stop when a new greeting audio URL is selected (handled at start of effect)
  }, [dialogueLines.greeting?.audioUrl]);

  // Track currently playing contextual audio URL
  const playingContextualUrlRef = useRef<string | null>(null);
  const contextualTimeoutRef = useRef<number | null>(null);
  
  // Play contextual audio when it changes (with slight delay after greeting)
  useEffect(() => {
    if (!dialogueLines.contextual?.audioUrl) {
      playingContextualUrlRef.current = null;
      // Clear any pending timeout if contextual audio is removed
      if (contextualTimeoutRef.current) {
        clearTimeout(contextualTimeoutRef.current);
        contextualTimeoutRef.current = null;
      }
      return;
    }
    
    // Don't restart if already playing the same audio
    if (playingContextualUrlRef.current === dialogueLines.contextual.audioUrl) {
      return;
    }
    
    // Stop any existing contextual audio
    if (contextualAudioRef.current) {
      contextualAudioRef.current.pause();
      contextualAudioRef.current = null;
    }
    
    // Clear any existing timeout (new dialogue selected)
    if (contextualTimeoutRef.current) {
      clearTimeout(contextualTimeoutRef.current);
      contextualTimeoutRef.current = null;
    }
    
    // Capture the audio URL in the closure so it persists even if dialogueLines changes
    const audioUrlToPlay = dialogueLines.contextual.audioUrl;
    
    // Wait for greeting to finish, then add 6 second gap
    // Audio clips are ~5 seconds, so 6 second gap prevents overlap
    const delay = greetingAudioRef.current && greetingAudioRef.current.duration > 0
      ? greetingAudioRef.current.duration * 1000 + 6000 // Wait for greeting + 6 second gap
      : 6000; // Default 6 second delay if no greeting audio
    
    // Store timeout in ref so it persists even if component unmounts
    contextualTimeoutRef.current = setTimeout(() => {
      // Use the captured URL, not the current dialogueLines (which might have changed)
      const audio = new Audio(audioUrlToPlay);
      audio.volume = 0.7;
      contextualAudioRef.current = audio;
      playingContextualUrlRef.current = audioUrlToPlay;
      contextualTimeoutRef.current = null; // Clear ref after timeout fires
      
      audio.play().catch(error => {
        console.debug('Could not play contextual dialogue audio:', error);
        playingContextualUrlRef.current = null;
      });
    }, delay);
    
    // Don't cleanup on unmount - let the timeout persist so audio plays even after dock intro is dismissed
    // Only cleanup if the audio URL changes (handled at start of effect)
  }, [dialogueLines.contextual?.audioUrl]);

  // Preload manifest on mount
  useEffect(() => {
    preloadManifest();
  }, []);
  
  // Strip ElevenLabs v3 emotion tags from displayed text
  // Tags like [warmly], [pauses], [laughs] are for audio synthesis only
  const stripEmotionTags = (text: string | undefined): string | undefined => {
    if (!text) return text;
    return text.replace(/\[[^\]]+\]\s*/g, '').trim();
  };
  
  // Legacy single line for backwards compatibility (with emotion tags stripped for display)
  const line = stripEmotionTags(dialogueLines.greeting?.line.text);
  const contextualLine = stripEmotionTags(dialogueLines.contextual?.line.text);
  
  // Player relationship tier with this character
  const relationshipTier = useMemo(() => 
    getPlayerRelationshipTier(station?.reputation ?? 0),
    [station?.reputation]
  );
  const relationshipDisplay = RELATIONSHIP_TIER_DISPLAY[relationshipTier];
  
  // Character relationships (who this character knows)
  const characterRelationships = useMemo(() => {
    if (!station) return [];
    return getCharacterRelationships(station.id)
      .filter(r => r.publicKnowledge)
      .slice(0, 3);
  }, [station?.id]);
  
  const avatarUrl = useMemo(() => {
    if (!station || !persona) return undefined;
    const target = `${toSafeFilename(station.id)} - ${toSafeFilename(persona.name)}.png`;
    let found: string | undefined;
    for (const [key, url] of Object.entries(avatarModules)) {
      if (key.endsWith(target)) { found = url; break; }
    }
    return found;
  }, [stationId]);

  const stationRep = station?.reputation || 0;
  const repTier = useMemo(() => getReputationTier(stationRep), [stationRep]);
  const tierDisplay = useMemo(() => getTierDisplay(repTier), [repTier]);
  const tierPerks = useMemo(() => getTierPerks(stationRep), [stationRep]);

  // Market opportunities: most in-demand and most surplus commodities
  const marketOpportunities = useMemo(() => {
    if (!station) return { inDemand: [], surplus: [] };
    
    const commodities = generateCommodities();
    const inventory = station.inventory;
    
    // Calculate opportunity scores for each commodity
    type Opportunity = {
      id: string;
      name: string;
      category: string;
      buyPrice: number;
      sellPrice: number;
      baseBuy: number;
      baseSell: number;
      stock: number;
      targetStock: number;
      sellPriceRatio: number;
      buyPriceRatio: number;
      stockEffect: ReturnType<typeof getStockPriceEffect>;
      bias: ReturnType<typeof getPriceBiasForStation>;
      canBuy: boolean;
      canSell: boolean;
      demandScore: number;
      surplusScore: number;
    };

    const opportunities: Opportunity[] = commodities
      .map((commodity): Opportunity | null => {
        const item = inventory[commodity.id];
        if (!item) return null;
        
        // Price ratio compared to base prices (higher = station pays more)
        const sellPriceRatio = item.sell / commodity.baseSell;
        const buyPriceRatio = item.buy / commodity.baseBuy;
        
        // Get stock effect for visual indicator
        const targetStock = getTargetStock(station.type, commodity.id);
        const stockEffect = getStockPriceEffect(item.stock || 50, targetStock);
        
        // Price bias at this station
        const bias = getPriceBiasForStation(station.type, commodity.id);
        
        return {
          id: commodity.id,
          name: commodity.name,
          category: commodity.category,
          buyPrice: item.buy,
          sellPrice: item.sell,
          baseBuy: commodity.baseBuy,
          baseSell: commodity.baseSell,
          stock: item.stock || 50,
          targetStock,
          sellPriceRatio,
          buyPriceRatio,
          stockEffect,
          bias,
          canBuy: item.canBuy !== false,
          canSell: item.canSell !== false,
          // Demand score: higher when station pays well for a commodity (good for player to sell)
          demandScore: item.canBuy !== false ? sellPriceRatio * (bias === 'expensive' ? 1.3 : bias === 'cheap' ? 0.7 : 1.0) : 0,
          // Surplus score: higher when station sells cheap (good for player to buy)
          surplusScore: item.canSell !== false ? (1 / buyPriceRatio) * (bias === 'cheap' ? 1.3 : bias === 'expensive' ? 0.7 : 1.0) : 0,
        };
      })
      .filter((o): o is Opportunity => o !== null);
    
    // Sort by demand (station wants to buy = player can sell)
    const inDemand = opportunities
      .filter(o => o.canBuy && o.demandScore > 0)
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 4);
    
    // Sort by surplus (station wants to sell = player can buy cheap)
    const surplus = opportunities
      .filter(o => o.canSell && o.surplusScore > 0)
      .sort((a, b) => b.surplusScore - a.surplusScore)
      .slice(0, 4);
    
    return { inDemand, surplus };
  }, [station]);

  // Contracts at this station
  const stationContracts = useMemo(() => 
    contracts.filter(c => c.toId === station?.id && c.status === 'offered').slice(0, 3),
    [contracts, station?.id]
  );

  // Fabrication capabilities
  const recipes = useMemo(() => {
    if (!station) return [];
    return processRecipes[station.type] || [];
  }, [station]);

  const colors = station ? stationTypeColors[station.type] : stationTypeColors.city;
  const icon = station ? stationTypeIcons[station.type] : '🏪';

  // Scanline animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlineOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stationId) return;
    const onKey = (e: KeyboardEvent) => {
      const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
      if (isSpace) {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [stationId, dismiss]);

  if (!stationId || !station) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 8px ${colors.glow}) drop-shadow(0 0 16px ${colors.glow}); }
          50% { filter: drop-shadow(0 0 12px ${colors.glow}) drop-shadow(0 0 24px ${colors.glow}); }
        }
        @keyframes scanline {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .hex-clip {
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
        }
        .data-panel {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${colors.primary};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .data-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
          animation: scanline 3s linear infinite;
        }
        .data-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          );
          pointer-events: none;
          opacity: 0.3;
        }
        .corner-accent {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid ${colors.primary};
        }
        .corner-accent.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
        .corner-accent.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; }
        .corner-accent.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; }
        .corner-accent.br { bottom: -2px; right: -2px; border-left: none; border-top: none; }
      `}</style>

      <div style={{
        width: '92vw',
        maxWidth: '1600px',
        height: '88vh',
        maxHeight: '900px',
        display: 'grid',
        gridTemplateColumns: '400px 1fr 360px',
        gridTemplateRows: '120px 1fr 80px',
        gap: 16,
        color: '#e5e7eb',
        animation: 'slideIn 0.5s ease-out',
      }}>
        
        {/* HEADER - Full Width */}
        <div className="data-panel" style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          position: 'relative',
        }}>
          <div className="corner-accent tl" />
          <div className="corner-accent tr" />
          <div className="corner-accent bl" />
          <div className="corner-accent br" />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              fontSize: 64,
              lineHeight: 1,
              filter: glitchActive ? 'blur(2px)' : 'none',
              animation: 'glow 2s ease-in-out infinite',
              transform: glitchActive ? 'translate(2px, 0)' : 'none',
            }}>
              {icon}
            </div>
            <div>
              <div style={{
                fontSize: 14,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: colors.secondary,
                fontFamily: 'monospace',
                marginBottom: 4,
              }}>
                {station.type.replace(/_/g, ' ')} • SECTOR 7
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
                lineHeight: 1,
              }}>
                {station.name.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
              border: `2px solid ${colors.primary}`,
              borderRadius: 8,
              padding: '12px 20px',
              textAlign: 'center',
              boxShadow: `0 0 20px ${colors.glow}`,
            }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>PILOT CREDITS</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
                ${ship.credits.toLocaleString()}
              </div>
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
              border: `2px solid ${colors.primary}`,
              borderRadius: 8,
              padding: '12px 20px',
              textAlign: 'center',
              boxShadow: `0 0 20px ${colors.glow}`,
            }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>CARGO HOLD</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
                {Object.values(ship.cargo).reduce((a, b) => a + b, 0)}/{ship.maxCargo}
              </div>
            </div>
          </div>
        </div>

        {/* LEFT PANEL - Persona & Reputation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar & Persona */}
          <div className="data-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}>
            <div style={{
              fontSize: 12,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              color: colors.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              borderBottom: `1px solid ${colors.primary}40`,
              paddingBottom: 8,
            }}>
              ◢ Station Commander
            </div>
            
            {persona && avatarUrl && (
              <>
                <div style={{
                  position: 'relative',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 280,
                    height: 280,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: -8,
                      background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
                      borderRadius: '12px',
                      animation: 'glow 3s ease-in-out infinite',
                      opacity: 0.6,
                    }} />
                    <img
                      src={avatarUrl}
                      alt={persona.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        position: 'relative',
                        zIndex: 1,
                        border: `2px solid ${colors.primary}`,
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{persona.name}</div>
                  <div style={{ fontSize: 13, color: colors.secondary, fontStyle: 'italic', marginBottom: 8 }}>{persona.title}</div>
                  
                  {/* Relationship Status Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    background: `${relationshipDisplay.color}20`,
                    border: `1px solid ${relationshipDisplay.color}60`,
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 600,
                    color: relationshipDisplay.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: relationshipDisplay.color,
                      boxShadow: `0 0 6px ${relationshipDisplay.color}`,
                    }} />
                    {relationshipDisplay.name}
                  </div>
                </div>

                {/* Dialogue Lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                  {/* Greeting Line */}
                  {line && (
                    <div style={{
                      background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05)`,
                      border: `1px solid ${colors.primary}40`,
                      borderLeft: `4px solid ${colors.primary}`,
                      borderRadius: 6,
                      padding: 14,
                      fontSize: 14,
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                    }}>
                      "{line}"
                    </div>
                  )}
                  
                  {/* Contextual Line (gossip, reaction, etc.) */}
                  {contextualLine && (
                    <div style={{
                      background: `linear-gradient(135deg, ${colors.secondary}10, ${colors.secondary}05)`,
                      border: `1px solid ${colors.secondary}30`,
                      borderLeft: `4px solid ${colors.secondary}80`,
                      borderRadius: 6,
                      padding: 14,
                      fontSize: 13,
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      opacity: 0.9,
                    }}>
                      <span style={{ 
                        fontSize: 10, 
                        textTransform: 'uppercase', 
                        opacity: 0.7, 
                        display: 'block',
                        marginBottom: 4,
                        fontStyle: 'normal',
                        letterSpacing: '0.05em',
                      }}>
                        {dialogueLines.contextual?.line.category === 'gossip' ? '◦ Word around the station' : 
                         dialogueLines.contextual?.line.category === 'reaction' ? '◦ About recent events' :
                         dialogueLines.contextual?.line.category === 'memory' ? '◦ Remembers you' :
                         dialogueLines.contextual?.line.category === 'concern' ? '◦ Current concerns' :
                         '◦ Local intel'}
                      </span>
                      "{contextualLine}"
                    </div>
                  )}
                </div>
                
                {/* Character Relationships */}
                {characterRelationships.length > 0 && (
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      opacity: 0.6,
                      marginBottom: 8,
                    }}>
                      Known Connections
                    </div>
                    {characterRelationships.map(rel => (
                      <div key={rel.targetId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        marginBottom: 4,
                        opacity: 0.85,
                      }}>
                        <span style={{
                          color: rel.attitude === 'allied' || rel.attitude === 'friendly' ? '#34d399' :
                                 rel.attitude === 'rival' || rel.attitude === 'hostile' ? '#f87171' :
                                 rel.attitude === 'complicated' ? '#fbbf24' : '#9ca3af',
                        }}>
                          {rel.attitude === 'allied' ? '●' :
                           rel.attitude === 'friendly' ? '○' :
                           rel.attitude === 'rival' ? '◆' :
                           rel.attitude === 'hostile' ? '◇' :
                           rel.attitude === 'complicated' ? '◐' : '○'}
                        </span>
                        <span>{CHARACTER_NAMES[rel.targetId] || rel.targetId}</span>
                        <span style={{ fontSize: 10, opacity: 0.5 }}>— {rel.attitude}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CENTER PANEL - Market Data & Station Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Reputation Status */}
          {repTier !== 'stranger' && (
            <div className="data-panel" style={{ padding: 20 }}>
              <div style={{
                fontSize: 12,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                color: colors.secondary,
                marginBottom: 12,
                textTransform: 'uppercase',
                borderBottom: `1px solid ${colors.primary}40`,
                paddingBottom: 8,
              }}>
                ◢ Reputation Status
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={`${colors.primary}30`}
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={tierDisplay.color}
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - stationRep / 100)}`}
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 8px ${tierDisplay.color})`,
                        transition: 'stroke-dashoffset 1s ease-out',
                      }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: tierDisplay.color }}>
                      {formatNumber(stationRep)}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'monospace' }}>REP</div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: tierDisplay.color,
                    marginBottom: 8,
                    textShadow: `0 0 10px ${tierDisplay.color}60`,
                  }}>
                    {tierDisplay.name}
                  </div>
                  {tierPerks.length > 0 && (
                    <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.9 }}>
                      {tierPerks.map((perk, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          <span style={{ color: colors.secondary, marginRight: 6 }}>▸</span>
                          {perk}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Market Opportunities - In Demand & Surplus */}
          <div className="data-panel" style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
            <div style={{
              fontSize: 12,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              color: colors.secondary,
              marginBottom: 16,
              textTransform: 'uppercase',
              borderBottom: `1px solid ${colors.primary}40`,
              paddingBottom: 8,
            }}>
              ◢ Market Opportunities
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* In Demand - Station wants to buy (player can sell here) */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: 'linear-gradient(90deg, #10b98130, transparent)',
                  borderLeft: '3px solid #10b981',
                  borderRadius: '0 4px 4px 0',
                }}>
                  <span style={{ fontSize: 18 }}>📈</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>HIGH DEMAND</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Sell here for premium prices</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {marketOpportunities.inDemand.length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', padding: 8 }}>
                      No high-demand commodities
                    </div>
                  ) : (
                    marketOpportunities.inDemand.map((item, idx) => {
                      const priceChange = Math.round((item.sellPriceRatio - 1) * 100);
                      return (
                        <div key={item.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: `linear-gradient(135deg, #10b98115, #10b98105)`,
                          border: '1px solid #10b98140',
                          borderRadius: 6,
                          animation: `slideIn ${0.3 + idx * 0.08}s ease-out`,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase' }}>
                              {item.category}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 700, 
                              color: '#10b981',
                              fontFamily: 'monospace',
                            }}>
                              ${item.sellPrice}
                            </div>
                            {priceChange !== 0 && (
                              <div style={{
                                fontSize: 10,
                                color: priceChange > 0 ? '#10b981' : '#f59e0b',
                                fontFamily: 'monospace',
                              }}>
                                {priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`} vs avg
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Surplus - Station selling cheap (player can buy here) */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: 'linear-gradient(90deg, #3b82f630, transparent)',
                  borderLeft: '3px solid #3b82f6',
                  borderRadius: '0 4px 4px 0',
                }}>
                  <span style={{ fontSize: 18 }}>📦</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>SURPLUS STOCK</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>Buy here at discount prices</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {marketOpportunities.surplus.length === 0 ? (
                    <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', padding: 8 }}>
                      No surplus commodities
                    </div>
                  ) : (
                    marketOpportunities.surplus.map((item, idx) => {
                      const priceChange = Math.round((1 - item.buyPriceRatio) * 100);
                      return (
                        <div key={item.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: `linear-gradient(135deg, #3b82f615, #3b82f605)`,
                          border: '1px solid #3b82f640',
                          borderRadius: 6,
                          animation: `slideIn ${0.3 + idx * 0.08}s ease-out`,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase' }}>
                              {item.category}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 700, 
                              color: '#3b82f6',
                              fontFamily: 'monospace',
                            }}>
                              ${item.buyPrice}
                            </div>
                            {priceChange !== 0 && (
                              <div style={{
                                fontSize: 10,
                                color: priceChange > 0 ? '#10b981' : '#f59e0b',
                                fontFamily: 'monospace',
                              }}>
                                {priceChange > 0 ? `${priceChange}% off` : `+${Math.abs(priceChange)}%`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div style={{
              marginTop: 16,
              padding: 10,
              background: `${colors.primary}10`,
              border: `1px solid ${colors.primary}30`,
              borderRadius: 4,
              fontSize: 11,
              textAlign: 'center',
              color: colors.secondary,
              fontFamily: 'monospace',
            }}>
              💡 FULL MARKET DATA AVAILABLE IN STATION TERMINAL
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Missions & Capabilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Station Capabilities */}
          <div className="data-panel" style={{ padding: 20 }}>
            <div style={{
              fontSize: 12,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              color: colors.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              borderBottom: `1px solid ${colors.primary}40`,
              paddingBottom: 8,
            }}>
              ◢ Station Capabilities
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: `${colors.primary}15`,
                border: `1px solid ${colors.primary}40`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 24 }}>🏪</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Market Trading</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                    {Object.keys(station.inventory).length} commodities
                  </div>
                </div>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
              </div>

              {recipes.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  background: `${colors.primary}15`,
                  border: `1px solid ${colors.primary}40`,
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 24 }}>⚙️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Fabrication</div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      {recipes.length} recipe{recipes.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    boxShadow: '0 0 8px #8b5cf6',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                </div>
              )}

              {stationContracts.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  background: `${colors.primary}15`,
                  border: `1px solid ${colors.primary}40`,
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 24 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Missions</div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      {stationContracts.length} available
                    </div>
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 8px #f59e0b',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                </div>
              )}

              {station.type === 'shipyard' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  background: `${colors.primary}15`,
                  border: `1px solid ${colors.primary}40`,
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 24 }}>🚀</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Shipyard</div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      Ships & upgrades
                    </div>
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ec4899',
                    boxShadow: '0 0 8px #ec4899',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Mission Board Preview */}
          {stationContracts.length > 0 && (
            <div className="data-panel" style={{ flex: 1, padding: 20 }}>
              <div style={{
                fontSize: 12,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                color: colors.secondary,
                marginBottom: 12,
                textTransform: 'uppercase',
                borderBottom: `1px solid ${colors.primary}40`,
                paddingBottom: 8,
              }}>
                ◢ Priority Missions
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stationContracts.map((contract, idx) => (
                  <div key={contract.id} style={{
                    padding: 12,
                    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}05)`,
                    border: `1px solid ${colors.primary}`,
                    borderLeft: `4px solid ${colors.primary}`,
                    borderRadius: 6,
                    animation: `slideIn ${0.4 + idx * 0.1}s ease-out`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: 'capitalize' }}>
                      {contract.commodityId.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                      Units: {contract.units}
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#10b981',
                      fontFamily: 'monospace',
                    }}>
                      REWARD: ${(contract.rewardBonus || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - Action Bar */}
        <div className="data-panel" style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: 'monospace', opacity: 0.7 }}>
            <div>DOCKING_BAY_07</div>
            <div>•</div>
            <div>SECURE_LINK_ESTABLISHED</div>
            <div>•</div>
            <div style={{ animation: 'pulse 2s ease-in-out infinite', color: colors.secondary }}>◉ SYSTEMS_NOMINAL</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6 }}>
              [SPACE] TO CONTINUE
            </div>
            <button
              onClick={dismiss}
              style={{
                padding: '16px 48px',
                fontSize: 18,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                border: `2px solid ${colors.primary}`,
                borderRadius: 8,
                color: '#000',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: `0 0 30px ${colors.glow}, 0 8px 16px rgba(0,0,0,0.3)`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 40px ${colors.glow}, 0 12px 24px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 30px ${colors.glow}, 0 8px 16px rgba(0,0,0,0.3)`;
              }}
            >
              ▶ Enter Station
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


