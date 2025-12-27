import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../state';

type Vec3 = [number, number, number];

function projectTo2D(p: Vec3, center: Vec3, scale: number): { x: number; y: number } {
  const dx = p[0] - center[0];
  const dz = p[2] - center[2];
  return { x: dx * scale, y: dz * scale };
}

export function Minimap() {
  const planets = useGameStore(s => s.planets);
  const stations = useGameStore(s => s.stations);
  const belts = useGameStore(s => s.belts);
  const ship = useGameStore(s => s.ship);
  const npcTraders = useGameStore(s => s.npcTraders);
  const missions = useGameStore(s => s.missions);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Check if player has Navigation Array for enhanced minimap features
  const hasNavArray = ship.hasNavigationArray;
  
  // Get mission target NPCs for minimap display
  const missionTargets = useMemo(() => {
    const activeCombatMissions = missions.filter(m => m.status === 'active' && m.type === 'combat');
    if (activeCombatMissions.length === 0) return [];
    
    return npcTraders.filter(npc => npc.isMissionTarget && npc.hp > 0);
  }, [missions, npcTraders]);
  
  // Check if there are pending targets (not yet spawned)
  const pendingTargetCount = useMemo(() => {
    const activeCombatMissions = missions.filter(m => m.status === 'active' && m.type === 'combat');
    if (activeCombatMissions.length === 0) return 0;
    
    for (const mission of activeCombatMissions) {
      const destroyObjective = mission.objectives.find(o => o.type === 'destroy');
      if (!destroyObjective) continue;
      
      const totalRequired = destroyObjective.quantity || 0;
      const currentlySpawned = npcTraders.filter(n => n.missionId === mission.id && n.hp > 0).length;
      const alreadyDestroyed = destroyObjective.current || 0;
      
      if (currentlySpawned === 0 && alreadyDestroyed < totalRequired) {
        return totalRequired - alreadyDestroyed;
      }
    }
    return 0;
  }, [missions, npcTraders]);

  // Determine world bounds once based on static bodies for scaling
  const bounds = useMemo(() => {
    const xs: number[] = [];
    const zs: number[] = [];
    const add = (pos: Vec3) => { xs.push(pos[0]); zs.push(pos[2]); };
    planets.forEach(p => add(p.position));
    stations.forEach(s => add(s.position));
    belts.forEach(b => add(b.position));
    // Include ship initial region
    add(ship.position);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxZ - minZ);
    return { minX, maxX, minZ, maxZ, width, height };
  }, [planets, stations, belts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssSize = { w: 320, h: 320 };
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = cssSize.w * dpr;
    canvas.height = cssSize.h * dpr;
    canvas.style.width = cssSize.w + 'px';
    canvas.style.height = cssSize.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = 14;
    const drawW = cssSize.w - padding * 2;
    const drawH = cssSize.h - padding * 2;

    const worldCenter: Vec3 = [
      (bounds.minX + bounds.maxX) / 2,
      0,
      (bounds.minZ + bounds.maxZ) / 2,
    ];
    // scale to fit max dimension into draw area
    const scale = Math.min(drawW / bounds.width, drawH / bounds.height);

    ctx.clearRect(0, 0, cssSize.w, cssSize.h);

    // background
    ctx.fillStyle = 'rgba(10,14,22,0.85)';
    ctx.fillRect(0, 0, cssSize.w, cssSize.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(0.5, 0.5, cssSize.w - 1, cssSize.h - 1);

    // origin for drawing
    ctx.save();
    ctx.translate(padding + drawW / 2, padding + drawH / 2);

    // belts as rings
    for (const b of belts) {
      const p2 = projectTo2D(b.position, worldCenter, scale);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156,163,175,0.6)';
      ctx.lineWidth = 1;
      ctx.arc(p2.x, p2.y, Math.max(1, b.radius * scale), 0, Math.PI * 2);
      ctx.stroke();
    }

    // planets
    for (const p of planets) {
      const p2 = projectTo2D(p.position, worldCenter, scale);
      ctx.beginPath();
      ctx.fillStyle = '#1f2937';
      ctx.arc(p2.x, p2.y, Math.max(2, p.radius * scale * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // stations
    for (const s of stations) {
      const p2 = projectTo2D(s.position, worldCenter, scale);
      ctx.fillStyle = s.type === 'shipyard' ? '#34d399' : '#7dd3fc';
      ctx.fillRect(p2.x - 2, p2.y - 2, 4, 4);
    }
    
    // Mission targets (only when player has Navigation Array)
    if (hasNavArray && missionTargets.length > 0) {
      for (const target of missionTargets) {
        const p2 = projectTo2D(target.position, worldCenter, scale);
        
        // Calculate distance to determine if "en route"
        const dx = target.position[0] - ship.position[0];
        const dz = target.position[2] - ship.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const isEnRoute = dist > 800;
        
        // Draw target icon
        ctx.save();
        
        // Pulsing effect using time
        const pulseTime = Date.now() / 500;
        const pulseScale = 1 + Math.sin(pulseTime) * 0.2;
        
        // Draw outer ring (pulsing)
        ctx.beginPath();
        ctx.strokeStyle = isEnRoute ? 'rgba(255, 200, 68, 0.8)' : 'rgba(255, 68, 68, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.arc(p2.x, p2.y, 5 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner dot
        ctx.beginPath();
        ctx.fillStyle = isEnRoute ? '#ffcc44' : '#ff4444';
        ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw crosshair lines for active targets
        if (!isEnRoute) {
          ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
          ctx.lineWidth = 1;
          // Horizontal
          ctx.beginPath();
          ctx.moveTo(p2.x - 8, p2.y);
          ctx.lineTo(p2.x - 4, p2.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p2.x + 4, p2.y);
          ctx.lineTo(p2.x + 8, p2.y);
          ctx.stroke();
          // Vertical
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y - 8);
          ctx.lineTo(p2.x, p2.y - 4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y + 4);
          ctx.lineTo(p2.x, p2.y + 8);
          ctx.stroke();
        }
        
        ctx.restore();
      }
    }

    // ship
    {
      const p2 = projectTo2D(ship.position, worldCenter, scale);
      ctx.beginPath();
      ctx.fillStyle = '#60a5fa';
      ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
      ctx.fill();
      // Heading indicator using velocity
      const vx = ship.velocity[0];
      const vz = ship.velocity[2];
      const speed = Math.hypot(vx, vz);
      if (speed > 0.01) {
        const dirX = vx / speed;
        const dirY = vz / speed;
        ctx.strokeStyle = 'rgba(96,165,250,0.9)';
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x + dirX * 12, p2.y + dirY * 12);
        ctx.stroke();
      }
    }

    ctx.restore();

    // HUD text
    ctx.fillStyle = 'rgba(229,231,235,0.8)';
    ctx.font = '16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillText('System Map', padding, cssSize.h - 10);
    
    // Mission target legend (when showing targets)
    if (hasNavArray && (missionTargets.length > 0 || pendingTargetCount > 0)) {
      ctx.font = '11px ui-sans-serif, system-ui';
      
      if (missionTargets.length > 0) {
        // Draw target indicator legend
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(padding + 8, cssSize.h - 30, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
        ctx.fillText(`${missionTargets.length} Target${missionTargets.length > 1 ? 's' : ''}`, padding + 16, cssSize.h - 26);
      }
      
      if (pendingTargetCount > 0 && missionTargets.length === 0) {
        // Show "en route" indicator when no targets visible yet
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.arc(padding + 8, cssSize.h - 30, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 68, 0.9)';
        ctx.fillText(`${pendingTargetCount} En Route`, padding + 16, cssSize.h - 26);
      }
    }
  }, [planets, stations, belts, ship.position, ship.velocity, bounds, hasNavArray, missionTargets, pendingTargetCount]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} />
    </div>
  );
}


