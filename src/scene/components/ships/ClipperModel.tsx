import { Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';

export function ClipperModel({ power, hasRig }: { power: number; hasRig: boolean }) {
  const { scene } = useGLTF('/ships/racer_ship.glb');
  
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
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} position={[0, 0, 1.85]} />
      
      {/* Engine glow effects */}
      {[-1, 1].map((ix, i) => (
        <group key={i} position={[ix * 0.9, -0.2, -3.0]}>
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

// Preload the model for better performance
useGLTF.preload('/ships/racer_ship.glb');


