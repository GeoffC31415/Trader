import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import React, { useMemo } from 'react';

// Asteroid model paths
const asteroidModels = [
  '/asteroids/asteroid_01.glb',  // big model
  '/asteroids/asteroid_02.glb',
  '/asteroids/asteroid_ore.glb',
];

// Preload asteroid models
asteroidModels.forEach(path => useGLTF.preload(path));

function AsteroidField({ radius }: { radius: number }) {
  // Load all asteroid models
  const asteroid1 = useGLTF(asteroidModels[0]);
  const asteroid2 = useGLTF(asteroidModels[1]);
  const asteroid3 = useGLTF(asteroidModels[2]);
  
  const asteroidScenes = [asteroid1.scene, asteroid2.scene, asteroid3.scene];

  // Generate asteroid positions and properties
  const asteroids = useMemo(() => {
    const count = Math.floor(radius * 0.5); // Scale count based on belt size
    const items = [];
    
    // Seeded random for consistent placement
    let seed = radius * 123.456;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + random() * 0.5;
      const radiusVariation = (random() - 0.5) * 8; // Spread across belt width
      const heightVariation = (random() - 0.5) * 6; // Vertical variation
      const r = radius + radiusVariation;
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = heightVariation;
      
      items.push({
        position: [x, y, z] as [number, number, number],
        rotation: [random() * Math.PI * 2, random() * Math.PI * 2, random() * Math.PI * 2] as [number, number, number],
        modelIndex: 1 + Math.floor(random() * 2),
        scale: 0.05 + random() * 0.005, // 1% scale with slight variation
      });
    }
    
    return items;
  }, [radius]);

  return (
    <>
      {asteroids.map((asteroid, i) => {
        const model = asteroidScenes[asteroid.modelIndex].clone();
        return (
          <primitive
            key={i}
            object={model}
            position={asteroid.position}
            rotation={asteroid.rotation}
            scale={asteroid.scale}
          />
        );
      })}
    </>
  );
}

export function BeltRing({ position, radius, name, showAsteroids = true }: { position: [number, number, number]; radius: number; name: string; showAsteroids?: boolean }) {
  return (
    <group position={position as any}>
      {/* Subtle background ring guide */}
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[radius, 0.5, 16, 120]} />
        <meshStandardMaterial color={new THREE.Color('#9ca3af')} roughness={0.9} metalness={0.1} transparent opacity={showAsteroids ? 0.3 : 1.0} />
      </mesh>
      
      {/* Scatter asteroid models - can be toggled for performance */}
      {showAsteroids && <AsteroidField radius={radius} />}
      
      <Html center distanceFactor={12}><div style={{ fontSize: 12 }}>{name}</div></Html>
    </group>
  );
}


