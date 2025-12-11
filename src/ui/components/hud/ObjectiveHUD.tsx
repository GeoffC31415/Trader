import type { Objective } from '../../../domain/types/world_types';
import type { Contract } from '../../../domain/types/world_types';
import type { Mission } from '../../../domain/types/mission_types';
import type { Station } from '../../../domain/types/world_types';
import type { Ship } from '../../../domain/types/world_types';
import type { NpcTrader } from '../../../domain/types/world_types';

interface ObjectiveHUDProps {
  activeObj?: Objective;
  primaryMission?: Mission;
  activeContract?: Contract;
  activeEscorts: NpcTrader[];
  trackedStationId?: string;
  stations: Station[];
  ship: Ship;
  onSetTrackedStation: (id?: string) => void;
}

export function ObjectiveHUD({
  activeObj,
  primaryMission,
  activeContract,
  activeEscorts,
  trackedStationId,
  stations,
  ship,
  onSetTrackedStation,
}: ObjectiveHUDProps) {
  if (!trackedStationId && !activeObj && !primaryMission) return null;
  
  const escortCargo = activeEscorts.reduce((sum, e) => sum + (e.escortCargoUsed || 0), 0);
  const totalEscortCapacity = activeEscorts.reduce((sum, e) => sum + (e.escortCargoCapacity || 0), 0);
  
  const trackedStation = trackedStationId ? stations.find(s => s.id === trackedStationId) : null;
  const trackedDistance = trackedStation ? (() => {
    const dx = trackedStation.position[0] - ship.position[0];
    const dy = trackedStation.position[1] - ship.position[1];
    const dz = trackedStation.position[2] - ship.position[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  })() : null;
  
  return (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25, maxWidth: 640 }}>
      <div style={{ background: 'rgba(11,18,32,0.9)', color: '#e5e7eb', padding: 12, borderRadius: 10, border: '1px solid #1f2937', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        {/* Show active mission if present */}
        {primaryMission && (
          <div style={{ marginBottom: activeObj ? 12 : 0, paddingBottom: activeObj ? 12 : 0, borderBottom: activeObj ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>Story Mission</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  {primaryMission.title}
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                Stage {primaryMission.stage}
              </div>
            </div>
            
            {/* Mission objectives */}
            <div style={{ fontSize: 12, marginTop: 8 }}>
              {primaryMission.objectives.filter(obj => !obj.optional).map(obj => (
                <div key={obj.id} style={{ 
                  marginBottom: 4, 
                  opacity: obj.completed ? 0.6 : 1,
                  textDecoration: obj.completed ? 'line-through' : 'none',
                }}>
                  {obj.completed ? '✓' : '○'} {obj.description}
                  {obj.quantity && obj.quantity > 1 && (
                    <span style={{ marginLeft: 8, opacity: 0.8, fontFamily: 'monospace' }}>
                      ({obj.current}/{obj.quantity})
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (primaryMission.objectives.filter(o => o.completed).length / primaryMission.objectives.filter(o => !o.optional).length) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px #8b5cf680'
              }} />
            </div>
          </div>
        )}
        
        {/* Contract objective */}
        {activeObj && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Contract</div>
            <div style={{ fontSize: 13 }}>
              {activeObj.label}
            </div>
            {activeContract && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                Progress: {activeContract.deliveredUnits || 0} / {activeContract.units} {activeContract.commodityId.replace(/_/g, ' ')}
                {activeEscorts.length > 0 && (
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                    🚀 {activeEscorts.length} Escort{activeEscorts.length > 1 ? 's' : ''}: {escortCargo} / {totalEscortCapacity} cargo
                  </div>
                )}
                <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, ((activeContract.deliveredUnits || 0) / activeContract.units) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #22c55e)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Waypoint controls - shown for both contracts and missions */}
        <div style={{ display: 'flex', gap: 8, marginTop: (activeObj || primaryMission) ? 8 : 0 }}>
          <button
            onClick={() => {
              const target = activeObj?.targetStationId;
              if (target) {
                onSetTrackedStation(target);
                return;
              }
              // Fallback: set nearest station if no active objective
              let best: { id: string; d: number } | undefined;
              for (const st of stations) {
                const dx = st.position[0] - ship.position[0];
                const dy = st.position[1] - ship.position[1];
                const dz = st.position[2] - ship.position[2];
                const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (!best || d < best.d) best = { id: st.id, d };
              }
              if (best) onSetTrackedStation(best.id);
            }}
          >
            Set waypoint
          </button>
          {trackedStationId && (
            <button onClick={() => onSetTrackedStation(undefined)}>Clear waypoint</button>
          )}
        </div>
        {trackedStation && trackedDistance !== null && (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
            Waypoint: {trackedStation.name} — Distance: {trackedDistance.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

