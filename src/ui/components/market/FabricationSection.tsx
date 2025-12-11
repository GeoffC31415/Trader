import type { Station } from '../../../domain/types/world_types';
import type { Ship } from '../../../domain/types/world_types';
import type { ProcessRecipe } from '../../../systems/economy/recipes';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { DataRow } from '../shared/DataRow';
import { SciFiButton } from '../shared/SciFiButton';
import { gatedCommodities } from '../../../systems/economy/pricing';
import { commodityById } from '../../../state/world';

interface FabricationSectionProps {
  station: Station;
  ship: Ship;
  recipes: ProcessRecipe[];
  hasNav: boolean;
  hasUnion: boolean;
  isPirate: boolean;
  onProcess: (inputId: string, outputs: number) => void;
}

export function FabricationSection({
  station,
  ship,
  recipes,
  hasNav,
  hasUnion,
  isPirate,
  onProcess,
}: FabricationSectionProps) {
  const colors = stationTypeColors[station.type];
  const isGated = (id: string) => (gatedCommodities as readonly string[]).includes(id);
  
  return (
    <div className="scrollable-content">
      <SciFiPanel stationType={station.type}>
        <SectionHeader stationType={station.type}>Fabrication Bay</SectionHeader>
        {recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
            ⚠ NO FABRICATION SERVICES AVAILABLE
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recipes.map(r => {
              const have = ship.cargo[r.inputId] || 0;
              const canMake = Math.floor(have / r.inputPerOutput);
              const outIsGated = isGated(r.outputId);
              const unionBlocked = !isPirate && !hasUnion;
              const navBlocked = !hasNav && outIsGated;
              const inputCommodity = commodityById[r.inputId];
              const outputCommodity = commodityById[r.outputId];
              return (
                <DataRow key={r.inputId} stationType={station.type} style={{ gridTemplateColumns: '2fr 1fr auto' }}>
                  <div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {inputCommodity?.icon && (
                          <img 
                            src={inputCommodity.icon} 
                            alt={inputCommodity.name}
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span>{r.inputId.replace(/_/g,' ')}</span>
                      </div>
                      <span>→</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {outputCommodity?.icon && (
                          <img 
                            src={outputCommodity.icon} 
                            alt={outputCommodity.name}
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span>{r.outputId.replace(/_/g,' ')}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      RATIO: {r.inputPerOutput}:1 | AVAILABLE: {have} units
                    </div>
                    {(unionBlocked || navBlocked) && (
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, color: '#ef4444' }}>
                        {!isPirate && !hasUnion && '⚠ REQUIRES UNION MEMBERSHIP'}
                        {!hasNav && outIsGated && (unionBlocked ? ' | ' : '') + '⚠ REQUIRES NAVIGATION ARRAY'}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', color: colors.secondary, fontWeight: 700 }}>
                    CAN MAKE: {canMake}
                  </div>
                  <SciFiButton
                    stationType={station.type}
                    onClick={() => onProcess(r.inputId, 1)}
                    disabled={canMake <= 0 || unionBlocked || navBlocked}
                  >
                    FABRICATE 1
                  </SciFiButton>
                </DataRow>
              );
            })}
          </div>
        )}
      </SciFiPanel>
    </div>
  );
}

