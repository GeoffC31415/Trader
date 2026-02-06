import { useState, useCallback } from 'react';
import type { Station, Ship } from '../../../domain/types/world_types';
import type { StationInventory } from '../../../domain/types/economy_types';
import type { WeaponKind } from '../../../domain/types/combat_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { DataRow } from '../shared/DataRow';
import { CommodityGrid } from '../shared/CommodityGrid';
import { SciFiButton } from '../shared/SciFiButton';
import { ShipyardSection } from './ShipyardSection';
import { UIIcon } from '../ui_icon';
import { canTradeCommodity } from '../../../state/modules/economy';

interface HallSectionProps {
  station: Station;
  ship: Ship;
  otherItems: Array<[string, StationInventory[string]]>;
  hasUnion: boolean;
  onBuy: (id: string, qty: number) => void;
  onSell: (id: string, qty: number) => void;
  onUpgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'union' | 'intel' | 'ledger' | 'tempcargo' | 'shieldedcargo', amount: number, cost: number) => void;
  onPurchaseWeapon: (weaponKind: WeaponKind, cost: number) => void;
  onUpgradeWeapon: (upgradeType: 'damage' | 'fireRate' | 'range', cost: number) => void;
  onReplaceShip: (kind: Ship['kind'], cost: number) => void;
  hasIntel: boolean;
  avgCostByCommodity: Record<string, number>;
}

export function HallSection({
  station,
  ship,
  otherItems,
  hasUnion,
  onBuy,
  onSell,
  onUpgrade,
  onPurchaseWeapon,
  onUpgradeWeapon,
  onReplaceShip,
  hasIntel,
  avgCostByCommodity,
}: HallSectionProps) {
  const colors = stationTypeColors[station.type];
  const [qty, setQty] = useState<number>(1);
  
  // Sell all cargo items that can be sold at this station
  const handleSellAll = useCallback(() => {
    const inventory = station.inventory;
    
    for (const [commodityId, amount] of Object.entries(ship.cargo)) {
      if (amount <= 0) continue;
      
      // Check if this commodity can be sold at this station
      const stationItem = inventory[commodityId];
      if (!stationItem) continue;
      if (stationItem.canBuy === false) continue;
      
      // Check gating (cargo hold upgrades)
      if (!canTradeCommodity(ship, commodityId)) continue;
      
      // Sell all of this commodity
      onSell(commodityId, amount);
    }
  }, [station.inventory, ship.cargo, ship, onSell]);
  
  return (
    <div className="scrollable-content">
      {station.type === 'shipyard' && (
        <ShipyardSection
          stationType="shipyard"
          ship={ship}
          hasIntel={hasIntel}
          onUpgrade={onUpgrade}
          onPurchaseWeapon={onPurchaseWeapon}
          onUpgradeWeapon={onUpgradeWeapon}
          onReplaceShip={onReplaceShip}
        />
      )}
      
      {station.type === 'city' && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type}>City Services</SectionHeader>
          <DataRow stationType={station.type}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Union Membership</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                Status: {hasUnion ? '✓ MEMBER' : '✗ NOT A MEMBER'}
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,500</div>
            <SciFiButton stationType={station.type} onClick={() => onUpgrade('union', 0, 1500)} disabled={hasUnion}>
              {hasUnion ? 'MEMBER' : 'JOIN'}
            </SciFiButton>
          </DataRow>
        </SciFiPanel>
      )}

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

      {otherItems.length > 0 && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type}>Commodity Exchange</SectionHeader>
          <CommodityGrid
            items={otherItems}
            station={station}
            ship={ship}
            qty={qty}
            hasTradeLedger={!!ship.hasTradeLedger}
            onBuy={onBuy}
            onSell={onSell}
            onSellAll={handleSellAll}
            avgCostByCommodity={avgCostByCommodity}
          />
        </SciFiPanel>
      )}
    </div>
  );
}

