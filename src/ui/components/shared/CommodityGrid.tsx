import { Fragment, useMemo } from 'react';
import type { StationType } from '../../../domain/types/economy_types';
import type { StationInventory } from '../../../domain/types/economy_types';
import type { Ship } from '../../../domain/types/world_types';
import { stationTypeColors } from '../../utils/station_theme';
import { getPriceBiasForStation, getStockPriceEffect, getTargetStock } from '../../../systems/economy/pricing';
import { canTradeCommodity, getGatingReason } from '../../../state/modules/economy';
import { commodityById } from '../../../state/world';
import { getAdjustedPrices } from '../../utils/price_display';
import { getCommodityTier, getTierLabel, getTierColor, isPerishable } from '../../../systems/economy/commodity_tiers';
import { getSpoilageTimeSeconds, formatSpoilageTime } from '../../../state/modules/cargo_freshness';
// UIIcon not needed in this component

interface CommodityGridProps {
  items: Array<[string, StationInventory[string]]>;
  station: { type: StationType; reputation?: number };
  ship: Ship;
  qty: number;
  hasTradeLedger: boolean;
  onBuy: (id: string, qty: number) => void;
  onSell: (id: string, qty: number) => void;
  onSellAll?: () => void;
  avgCostByCommodity?: Record<string, number>;
}

export function CommodityGrid({
  items,
  station,
  ship,
  qty,
  hasTradeLedger,
  onBuy,
  onSell,
  onSellAll,
  avgCostByCommodity = {},
}: CommodityGridProps) {
  const colors = stationTypeColors[station.type];
  const canTrade = (id: string) => canTradeCommodity(ship, id);
  
  // Split items into cargo (items player has) and other items
  const { cargoItems, otherItems } = useMemo(() => {
    const inCargo: Array<[string, StationInventory[string]]> = [];
    const notInCargo: Array<[string, StationInventory[string]]> = [];
    
    for (const item of items) {
      const [id] = item;
      if ((ship.cargo[id] || 0) > 0) {
        inCargo.push(item);
      } else {
        notInCargo.push(item);
      }
    }
    
    return { cargoItems: inCargo, otherItems: notInCargo };
  }, [items, ship.cargo]);
  
  // Check if there's anything to sell
  const hasCargoToSell = cargoItems.some(([id, p]) => 
    p.canBuy !== false && canTrade(id)
  );
  
  return (
    <>
      <style>{`
        .commodity-grid {
          display: grid;
          grid-template-columns: auto 2fr 1fr 1fr 0.7fr 2fr;
          gap: 12px 12px;
          font-family: monospace;
          font-size: 13px;
        }
        .commodity-grid-header {
          font-weight: 700;
          color: ${colors.secondary};
          font-size: 11px;
          text-transform: uppercase;
          padding-bottom: 8px;
          border-bottom: 1px solid ${colors.primary}30;
        }
        .tier-badge {
          display: inline-block;
          padding: 2px 6px;
          font-size: 9px;
          font-weight: 700;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 6px;
        }
        .freshness-bar {
          width: 100%;
          height: 3px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }
        .freshness-fill {
          height: 100%;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .stock-bar {
          width: 100%;
          height: 4px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 4px;
        }
        .stock-fill {
          height: 100%;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .stock-effect-badge {
          display: inline-block;
          padding: 2px 5px;
          font-size: 9px;
          font-weight: 700;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .cargo-section-header {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin: 8px 0 4px 0;
          background: linear-gradient(90deg, ${colors.primary}20, transparent);
          border-left: 3px solid ${colors.primary};
          border-radius: 0 6px 6px 0;
        }
        .cargo-section-title {
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${colors.secondary};
        }
        .sell-all-btn {
          padding: 4px 12px;
          font-size: 10px;
          font-weight: 700;
          font-family: monospace;
          background: linear-gradient(135deg, #ef444440, #ef444420);
          border: 1px solid #ef4444;
          border-radius: 6px;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sell-all-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ef444460, #ef444440);
          box-shadow: 0 0 8px #ef444440;
        }
        .sell-all-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
      <div className="commodity-grid">
        <div className="commodity-grid-header"></div>
        <div className="commodity-grid-header">COMMODITY</div>
        <div className="commodity-grid-header">PRICE (BUY / SELL)</div>
        <div className="commodity-grid-header">STOCK</div>
        <div className="commodity-grid-header">HELD</div>
        <div className="commodity-grid-header">ACTIONS</div>
        
        {/* Cargo section - items player has */}
        {cargoItems.length > 0 && (
          <div className="cargo-section-header">
            <span className="cargo-section-title">📦 In Your Cargo ({cargoItems.length})</span>
            {onSellAll && (
              <button 
                className="sell-all-btn"
                onClick={onSellAll}
                disabled={!hasCargoToSell}
                title="Sell all cargo items at this station"
              >
                💰 SELL ALL
              </button>
            )}
          </div>
        )}
        
        {cargoItems.map(([id, p]) => {
          const bias = getPriceBiasForStation(station.type, id);
          const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
          const rep = station.reputation || 0;
          const { adjBuy, adjSell } = getAdjustedPrices({ buy: p.buy, sell: p.sell }, rep);
          const commodity = commodityById[id];
          
          return (
            <Fragment key={id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {commodity?.icon && (
                  <img 
                    src={commodity.icon} 
                    alt={commodity.name}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ opacity: !canTrade(id) ? 0.5 : 1 }}>{id.replace(/_/g, ' ')}</span>
                  {(() => {
                    const tier = getCommodityTier(id);
                    const tierColor = getTierColor(tier);
                    return (
                      <span 
                        className="tier-badge"
                        style={{
                          backgroundColor: `${tierColor}20`,
                          color: tierColor,
                          border: `1px solid ${tierColor}40`,
                          opacity: !canTrade(id) ? 0.5 : 1,
                        }}
                      >
                        {getTierLabel(tier)}
                      </span>
                    );
                  })()}
                </div>
                {!canTrade(id) && getGatingReason(id) && (
                  <div style={{ 
                    fontSize: 9, 
                    color: '#f59e0b', 
                    marginTop: 4, 
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    🔒 {getGatingReason(id)}
                  </div>
                )}
                {isPerishable(id) && (ship.cargo[id] || 0) > 0 && (() => {
                  const freshness = ship.cargoFreshness?.[id] ?? 1.0;
                  const freshnessPercent = Math.round(freshness * 100);
                  // Color coding: green >80%, amber 20-80%, red <20%, dark red at 0%
                  const freshnessColor = freshness > 0.8 ? '#10b981' 
                    : freshness > 0.2 ? '#f59e0b' 
                    : freshness > 0 ? '#ef4444' 
                    : '#7f1d1d'; // Dark red for worthless (0%)
                  return (
                    <div style={{ width: '100%', marginTop: 6 }}>
                      <div className="freshness-bar">
                        <div 
                          className="freshness-fill"
                          style={{
                            width: `${freshnessPercent}%`,
                            background: `linear-gradient(90deg, ${freshnessColor}, ${freshnessColor}80)`,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 9, color: freshnessColor, marginTop: 2, opacity: 0.8 }}>
                        {freshnessPercent > 0 ? `${freshnessPercent}% fresh` : 'WORTHLESS'}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div style={{ color }}>
                <div>
                  <span style={{ color: '#10b981' }}>${adjBuy}</span>
                  <span style={{ opacity: 0.5 }}> / </span>
                  <span style={{ color: '#ef4444' }}>${adjSell}</span>
                </div>
                {hasTradeLedger && (() => {
                  const avgCost = avgCostByCommodity[id];
                  if (avgCost && avgCost > 0) {
                    const profitPerUnit = adjSell - avgCost;
                    const profitColor = profitPerUnit >= 0 ? '#10b981' : '#ef4444';
                    const profitSymbol = profitPerUnit >= 0 ? '▲' : '▼';
                    return (
                      <div style={{ fontSize: 9, marginTop: 4, fontFamily: 'monospace' }}>
                        <div style={{ opacity: 0.7, marginBottom: 2 }}>
                          Avg cost: <span style={{ color: '#94a3b8' }}>${Math.round(avgCost)}</span>
                        </div>
                        <div style={{ color: profitColor, fontWeight: 600 }}>
                          {profitSymbol} {profitPerUnit >= 0 ? '+' : ''}${Math.round(profitPerUnit)}/unit
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {isPerishable(id) && p.canSell !== false && (
                  <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 4, opacity: 0.8 }}>
                    ⏱ Spoils in {formatSpoilageTime(getSpoilageTimeSeconds())}
                  </div>
                )}
              </div>
              {/* Stock column with price effect */}
              {(() => {
                const currentStock = Math.round(p.stock || 0);
                const targetStock = getTargetStock(station.type, id);
                const stockEffect = getStockPriceEffect(currentStock, targetStock);
                const stockPercent = Math.min(150, Math.max(0, (currentStock / targetStock) * 100));
                // Color the bar based on stock level
                const barColor = stockPercent > 100 ? '#3b82f6' // blue for surplus
                  : stockPercent > 50 ? '#10b981' // green for healthy
                  : stockPercent > 20 ? '#f59e0b' // amber for low
                  : '#ef4444'; // red for critical
                
                return (
                  <div style={{ minWidth: 70 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {currentStock}
                      <span style={{ opacity: 0.5, fontSize: 10 }}> / {targetStock}</span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className="stock-fill"
                        style={{
                          width: `${Math.min(100, stockPercent)}%`,
                          background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                        }}
                      />
                    </div>
                    {stockEffect.label && (
                      <span 
                        className="stock-effect-badge"
                        style={{
                          backgroundColor: `${stockEffect.color}20`,
                          color: stockEffect.color,
                          border: `1px solid ${stockEffect.color}40`,
                          marginTop: 4,
                          display: 'inline-block',
                        }}
                      >
                        {stockEffect.label}
                      </span>
                    )}
                  </div>
                );
              })()}
              <div style={{ fontWeight: 700, color: colors.secondary }}>
                {ship.cargo[id] || 0}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onBuy(id, qty)}
                  disabled={p.canSell === false || !canTrade(id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canSell === false || !canTrade(id) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canSell === false || !canTrade(id) ? 0.4 : 1,
                  }}
                >
                  BUY {qty}
                </button>
                <button
                  onClick={() => onSell(id, qty)}
                  disabled={p.canBuy === false || !canTrade(id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canBuy === false || !canTrade(id) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canBuy === false || !canTrade(id) ? 0.4 : 1,
                  }}
                >
                  SELL {qty}
                </button>
              </div>
              {(p.canSell === false || p.canBuy === false) && (
                <div style={{ gridColumn: '1 / -1', fontSize: 10, opacity: 0.6, marginTop: -4, fontFamily: 'monospace' }}>
                  {p.canSell === false && p.canBuy === false && '⚠ NOT TRADED HERE'}
                  {p.canSell === false && p.canBuy !== false && '⚠ NOT SOLD HERE'}
                  {p.canBuy === false && p.canSell !== false && '⚠ NOT BOUGHT HERE'}
                </div>
              )}
            </Fragment>
          );
        })}
        
        {/* Other available commodities section */}
        {otherItems.length > 0 && (
          <div className="cargo-section-header" style={{ marginTop: cargoItems.length > 0 ? 16 : 8 }}>
            <span className="cargo-section-title">🏪 Available ({otherItems.length})</span>
          </div>
        )}
        
        {otherItems.map(([id, p]) => {
          const bias = getPriceBiasForStation(station.type, id);
          const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
          const rep = station.reputation || 0;
          const { adjBuy, adjSell } = getAdjustedPrices({ buy: p.buy, sell: p.sell }, rep);
          const commodity = commodityById[id];
          
          return (
            <Fragment key={id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {commodity?.icon && (
                  <img 
                    src={commodity.icon} 
                    alt={commodity.name}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ opacity: !canTrade(id) ? 0.5 : 1 }}>{id.replace(/_/g, ' ')}</span>
                  {(() => {
                    const tier = getCommodityTier(id);
                    const tierColor = getTierColor(tier);
                    return (
                      <span 
                        className="tier-badge"
                        style={{
                          backgroundColor: `${tierColor}20`,
                          color: tierColor,
                          border: `1px solid ${tierColor}40`,
                          opacity: !canTrade(id) ? 0.5 : 1,
                        }}
                      >
                        {getTierLabel(tier)}
                      </span>
                    );
                  })()}
                </div>
                {!canTrade(id) && getGatingReason(id) && (
                  <div style={{ 
                    fontSize: 9, 
                    color: '#f59e0b', 
                    marginTop: 4, 
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    🔒 {getGatingReason(id)}
                  </div>
                )}
              </div>
              <div style={{ color }}>
                <div>
                  <span style={{ color: '#10b981' }}>${adjBuy}</span>
                  <span style={{ opacity: 0.5 }}> / </span>
                  <span style={{ color: '#ef4444' }}>${adjSell}</span>
                </div>
                {isPerishable(id) && p.canSell !== false && (
                  <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 4, opacity: 0.8 }}>
                    ⏱ Spoils in {formatSpoilageTime(getSpoilageTimeSeconds())}
                  </div>
                )}
              </div>
              {/* Stock column with price effect */}
              {(() => {
                const currentStock = Math.round(p.stock || 0);
                const targetStock = getTargetStock(station.type, id);
                const stockEffect = getStockPriceEffect(currentStock, targetStock);
                const stockPercent = Math.min(150, Math.max(0, (currentStock / targetStock) * 100));
                // Color the bar based on stock level
                const barColor = stockPercent > 100 ? '#3b82f6' // blue for surplus
                  : stockPercent > 50 ? '#10b981' // green for healthy
                  : stockPercent > 20 ? '#f59e0b' // amber for low
                  : '#ef4444'; // red for critical
                
                return (
                  <div style={{ minWidth: 70 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {currentStock}
                      <span style={{ opacity: 0.5, fontSize: 10 }}> / {targetStock}</span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className="stock-fill"
                        style={{
                          width: `${Math.min(100, stockPercent)}%`,
                          background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                        }}
                      />
                    </div>
                    {stockEffect.label && (
                      <span 
                        className="stock-effect-badge"
                        style={{
                          backgroundColor: `${stockEffect.color}20`,
                          color: stockEffect.color,
                          border: `1px solid ${stockEffect.color}40`,
                          marginTop: 4,
                          display: 'inline-block',
                        }}
                      >
                        {stockEffect.label}
                      </span>
                    )}
                  </div>
                );
              })()}
              <div style={{ fontWeight: 700, color: colors.secondary }}>
                {ship.cargo[id] || 0}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onBuy(id, qty)}
                  disabled={p.canSell === false || !canTrade(id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canSell === false || !canTrade(id) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canSell === false || !canTrade(id) ? 0.4 : 1,
                  }}
                >
                  BUY {qty}
                </button>
                <button
                  onClick={() => onSell(id, qty)}
                  disabled={p.canBuy === false || !canTrade(id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canBuy === false || !canTrade(id) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canBuy === false || !canTrade(id) ? 0.4 : 1,
                  }}
                >
                  SELL {qty}
                </button>
              </div>
              {(p.canSell === false || p.canBuy === false) && (
                <div style={{ gridColumn: '1 / -1', fontSize: 10, opacity: 0.6, marginTop: -4, fontFamily: 'monospace' }}>
                  {p.canSell === false && p.canBuy === false && '⚠ NOT TRADED HERE'}
                  {p.canSell === false && p.canBuy !== false && '⚠ NOT SOLD HERE'}
                  {p.canBuy === false && p.canSell !== false && '⚠ NOT BOUGHT HERE'}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

