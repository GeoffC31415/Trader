import { useState } from 'react';
import type { Station } from '../../../domain/types/world_types';
import type { Ship } from '../../../domain/types/world_types';
import type { StationInventory } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { CommodityGrid } from '../shared/CommodityGrid';
import { SciFiButton } from '../shared/SciFiButton';

interface ProductionSectionProps {
  station: Station;
  ship: Ship;
  producedItems: Array<[string, StationInventory[string]]>;
  onBuy: (id: string, qty: number) => void;
  onSell: (id: string, qty: number) => void;
}

export function ProductionSection({
  station,
  ship,
  producedItems,
  onBuy,
  onSell,
}: ProductionSectionProps) {
  const colors = stationTypeColors[station.type];
  const [qty, setQty] = useState<number>(1);
  
  if (producedItems.length === 0) return null;
  
  return (
    <div className="scrollable-content">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: `${colors.primary}10`,
        border: `1px solid ${colors.primary}30`,
        borderRadius: 6,
        marginBottom: 12,
      }}>
        <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: colors.secondary }}>
          TRADE QUANTITY:
        </div>
        <SciFiButton stationType={station.type} onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '4px 12px' }}>
          −
        </SciFiButton>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          style={{
            width: 80,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${colors.primary}`,
            borderRadius: 4,
            color: '#e5e7eb',
            fontFamily: 'monospace',
            fontWeight: 700,
            textAlign: 'center',
          }}
        />
        <SciFiButton stationType={station.type} onClick={() => setQty(q => q + 1)} style={{ padding: '4px 12px' }}>
          +
        </SciFiButton>
        <SciFiButton stationType={station.type} onClick={() => setQty(10)} style={{ padding: '4px 12px' }}>
          10
        </SciFiButton>
        <SciFiButton stationType={station.type} onClick={() => setQty(50)} style={{ padding: '4px 12px' }}>
          50
        </SciFiButton>
      </div>

      <SciFiPanel stationType={station.type}>
        <SectionHeader stationType={station.type}>Local Production</SectionHeader>
        <CommodityGrid
          items={producedItems}
          station={station}
          ship={ship}
          qty={qty}
          hasTradeLedger={!!ship.hasTradeLedger}
          onBuy={onBuy}
          onSell={onSell}
        />
      </SciFiPanel>
    </div>
  );
}

