import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../state/game_state';

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  }, [planets, stations, belts, ship.position, ship.velocity, bounds]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} />
    </div>
  );
}


