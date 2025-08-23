import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state/game_state';
import { Html } from '@react-three/drei';

function Planet({ position, radius, name }: { position: [number, number, number]; radius: number; name: string }) {
  return (
    <group position={position as any}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={new THREE.Color('#1f2937')} roughness={1} metalness={0} />
      </mesh>
      <Html center distanceFactor={40}><div style={{ fontSize: 28, opacity: 0.8 }}>{name}</div></Html>
    </group>
  );
}

function StationBox({ position, name, color = '#7dd3fc' }: { position: [number, number, number]; name: string; color?: string }) {
  return (
    <group position={position as any}>
      <mesh>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial color={new THREE.Color(color)} roughness={0.7} metalness={0.1} />
      </mesh>
      <Html center distanceFactor={50}><div style={{ fontSize: 28 }}>{name}</div></Html>
    </group>
  );
}

function ShipyardVisual({ position, name }: { position: [number, number, number]; name: string }) {
  return (
    <group position={position as any}>
      <mesh>
        <torusKnotGeometry args={[3, 0.5, 120, 32]} />
        <meshStandardMaterial color={new THREE.Color('#34d399')} metalness={0.6} roughness={0.2} emissive={new THREE.Color('#10b981')} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[2, 2, 1, 24]} />
        <meshStandardMaterial color={new THREE.Color('#065f46')} metalness={0.3} roughness={0.6} />
      </mesh>
      <Html center distanceFactor={50}><div style={{ fontSize: 28 }}>{name}</div></Html>
    </group>
  );
}

function StationVisual({ position, name, type }: { position: [number, number, number]; name: string; type: import('../systems/economy').StationType }) {
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
  } as Record<string, string>), []);

  return (
    <group position={position as any}>
      {/* Keep overall footprint ~4 x 2 x 4 */}
      {type === 'refinery' && (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[4, 1.4, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.refinery)} metalness={0.2} roughness={0.7} />
          </mesh>
          {/* Stacks */}
          <mesh position={[-1.2, 1.2, -0.8]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[1.2, 1.2, 0.8]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Pipes */}
          <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
            <torusGeometry args={[1.6, 0.08, 10, 60]} />
            <meshStandardMaterial color={new THREE.Color('#a3a3a3')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
      {type === 'fabricator' && (
        <group>
          <mesh>
            <boxGeometry args={[3.8, 1.2, 3.8]} />
            <meshStandardMaterial color={new THREE.Color(base.fabricator)} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color={new THREE.Color(accent.fabricator)} metalness={0.6} roughness={0.3} emissive={new THREE.Color('#4c1d95')} emissiveIntensity={0.15} />
          </mesh>
        </group>
      )}
      {type === 'power_plant' && (
        <group>
          <mesh>
            <cylinderGeometry args={[1.6, 1.6, 2, 24]} />
            <meshStandardMaterial color={new THREE.Color(base.power_plant)} metalness={0.3} roughness={0.5} emissive={new THREE.Color(accent.power_plant)} emissiveIntensity={0.12} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[2.2, 0.1, 12, 80]} />
            <meshStandardMaterial color={new THREE.Color('#14532d')} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'city' && (
        <group>
          <mesh>
            <boxGeometry args={[4, 0.8, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.city)} metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Towers */}
          <mesh position={[-1, 1.1, -1]}>
            <boxGeometry args={[0.6, 2, 0.6]} />
            <meshStandardMaterial color={new THREE.Color('#dbeafe')} />
          </mesh>
          <mesh position={[1, 1.3, 1]}>
            <boxGeometry args={[0.5, 2.4, 0.5]} />
            <meshStandardMaterial color={new THREE.Color('#bfdbfe')} />
          </mesh>
        </group>
      )}
      {type === 'trading_post' && (
        <group>
          <mesh>
            <boxGeometry args={[3.6, 1.0, 3.6]} />
            <meshStandardMaterial color={new THREE.Color(base.trading_post)} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color={new THREE.Color(accent.trading_post)} metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      )}
      {type === 'mine' && (
        <group>
          <mesh>
            <boxGeometry args={[4, 1.0, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.mine)} metalness={0.15} roughness={0.9} />
          </mesh>
          {/* Cranes */}
          <mesh position={[-1.4, 1.0, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
            <meshStandardMaterial color={new THREE.Color('#78350f')} />
          </mesh>
          <mesh position={[1.4, 1.0, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
            <meshStandardMaterial color={new THREE.Color('#78350f')} />
          </mesh>
        </group>
      )}
      {type === 'farm' && (
        <group>
          <mesh>
            <boxGeometry args={[3.6, 0.8, 3.6]} />
            <meshStandardMaterial color={new THREE.Color(base.farm)} metalness={0.1} roughness={0.9} />
          </mesh>
          {/* Domes */}
          <mesh position={[-0.9, 0.8, -0.9]}>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color={new THREE.Color('#bbf7d0')} roughness={0.6} />
          </mesh>
          <mesh position={[0.9, 0.8, 0.9]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color={new THREE.Color('#bbf7d0')} roughness={0.6} />
          </mesh>
        </group>
      )}
      {type === 'research' && (
        <group>
          <mesh>
            <cylinderGeometry args={[1.4, 1.4, 1.6, 20]} />
            <meshStandardMaterial color={new THREE.Color(base.research)} metalness={0.4} roughness={0.4} emissive={new THREE.Color(accent.research)} emissiveIntensity={0.1} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[2.0, 0.08, 12, 64]} />
            <meshStandardMaterial color={new THREE.Color('#155e75')} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'orbital_hab' && (
        <group>
          <mesh>
            <torusGeometry args={[2.0, 0.25, 14, 80]} />
            <meshStandardMaterial color={new THREE.Color(base.orbital_hab)} metalness={0.2} roughness={0.8} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
            <meshStandardMaterial color={new THREE.Color(accent.orbital_hab)} metalness={0.2} roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'shipyard' && (
        <ShipyardVisual position={[0,0,0] as any} name={name} />
      )}
      {type !== 'shipyard' && (
        <Html center distanceFactor={50}><div style={{ fontSize: 28 }}>{name}</div></Html>
      )}
    </group>
  );
}

function Ship() {
  const ship = useGameStore(s => s.ship);
  const hasRig = ship.canMine;
  const groupRef = useRef<THREE.Group>(null);

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
      {/* Main industrial hull */}
      <mesh>
        <boxGeometry args={[3.6, 1.2, 5.6]} />
        <meshStandardMaterial color={new THREE.Color('#6b7280')} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Hull trims */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[3.2, 0.2, 5.0]} />
        <meshStandardMaterial color={new THREE.Color('#4b5563')} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.2, 0.2, 5.0]} />
        <meshStandardMaterial color={new THREE.Color('#4b5563')} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Nose block */}
      <mesh position={[0, 0, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 1.2, 1.0, 16]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 0.3, 2.2]} scale={[1.2, 0.6, 1.0]}>
        <sphereGeometry args={[1.4, 24, 24]} />
        <meshStandardMaterial color={new THREE.Color('#93c5fd')} metalness={0.1} roughness={0.2} emissive={new THREE.Color('#1d4ed8')} emissiveIntensity={0.05} transparent opacity={0.6} />
      </mesh>
      {/* Engine block */}
      <mesh position={[0, -0.2, -2.8]}>
        <boxGeometry args={[3.2, 1.0, 1.2]} />
        <meshStandardMaterial color={new THREE.Color('#374151')} metalness={0.7} roughness={0.5} />
      </mesh>
      {/* Thrusters cluster */}
      <group position={[-1.0, -0.2, -3.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.6, 16]} />
          <meshStandardMaterial color={new THREE.Color('#6b7280')} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.4]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={new THREE.Color('#60a5fa')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.8} />
        </mesh>
      </group>
      <group position={[0, -0.2, -3.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.6, 16]} />
          <meshStandardMaterial color={new THREE.Color('#6b7280')} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.4]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={new THREE.Color('#60a5fa')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.8} />
        </mesh>
      </group>
      <group position={[1.0, -0.2, -3.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.6, 16]} />
          <meshStandardMaterial color={new THREE.Color('#6b7280')} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.4]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={new THREE.Color('#60a5fa')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.8} />
        </mesh>
      </group>
      {/* Antennas */}
      <mesh position={[-1.4, 0.9, 0.6]}>
        <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.4, 1.4, 0.6]}>
        <coneGeometry args={[0.08, 0.2, 10]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.3, 0.8, -0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Dish antenna */}
      <group position={[1.5, 0.6, 1.2]} rotation={[0, Math.PI / 6, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 12]} />
          <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2.5, 0, 0]}>
          <coneGeometry args={[0.35, 0.25, 18]} />
          <meshStandardMaterial color={new THREE.Color('#a1a1aa')} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* Side ports */}
      <mesh position={[-2.0, 0, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 20]} />
        <meshStandardMaterial color={new THREE.Color('#111827')} metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[2.0, 0, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 20]} />
        <meshStandardMaterial color={new THREE.Color('#111827')} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Windows - port side */}
      <group>
        <mesh position={[-1.6, 0.25, 1.2]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-1.6, 0.25, 0.6]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-1.6, 0.25, 0.0]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-1.6, 0.25, -0.6]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
      </group>
      {/* Windows - starboard side */}
      <group>
        <mesh position={[1.6, 0.25, 1.2]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[1.6, 0.25, 0.6]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[1.6, 0.25, 0.0]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[1.6, 0.25, -0.6]}>
          <boxGeometry args={[0.18, 0.08, 0.02]} />
          <meshStandardMaterial color={new THREE.Color('#e5f2ff')} emissive={new THREE.Color('#60a5fa')} emissiveIntensity={0.6} />
        </mesh>
      </group>
      {/* Piping/greebles */}
      <mesh position={[0, -0.1, 0]}>
        <torusGeometry args={[1.6, 0.06, 12, 64]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Running lights */}
      <mesh position={[0.6, -0.5, 2.6]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={new THREE.Color('#f87171')} emissive={new THREE.Color('#f87171')} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.6, -0.5, 2.6]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={new THREE.Color('#34d399')} emissive={new THREE.Color('#34d399')} emissiveIntensity={0.8} />
      </mesh>
      {/* Mining rig attachment (visible when purchased) */}
      {hasRig && (
        <group position={[0, -0.4, 2.6]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 1.2, 12]} />
            <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.25, 0.6, 16]} />
            <meshStandardMaterial color={new THREE.Color('#d1d5db')} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, -0.3]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.4]} />
            <meshStandardMaterial color={new THREE.Color('#374151')} metalness={0.5} roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function PlaneGrid() {
  return (
    <gridHelper args={[400, 80, '#374151', '#1f2937']} />
  );
}

function BeltRing({ position, radius, name }: { position: [number, number, number]; radius: number; name: string }) {
  return (
    <group position={position as any}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.5, 16, 120]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} roughness={0.9} metalness={0.1} />
      </mesh>
      <Html center distanceFactor={12}><div style={{ fontSize: 12 }}>{name}</div></Html>
    </group>
  );
}

export function SceneRoot() {
  const planets = useGameStore(s => s.planets);
  const stations = useGameStore(s => s.stations);
  const belts = useGameStore(s => s.belts);
  const tick = useGameStore(s => s.tick);
  const thrust = useGameStore(s => s.thrust);
  const tryDock = useGameStore(s => s.tryDock);
  const undock = useGameStore(s => s.undock);
  const mine = useGameStore(s => s.mine);
  const ship = useGameStore(s => s.ship);
  const { camera } = useThree();
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3());

  const pressed = useRef<Record<string, boolean>>({});

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // Movement input evaluated every frame: WSAD on station plane, RF vertical
    const up = new THREE.Vector3(0, 1, 0);
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    let fwdPlanar = camForward.clone().projectOnPlane(up);
    if (fwdPlanar.lengthSq() < 1e-6) fwdPlanar.set(0, 0, -1); // fallback if looking straight up/down
    fwdPlanar.normalize();
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
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tryDock, undock, mine]);

  return (
    <group>
      <PlaneGrid />
      {planets.map(p => (
        <Planet key={p.id} position={p.position} radius={p.radius} name={p.name} />
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
          ) < 6 && !ship.dockedStationId && (
            <Html position={[b.position[0], b.position[1]+3, b.position[2]]} center distanceFactor={60}>
              <div style={{ background:'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 6, fontSize: 24 }}>
                {ship.canMine ? 'Press M to Mine' : 'Dock at a shipyard to buy Mining Rig'}
              </div>
            </Html>
          )}
        </group>
      ))}
      {stations.map(s => (
        <group key={s.id}>
          <StationVisual position={s.position} name={s.name} type={s.type} />
          {/* Dock prompt when near */}
          {Math.hypot(
            ship.position[0]-s.position[0],
            ship.position[1]-s.position[1],
            ship.position[2]-s.position[2]
          ) < 8 && !ship.dockedStationId && (
            <Html position={[s.position[0], s.position[1]+3, s.position[2]]} center distanceFactor={60}>
              <div style={{ background:'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 6, fontSize: 24 }}>
                Press E to Dock
              </div>
            </Html>
          )}
        </group>
      ))}
      <Ship />
    </group>
  );
}


