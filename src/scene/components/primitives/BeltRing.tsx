import { Html } from '@react-three/drei';
import * as THREE from 'three';
import React from 'react';

export function BeltRing({ position, radius, name }: { position: [number, number, number]; radius: number; name: string }) {
  return (
    <group position={position as any}>
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[radius, 0.5, 16, 120]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} roughness={0.9} metalness={0.1} />
      </mesh>
      <Html center distanceFactor={12}><div style={{ fontSize: 12 }}>{name}</div></Html>
    </group>
  );
}


