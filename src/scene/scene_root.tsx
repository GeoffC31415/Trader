import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state';
import { Html, Sparkles } from '@react-three/drei';
import type { StationType } from '../domain/types/economy_types';
import { FreighterModel } from './components/ships/FreighterModel';
import { ClipperModel } from './components/ships/ClipperModel';
import { MinerModel } from './components/ships/MinerModel';
import { useGameInput } from '../input/use_game_input';
import { SCALE } from '../domain/constants/world_constants';
import { DOCKING_RANGE_WORLD, MINING_RANGE_WORLD } from '../domain/constants/game_constants';
const SHOW_ASTEROIDS = false; // Set to false to disable asteroid rendering for better performance

function colorFromCommodity(id: string): string {
  const palette: Record<string, string> = {
    refined_fuel: '#f59e0b',
    hydrogen: '#60a5fa',
    oxygen: '#93c5fd',
    water: '#3b82f6',
    sugar: '#f97316',
    coffee: '#6b4f1d',
    tobacco: '#92400e',
    grain: '#84cc16',
    meat: '#ef4444',
    spices: '#eab308',
    rare_minerals: '#a78bfa',
    iron_ore: '#9ca3af',
    copper_ore: '#f59e0b',
    silicon: '#22d3ee',
    steel: '#6b7280',
    alloys: '#64748b',
    electronics: '#06b6d4',
    microchips: '#14b8a6',
    batteries: '#10b981',
    medical_supplies: '#f43f5e',
    pharmaceuticals: '#e11d48',
    textiles: '#f472b6',
    plastics: '#fca5a5',
    machinery: '#f59e0b',
    fertilizer: '#65a30d',
    luxury_goods: '#f472b6',
    data_drives: '#38bdf8',
    nanomaterials: '#22c55e',
  };
  const known = (palette as any)[id];
  if (known) return known;
  let h = 0 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = (h % 360) / 360;
  const c = new THREE.Color().setHSL(hue, 0.65, 0.55);
  return `#${c.getHexString()}`;
}

import { Planet } from './components/primitives/Planet';
import { StationVisual } from './components/stations/StationVisual';
import { MissionMarkers } from './components/MissionMarkers';

// Projectile rendering component
function Projectiles() {
  const projectiles = useGameStore(s => s.projectiles);
  
  return (
    <>
      {projectiles.map(proj => {
        // Color based on weapon kind
        let color = '#ff4444'; // default red
        if (proj.weaponKind === 'laser') color = '#ff4444'; // red
        if (proj.weaponKind === 'plasma') color = '#44ff44'; // green
        if (proj.weaponKind === 'railgun') color = '#4444ff'; // blue
        if (proj.weaponKind === 'missile') color = '#ffff44'; // yellow
        
        // Player projectiles brighter than NPC
        if (proj.ownerType === 'player') {
          color = new THREE.Color(color).multiplyScalar(1.5).getHexString();
          color = '#' + color;
        }
        
        // Render as a stretched capsule or line
        const length = proj.weaponKind === 'laser' ? 8 : 4;
        const dir = new THREE.Vector3(proj.velocity[0], proj.velocity[1], proj.velocity[2]).normalize();
        const endPos = new THREE.Vector3(
          proj.position[0] - dir.x * length,
          proj.position[1] - dir.y * length,
          proj.position[2] - dir.z * length
        );
        
        return (
          <group key={proj.id}>
            <mesh position={proj.position as any}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <line>
              <bufferGeometry
                attach="geometry"
                attributes={{
                  position: new THREE.Float32BufferAttribute(
                    [proj.position[0], proj.position[1], proj.position[2], endPos.x, endPos.y, endPos.z],
                    3
                  )
                }}
              />
              <lineBasicMaterial color={color} linewidth={2} />
            </line>
          </group>
        );
      })}
    </>
  );
}

function Explosions() {
  const explosions = useGameStore(s => s.explosions);
  const now = Date.now();

  return (
    <>
      {explosions.map(e => {
        const age = now - e.startedAt;
        const t = Math.max(0, Math.min(1, age / e.duration));
        const radius = Math.max(0.05, e.maxRadius * t);
        const opacity = (1 - t) * (e.kind === 'hit' ? 0.9 : 0.65);
        const emissiveIntensity = e.kind === 'hit' ? 0.9 : 0.6;
        const sparkCount = e.kind === 'hit' ? 4 : 14;

        return (
          <group key={e.id} position={e.position as any}>
            <mesh>
              <sphereGeometry args={[radius, 16, 16]} />
              <meshBasicMaterial
                color={e.color}
                transparent
                opacity={opacity}
                depthWrite={false}
              />
            </mesh>
            <Sparkles
              count={sparkCount}
              scale={e.kind === 'hit' ? 1.8 : 4.5}
              size={e.kind === 'hit' ? 1.2 : 1.8}
              speed={e.kind === 'hit' ? 0.4 : 1.1}
              color={e.color}
              opacity={opacity}
            />
            <mesh>
              <sphereGeometry args={[Math.max(0.05, radius * 0.25), 10, 10]} />
              <meshStandardMaterial
                color={e.color}
                emissive={new THREE.Color(e.color)}
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={opacity}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function DebrisField() {
  const debris = useGameStore(s => s.debris);
  const now = Date.now();

  return (
    <>
      {debris.map(d => {
        const age = now - d.createdAt;
        const t = Math.max(0, Math.min(1, age / Math.max(1, d.lifetime)));
        const bob = Math.sin((now / 1000) * 2 + (d.position[0] + d.position[2]) * 0.01) * 0.6;
        const opacity = Math.max(0.15, 1 - t);
        return (
          <group key={d.id} position={[d.position[0], d.position[1] + 1.0 + bob, d.position[2]] as any}>
            <mesh>
              <boxGeometry args={[1.4, 1.0, 1.4]} />
              <meshStandardMaterial
                color={new THREE.Color('#fbbf24')}
                emissive={new THREE.Color('#f59e0b')}
                emissiveIntensity={0.35}
                transparent
                opacity={opacity}
                metalness={0.2}
                roughness={0.35}
              />
            </mesh>
            <mesh>
              <boxGeometry args={[1.8, 1.4, 1.8]} />
              <meshBasicMaterial
                color={'#f59e0b'}
                transparent
                opacity={opacity * 0.18}
                depthWrite={false}
              />
            </mesh>
            <Sparkles count={10} scale={3.2} size={1.4} speed={0.35} color={'#fde68a'} opacity={opacity * 0.6} />
          </group>
        );
      })}
    </>
  );
}

function Ship({ turnLeft = false, turnRight = false }: { turnLeft?: boolean; turnRight?: boolean }) {
  const ship = useGameStore(s => s.ship);
  const hasRig = ship.canMine;
  const hasNav = !!ship.hasNavigationArray;
  const groupRef = useRef<THREE.Group>(null);
  const power = ship.enginePower || 0;

  useFrame((_: unknown, dt: number) => {
    const g = groupRef.current;
    if (!g) return;
    const vx = ship.velocity[0];
    const vy = ship.velocity[1];
    const vz = ship.velocity[2];
    const speedSq = vx*vx + vy*vy + vz*vz;
    if (speedSq < 1e-5) return;
    const dir = new THREE.Vector3(vx, vy, vz).normalize();
    const from = new THREE.Vector3(0, 0, 1);
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(from, dir);
    const s = 1 - Math.exp(-10 * dt);
    g.quaternion.slerp(targetQuat, s);
  });
  return (
    <group ref={groupRef} position={ship.position as any}>
      {ship.kind === 'freighter' && (
        <FreighterModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'heavy_freighter' && (
        <FreighterModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'clipper' && (
        <ClipperModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'racer' && (
        <ClipperModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'miner' && (
        <MinerModel power={power} />
      )}
      {ship.kind === 'industrial_miner' && (
        <MinerModel power={power} />
      )}
      {/* Common nav dish */}
      {hasNav && (
        <group position={[1.5, 0.6, 1.2]} rotation={[0, Math.PI / 6, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 12]} />
            <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2.5, 0, 0]} castShadow>
            <coneGeometry args={[0.35, 0.25, 18]} />
            <meshStandardMaterial color={new THREE.Color('#a1a1aa')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function EscortShip({ escort, playerPosition, playerVelocity }: { escort: any; playerPosition: [number, number, number]; playerVelocity: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const power = 0.6; // Escorts always at moderate power

  useFrame((_: unknown, dt: number) => {
    const g = groupRef.current;
    if (!g) return;
    
    // Calculate distance to formation position
    const escortIndex = parseInt(escort.id.split(':')[2] || '0');
    const isLeftFlank = escortIndex === 0;
    
    // Calculate player forward and right vectors
    let forwardX = playerVelocity[0];
    let forwardZ = playerVelocity[2];
    const speedSq = forwardX * forwardX + forwardZ * forwardZ;
    
    if (speedSq < 0.01) {
      forwardX = 0;
      forwardZ = -1;
    } else {
      const speed = Math.sqrt(speedSq);
      forwardX /= speed;
      forwardZ /= speed;
    }
    
    const rightX = -forwardZ;
    const rightZ = forwardX;
    
    const sideOffset = isLeftFlank ? -18 : 18;
    const backOffset = -12;
    
    const targetX = playerPosition[0] + (rightX * sideOffset) + (forwardX * backOffset);
    const targetY = playerPosition[1];
    const targetZ = playerPosition[2] + (rightZ * sideOffset) + (forwardZ * backOffset);
    
    const dx = targetX - escort.position[0];
    const dy = targetY - escort.position[1];
    const dz = targetZ - escort.position[2];
    const distToTarget = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    let targetQuat: THREE.Quaternion;
    
    if (distToTarget > 3) {
      // Moving to formation: face movement direction
      if (dx*dx + dz*dz > 1e-6) {
        const dir = new THREE.Vector3(dx, dy, dz).normalize();
        const from = new THREE.Vector3(0, 0, 1);
        targetQuat = new THREE.Quaternion().setFromUnitVectors(from, dir);
      } else {
        return;
      }
    } else {
      // In formation: match player's facing direction
      if (forwardX*forwardX + forwardZ*forwardZ > 1e-6) {
        const dir = new THREE.Vector3(forwardX, 0, forwardZ).normalize();
        const from = new THREE.Vector3(0, 0, 1);
        targetQuat = new THREE.Quaternion().setFromUnitVectors(from, dir);
      } else {
        return;
      }
    }
    
    // Smooth rotation
    const slerpSpeed = distToTarget > 3 ? 8 : 12; // Faster rotation when in formation
    const s = 1 - Math.exp(-slerpSpeed * dt);
    g.quaternion.slerp(targetQuat, s);
  });

  return (
    <group ref={groupRef} position={escort.position as any}>
      {/* Escorts use clipper model with green tint to distinguish them */}
      <ClipperModel power={power} hasRig={false} />
      {/* Green identification marker */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={new THREE.Color('#22c55e')} emissive={new THREE.Color('#10b981')} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

import { PlaneGrid } from './components/primitives/PlaneGrid';

import { BeltRing } from './components/primitives/BeltRing';

function TargetReticle() {
  const targetedNpcId = useGameStore(s => s.targetedNpcId);
  const npcTraders = useGameStore(s => s.npcTraders);
  const ship = useGameStore(s => s.ship);

  if (!targetedNpcId || ship.dockedStationId) return null;
  const npc = npcTraders.find(n => n.id === targetedNpcId);
  if (!npc) return null;

  return (
    <Html position={[npc.position[0], npc.position[1] + 2.0, npc.position[2]]} center distanceFactor={45}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          border: '2px solid rgba(239,68,68,0.85)',
          boxShadow: '0 0 18px rgba(239,68,68,0.35)',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 6, border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8 }} />
      </div>
    </Html>
  );
}

export function SceneRoot() {
  const planets = useGameStore(s => s.planets);
  const stations = useGameStore(s => s.stations);
  const belts = useGameStore(s => s.belts);
  const npcTraders = useGameStore(s => s.npcTraders);
  const tick = useGameStore(s => s.tick);
  const thrust = useGameStore(s => s.thrust);
  const setEngineTarget = useGameStore(s => s.setEngineTarget);
  const ship = useGameStore(s => s.ship);
  const trackedStationId = useGameStore(s => s.trackedStationId);
  const { camera } = useThree();
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const yawRef = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const { pressed, lastFacingDir } = useGameInput();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // Movement input evaluated every frame: WSAD on station plane, RF vertical
    const up = new THREE.Vector3(0, 1, 0);
    const yaw = yawRef.current;
    // Forward direction on XZ plane derived from yaw around world Z
    const fwdPlanar = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const rightPlanar = new THREE.Vector3().crossVectors(fwdPlanar, up).normalize();

    const dir = new THREE.Vector3();
    if (pressed['w']) dir.add(fwdPlanar);
    if (pressed['s']) dir.addScaledVector(fwdPlanar, -1);
    if (pressed['a']) dir.addScaledVector(rightPlanar, -1);
    if (pressed['d']) dir.add(rightPlanar);
    if (pressed['r']) dir.add(up);
    if (pressed['f']) dir.addScaledVector(up, -1);
    if (dir.lengthSq() > 0) {
      dir.normalize();
      thrust([dir.x, dir.y, dir.z], dt);
      setEngineTarget(1);
    } else {
      setEngineTarget(0);
    }
    
    tick(dt);

    // Camera follow: keep ship in lower center by offsetting camera behind and above
    const desiredOffset = new THREE.Vector3(0, 20, 35); // above and behind
    const offsetWorld = new THREE.Vector3()
      .addScaledVector(up, desiredOffset.y)
      .addScaledVector(fwdPlanar, -desiredOffset.z)
      .addScaledVector(rightPlanar, desiredOffset.x);
    const target = new THREE.Vector3(ship.position[0], ship.position[1], ship.position[2]);
    const desiredPos = target.clone().add(offsetWorld);
    camera.position.lerp(desiredPos, 1 - Math.exp(-5 * dt)); // smooth chase
    camera.lookAt(target.x, target.y + 2, target.z); // look slightly above ship
  });

  // Mouse camera control
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // middle mouse
        isDragging.current = true;
        e.preventDefault();
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isDragging.current = false;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      yawRef.current += (e.movementX || 0) * 0.005; // sensitivity
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const dockIntroVisibleId = useGameStore(s => s.dockIntroVisibleId);
  return (
    <group>
      <PlaneGrid />
      {planets.map(p => (
        <Planet key={p.id} position={p.position} radius={p.radius} name={p.name} color={(p as any).color} isStar={(p as any).isStar} />
      ))}
      {belts.map(b => (
        <group key={b.id}>
          <BeltRing position={b.position} radius={b.radius} name={b.name} showAsteroids={SHOW_ASTEROIDS} />
          {Math.abs(
            Math.hypot(
              ship.position[0]-b.position[0],
              ship.position[1]-b.position[1],
              ship.position[2]-b.position[2]
            ) - b.radius
            ) < MINING_RANGE_WORLD && !ship.dockedStationId && (
            <Html position={[b.position[0], b.position[1]+3, b.position[2]]} center distanceFactor={60}>
              <div style={{ background:'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>
                  {ship.canMine ? 'Press M to Mine' : 'Dock at a shipyard to buy Mining Rig'}
                </span>
              </div>
            </Html>
          )}
        </group>
      ))}
      {stations.map(s => (
        <group key={s.id}>
          <StationVisual position={s.position} name={s.name} type={s.type} hideLabel={!!dockIntroVisibleId} />
          {/* Dock prompt when near */}
          {Math.hypot(
            ship.position[0]-s.position[0],
            ship.position[1]-s.position[1],
            ship.position[2]-s.position[2]
            ) < MINING_RANGE_WORLD && !ship.dockedStationId && (
            <Html position={[s.position[0], s.position[1]+3, s.position[2]]} center distanceFactor={60}>
              <div style={{ background:'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>Press E to Dock</span>
              </div>
            </Html>
          )}
          {/* Waypoint marker (visible while undocked for clarity) */}
          {trackedStationId === s.id && !ship.dockedStationId && (
            <Html position={[s.position[0], s.position[1]+5, s.position[2]]} center>
              <div style={{ background:'rgba(34,197,94,0.15)', border: '1px solid #22c55e', padding: '4px 8px', borderRadius: 6, color: '#bbf7d0' }}>
                Waypoint
              </div>
            </Html>
          )}
        </group>
      ))}
      {/* NPC trader spheres (non-escorts) */}
      {npcTraders.filter(n => !n.isEscort).map(n => (
        <group key={n.id} position={n.position as any}>
          <mesh castShadow>
            <sphereGeometry args={[0.6, 16, 16]} />
            {/* Commodity color mapping via HSL from id hash for visual distinction; expensive goods slower already */}
            <meshStandardMaterial color={new THREE.Color(colorFromCommodity(n.commodityId || 'fuel'))} metalness={0.2} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Escort ships */}
      {npcTraders.filter(n => n.isEscort).map(n => (
        <EscortShip key={n.id} escort={n} playerPosition={ship.position} playerVelocity={ship.velocity} />
      ))}
      {/* Projectiles */}
      <Projectiles />
      {/* Explosions / hit sparks */}
      <Explosions />
      {/* Debris (cargo drops) */}
      <DebrisField />
      {/* Target reticle */}
      <TargetReticle />
      {/* Mission markers */}
      <MissionMarkers />
      <Ship turnLeft={!!pressed['a']} turnRight={!!pressed['d']} />
    </group>
  );
}


