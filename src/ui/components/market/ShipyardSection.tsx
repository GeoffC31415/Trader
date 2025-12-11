import type { Ship } from '../../../domain/types/world_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { DataRow } from '../shared/DataRow';
import { SciFiButton } from '../shared/SciFiButton';
import { UIIcon } from '../ui_icon';

interface ShipyardSectionProps {
  stationType: 'shipyard';
  ship: Ship;
  hasIntel: boolean;
  onUpgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'union' | 'intel', amount: number, cost: number) => void;
  onReplaceShip: (kind: string, cost: number) => void;
}

export function ShipyardSection({
  stationType,
  ship,
  hasIntel,
  onUpgrade,
  onReplaceShip,
}: ShipyardSectionProps) {
  const colors = stationTypeColors[stationType];
  
  return (
    <SciFiPanel stationType={stationType}>
      <SectionHeader stationType={stationType}>Ship Upgrades & Services</SectionHeader>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 12, opacity: 0.9 }}>
          CURRENT VESSEL: <span style={{ color: colors.secondary, fontWeight: 700 }}>{ship.kind.toUpperCase()}</span>
        </div>
        
        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_engine" size={20} />
              Acceleration Boost
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.stats.acc.toFixed(1)}</div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('acc', 3, 1000)}>+3 ACC</SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_engine" size={20} />
              Velocity Enhancer
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.stats.vmax.toFixed(1)}</div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('vmax', 3, 1000)}>+3 VMAX</SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_cargo" size={20} />
              Cargo Bay Expansion
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.maxCargo} units</div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,200</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('cargo', 50, 1200)}>+50 CARGO</SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_mining" size={20} />
              Mining Rig Installation
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {ship.canMine ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$25,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('mining', 0, 25000)} disabled={ship.canMine}>
            {ship.canMine ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_navigation" size={20} />
              Navigation Array
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {ship.hasNavigationArray ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$5,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('navigation', 0, 5000)} disabled={!!ship.hasNavigationArray}>
            {ship.hasNavigationArray ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_sensors" size={20} />
              Mercantile Data Nexus
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {hasIntel ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$2,500</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('intel', 0, 2500)} disabled={hasIntel}>
            {hasIntel ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>
      </div>

      <SectionHeader stationType={stationType} style={{ marginTop: 20 }}>Ship Replacement Services</SectionHeader>
      <div style={{
        padding: 12,
        background: `${colors.primary}10`,
        border: `1px solid ${colors.primary}30`,
        borderRadius: 6,
        marginBottom: 12,
        fontSize: 12,
        opacity: 0.9,
      }}>
        ⚠ WARNING: Cargo hold must be empty to replace ship
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { kind: 'freighter', cargo: 300, acc: 10, vmax: 11, price: 20000 },
          { kind: 'clipper', cargo: 60, acc: 18, vmax: 20, price: 20000 },
          { kind: 'miner', cargo: 80, acc: 9, vmax: 11, price: 10000, mining: true },
          { kind: 'heavy_freighter', cargo: 600, acc: 9, vmax: 12, price: 60000 },
          { kind: 'racer', cargo: 40, acc: 24, vmax: 28, price: 50000 },
          { kind: 'industrial_miner', cargo: 160, acc: 10, vmax: 12, price: 40000, mining: true },
        ].map(s => (
          <div key={s.kind} style={{
            padding: 14,
            background: `${colors.primary}10`,
            border: `1px solid ${colors.primary}40`,
            borderRadius: 8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: colors.secondary }}>
              {s.kind.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 8, lineHeight: 1.6 }}>
              <div>CARGO: {s.cargo}</div>
              <div>ACC: {s.acc} | VMAX: {s.vmax}</div>
              {s.mining && <div style={{ color: '#10b981' }}>✓ MINING RIG</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                ${s.price.toLocaleString()}
              </div>
              <SciFiButton
                stationType={stationType}
                onClick={() => onReplaceShip(s.kind, s.price)}
                disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                PURCHASE
              </SciFiButton>
            </div>
          </div>
        ))}
      </div>
    </SciFiPanel>
  );
}

