import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import React from 'react';

export function ClipperModel({ power, hasRig }: { power: number; hasRig: boolean }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.8, 5.0]} />
        <meshStandardMaterial color={new THREE.Color('#ef4444')} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 2.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.9, 1.0, 20]} />
        <meshStandardMaterial color={new THREE.Color('#b91c1c')} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-1.6, 0.0, 0.6]} rotation={[0, 0.1, 0.2]} castShadow>
        <boxGeometry args={[0.2, 0.1, 3.0]} />
        <meshStandardMaterial color={new THREE.Color('#7f1d1d')} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[1.6, 0.0, 0.6]} rotation={[0, -0.1, -0.2]} castShadow>
        <boxGeometry args={[0.2, 0.1, 3.0]} />
        <meshStandardMaterial color={new THREE.Color('#7f1d1d')} metalness={0.6} roughness={0.5} />
      </mesh>
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


