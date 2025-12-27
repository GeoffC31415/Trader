// Mission Markers - Highlight mission targets in 3D space

import { useGameStore } from '../../state';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState, useMemo } from 'react';

// Check if a combat mission has pending (not yet spawned) targets
function getPendingTargetCount(mission: any, missionNpcs: any[]): number {
  if (mission.type !== 'combat') return 0;
  
  const destroyObjective = mission.objectives.find((o: any) => o.type === 'destroy');
  if (!destroyObjective) return 0;
  
  const totalRequired = destroyObjective.quantity || 0;
  const currentlySpawned = missionNpcs.filter(n => n.missionId === mission.id && n.hp > 0).length;
  const alreadyDestroyed = destroyObjective.current || 0;
  
  // If we have fewer spawned than expected (and not all destroyed), show as pending
  const expectedActive = totalRequired - alreadyDestroyed;
  if (currentlySpawned < expectedActive && currentlySpawned === 0) {
    return expectedActive;
  }
  
  return 0;
}

export function MissionMarkers() {
  const missions = useGameStore(s => s.missions);
  const npcTraders = useGameStore(s => s.npcTraders);
  const stations = useGameStore(s => s.stations);
  const ship = useGameStore(s => s.ship);
  
  const [pulse, setPulse] = useState(0);
  
  useFrame((state, dt) => {
    setPulse(prev => (prev + dt * 2) % (Math.PI * 2));
  });
  
  // Get active missions
  const activeMissions = useMemo(() => 
    missions.filter(m => m.status === 'active'),
    [missions]
  );
  
  // Find mission NPCs (targets)
  const missionNpcs = useMemo(() => 
    npcTraders.filter(npc => npc.isMissionTarget),
    [npcTraders]
  );
  
  // Check for pending (en route) targets
  const pendingTargetInfo = useMemo(() => {
    for (const mission of activeMissions) {
      if (mission.type === 'combat') {
        const pendingCount = getPendingTargetCount(mission, missionNpcs);
        if (pendingCount > 0) {
          return {
            missionId: mission.id,
            count: pendingCount,
            missionTitle: mission.title,
          };
        }
      }
    }
    return null;
  }, [activeMissions, missionNpcs]);
  
  // Early return AFTER all hooks
  if (activeMissions.length === 0) return null;
  
  // Find target stations for delivery missions
  const targetStationIds = new Set<string>();
  for (const mission of activeMissions) {
    for (const objective of mission.objectives) {
      if ((objective.type === 'deliver' || objective.type === 'visit') && objective.targetStation) {
        targetStationIds.add(objective.targetStation);
      }
      if (objective.type === 'avoid_detection' && objective.target) {
        // Mark detection zones differently
      }
    }
  }
  
  return (
    <>
      {/* NPC Target Markers */}
      {missionNpcs.map(npc => {
        if (npc.hp <= 0) return null; // Don't show markers for destroyed NPCs
        
        const scale = 1 + Math.sin(pulse) * 0.3;
        const opacity = 0.7 + Math.sin(pulse) * 0.3;
        
        // Calculate distance to player
        const dx = npc.position[0] - ship.position[0];
        const dy = npc.position[1] - ship.position[1];
        const dz = npc.position[2] - ship.position[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Determine if target is "en route" (far away, still approaching)
        const isEnRoute = dist > 800;
        const markerColor = isEnRoute ? '#ffcc44' : '#ff4444';
        
        // HP bar calculation
        const hpPercent = npc.maxHp > 0 ? (npc.hp / npc.maxHp) * 100 : 100;
        const hpColor = hpPercent > 60 ? '#44cc88' : hpPercent > 30 ? '#ffcc44' : '#ff4444';
        
        return (
          <group key={npc.id} position={npc.position}>
            {/* Ring marker above NPC */}
            <mesh position={[0, 50, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[18, 22, 32]} />
              <meshBasicMaterial color={markerColor} transparent opacity={opacity} />
            </mesh>
            
            {/* Inner ring for active targets */}
            {!isEnRoute && (
              <mesh position={[0, 50, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[10, 14, 32]} />
                <meshBasicMaterial color="#ff6666" transparent opacity={opacity * 0.6} />
              </mesh>
            )}
            
            {/* Distance and status label */}
            <Html
              position={[0, 60, 0]}
              center
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                transform: `scale(${scale})`,
              }}
            >
              <div style={{
                background: `${markerColor}ee`,
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                fontFamily: 'monospace',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                minWidth: 80,
                textAlign: 'center',
              }}>
                <div style={{ marginBottom: 2 }}>
                  🎯 {isEnRoute ? 'EN ROUTE' : 'TARGET'}
                </div>
                <div style={{ fontSize: 10, opacity: 0.9 }}>
                  {dist > 100 ? `${Math.floor(dist)}m` : `${dist.toFixed(0)}m`}
                </div>
                {/* HP Bar */}
                <div style={{
                  marginTop: 3,
                  height: 3,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${hpPercent}%`,
                    background: hpColor,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            </Html>
          </group>
        );
      })}
      
      {/* Pending Target Indicator - when targets haven't spawned yet */}
      {pendingTargetInfo && missionNpcs.filter(n => n.missionId === pendingTargetInfo.missionId && n.hp > 0).length === 0 && (
        <Html
          position={[ship.position[0], ship.position[1] + 100, ship.position[2]]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            background: 'rgba(255, 200, 68, 0.9)',
            color: '#000',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <div style={{ marginBottom: 2 }}>⏳ TARGETS EN ROUTE</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>
              {pendingTargetInfo.count} convoy{pendingTargetInfo.count > 1 ? 's' : ''} approaching
            </div>
          </div>
        </Html>
      )}
      
      {/* Station Target Markers */}
      {Array.from(targetStationIds).map(stationId => {
        const station = stations.find(s => s.id === stationId);
        if (!station) return null;
        
        const scale = 1 + Math.sin(pulse * 0.7) * 0.2;
        const opacity = 0.6 + Math.sin(pulse * 0.7) * 0.2;
        
        // Calculate distance to player
        const dx = station.position[0] - ship.position[0];
        const dy = station.position[1] - ship.position[1];
        const dz = station.position[2] - ship.position[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        return (
          <group key={stationId} position={station.position}>
            {/* Blue ring marker below station */}
            <mesh position={[0, -80, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[30, 36, 32]} />
              <meshBasicMaterial color="#6b9aff" transparent opacity={opacity} />
            </mesh>
            
            {/* Mission destination label */}
            <Html
              position={[0, -95, 0]}
              center
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                transform: `scale(${scale})`,
              }}
            >
              <div style={{
                background: 'rgba(107, 154, 255, 0.9)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                fontFamily: 'monospace',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
              }}>
                📍 {station.name.toUpperCase()} {dist > 100 ? `${Math.floor(dist)}` : dist.toFixed(0)}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

