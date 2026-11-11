import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Ship } from '../../../domain/types/world_types';
import { SHIP_SYSTEMS } from '../../../systems/journal';
import { useReducedMotion } from '../../../shared/hooks/use_reduced_motion';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import './assets.css';
type Vec = [number, number, number];
const details = ['Extracts ore at asteroid belts.', 'Advanced navigation intelligence.', 'Fabrication access credential, not a physical hull attachment.', 'Live market and trader intelligence.', 'Acquisition cost and profit instruments.', 'Temperature-controlled perishable storage.', 'Protected carriage for sensitive technology.', 'Automatic onboard fire response after three simulation seconds.'];
function DetailedHull({ kind }: { kind: Ship['kind'] }) {
  const family = ['freighter', 'heavy_freighter'].includes(kind) ? 'freighter_ship' : ['clipper', 'racer'].includes(kind) ? 'racer_ship' : 'general_ship';
  const { scene } = useGLTF(`/ships/${family}.glb`);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#66b5bd', metalness: .65, roughness: .36, flatShading: true }), []);
  const hull = useMemo(() => { const clone = scene.clone(); clone.traverse(child => { if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = material; }); return clone; }, [scene, material]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={hull} />;
}
function WireHull({ kind, angle }: { kind: Ship['kind']; angle: number }) {
  const freighter = ['freighter', 'heavy_freighter'].includes(kind), miner = ['miner', 'industrial_miner'].includes(kind);
  const boxes = [[0, 0, 0, freighter ? 1.3 : .65, .45, freighter ? 2.5 : 2], [-1.5, 0, .8, .35, .35, 1.7], [1.5, 0, .8, .35, .35, 1.7], [0, -.65, -.7, .5, .25, .6]];
  if (miner) boxes.push([0, .4, -2.1, .22, .22, 1.4]);
  const project = ([x, y, z]: Vec) => {
    const rx = x * Math.cos(angle) + z * Math.sin(angle), rz = z * Math.cos(angle) - x * Math.sin(angle);
    const ry = y * .82 - rz * .57, depth = rz * .82 + y * .57 + 12;
    return { x: 500 + rx / depth * 760, y: 280 + ry / depth * 760, z: depth };
  };
  const faces = boxes.flatMap(([cx, cy, cz, w, h, d]) => {
    const vertices: Vec[] = [[cx-w,cy-h,cz-d],[cx+w,cy-h,cz-d],[cx+w,cy+h,cz-d],[cx-w,cy+h,cz-d],[cx-w,cy-h,cz+d],[cx+w,cy-h,cz+d],[cx+w,cy+h,cz+d],[cx-w,cy+h,cz+d]];
    return [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[0,1,5,4],[3,2,6,7]].map(face => face.map(i => project(vertices[i])));
  }).sort((a, b) => b.reduce((sum, p) => sum + p.z, 0) - a.reduce((sum, p) => sum + p.z, 0));
  return <g aria-label={`${kind} procedural technical hull`}>{faces.map((face, i) => <polygon key={i} points={face.map(p => `${p.x},${p.y}`).join(' ')} fill={i % 2 ? '#173c4be8' : '#0b2433ed'} stroke="#73d8dd" strokeWidth={1.3} />)}</g>;
}
export function ShipSchematic({ ship, quality }: { ship: Ship; quality: 'low' | 'medium' | 'high' }) {
  const reduced = useReducedMotion(), [rotating, setRotating] = useState(true), [angle, setAngle] = useState(.55), [selected, setSelected] = useState(0);
  const detailed = quality !== 'low' && typeof window !== 'undefined' && 'WebGLRenderingContext' in window;
  useEffect(() => {
    if (reduced || !rotating || detailed) return;
    let frame = 0, previous = 0;
    const animate = (now: number) => { if (!document.hidden && now - previous >= 50) { setAngle(a => a + .008); previous = now; } frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [reduced, rotating, detailed]);
  const schematic = <WireHull kind={ship.kind} angle={angle} />;
  return <section className="ship-schematic" aria-label="Ship technical schematic" onPointerDown={e => e.stopPropagation()}>
    <header><div><small>VESSEL ENGINEERING / {ship.kind.toUpperCase().replace(/_/g, ' ')}</small><h3>Systems architecture</h3></div><span>{SHIP_SYSTEMS.filter(([key]) => ship[key]).length} / 8 ONLINE</span></header>
    <div className="ship-blueprint">
      <svg viewBox="0 0 1000 560" role="group" aria-label="Annotated ship model">
        <defs><pattern id="ship-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#73d8dd12" /></pattern><marker id="ship-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3"><circle cx="3" cy="3" r="2" fill="#73d8dd" /></marker></defs>
        <rect width="1000" height="560" fill="url(#ship-grid)" />
        {[150, 200].map(radius => <ellipse key={radius} cx="500" cy="285" rx={radius} ry={radius * .7} fill="none" stroke="#4db6c92e" strokeDasharray="4 9" />)}
        <path d="M270 285H730 M500 65V505" stroke="#4db6c930" strokeDasharray="3 6" />
        {!detailed && schematic}
      </svg>
      {detailed && <div className="ship-model-canvas"><ErrorBoundary fallback={<svg viewBox="260 50 480 460" aria-label="Fallback technical hull">{schematic}</svg>}><Canvas camera={{ position: [5, 4, 5], fov: 38 }} dpr={[1, 1.5]} frameloop={reduced || !rotating ? 'demand' : 'always'} gl={{ alpha: true, antialias: quality === 'high' }}><ambientLight intensity={1.6} /><directionalLight position={[4, 7, 5]} intensity={2.5} /><Suspense fallback={null}><group rotation={[0, angle, 0]}><Bounds fit clip observe margin={1.25}><Center><DetailedHull kind={ship.kind} /></Center></Bounds></group></Suspense><OrbitControls makeDefault autoRotate={!reduced && rotating} autoRotateSpeed={1} enableZoom={false} enablePan={false} /></Canvas></ErrorBoundary></div>}
      <svg className="ship-callouts" viewBox="0 0 1000 560" role="group" aria-label="Eight upgrade annotations">
        {SHIP_SYSTEMS.map(([key, label], i) => {
          const left = i < 4, row = i % 4, y = 105 + row * 108, textX = left ? 30 : 790;
          const tipX = left ? 450 + row * 10 : 550 - row * 10, tipY = 225 + row * 45, installed = !!ship[key];
          return <g key={key} tabIndex={0} role="button" data-installed={installed} className={`ship-callout ${installed ? 'online' : ''} ${selected === i ? 'selected' : ''}`} aria-label={`${label}: ${installed ? 'installed' : 'not installed'}`} onFocus={() => setSelected(i)} onMouseEnter={() => setSelected(i)} onClick={() => setSelected(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i); } }}>
            <title>{label}: {installed ? 'Installed' : 'Not installed'}. {details[i]}</title><polyline points={`${left ? 225 : 775},${y + 15} ${left ? 285 : 715},${y + 15} ${tipX},${tipY}`} fill="none" markerEnd="url(#ship-arrow)" /><text x={textX} y={y} fontSize={11}>{String(i + 1).padStart(2, '0')} / {installed ? 'ONLINE' : 'AVAILABLE'}</text><text x={textX} y={y + 23} fontSize={16}>{label}</text><line x1={textX} y1={y + 35} x2={textX + 175} y2={y + 35} /></g>;
        })}
        <text x="500" y="540" textAnchor="middle" fill="#6296aa" fontSize={10}>{detailed ? 'DETAILED HULL / LOGICAL SYSTEM CALLOUTS' : 'PROCEDURAL TECHNICAL SILHOUETTE / LOGICAL SYSTEM CALLOUTS'}</text>
      </svg>
    </div>
    <div className="schematic-detail" role="status"><strong>{SHIP_SYSTEMS[selected][1]} · {ship[SHIP_SYSTEMS[selected][0]] ? 'Installed' : 'Not installed'}</strong><span>{details[selected]} Callouts indicate logical systems, not separately modelled hardware.</span></div>
    <div className="j-toolbar"><button disabled={reduced} onClick={() => setRotating(v => !v)}>{reduced ? 'Automatic rotation disabled' : rotating ? 'Pause model rotation' : 'Enable model rotation'}</button><button onClick={() => setAngle(a => a + .35)}>Rotate model step</button><small>{reduced ? 'Reduced motion: automatic rotation disabled.' : 'Model rotation is cosmetic, independent of the simulation clock.'}</small></div>
  </section>;
}
