import { useEffect, useMemo, useState, Fragment } from 'react';
import { usePoll } from '../shared/hooks/use_poll';
import { useGameStore } from '../state';
import { commodityById } from '../state/world';

const primaryColor = '#3b82f6';
const secondaryColor = '#60a5fa';
const glowColor = '#3b82f680';

export function JournalPanel() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const tradeLog = useGameStore(s => s.tradeLog);
  const profitByCommodity = useGameStore(s => s.profitByCommodity);
  const getSuggestedRoutes = useGameStore(s => s.getSuggestedRoutes);
  const routesPoll = usePoll(2000);
  const hasIntel = useGameStore(s => !!s.ship.hasMarketIntel);

  const [tab, setTab] = useState<'ship' | 'trades' | 'routes'>('ship');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const cargoCount = useMemo(() => Object.values(ship.cargo).reduce((a,b)=>a+b,0), [ship.cargo]);
  const cargoEntries = useMemo(() => Object.entries(ship.cargo)
    .filter(([,q]) => (q||0) > 0)
    .sort((a,b) => a[0].localeCompare(b[0]))
  , [ship.cargo]);

  const reversed = useMemo(() => tradeLog.slice().reverse(), [tradeLog]);
  const pageCount = Math.max(1, Math.ceil(reversed.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const start = (page - 1) * pageSize;
  const pageRows = reversed.slice(start, start + pageSize);

  return (
    <>
      <style>{`
        .journal-panel {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .journal-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);
          animation: scanline-journal 3s linear infinite;
        }
        .journal-panel::after {
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
        @keyframes scanline-journal {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .journal-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, ${primaryColor}30, ${primaryColor}20);
          border: 1px solid ${primaryColor};
          border-radius: 6px;
          color: #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          font-family: monospace;
        }
        .journal-button:hover:not(:disabled) {
          background: linear-gradient(135deg, ${primaryColor}50, ${primaryColor}30);
          box-shadow: 0 0 20px ${glowColor};
          transform: translateY(-1px);
        }
        .journal-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: linear-gradient(135deg, rgba(100,100,100,0.2), rgba(100,100,100,0.1));
          border-color: rgba(100,100,100,0.3);
        }
        .journal-button.active {
          background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
          color: #000;
          font-weight: 700;
          box-shadow: 0 0 20px ${glowColor};
        }
        .section-header-journal {
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
        .section-header-journal::before {
          content: '◢';
          color: ${primaryColor};
        }
        .data-grid-journal {
          display: grid;
          gap: 8px;
          font-family: monospace;
          font-size: 13px;
        }
        .stat-row-journal {
          display: grid;
          grid-template-columns: 1fr auto;
          padding: 10px 14px;
          background: ${primaryColor}10;
          border: 1px solid ${primaryColor}30;
          border-left: 3px solid ${primaryColor};
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .stat-row-journal:hover {
          background: ${primaryColor}15;
          border-left-color: ${secondaryColor};
        }
        .scrollable-content-journal {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content-journal::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content-journal::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content-journal::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content-journal::-webkit-scrollbar-thumb:hover {
          background: ${secondaryColor};
          box-shadow: 0 0 10px ${glowColor};
        }
      `}</style>

      <div className="panel">
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setTab('ship')} className={`journal-button ${tab === 'ship' ? 'active' : ''}`}>
            🚀 Ship Status
          </button>
          <button onClick={() => setTab('trades')} className={`journal-button ${tab === 'trades' ? 'active' : ''}`}>
            📊 Trading Log
          </button>
          <button
            onClick={() => setTab('routes')}
            disabled={!hasIntel}
            title={!hasIntel ? 'Requires Mercantile Data Nexus upgrade' : undefined}
            className={`journal-button ${tab === 'routes' ? 'active' : ''}`}
          >
            🗺️ Routes
          </button>
        </div>

        {/* SHIP TAB */}
        {tab === 'ship' && (
          <div className="scrollable-content-journal">
            <div className="journal-panel">
              <div className="section-header-journal">Pilot Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{
                  padding: '16px 20px',
                  background: `${primaryColor}15`,
                  border: `2px solid ${primaryColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>ACCOUNT BALANCE</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>
                    ${ship.credits.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  padding: '16px 20px',
                  background: `${primaryColor}15`,
                  border: `2px solid ${primaryColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>CARGO UTILIZATION</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: secondaryColor }}>
                    {cargoCount} / {ship.maxCargo}
                  </div>
                </div>
              </div>
            </div>

            <div className="journal-panel">
              <div className="section-header-journal">Ship Systems</div>
              <div className="stat-row-journal">
                <div style={{ fontWeight: 600 }}>ACCELERATION</div>
                <div style={{ color: secondaryColor, fontWeight: 700 }}>{ship.stats.acc.toFixed(1)}</div>
              </div>
              <div className="stat-row-journal">
                <div style={{ fontWeight: 600 }}>MAX VELOCITY</div>
                <div style={{ color: secondaryColor, fontWeight: 700 }}>{ship.stats.vmax.toFixed(1)}</div>
              </div>
              <div className="stat-row-journal">
                <div style={{ fontWeight: 600 }}>DRAG COEFFICIENT</div>
                <div style={{ color: secondaryColor, fontWeight: 700 }}>{ship.stats.drag.toFixed(2)}</div>
              </div>
              <div className="stat-row-journal">
                <div style={{ fontWeight: 600 }}>CARGO CAPACITY</div>
                <div style={{ color: secondaryColor, fontWeight: 700 }}>{ship.maxCargo} units</div>
              </div>
            </div>

            <div className="journal-panel">
              <div className="section-header-journal">Cargo Manifest</div>
              {cargoEntries.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 24,
                  opacity: 0.7,
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}>
                  ⚠ CARGO HOLD EMPTY
                </div>
              ) : (
                <div className="data-grid-journal">
                  {cargoEntries.map(([id, q]) => {
                    const commodity = commodityById[id];
                    return (
                      <div key={id} className="stat-row-journal">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {commodity?.icon && (
                            <img 
                              src={commodity.icon} 
                              alt={commodity.name}
                              style={{ 
                                width: 28, 
                                height: 28, 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                              }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {id.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div style={{ color: secondaryColor, fontWeight: 700 }}>{q} units</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRADES TAB */}
        {tab === 'trades' && (
          <div className="scrollable-content-journal">
            <div className="journal-panel">
              <div className="section-header-journal">Transaction History</div>
              {pageRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
                  NO TRANSACTIONS RECORDED
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pageRows.map(t => (
                    <div key={t.id} style={{
                      padding: 12,
                      background: `${primaryColor}10`,
                      border: `1px solid ${primaryColor}30`,
                      borderLeft: `3px solid ${t.type === 'buy' ? '#3b82f6' : '#f59e0b'}`,
                      borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                          {new Date(t.time).toLocaleTimeString()}
                        </div>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: t.type === 'buy' ? '#3b82f6' : '#f59e0b',
                          fontFamily: 'monospace',
                        }}>
                          {t.type.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 2 }}>
                            {t.commodityId.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.8, fontFamily: 'monospace' }}>
                            {t.stationName}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: secondaryColor }}>
                            {t.quantity} @ ${t.unitPrice}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>
                            = ${t.totalPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginTop: 12,
                padding: 12,
                background: `${primaryColor}10`,
                borderRadius: 6,
              }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="journal-button">
                  ← PREV
                </button>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: secondaryColor }}>
                  PAGE {page} / {pageCount}
                </div>
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="journal-button">
                  NEXT →
                </button>
              </div>
            </div>

            <div className="journal-panel">
              <div className="section-header-journal">Commodity Profit Analysis</div>
              <div className="data-grid-journal">
                {Object.entries(profitByCommodity).sort((a,b)=> (b[1]||0)-(a[1]||0)).map(([id, p]) => (
                  <div key={id} className="stat-row-journal">
                    <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {id.replace(/_/g, ' ')}
                    </div>
                    <div style={{
                      color: (p || 0) >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}>
                      {(p || 0) >= 0 ? '+' : ''}${(p || 0).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROUTES TAB */}
        {tab === 'routes' && (
          <div className="scrollable-content-journal">
            {hasIntel ? (
              <div className="journal-panel">
                <div className="section-header-journal">Optimal Trade Routes</div>
                <div style={{
                  padding: 12,
                  background: `${primaryColor}10`,
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 12,
                  opacity: 0.9,
                }}>
                  ℹ Routes calculated based on current market conditions and cargo capacity
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {routesPoll && getSuggestedRoutes({ limit: 10, prioritizePerDistance: true }).map((r, idx) => (
                    <div key={r.id} style={{
                      padding: 16,
                      background: `${primaryColor}10`,
                      border: `2px solid ${primaryColor}40`,
                      borderLeft: `4px solid ${primaryColor}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'between', marginBottom: 12 }}>
                        <div style={{
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: secondaryColor,
                          fontWeight: 700,
                        }}>
                          ROUTE #{idx + 1}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, lineHeight: 1.6 }}>
                        {r.kind === 'direct'
                          ? `Buy ${r.maxUnits} ${r.inputId.replace(/_/g, ' ')} at ${r.fromName} → Sell at ${r.toName}`
                          : (() => {
                              const inputUnits = Math.ceil(r.maxUnits * r.inputPerOutput);
                              return `Buy ${inputUnits} ${r.inputId.replace(/_/g, ' ')} at ${r.fromName} → Process at ${r.viaName} → Sell ${r.maxUnits} ${r.outputId.replace(/_/g, ' ')} at ${r.toName}`;
                            })()
                        }
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>UNITS</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: secondaryColor, fontFamily: 'monospace' }}>
                            {r.maxUnits}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>MARGIN/UNIT</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace' }}>
                            ${r.unitMargin.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>EST. PROFIT</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                            ${r.estProfit.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        marginTop: 12,
                        padding: 10,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        fontSize: 11,
                        opacity: 0.9,
                        fontFamily: 'monospace',
                      }}>
                        {r.kind === 'direct' ? (
                          <>
                            <span style={{ textTransform: 'capitalize' }}>{r.inputId.replace(/_/g, ' ')}</span>
                            {` per unit: buy @ $${r.unitBuy.toFixed(0)} → sell @ $${r.unitSell.toFixed(0)}`}
                          </>
                        ) : (
                          (() => {
                            const inputUnits = Math.ceil(r.maxUnits * r.inputPerOutput);
                            const inputName = r.inputId.replace(/_/g, ' ');
                            const outputName = r.outputId.replace(/_/g, ' ');
                            return (
                              <>
                                <span style={{ textTransform: 'capitalize' }}>{inputName}</span>
                                {` → ${outputName}: buy ${inputUnits} @ $${r.unitBuy.toFixed(0)} at ${r.fromName} → process ${r.inputPerOutput}:1 at ${r.viaName} → sell ${r.maxUnits} @ $${r.unitSell.toFixed(0)} at ${r.toName}`}
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="journal-panel">
                <div className="section-header-journal">Trade Route Analysis</div>
                <div style={{
                  padding: 20,
                  background: `rgba(239,68,68,0.1)`,
                  border: `2px solid rgba(239,68,68,0.3)`,
                  borderRadius: 8,
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                    SYSTEM LOCKED
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    Requires ship upgrade: <strong>Mercantile Data Nexus</strong>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, fontFamily: 'monospace' }}>
                    Available at Shipyard stations
                  </div>
                </div>

                <div style={{ opacity: 0.6 }}>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 8, opacity: 0.7 }}>
                    BASIC ROUTE RECOMMENDATION:
                  </div>
                  {(routesPoll ? getSuggestedRoutes({ limit: 1, prioritizePerDistance: true }) : []).map(r => (
                    <div key={r.id} style={{
                      padding: 16,
                      background: `${primaryColor}10`,
                      border: `1px solid ${primaryColor}30`,
                      borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        {r.kind === 'direct'
                          ? `Buy ${r.maxUnits} ${r.inputId.replace(/_/g, ' ')} at ${r.fromName} → Sell at ${r.toName}`
                          : (() => {
                              const inputUnits = Math.ceil(r.maxUnits * r.inputPerOutput);
                              return `Buy ${inputUnits} ${r.inputId.replace(/_/g, ' ')} at ${r.fromName} → Process at ${r.viaName} → Sell ${r.maxUnits} ${r.outputId.replace(/_/g, ' ')} at ${r.toName}`;
                            })()
                        }
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontFamily: 'monospace', fontSize: 12 }}>
                        <div>Units: <strong>{r.maxUnits}</strong></div>
                        <div>Margin: <strong>${r.unitMargin.toFixed(0)}</strong></div>
                        <div>Profit: <strong>${r.estProfit.toFixed(0)}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
