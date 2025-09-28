import { Html } from '@react-three/drei';
import * as THREE from 'three';
import React from 'react';

export function Planet({ position, radius, name, color = '#2b3b55', isStar = false }: { position: [number, number, number]; radius: number; name: string; color?: string; isStar?: boolean }) {
  return (
    <group position={position as any}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 48, 48]} />
        {isStar ? (
          <meshStandardMaterial color={new THREE.Color(color)} emissive={new THREE.Color(color)} emissiveIntensity={1.2} roughness={0.3} metalness={0.0} />
        ) : (
          <meshStandardMaterial color={new THREE.Color(color)} roughness={0.85} metalness={0.05} />
        )}
      </mesh>
      {isStar && (
        <pointLight args={[new THREE.Color(color), 1.5, 500, 2]} />
      )}
      <Html center distanceFactor={40}><div style={{ fontSize: 28, opacity: 0.8 }}>{name}</div></Html>
    </group>
  );
}


