// Mission Markers - Highlight mission targets in 3D space

import { useGameStore } from '../../state';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';

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
  const activeMissions = missions.filter(m => m.status === 'active');
  if (activeMissions.length === 0) return null;
  
  // Find mission NPCs (targets)
  const missionNpcs = npcTraders.filter(npc => npc.isMissionTarget);
  
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
        const scale = 1 + Math.sin(pulse) * 0.3;
        const opacity = 0.7 + Math.sin(pulse) * 0.3;
        
        // Calculate distance to player
        const dx = npc.position[0] - ship.position[0];
        const dy = npc.position[1] - ship.position[1];
        const dz = npc.position[2] - ship.position[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        return (
          <group key={npc.id} position={npc.position}>
            {/* Red ring marker above NPC */}
            <mesh position={[0, 50, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[18, 22, 32]} />
              <meshBasicMaterial color="#ff4444" transparent opacity={opacity} />
            </mesh>
            
            {/* Distance label */}
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
                background: 'rgba(255, 68, 68, 0.9)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                fontFamily: 'monospace',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
              }}>
                🎯 TARGET {dist > 100 ? `${Math.floor(dist)}` : dist.toFixed(0)}
              </div>
            </Html>
          </group>
        );
      })}
      
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
            {/* Blue ring marker above station */}
            <mesh position={[0, 80, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[30, 36, 32]} />
              <meshBasicMaterial color="#6b9aff" transparent opacity={opacity} />
            </mesh>
            
            {/* Mission destination label */}
            <Html
              position={[0, 95, 0]}
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

