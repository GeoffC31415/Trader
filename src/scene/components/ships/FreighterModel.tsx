import { Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';

export function FreighterModel({ power, hasRig }: { power: number; hasRig: boolean }) {
  const { scene } = useGLTF('/ships/freighter_ship.glb');
  
  // Clone the scene so each ship instance is independent
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Setup shadows and materials
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return (
    <>
      <primitive object={clonedScene} position={[0, -3.8, 1.9]} />
      
      {/* Engine glow effects */}
      {[-1, 0, 1].map((ix, i) => (
        <group key={i} position={[ix * 1.0, -0.2, -3.6]}>
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

// Preload the model for better performance
useGLTF.preload('/ships/freighter_ship.glb');


