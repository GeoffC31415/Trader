import { Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';

export function MinerModel({ power }: { power: number }) {
  const { scene } = useGLTF('/ships/general_ship.glb');
  
  // Clone the scene so each ship instance is independent
  const clonedScene = useMemo(() => {
    console.log('MinerModel: Loading general_ship.glb', scene);
    return scene.clone();
  }, [scene]);
  
  // Setup shadows and materials
  useEffect(() => {
    let meshCount = 0;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        meshCount++;
      }
    });
    console.log('MinerModel: Found', meshCount, 'meshes in model');
  }, [clonedScene]);

  return (
    <>
      <primitive object={clonedScene} position={[0, -0.8, -3.9]}/>
      
      {/* Engine glow effects */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, -0.2, -3.0]}>
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

// Preload the model for better performance
useGLTF.preload('/ships/general_ship.glb');


