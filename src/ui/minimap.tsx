import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../state';
import { stationTypeColors } from './utils/station_theme';

type Vec3 = [number, number, number];

function projectTo2D(p: Vec3, center: Vec3, scale: number): { x: number; y: number } {
  const dx = p[0] - center[0];
  const dz = p[2] - center[2];
  return { x: dx * scale, y: dz * scale };
}

function niceGridStep(rawWorldStep: number): number {
  if (!Number.isFinite(rawWorldStep) || rawWorldStep <= 0) return 100;
  const pow10 = 10 ** Math.floor(Math.log10(rawWorldStep));
  const n = rawWorldStep / pow10;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow10;
}

function abbreviateStationName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '???';
  const parts = cleaned.split(' ');
  const first = parts[0] || cleaned;
  const lettersOnly = first.replace(/[^a-z0-9]/gi, '');
  const abbr = (lettersOnly || first).slice(0, 3).toUpperCase();
  return abbr.padEnd(3, ' ');
}

export function Minimap() {
  const planets = useGameStore(s => s.planets);
  const stations = useGameStore(s => s.stations);
  const belts = useGameStore(s => s.belts);
  const ship = useGameStore(s => s.ship);
  const npcTraders = useGameStore(s => s.npcTraders);
  const missions = useGameStore(s => s.missions);
  const trackedStationId = useGameStore(s => s.trackedStationId);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Check if player has Navigation Array for enhanced minimap features
  const hasNavArray = ship.hasNavigationArray;
  
  // Get mission target NPCs for minimap display
  // Include targets from both combat missions and escort/defend missions
  const missionTargets = useMemo(() => {
    const activeMissionsWithTargets = missions.filter(m => 
      m.status === 'active' && (
        m.type === 'combat' || 
        // Escort missions with defend objectives spawn hostile targets
        (m.type === 'escort' && m.objectives.some(o => o.type === 'defend'))
      )
    );
    if (activeMissionsWithTargets.length === 0) return [];
    
    return npcTraders.filter(npc => npc.isMissionTarget && npc.hp > 0);
  }, [missions, npcTraders]);
  
  // Get mission escort NPCs for minimap display
  const missionEscorts = useMemo(() => {
    const activeEscortMissions = missions.filter(m => m.status === 'active' && m.type === 'escort');
    if (activeEscortMissions.length === 0) return [];
    
    return npcTraders.filter(npc => npc.isMissionEscort && npc.hp > 0);
  }, [missions, npcTraders]);
  
  // Check if there are pending targets (not yet spawned)
  const pendingTargetCount = useMemo(() => {
    const activeMissionsWithTargets = missions.filter(m => 
      m.status === 'active' && (
        m.type === 'combat' || 
        (m.type === 'escort' && m.objectives.some(o => o.type === 'defend'))
      )
    );
    if (activeMissionsWithTargets.length === 0) return 0;
    
    for (const mission of activeMissionsWithTargets) {
      // Check for destroy objectives (combat missions)
      const destroyObjective = mission.objectives.find(o => o.type === 'destroy');
      if (destroyObjective) {
        const totalRequired = destroyObjective.quantity || 0;
        const currentlySpawned = npcTraders.filter(n => n.missionId === mission.id && n.hp > 0).length;
        const alreadyDestroyed = destroyObjective.current || 0;
        
        if (currentlySpawned === 0 && alreadyDestroyed < totalRequired) {
          return totalRequired - alreadyDestroyed;
        }
      }
      
      // Check for defend objectives (escort/defend missions)
      const defendObjectives = mission.objectives.filter(o => o.type === 'defend');
      if (defendObjectives.length > 0) {
        const currentlySpawned = npcTraders.filter(n => n.missionId === mission.id && n.isMissionTarget && n.hp > 0).length;
        // If no targets spawned yet but mission has defend objectives, show as pending
        if (currentlySpawned === 0 && !defendObjectives.every(o => o.completed)) {
          return 1; // Show "incoming" indicator
        }
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

    // Subtle radar sweep for atmosphere
    {
      const sweepT = (Date.now() % 4000) / 4000;
      const sweepAngle = sweepT * Math.PI * 2;
      const sweepRadius = Math.min(drawW, drawH) * 0.52;
      ctx.save();
      ctx.rotate(sweepAngle);
      const grad = ctx.createLinearGradient(0, 0, sweepRadius, 0);
      grad.addColorStop(0, 'rgba(96,165,250,0.00)');
      grad.addColorStop(0.6, 'rgba(96,165,250,0.06)');
      grad.addColorStop(1, 'rgba(96,165,250,0.18)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(sweepRadius, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Grid lines (scale reference)
    {
      const worldPerPixel = 1 / Math.max(1e-9, scale);
      const gridWorldStep = niceGridStep(worldPerPixel * 40); // target ~40px spacing

      const halfWorldW = drawW / 2 / scale;
      const halfWorldH = drawH / 2 / scale;
      const minWorldX = worldCenter[0] - halfWorldW;
      const maxWorldX = worldCenter[0] + halfWorldW;
      const minWorldZ = worldCenter[2] - halfWorldH;
      const maxWorldZ = worldCenter[2] + halfWorldH;

      const startX = Math.floor(minWorldX / gridWorldStep) * gridWorldStep;
      const startZ = Math.floor(minWorldZ / gridWorldStep) * gridWorldStep;

      // Minor grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let wx = startX; wx <= maxWorldX; wx += gridWorldStep) {
        const x = (wx - worldCenter[0]) * scale;
        ctx.moveTo(x, -drawH / 2);
        ctx.lineTo(x, drawH / 2);
      }
      for (let wz = startZ; wz <= maxWorldZ; wz += gridWorldStep) {
        const y = (wz - worldCenter[2]) * scale;
        ctx.moveTo(-drawW / 2, y);
        ctx.lineTo(drawW / 2, y);
      }
      ctx.stroke();

      // Major grid every 5 lines
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      const majorStep = gridWorldStep * 5;
      const startXMajor = Math.floor(minWorldX / majorStep) * majorStep;
      const startZMajor = Math.floor(minWorldZ / majorStep) * majorStep;
      for (let wx = startXMajor; wx <= maxWorldX; wx += majorStep) {
        const x = (wx - worldCenter[0]) * scale;
        ctx.moveTo(x, -drawH / 2);
        ctx.lineTo(x, drawH / 2);
      }
      for (let wz = startZMajor; wz <= maxWorldZ; wz += majorStep) {
        const y = (wz - worldCenter[2]) * scale;
        ctx.moveTo(-drawW / 2, y);
        ctx.lineTo(drawW / 2, y);
      }
      ctx.stroke();
      ctx.restore();
    }

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

    // Waypoint path (tracked station)
    const trackedStation = trackedStationId ? stations.find(s => s.id === trackedStationId) : undefined;
    if (trackedStation) {
      const ship2 = projectTo2D(ship.position, worldCenter, scale);
      const st2 = projectTo2D(trackedStation.position, worldCenter, scale);

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(34,197,94,0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ship2.x, ship2.y);
      ctx.lineTo(st2.x, st2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Station highlight ring
      ctx.strokeStyle = 'rgba(34,197,94,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(st2.x, st2.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // stations
    for (const s of stations) {
      const p2 = projectTo2D(s.position, worldCenter, scale);
      const colors = stationTypeColors[s.type] ?? stationTypeColors.city;
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(p2.x - 2, p2.y - 2, 4, 4);

      // label (2-3 chars)
      ctx.save();
      ctx.font = '9px "Share Tech Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(229,231,235,0.75)';
      ctx.textBaseline = 'middle';
      ctx.fillText(abbreviateStationName(s.name), p2.x + 6, p2.y);
      ctx.restore();
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
    
    // Mission escorts (only when player has Navigation Array)
    if (hasNavArray && missionEscorts.length > 0) {
      for (const escort of missionEscorts) {
        const p2 = projectTo2D(escort.position, worldCenter, scale);
        
        // Draw escort icon
        ctx.save();
        
        // Pulsing effect using time
        const pulseTime = Date.now() / 500;
        const pulseScale = 1 + Math.sin(pulseTime) * 0.2;
        
        // Draw outer ring (pulsing) - teal color for friendly
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(68, 204, 170, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.arc(p2.x, p2.y, 5 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner dot - teal
        ctx.beginPath();
        ctx.fillStyle = '#44ccaa';
        ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shield-like indicator (small ring inside)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(68, 204, 170, 0.6)';
        ctx.lineWidth = 1;
        ctx.arc(p2.x, p2.y, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // ship
    {
      const p2 = projectTo2D(ship.position, worldCenter, scale);

      // Player glow ring
      ctx.save();
      ctx.shadowColor = 'rgba(96,165,250,0.85)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(96,165,250,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

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
    ctx.font = '16px Orbitron, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.fillText('System Map', padding, cssSize.h - 10);
    
    // Mission target and escort legend (when showing targets/escorts)
    if (hasNavArray && (missionTargets.length > 0 || pendingTargetCount > 0 || missionEscorts.length > 0)) {
      ctx.font = '11px ui-sans-serif, system-ui';
      let legendY = cssSize.h - 30;
      
      if (missionTargets.length > 0) {
        // Draw target indicator legend
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(padding + 8, legendY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
        ctx.fillText(`${missionTargets.length} Target${missionTargets.length > 1 ? 's' : ''}`, padding + 16, legendY + 4);
        legendY -= 18;
      }
      
      if (missionEscorts.length > 0) {
        // Draw escort indicator legend
        ctx.fillStyle = '#44ccaa';
        ctx.beginPath();
        ctx.arc(padding + 8, legendY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(68, 204, 170, 0.9)';
        ctx.fillText(`${missionEscorts.length} Escort${missionEscorts.length > 1 ? 's' : ''}`, padding + 16, legendY + 4);
        legendY -= 18;
      }
      
      if (pendingTargetCount > 0 && missionTargets.length === 0) {
        // Show "en route" indicator when no targets visible yet
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.arc(padding + 8, legendY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 68, 0.9)';
        ctx.fillText(`${pendingTargetCount} En Route`, padding + 16, legendY + 4);
      }
    }
  }, [planets, stations, belts, ship.position, ship.velocity, trackedStationId, bounds, hasNavArray, missionTargets, missionEscorts, pendingTargetCount]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} />
    </div>
  );
}


