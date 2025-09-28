import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import React from 'react';

export function MinerModel({ power }: { power: number }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.2, 5.2]} />
        <meshStandardMaterial color={new THREE.Color('#8b5e3c')} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[-1.9, -0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 2.8]} />
        <meshStandardMaterial color={new THREE.Color('#7c4a2a')} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[1.9, -0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 2.8]} />
        <meshStandardMaterial color={new THREE.Color('#7c4a2a')} metalness={0.3} roughness={0.7} />
      </mesh>
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


