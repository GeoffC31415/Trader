import type { Ship } from '../../../domain/types/world_types';
import type { WeaponKind } from '../../../domain/types/combat_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { DataRow } from '../shared/DataRow';
import { SciFiButton } from '../shared/SciFiButton';
import { UIIcon } from '../ui_icon';
import { formatNumber } from '../../utils/number_format';
import { WEAPON_COSTS, WEAPON_UPGRADE_COSTS, WEAPON_UPGRADE_MAX_LEVELS } from '../../../domain/constants/weapon_constants';
import { getWeaponStats } from '../../../systems/combat/weapon_systems';

interface ShipyardSectionProps {
  stationType: 'shipyard';
  ship: Ship;
  hasIntel: boolean;
  onUpgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'union' | 'intel' | 'ledger' | 'tempcargo' | 'shieldedcargo', amount: number, cost: number) => void;
  onPurchaseWeapon: (weaponKind: WeaponKind, cost: number) => void;
  onUpgradeWeapon: (upgradeType: 'damage' | 'fireRate' | 'range', cost: number) => void;
  onReplaceShip: (kind: Ship['kind'], cost: number) => void;
}

export function ShipyardSection({
  stationType,
  ship,
  hasIntel,
  onUpgrade,
  onPurchaseWeapon,
  onUpgradeWeapon,
  onReplaceShip,
}: ShipyardSectionProps) {
  const colors = stationTypeColors[stationType];
  const weaponStats = getWeaponStats(ship.weapon);
  const weaponKind = ship.weapon.kind;
  const canAfford = (cost: number) => ship.credits >= cost;
  
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
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {formatNumber(ship.stats.acc)}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Increases thrust power for faster acceleration
            </div>
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
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {formatNumber(ship.stats.vmax)}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Raises maximum cruising speed
            </div>
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
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Expands cargo hold capacity for more goods
            </div>
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
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Enables asteroid mining near belt rings
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
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Enables the system minimap display
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$500</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('navigation', 0, 500)} disabled={!!ship.hasNavigationArray}>
            {ship.hasNavigationArray ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_cargo" size={20} />
              Temperature Controlled Cargo
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {ship.hasTempCargo ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Allows trading perishables: pharmaceuticals, meat
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$5,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('tempcargo', 0, 5000)} disabled={!!ship.hasTempCargo}>
            {ship.hasTempCargo ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_cargo" size={20} />
              Shielded Cargo Hold
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {ship.hasShieldedCargo ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Allows trading sensitive tech: electronics, chips, data, nano
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$5,000</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('shieldedcargo', 0, 5000)} disabled={!!ship.hasShieldedCargo}>
            {ship.hasShieldedCargo ? 'OWNED' : 'INSTALL'}
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
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Shows NPC trader activity & market intel
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$2,500</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('intel', 0, 2500)} disabled={hasIntel}>
            {hasIntel ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>

        <DataRow stationType={stationType}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIIcon name="system_cargo" size={20} />
              Trade Ledger
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
              Status: {ship.hasTradeLedger ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Shows purchase costs & profit/loss when selling
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$750</div>
          <SciFiButton stationType={stationType} onClick={() => onUpgrade('ledger', 0, 750)} disabled={!!ship.hasTradeLedger}>
            {ship.hasTradeLedger ? 'OWNED' : 'INSTALL'}
          </SciFiButton>
        </DataRow>
      </div>

      <SectionHeader stationType={stationType} style={{ marginTop: 20 }}>Weapons Bay</SectionHeader>
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          padding: 12,
          background: `${colors.primary}10`,
          border: `1px solid ${colors.primary}30`,
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.9, marginBottom: 8 }}>
            CURRENT WEAPON:{' '}
            <span style={{ color: colors.secondary, fontWeight: 800 }}>
              {weaponKind.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'monospace', fontSize: 11, opacity: 0.9 }}>
            <div>DMG: <span style={{ fontWeight: 800, color: '#fca5a5' }}>{formatNumber(weaponStats.damage)}</span></div>
            <div>RATE: <span style={{ fontWeight: 800, color: '#bfdbfe' }}>{formatNumber(weaponStats.fireRate)}/s</span></div>
            <div>RANGE: <span style={{ fontWeight: 800, color: '#a7f3d0' }}>{formatNumber(weaponStats.range)}</span></div>
            <div>ENERGY: <span style={{ fontWeight: 800, color: '#93c5fd' }}>{formatNumber(ship.weapon.energyCost)}/shot</span></div>
          </div>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <SciFiButton
              stationType={stationType}
              onClick={() => onUpgradeWeapon('damage', WEAPON_UPGRADE_COSTS.damage)}
              disabled={ship.weapon.damageLevel >= WEAPON_UPGRADE_MAX_LEVELS.damage || !canAfford(WEAPON_UPGRADE_COSTS.damage)}
              style={{ fontSize: 11, padding: '8px 10px' }}
              title={`Damage level ${ship.weapon.damageLevel}/${WEAPON_UPGRADE_MAX_LEVELS.damage}`}
            >
              DMG {ship.weapon.damageLevel}/{WEAPON_UPGRADE_MAX_LEVELS.damage}
            </SciFiButton>
            <SciFiButton
              stationType={stationType}
              onClick={() => onUpgradeWeapon('fireRate', WEAPON_UPGRADE_COSTS.fireRate)}
              disabled={ship.weapon.fireRateLevel >= WEAPON_UPGRADE_MAX_LEVELS.fireRate || !canAfford(WEAPON_UPGRADE_COSTS.fireRate)}
              style={{ fontSize: 11, padding: '8px 10px' }}
              title={`Fire rate level ${ship.weapon.fireRateLevel}/${WEAPON_UPGRADE_MAX_LEVELS.fireRate}`}
            >
              RATE {ship.weapon.fireRateLevel}/{WEAPON_UPGRADE_MAX_LEVELS.fireRate}
            </SciFiButton>
            <SciFiButton
              stationType={stationType}
              onClick={() => onUpgradeWeapon('range', WEAPON_UPGRADE_COSTS.range)}
              disabled={ship.weapon.rangeLevel >= WEAPON_UPGRADE_MAX_LEVELS.range || !canAfford(WEAPON_UPGRADE_COSTS.range)}
              style={{ fontSize: 11, padding: '8px 10px' }}
              title={`Range level ${ship.weapon.rangeLevel}/${WEAPON_UPGRADE_MAX_LEVELS.range}`}
            >
              RNG {ship.weapon.rangeLevel}/{WEAPON_UPGRADE_MAX_LEVELS.range}
            </SciFiButton>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, opacity: 0.7, fontFamily: 'monospace' }}>
            Upgrades cost: DMG ${WEAPON_UPGRADE_COSTS.damage.toLocaleString()} • RATE ${WEAPON_UPGRADE_COSTS.fireRate.toLocaleString()} • RNG ${WEAPON_UPGRADE_COSTS.range.toLocaleString()}
          </div>
        </div>

        {(
          [
            {
              kind: 'laser' as const,
              title: 'Laser Cannon',
              blurb: 'Reliable hitscan, low energy, fast cadence',
              req: undefined as string | undefined,
            },
            {
              kind: 'plasma' as const,
              title: 'Plasma Burster',
              blurb: 'High damage bolts, mid range, heavier energy draw',
              req: undefined as string | undefined,
            },
            {
              kind: 'railgun' as const,
              title: 'Railgun',
              blurb: 'Long-range precision shots with punch',
              req: undefined as string | undefined,
            },
            {
              kind: 'missile' as const,
              title: 'Missile Launcher',
              blurb: 'Heavy tracking payloads (requires Market Intel)',
              req: 'Requires Mercantile Data Nexus (Market Intel)',
            },
          ] satisfies Array<{ kind: WeaponKind; title: string; blurb: string; req?: string }>
        ).map(w => {
          const isOwned = weaponKind === w.kind;
          const cost = WEAPON_COSTS[w.kind];
          const isLocked = w.kind === 'missile' && !hasIntel;
          const canBuy = !isOwned && !isLocked && canAfford(cost);

          return (
            <DataRow key={w.kind} stationType={stationType}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UIIcon name="system_sensors" size={18} />
                  {w.title}
                </div>
                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>
                  {w.blurb}
                </div>
                {w.req && isLocked && (
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4, color: '#fbbf24', fontFamily: 'monospace' }}>
                    {w.req}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                ${cost.toLocaleString()}
              </div>
              <SciFiButton
                stationType={stationType}
                onClick={() => onPurchaseWeapon(w.kind, cost)}
                disabled={!canBuy}
                style={{ fontSize: 11, padding: '6px 12px' }}
              >
                {isOwned ? 'EQUIPPED' : isLocked ? 'LOCKED' : canAfford(cost) ? 'PURCHASE' : 'NEED CREDITS'}
              </SciFiButton>
            </DataRow>
          );
        })}
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
        {(
          [
            { kind: 'freighter', cargo: 300, acc: 10, vmax: 11, price: 20000 },
            { kind: 'clipper', cargo: 60, acc: 18, vmax: 20, price: 20000 },
            { kind: 'miner', cargo: 80, acc: 9, vmax: 11, price: 10000, mining: true },
            { kind: 'heavy_freighter', cargo: 600, acc: 9, vmax: 12, price: 60000 },
            { kind: 'racer', cargo: 40, acc: 24, vmax: 28, price: 50000 },
            { kind: 'industrial_miner', cargo: 160, acc: 10, vmax: 12, price: 40000, mining: true },
          ] as Array<{ kind: Ship['kind']; cargo: number; acc: number; vmax: number; price: number; mining?: boolean }>
        ).map(s => (
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

