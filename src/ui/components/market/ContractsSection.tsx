import type { Station } from '../../../domain/types/world_types';
import type { Contract } from '../../../domain/types/world_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { SciFiButton } from '../shared/SciFiButton';
import { ReputationBadge } from '../reputation_badge';
import { getFactionForStation, FACTIONS } from '../../../domain/constants/faction_constants';
import { getFactionReputation, getFactionStanding, getFactionStandingDisplay } from '../../../systems/reputation/faction_system';
import type { Station as StationType } from '../../../domain/types/world_types';

interface ContractsSectionProps {
  station: Station;
  stations: StationType[];
  stationContracts: Contract[];
  activeContracts: Contract[];
  onAcceptContract: (id: string) => void;
  onAbandonContract: (id: string) => void;
  onSetTrackedStation: (id: string) => void;
}

export function ContractsSection({
  station,
  stations,
  stationContracts,
  activeContracts,
  onAcceptContract,
  onAbandonContract,
  onSetTrackedStation,
}: ContractsSectionProps) {
  const colors = stationTypeColors[station.type];
  const factionId = getFactionForStation(station.id);
  const factionRep = factionId ? getFactionReputation(factionId, stations) : 0;
  const factionStanding = factionId ? getFactionStanding(factionRep) : null;
  const standingDisplay = factionStanding ? getFactionStandingDisplay(factionStanding) : null;
  const faction = factionId ? FACTIONS[factionId] : null;
  
  return (
    <div className="scrollable-content">
      <SciFiPanel stationType={station.type}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <SectionHeader stationType={station.type} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Available Contracts
          </SectionHeader>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ReputationBadge reputation={station.reputation || 0} label="Station Reputation" size="small" />
            {faction && standingDisplay && (
              <div style={{
                padding: '6px 12px',
                background: `${standingDisplay.color}15`,
                border: `1px solid ${standingDisplay.color}`,
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={`${faction.name}: ${standingDisplay.description}`}
              >
                <span style={{ opacity: 0.7 }}>Faction:</span>
                <span style={{ color: standingDisplay.color, fontWeight: 600 }}>
                  {faction.name}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ color: standingDisplay.color }}>
                  {standingDisplay.name}
                </span>
                <span style={{ opacity: 0.7 }}>({factionRep})</span>
              </div>
            )}
          </div>
        </div>
        <div style={{
          padding: 12,
          background: `${colors.primary}10`,
          border: `1px solid ${colors.primary}30`,
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 12,
          opacity: 0.9,
        }}>
          ℹ Accept delivery contracts for goods needed at this station. Rewards are guaranteed profitable.
        </div>

        {stationContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
            ⚠ NO CONTRACTS AVAILABLE — CHECK BACK LATER
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stationContracts.map(c => {
              const fromStation = stations.find(s => s.id === c.fromId);
              const reqRepOk = !c.requiredRep || ((station.reputation || 0) >= c.requiredRep);
              return (
                <div key={c.id} style={{
                  padding: 16,
                  background: `${colors.primary}10`,
                  border: `2px solid ${colors.primary}40`,
                  borderLeft: `4px solid ${colors.primary}`,
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>
                        {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8, fontFamily: 'monospace', marginBottom: 4 }}>
                        COMMODITY: <span style={{ color: colors.secondary }}>{c.commodityId.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8, fontFamily: 'monospace', marginBottom: 4 }}>
                        QUANTITY: <span style={{ color: colors.secondary }}>{c.units} units</span>
                      </div>
                      {fromStation && (
                        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                          SOURCE: {fromStation.name}
                        </div>
                      )}
                      {c.requiredRep && c.requiredRep > 0 && (
                        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', color: reqRepOk ? '#10b981' : '#ef4444', marginTop: 4 }}>
                          {reqRepOk ? '✓' : '✗'} REQUIRES {c.requiredRep} REPUTATION
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>REWARD</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                        ${(c.rewardBonus || 0).toLocaleString()}
                      </div>
                      <SciFiButton
                        stationType={station.type}
                        onClick={() => onAcceptContract(c.id)}
                        disabled={!reqRepOk}
                        style={{ marginTop: 8, padding: '8px 20px' }}
                      >
                        ACCEPT
                      </SciFiButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SciFiPanel>

      <SciFiPanel stationType={station.type}>
        <SectionHeader stationType={station.type}>Active Contracts</SectionHeader>
        {activeContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
            NO ACTIVE CONTRACTS
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeContracts.map(c => {
              const destStation = stations.find(s => s.id === c.toId);
              const delivered = c.deliveredUnits || 0;
              const progress = (delivered / c.units) * 100;
              return (
                <div key={c.id} style={{
                  padding: 16,
                  background: `${colors.primary}10`,
                  border: `2px solid ${colors.primary}40`,
                  borderLeft: `4px solid ${progress >= 100 ? '#10b981' : colors.primary}`,
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>
                        {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                      </div>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>
                        PROGRESS: <span style={{ color: progress >= 100 ? '#10b981' : colors.secondary, fontWeight: 700 }}>
                          {delivered} / {c.units}
                        </span> units
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                        height: 8,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}>
                        <div style={{
                          width: `${Math.min(100, progress)}%`,
                          height: '100%',
                          background: progress >= 100 ? '#22c55e' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          transition: 'width 0.3s ease',
                          boxShadow: `0 0 10px ${progress >= 100 ? '#22c55e' : colors.glow}`,
                        }} />
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                        DESTINATION: {destStation?.name || c.toId}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                      <SciFiButton stationType={station.type} onClick={() => onSetTrackedStation(c.toId)}>
                        SET WAYPOINT
                      </SciFiButton>
                      <SciFiButton stationType={station.type} variant="danger" onClick={() => onAbandonContract(c.id)}>
                        ABANDON
                      </SciFiButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SciFiPanel>
    </div>
  );
}

