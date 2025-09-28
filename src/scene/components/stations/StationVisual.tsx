import { Html } from '@react-three/drei';
import * as THREE from 'three';
import React, { useMemo } from 'react';
import type { StationType } from '../../../domain/types/economy_types';

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

export function StationVisual({ position, name, type, hideLabel = false }: { position: [number, number, number]; name: string; type: StationType; hideLabel?: boolean }) {
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
      {type === 'refinery' && (
        <group>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 1.4, 4]} />
            <meshStandardMaterial color={new THREE.Color(base.refinery)} metalness={0.2} roughness={0.7} />
          </mesh>
          <mesh position={[-1.2, 1.2, -0.8]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[1.2, 1.2, 0.8]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 12]} />
            <meshStandardMaterial color={new THREE.Color(accent.refinery)} metalness={0.3} roughness={0.6} />
          </mesh>
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


