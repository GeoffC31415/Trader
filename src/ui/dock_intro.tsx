import { useMemo, useEffect, useState } from 'react';
import { useGameStore } from '../state';
import { ReputationBadge } from './components/reputation_badge';
import { getReputationTier, getTierDisplay, getTierPerks } from '../state/helpers/reputation_helpers';
import { processRecipes } from '../systems/economy/recipes';
import type { StationType } from '../domain/types/economy_types';

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
  const station = useMemo(() => stations.find(s => s.id === stationId), [stations, stationId]);
  const persona = station?.persona;
  const [scanlineOffset, setScanlineOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  
  const line = useMemo(() => {
    if (!persona) return undefined;
    const rep = station?.reputation || 0;
    const tier = rep >= 70 ? 'high' : rep >= 30 ? 'mid' : 'low';
    const lines = tier === 'high' ? (persona.lines_high || []) : tier === 'mid' ? (persona.lines_mid || []) : (persona.lines_low || []);
    const tips = tier === 'high' ? (persona.tips_high || []) : tier === 'mid' ? (persona.tips_mid || []) : (persona.tips_low || []);
    const fallback = [...(persona.lines || []), ...(persona.tips || [])];
    const pool = [...lines, ...tips, ...fallback];
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [stationId, station?.reputation]);
  
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

  // Market preview data
  const marketData = useMemo(() => {
    if (!station) return [];
    const items = Object.entries(station.inventory)
      .filter(([_, p]) => p.canSell !== false || p.canBuy !== false)
      .slice(0, 6)
      .map(([id, p]) => ({
        id,
        name: id.replace(/_/g, ' '),
        buyPrice: p.buy,
        sellPrice: p.sell,
      }));
    return items;
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
                  <div style={{ fontSize: 13, color: colors.secondary, fontStyle: 'italic' }}>{persona.title}</div>
                </div>

                {line && (
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05)`,
                    border: `1px solid ${colors.primary}40`,
                    borderLeft: `4px solid ${colors.primary}`,
                    borderRadius: 6,
                    padding: 16,
                    fontSize: 14,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    marginTop: 'auto',
                  }}>
                    "{line}"
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
                      {stationRep.toFixed(0)}
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

          {/* Market Preview */}
          <div className="data-panel" style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
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
              ◢ Market Data Feed
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '8px 16px',
              fontSize: 13,
              fontFamily: 'monospace',
            }}>
              <div style={{ fontWeight: 700, color: colors.secondary, fontSize: 11 }}>COMMODITY</div>
              <div style={{ fontWeight: 700, color: colors.secondary, fontSize: 11 }}>BUY</div>
              <div style={{ fontWeight: 700, color: colors.secondary, fontSize: 11 }}>SELL</div>
              
              {marketData.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'contents',
                  animation: `slideIn ${0.3 + idx * 0.1}s ease-out`,
                }}>
                  <div style={{ textTransform: 'capitalize', opacity: 0.9 }}>{item.name}</div>
                  <div style={{ color: '#10b981', textAlign: 'right' }}>${item.buyPrice}</div>
                  <div style={{ color: '#ef4444', textAlign: 'right' }}>${item.sellPrice}</div>
                </div>
              ))}
            </div>
            
            {marketData.length > 0 && (
              <div style={{
                marginTop: 12,
                padding: 8,
                background: `${colors.primary}10`,
                border: `1px solid ${colors.primary}30`,
                borderRadius: 4,
                fontSize: 11,
                textAlign: 'center',
                color: colors.secondary,
                fontFamily: 'monospace',
              }}>
                ⚠ FULL INVENTORY AVAILABLE IN STATION TERMINAL
              </div>
            )}
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


