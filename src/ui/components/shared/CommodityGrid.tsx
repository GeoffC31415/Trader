import { Fragment } from 'react';
import type { StationType } from '../../../domain/types/economy_types';
import type { StationInventory } from '../../../domain/types/economy_types';
import type { Ship } from '../../../domain/types/world_types';
import { stationTypeColors } from '../../utils/station_theme';
import { getPriceBiasForStation, gatedCommodities } from '../../../systems/economy/pricing';
import { commodityById } from '../../../state/world';
import { getAdjustedPrices } from '../../utils/price_display';
// UIIcon not needed in this component

interface CommodityGridProps {
  items: Array<[string, StationInventory[string]]>;
  station: { type: StationType; reputation?: number };
  ship: Ship;
  qty: number;
  hasNav: boolean;
  onBuy: (id: string, qty: number) => void;
  onSell: (id: string, qty: number) => void;
}

export function CommodityGrid({
  items,
  station,
  ship,
  qty,
  hasNav,
  onBuy,
  onSell,
}: CommodityGridProps) {
  const colors = stationTypeColors[station.type];
  const isGated = (id: string) => (gatedCommodities as readonly string[]).includes(id);
  
  return (
    <>
      <style>{`
        .commodity-grid {
          display: grid;
          grid-template-columns: auto 2fr 1fr 0.7fr 2fr;
          gap: 12px 16px;
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
      `}</style>
      <div className="commodity-grid">
        <div className="commodity-grid-header"></div>
        <div className="commodity-grid-header">COMMODITY</div>
        <div className="commodity-grid-header">PRICE (BUY / SELL)</div>
        <div className="commodity-grid-header">HELD</div>
        <div className="commodity-grid-header">ACTIONS</div>
        
        {items.map(([id, p]) => {
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
                {id.replace(/_/g, ' ')}
              </div>
              <div style={{ color }}>
                <span style={{ color: '#10b981' }}>${adjBuy}</span>
                <span style={{ opacity: 0.5 }}> / </span>
                <span style={{ color: '#ef4444' }}>${adjSell}</span>
              </div>
              <div style={{ fontWeight: 700, color: colors.secondary }}>{ship.cargo[id] || 0}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onBuy(id, qty)}
                  disabled={p.canSell === false || (!hasNav && isGated(id))}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canSell === false || (!hasNav && isGated(id)) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canSell === false || (!hasNav && isGated(id)) ? 0.4 : 1,
                  }}
                >
                  BUY {qty}
                </button>
                <button
                  onClick={() => onSell(id, qty)}
                  disabled={p.canBuy === false || (!hasNav && isGated(id))}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: p.canBuy === false || (!hasNav && isGated(id)) ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    opacity: p.canBuy === false || (!hasNav && isGated(id)) ? 0.4 : 1,
                  }}
                >
                  SELL {qty}
                </button>
              </div>
              {((p.canSell === false || p.canBuy === false) || (!hasNav && isGated(id))) && (
                <div style={{ gridColumn: '1 / -1', fontSize: 10, opacity: 0.6, marginTop: -4, fontFamily: 'monospace' }}>
                  {p.canSell === false && p.canBuy === false && '⚠ NOT TRADED HERE'}
                  {p.canSell === false && p.canBuy !== false && '⚠ NOT SOLD HERE'}
                  {p.canBuy === false && p.canSell !== false && '⚠ NOT BOUGHT HERE'}
                  {!hasNav && isGated(id) && ' | REQUIRES NAVIGATION ARRAY'}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

