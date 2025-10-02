import { useMemo, Fragment } from 'react';
import { usePoll } from '../shared/hooks/use_poll';
import { useGameStore } from '../state';

type Vec3 = [number, number, number];

function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

const primaryColor = '#06b6d4';
const secondaryColor = '#22d3ee';
const glowColor = '#06b6d480';

export function TradersPanel() {
  const npcTraders = useGameStore(s => s.npcTraders);
  const stations = useGameStore(s => s.stations);
  const hasIntel = useGameStore(s => !!s.ship.hasMarketIntel);
  
  const poll = usePoll(2000);
  const stationById = useMemo(() => Object.fromEntries(stations.map(s => [s.id, s])), [stations]);

  const rows = useMemo(() => {
    const deliverUnits = 3; // matches NPC delivery amount in tick()
    return npcTraders.map(npc => {
      const from = stationById[npc.fromId];
      const to = stationById[npc.toId];
      const fromInv = from?.inventory[npc.commodityId];
      const toInv = to?.inventory[npc.commodityId];
      const unitBuy = fromInv?.buy ?? 0;
      const unitSell = toInv?.sell ?? 0;
      const unitMargin = unitSell - unitBuy;
      const dist = (from && to) ? distance(from.position as any, to.position as any) : 0;
      const travelTime = npc.speed > 0 ? dist / npc.speed : 0;
      const tripProfit = unitMargin * deliverUnits;
      const profitPerSec = travelTime > 0 ? tripProfit / travelTime : 0;
      return {
        id: npc.id,
        fromName: from?.name || npc.fromId,
        toName: to?.name || npc.toId,
        route: from && to ? `${from.name} → ${to.name}` : `${npc.fromId} → ${npc.toId}`,
        commodityId: npc.commodityId,
        unitMargin,
        tripProfit,
        profitPerSec,
        dist,
      };
    }).sort((a, b) => b.profitPerSec - a.profitPerSec);
  }, [npcTraders, stationById, poll]);

  if (!hasIntel) {
    return (
      <>
        <style>{`
          .traders-panel-locked {
            background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
            border: 2px solid ${primaryColor};
            border-radius: 12px;
            padding: 32px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
            text-align: center;
          }
        `}</style>
        <div className="panel">
          <div className="traders-panel-locked">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: secondaryColor }}>
              TRADER INTELLIGENCE SYSTEM LOCKED
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
              This advanced tracking system requires specialized hardware to monitor NPC trader activities in real-time.
            </div>
            <div style={{
              padding: 16,
              background: `rgba(239,68,68,0.1)`,
              border: `2px solid rgba(239,68,68,0.3)`,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                REQUIRED UPGRADE:
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                Mercantile Data Nexus
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'monospace' }}>
              Visit any Shipyard station to install this upgrade
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .traders-panel {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .traders-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);
          animation: scanline-traders 3s linear infinite;
        }
        .traders-panel::after {
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
        @keyframes scanline-traders {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .section-header-traders {
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.1em;
          color: ${secondaryColor};
          margin-bottom: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid ${primaryColor}40;
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header-traders::before {
          content: '◢';
          color: ${primaryColor};
        }
        .trader-card {
          padding: 16px;
          background: ${primaryColor}10;
          border: 2px solid ${primaryColor}40;
          border-left: 4px solid ${primaryColor};
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }
        .trader-card:hover {
          background: ${primaryColor}15;
          border-left-color: ${secondaryColor};
          transform: translateX(4px);
        }
        .scrollable-content-traders {
          max-height: calc(100vh - 480px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content-traders::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content-traders::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content-traders::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content-traders::-webkit-scrollbar-thumb:hover {
          background: ${secondaryColor};
          box-shadow: 0 0 10px ${glowColor};
        }
      `}</style>

      <div className="panel">
        <div className="traders-panel">
          <div className="section-header-traders">
            Active Trader Network ({npcTraders.length} Vessels)
          </div>
          
          <div style={{
            padding: 12,
            background: `${primaryColor}10`,
            border: `1px solid ${primaryColor}30`,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
            opacity: 0.9,
            fontFamily: 'monospace',
          }}>
            ℹ Real-time tracking of NPC trader vessels and their profit margins. Data refreshes every 2 seconds.
          </div>

          <div className="scrollable-content-traders">
            {rows.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 32,
                opacity: 0.7,
                fontFamily: 'monospace',
                fontSize: 13,
              }}>
                ⚠ NO ACTIVE TRADERS DETECTED
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {rows.map((r, idx) => (
                <div key={r.id} className="trader-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: secondaryColor,
                        fontWeight: 700,
                        marginBottom: 6,
                      }}>
                        TRADER #{idx + 1}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                        {r.fromName} → {r.toName}
                      </div>
                      <div style={{ fontSize: 13, textTransform: 'capitalize', opacity: 0.9, marginBottom: 4 }}>
                        <span style={{ opacity: 0.6 }}>Commodity:</span> {r.commodityId.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>
                        Distance: {r.dist.toFixed(1)} units
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: r.profitPerSec >= 1 ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                      border: `2px solid ${r.profitPerSec >= 1 ? '#10b981' : '#6b7280'}`,
                      borderRadius: 6,
                      textAlign: 'center',
                      minWidth: 120,
                    }}>
                      <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        PROFIT/SEC
                      </div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: r.profitPerSec >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${r.profitPerSec.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        UNIT MARGIN
                      </div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: r.unitMargin >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${r.unitMargin.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        TRIP PROFIT
                      </div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: r.tripProfit >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${r.tripProfit.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <div style={{ marginTop: 16 }}>
            <div className="section-header-traders">Market Intelligence Summary</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}>
              <div style={{
                padding: 16,
                background: `${primaryColor}10`,
                border: `2px solid ${primaryColor}`,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                  ACTIVE TRADERS
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: secondaryColor, fontFamily: 'monospace' }}>
                  {rows.length}
                </div>
              </div>
              <div style={{
                padding: 16,
                background: `${primaryColor}10`,
                border: `2px solid ${primaryColor}`,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                  AVG MARGIN
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#10b981',
                  fontFamily: 'monospace',
                }}>
                  ${(rows.reduce((sum, r) => sum + r.unitMargin, 0) / Math.max(1, rows.length)).toFixed(0)}
                </div>
              </div>
              <div style={{
                padding: 16,
                background: `${primaryColor}10`,
                border: `2px solid ${primaryColor}`,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                  TOP PROFIT/SEC
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#10b981',
                  fontFamily: 'monospace',
                }}>
                  ${rows.length > 0 ? rows[0].profitPerSec.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
