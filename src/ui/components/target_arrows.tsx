// Target Arrows - Shows directional indicators pointing to mission combat targets
// Displays arrows at the edge of the screen when targets are off-screen
// This is a 2D HUD component that uses ship position to calculate direction

import { useGameStore } from '../../state';
import { useMemo, useState, useEffect } from 'react';

type TargetInfo = {
  id: string;
  position: [number, number, number];
  distance: number;
  directionAngle: number; // Angle in radians for arrow rotation
  status: 'active' | 'en_route';
  hp: number;
  maxHp: number;
};

// Calculate 2D direction angle from ship to target (top-down view)
function getDirectionAngle(
  shipPos: [number, number, number],
  targetPos: [number, number, number]
): number {
  const dx = targetPos[0] - shipPos[0];
  const dz = targetPos[2] - shipPos[2];
  // Return angle where 0 = up (negative Z), rotating clockwise
  return Math.atan2(dx, -dz);
}

// Arrow component displayed at screen edge
function DirectionalArrow({ 
  target, 
  centerX, 
  centerY, 
  radius,
  pulse,
}: { 
  target: TargetInfo; 
  centerX: number; 
  centerY: number;
  radius: number;
  pulse: number;
}) {
  // Position arrow at edge of circular region
  // Adjust angle to screen coordinates (where Y goes down)
  const screenAngle = target.directionAngle - Math.PI / 2;
  const x = centerX + Math.cos(screenAngle) * radius;
  const y = centerY + Math.sin(screenAngle) * radius;
  
  // Arrow rotation to point outward (in screen space)
  const arrowRotation = (screenAngle * 180 / Math.PI) + 90;
  
  // Color based on status
  const isEnRoute = target.status === 'en_route';
  const color = isEnRoute ? '#ffcc44' : '#ff4444';
  
  // Pulsing scale
  const pulseScale = 1 + Math.sin(pulse) * 0.15;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Arrow pointing toward target */}
      <div
        style={{
          transform: `rotate(${arrowRotation}deg)`,
          fontSize: 28,
          color: color,
          textShadow: `0 0 12px ${color}aa`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          lineHeight: 1,
        }}
      >
        ▼
      </div>
      
      {/* Distance label */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 6,
          background: `${color}ee`,
          color: '#fff',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          textAlign: 'center',
          minWidth: 60,
        }}
      >
        {isEnRoute && (
          <div style={{ fontSize: 9, marginBottom: 1, opacity: 0.9 }}>
            EN ROUTE
          </div>
        )}
        {Math.floor(target.distance)}m
      </div>
    </div>
  );
}

// En Route banner when no targets are visible yet
function EnRouteBanner({ count, pulse }: { count: number; pulse: number }) {
  const scale = 1 + Math.sin(pulse * 0.5) * 0.05;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        background: 'rgba(255, 200, 68, 0.95)',
        color: '#000',
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 20px rgba(255, 200, 68, 0.3)',
        textAlign: 'center',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>⏳</span>
        TARGETS EN ROUTE
      </div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>
        {count} convoy{count > 1 ? 's' : ''} approaching mission area
      </div>
    </div>
  );
}

export function TargetArrows() {
  const ship = useGameStore(s => s.ship);
  const npcTraders = useGameStore(s => s.npcTraders);
  const missions = useGameStore(s => s.missions);
  
  const [pulse, setPulse] = useState(0);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  });
  
  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Window resize handling
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get active combat mission targets
  const { targets, pendingCount } = useMemo(() => {
    const activeCombatMissions = missions.filter(
      m => m.status === 'active' && m.type === 'combat'
    );
    
    if (activeCombatMissions.length === 0) {
      return { targets: [], pendingCount: 0 };
    }
    
    // Find mission target NPCs
    const missionTargetNpcs = npcTraders.filter(npc => npc.isMissionTarget && npc.hp > 0);
    
    // Calculate pending targets
    let pending = 0;
    for (const mission of activeCombatMissions) {
      const destroyObjective = mission.objectives.find(o => o.type === 'destroy');
      if (!destroyObjective) continue;
      
      const totalRequired = destroyObjective.quantity || 0;
      const alreadyDestroyed = destroyObjective.current || 0;
      const currentlySpawned = npcTraders.filter(n => n.missionId === mission.id && n.hp > 0).length;
      
      if (currentlySpawned === 0 && alreadyDestroyed < totalRequired) {
        pending = totalRequired - alreadyDestroyed;
      }
    }
    
    const targetList: TargetInfo[] = missionTargetNpcs.map((npc) => {
      // Calculate distance
      const dx = npc.position[0] - ship.position[0];
      const dy = npc.position[1] - ship.position[1];
      const dz = npc.position[2] - ship.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Calculate direction angle
      const directionAngle = getDirectionAngle(ship.position, npc.position);
      
      // Determine status based on distance
      const status: 'active' | 'en_route' = distance > 800 ? 'en_route' : 'active';
      
      return {
        id: npc.id,
        position: npc.position,
        distance,
        directionAngle,
        status,
        hp: npc.hp,
        maxHp: npc.maxHp,
      };
    });
    
    return { targets: targetList, pendingCount: pending };
  }, [missions, npcTraders, ship.position]);
  
  // Don't render if no combat missions active
  if (targets.length === 0 && pendingCount === 0) return null;
  
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;
  const edgeRadius = Math.min(centerX, centerY) - 100;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      {/* En Route banner when no targets spawned */}
      {targets.length === 0 && pendingCount > 0 && (
        <EnRouteBanner count={pendingCount} pulse={pulse} />
      )}
      
      {/* Directional arrows for each target */}
      {targets.map(target => (
        <DirectionalArrow
          key={target.id}
          target={target}
          centerX={centerX}
          centerY={centerY}
          radius={edgeRadius}
          pulse={pulse}
        />
      ))}
      
      {/* Target count indicator in corner */}
      {targets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 68, 68, 0.9)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🎯</span>
          {targets.length} Target{targets.length > 1 ? 's' : ''} Active
        </div>
      )}
    </div>
  );
}
