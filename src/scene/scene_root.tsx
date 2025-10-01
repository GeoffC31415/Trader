import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state';
import { Html, Sparkles } from '@react-three/drei';
import type { StationType } from '../domain/types/economy_types';

const SCALE = 10;

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

function StationBox({ position, name, color = '#7dd3fc' }: { position: [number, number, number]; name: string; color?: string }) {
  return (
    <group position={position as any}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial color={new THREE.Color(color)} roughness={0.7} metalness={0.1} />
      </mesh>
      <Html center distanceFactor={50}><div style={{ fontSize: 28 }}>{name}</div></Html>
    </group>
  );
}

function ShipyardVisual({ position, name, hideLabel = false }: { position: [number, number, number]; name: string; hideLabel?: boolean }) {
  return (
    <group position={position as any}>
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[3, 0.5, 120, 32]} />
        <meshStandardMaterial color={new THREE.Color('#34d399')} metalness={0.6} roughness={0.2} emissive={new THREE.Color('#10b981')} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 1, 24]} />
        <meshStandardMaterial color={new THREE.Color('#065f46')} metalness={0.3} roughness={0.6} />
      </mesh>
      {!hideLabel && <Html center distanceFactor={50}><div style={{ fontSize: 14, opacity: 0.5 }}>{name}</div></Html>}
    </group>
  );
}

function StationVisual({ position, name, type, hideLabel = false }: { position: [number, number, number]; name: string; type: StationType; hideLabel?: boolean }) {
  // Base color palette by function (subtle, desaturated)
  const base = useMemo(() => ({
    refinery: '#9a7b4f',
    fabricator: '#6b7280',
    power_plant: '#6ee7b7',
    city: '#cbd5e1',
    trading_post: '#f1c40f',
    mine: '#8b5e3c',
    farm: '#86efac',
    research: '#67e8f9',
    orbital_hab: '#e5e7eb',
    shipyard: '#34d399',
    pirate: '#a855f7',
  } as Record<string, string>), []);

  const accent = useMemo(() => ({
    refinery: '#b45309',
    fabricator: '#8b5cf6',
    power_plant: '#10b981',
    city: '#60a5fa',
    trading_post: '#f59e0b',
    mine: '#92400e',
    farm: '#22c55e',
    research: '#22d3ee',
    orbital_hab: '#94a3b8',
    shipyard: '#10b981',
    pirate: '#7c3aed',
  } as Record<string, string>), []);

  return (
    <group position={position as any}>
      {/* Keep overall footprint ~4 x 2 x 4 */}
      {type === 'refinery' && (
        <group>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 1.4, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.refinery)} metalness={0.2} roughness={0.7} />
          </mesh>
          {/* Stacks */}
          <mesh position={[-1.2, 1.2, -0.8]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[1.2, 1.2, 0.8]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Pipes */}
          <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <torusGeometry args={[1.6, 0.08, 10, 60]} />
            <meshStandardMaterial color={new THREE.Color('#a3a3a3')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
      {type === 'fabricator' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.8, 1.2, 3.8]} />
            <meshStandardMaterial color={new THREE.Color(base.fabricator)} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color={new THREE.Color(accent.fabricator)} metalness={0.6} roughness={0.3} emissive={new THREE.Color('#4c1d95')} emissiveIntensity={0.15} />
          </mesh>
        </group>
      )}
      {type === 'power_plant' && (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.6, 1.6, 2, 24]} />
            <meshStandardMaterial color={new THREE.Color(base.power_plant)} metalness={0.3} roughness={0.5} emissive={new THREE.Color(accent.power_plant)} emissiveIntensity={0.12} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[2.2, 0.1, 12, 80]} />
            <meshStandardMaterial color={new THREE.Color('#14532d')} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'city' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4, 0.8, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.city)} metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Towers */}
          <mesh position={[-1, 1.1, -1]} castShadow>
            <boxGeometry args={[0.6, 2, 0.6]} />
            <meshStandardMaterial color={new THREE.Color('#dbeafe')} />
          </mesh>
          <mesh position={[1, 1.3, 1]} castShadow>
            <boxGeometry args={[0.5, 2.4, 0.5]} />
            <meshStandardMaterial color={new THREE.Color('#bfdbfe')} />
          </mesh>
        </group>
      )}
      {type === 'trading_post' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 1.0, 3.6]} />
            <meshStandardMaterial color={new THREE.Color(base.trading_post)} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]} castShadow>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color={new THREE.Color(accent.trading_post)} metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      )}
      {type === 'pirate' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 1.0, 3.6]} />
            <meshStandardMaterial color={new THREE.Color(base.pirate)} metalness={0.6} roughness={0.4} emissive={new THREE.Color('#4c1d95')} emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 1.0, 0]} rotation={[0, 0, 0]} castShadow>
            <dodecahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color={new THREE.Color(accent.pirate)} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}
      {type === 'mine' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4, 1.0, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.mine)} metalness={0.15} roughness={0.9} />
          </mesh>
          {/* Cranes */}
          <mesh position={[-1.4, 1.0, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
            <meshStandardMaterial color={new THREE.Color('#78350f')} />
          </mesh>
          <mesh position={[1.4, 1.0, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
            <meshStandardMaterial color={new THREE.Color('#78350f')} />
          </mesh>
        </group>
      )}
      {type === 'farm' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 0.8, 3.6]} />
            <meshStandardMaterial color={new THREE.Color(base.farm)} metalness={0.1} roughness={0.9} />
          </mesh>
          {/* Domes */}
          <mesh position={[-0.9, 0.8, -0.9]} castShadow>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color={new THREE.Color('#bbf7d0')} roughness={0.6} />
          </mesh>
          <mesh position={[0.9, 0.8, 0.9]} castShadow>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color={new THREE.Color('#bbf7d0')} roughness={0.6} />
          </mesh>
        </group>
      )}
      {type === 'research' && (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.4, 1.4, 1.6, 20]} />
            <meshStandardMaterial color={new THREE.Color(base.research)} metalness={0.4} roughness={0.4} emissive={new THREE.Color(accent.research)} emissiveIntensity={0.1} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[2.0, 0.08, 12, 64]} />
            <meshStandardMaterial color={new THREE.Color('#155e75')} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'orbital_hab' && (
        <group>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[2.0, 0.25, 14, 80]} />
            <meshStandardMaterial color={new THREE.Color(base.orbital_hab)} metalness={0.2} roughness={0.8} />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
            <meshStandardMaterial color={new THREE.Color(accent.orbital_hab)} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'shipyard' && (
        <ShipyardVisual position={[0,0,0] as any} name={name} hideLabel={hideLabel} />
      )}
      {type !== 'shipyard' && !hideLabel && (
        <Html center distanceFactor={50}><div style={{ fontSize: 14, opacity: 0.5 }}>{name}</div></Html>
      )}
    </group>
  );
}

function FreighterModel({ power, turnLeftPower, turnRightPower, hasRig }: { power: number; turnLeftPower: number; turnRightPower: number; hasRig: boolean }) {
  return (
    <>
      {/* Hull - gold freighter */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.2, 6.2]} />
        <meshStandardMaterial color={new THREE.Color('#d4af37')} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Cargo spine */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.3, 5.6]} />
        <meshStandardMaterial color={new THREE.Color('#8a6d1a')} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Bridge bubble */}
      <mesh position={[0, 0.4, 2.4]} scale={[1.2, 0.7, 1.1]} castShadow>
        <sphereGeometry args={[1.4, 24, 24]} />
        <meshStandardMaterial color={new THREE.Color('#ffe9a8')} metalness={0.2} roughness={0.2} emissive={new THREE.Color('#b45309')} emissiveIntensity={0.08} transparent opacity={0.5} />
      </mesh>
      {/* Engines - 3 clustered, modest flame */}
      {[-1, 0, 1].map((ix, i) => (
        <group key={i} position={[ix * 1.0, -0.2, -3.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.34, 0.6, 16]} />
            <meshStandardMaterial color={new THREE.Color('#8a6d1a')} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.4]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color={new THREE.Color('#ffd08a')} emissive={new THREE.Color('#f59e0b')} emissiveIntensity={0.15 + 0.9 * power} />
          </mesh>
          <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.5 + 0.5 * power, 1, Math.max(0.08, 0.9 * power)]}>
            <cylinderGeometry args={[0.02, 0.3, 1.1, 16]} />
            <meshStandardMaterial color={new THREE.Color('#ffd08a')} emissive={new THREE.Color('#fb923c')} emissiveIntensity={0.25 + 0.7 * power} transparent opacity={0.7 * power} roughness={0.2} metalness={0} />
          </mesh>
        </group>
      ))}
      <Sparkles count={Math.max(8, Math.floor(24 + power * 90))} scale={[2.6, 2.6, 3.2]} size={1.2} speed={0.6 + power} color={new THREE.Color('#ffd08a') as any} opacity={0.7} position={[0, -0.2, -3.9] as any} />
      {/* Mining rig mount if purchased */}
      {hasRig && (
        <group position={[0, -0.45, 2.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1.2, 12]} />
            <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <coneGeometry args={[0.25, 0.6, 16]} />
            <meshStandardMaterial color={new THREE.Color('#d1d5db')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </>
  );
}

function ClipperModel({ power, turnLeftPower, turnRightPower, hasRig }: { power: number; turnLeftPower: number; turnRightPower: number; hasRig: boolean }) {
  return (
    <>
      {/* Sleek red fuselage */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.8, 5.0]} />
        <meshStandardMaterial color={new THREE.Color('#ef4444')} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, 2.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.9, 1.0, 20]} />
        <meshStandardMaterial color={new THREE.Color('#b91c1c')} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Wings */}
      <mesh position={[-1.6, 0.0, 0.6]} rotation={[0, 0.1, 0.2]} castShadow>
        <boxGeometry args={[0.2, 0.1, 3.0]} />
        <meshStandardMaterial color={new THREE.Color('#7f1d1d')} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[1.6, 0.0, 0.6]} rotation={[0, -0.1, -0.2]} castShadow>
        <boxGeometry args={[0.2, 0.1, 3.0]} />
        <meshStandardMaterial color={new THREE.Color('#7f1d1d')} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Dual engines - stronger exhaust */}
      {[-1, 1].map((ix, i) => (
        <group key={i} position={[ix * 0.9, -0.2, -3.0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.34, 0.6, 16]} />
            <meshStandardMaterial color={new THREE.Color('#991b1b')} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.4]}>
            <sphereGeometry args={[0.17, 12, 12]} />
            <meshStandardMaterial color={new THREE.Color('#fecaca')} emissive={new THREE.Color('#f87171')} emissiveIntensity={0.2 + 1.3 * power} />
          </mesh>
          <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.7 + 0.7 * power, 1, Math.max(0.12, 1.4 * power)]}>
            <cylinderGeometry args={[0.02, 0.32, 1.2, 16]} />
            <meshStandardMaterial color={new THREE.Color('#fecaca')} emissive={new THREE.Color('#ef4444')} emissiveIntensity={0.35 + 1.0 * power} transparent opacity={0.8 * power} roughness={0.2} metalness={0} />
          </mesh>
        </group>
      ))}
      <Sparkles count={Math.max(12, Math.floor(30 + power * 150))} scale={[2.0, 2.0, 2.6]} size={1.0} speed={0.9 + power} color={new THREE.Color('#ffd08a') as any} opacity={0.75} position={[0, -0.2, -3.4] as any} />
      {/* Rig if purchased */}
      {hasRig && (
        <group position={[0, -0.4, 2.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.0, 12]} />
            <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.22, 0.5, 16]} />
            <meshStandardMaterial color={new THREE.Color('#e5e7eb')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </>
  );
}

function MinerModel({ power, turnLeftPower, turnRightPower, hasRig }: { power: number; turnLeftPower: number; turnRightPower: number; hasRig: boolean }) {
  return (
    <>
      {/* Brown utilitarian hull */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.2, 5.2]} />
        <meshStandardMaterial color={new THREE.Color('#8b5e3c')} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Side cargo pods */}
      <mesh position={[-1.9, -0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 2.8]} />
        <meshStandardMaterial color={new THREE.Color('#7c4a2a')} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[1.9, -0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 2.8]} />
        <meshStandardMaterial color={new THREE.Color('#7c4a2a')} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Drill rig - always visible for miner */}
      <group position={[0, -0.4, 2.6]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 12]} />
          <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <coneGeometry args={[0.28, 0.7, 16]} />
          <meshStandardMaterial color={new THREE.Color('#d1d5db')} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, -0.3]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.34, 0.5]} />
          <meshStandardMaterial color={new THREE.Color('#374151')} metalness={0.5} roughness={0.6} />
        </mesh>
      </group>
      {/* Small twin engines */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, -0.2, -3.0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 0.6, 16]} />
            <meshStandardMaterial color={new THREE.Color('#6b4b2e')} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.4]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color={new THREE.Color('#ffd08a')} emissive={new THREE.Color('#b45309')} emissiveIntensity={0.15 + 0.8 * power} />
          </mesh>
          <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.5 + 0.5 * power, 1, Math.max(0.08, 0.9 * power)]}>
            <cylinderGeometry args={[0.02, 0.28, 1.0, 16]} />
            <meshStandardMaterial color={new THREE.Color('#ffd08a')} emissive={new THREE.Color('#b45309')} emissiveIntensity={0.25 + 0.7 * power} transparent opacity={0.7 * power} roughness={0.2} metalness={0} />
          </mesh>
        </group>
      ))}
      <Sparkles count={Math.max(8, Math.floor(20 + power * 80))} scale={[2.2, 2.2, 2.8]} size={1.0} speed={0.6 + power} color={new THREE.Color('#ffd08a') as any} opacity={0.7} position={[0, -0.2, -3.2] as any} />
    </>
  );
}

function Ship({ turnLeft = false, turnRight = false }: { turnLeft?: boolean; turnRight?: boolean }) {
  const ship = useGameStore(s => s.ship);
  const hasRig = ship.canMine;
  const hasNav = !!ship.hasNavigationArray;
  const groupRef = useRef<THREE.Group>(null);
  const power = ship.enginePower || 0;
  const turnLeftPower = turnLeft ? 1 : 0;
  const turnRightPower = turnRight ? 1 : 0;

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
        <FreighterModel power={power} turnLeftPower={turnLeftPower} turnRightPower={turnRightPower} hasRig={hasRig} />
      )}
      {ship.kind === 'clipper' && (
        <ClipperModel power={power} turnLeftPower={turnLeftPower} turnRightPower={turnRightPower} hasRig={hasRig} />
      )}
      {ship.kind === 'racer' && (
        <ClipperModel power={power} turnLeftPower={turnLeftPower} turnRightPower={turnRightPower} hasRig={hasRig} />
      )}
      {ship.kind === 'miner' && (
        <MinerModel power={power} turnLeftPower={turnLeftPower} turnRightPower={turnRightPower} hasRig={true} />
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

import { PlaneGrid } from './components/primitives/PlaneGrid';

import { BeltRing } from './components/primitives/BeltRing';

export function SceneRoot() {
  const planets = useGameStore(s => s.planets);
  const stations = useGameStore(s => s.stations);
  const belts = useGameStore(s => s.belts);
  const npcTraders = useGameStore(s => s.npcTraders);
  const tick = useGameStore(s => s.tick);
  const thrust = useGameStore(s => s.thrust);
  const setEngineTarget = useGameStore(s => s.setEngineTarget);
  const tryDock = useGameStore(s => s.tryDock);
  const undock = useGameStore(s => s.undock);
  const mine = useGameStore(s => s.mine);
  const ship = useGameStore(s => s.ship);
  const trackedStationId = useGameStore(s => s.trackedStationId);
  const { camera } = useThree();
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const yawRef = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const pressed = useRef<Record<string, boolean>>({});

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // Movement input evaluated every frame: WSAD on station plane, RF vertical
    const up = new THREE.Vector3(0, 1, 0);
    const yaw = yawRef.current;
    // Forward direction on XZ plane derived from yaw around world Z
    const fwdPlanar = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const rightPlanar = new THREE.Vector3().crossVectors(fwdPlanar, up).normalize();

    const dir = new THREE.Vector3();
    if (pressed.current['w']) dir.add(fwdPlanar);
    if (pressed.current['s']) dir.addScaledVector(fwdPlanar, -1);
    if (pressed.current['a']) dir.addScaledVector(rightPlanar, -1);
    if (pressed.current['d']) dir.add(rightPlanar);
    if (pressed.current['r']) dir.add(up);
    if (pressed.current['f']) dir.addScaledVector(up, -1);
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
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'e') { tryDock(); return; }
      if (key === 'q') { undock(); return; }
      if (key === 'm') { mine(); return; }
      pressed.current[key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressed.current[key] = false;
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tryDock, undock, mine]);

  const dockIntroVisibleId = useGameStore(s => s.dockIntroVisibleId);
  return (
    <group>
      <PlaneGrid />
      {planets.map(p => (
        <Planet key={p.id} position={p.position} radius={p.radius} name={p.name} color={(p as any).color} isStar={(p as any).isStar} />
      ))}
      {belts.map(b => (
        <group key={b.id}>
          <BeltRing position={b.position} radius={b.radius} name={b.name} />
          {Math.abs(
            Math.hypot(
              ship.position[0]-b.position[0],
              ship.position[1]-b.position[1],
              ship.position[2]-b.position[2]
            ) - b.radius
          ) < 6 * SCALE && !ship.dockedStationId && (
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
          ) < 6 * SCALE && !ship.dockedStationId && (
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
      {/* NPC trader spheres */}
      {npcTraders.map(n => (
        <group key={n.id} position={n.position as any}>
          <mesh castShadow>
            <sphereGeometry args={[0.6, 16, 16]} />
            {/* Commodity color mapping via HSL from id hash for visual distinction; expensive goods slower already */}
            <meshStandardMaterial color={new THREE.Color(colorFromCommodity(n.commodityId))} metalness={0.2} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Ship turnLeft={!!pressed.current['a']} turnRight={!!pressed.current['d']} />
    </group>
  );
}


