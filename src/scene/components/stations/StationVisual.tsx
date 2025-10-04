import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';
import type { StationType } from '../../../domain/types/economy_types';

// Map station types to GLB model files
const stationModelPaths: Record<StationType, string> = {
  city: '/stations/station_solcity.glb',
  refinery: '/stations/station_refinery.glb',
  fabricator: '/stations/station_fabricator.glb',
  power_plant: '/stations/station_powerplant.glb',
  trading_post: '/stations/station_freeport.glb',
  shipyard: '/stations/station_shipyard.glb',
  pirate: '/stations/station_freeport.glb', // Use freeport for pirate stations
  mine: '/stations/station_refinery.glb', // Fallback to refinery
  farm: '/stations/station_farm.glb',
  research: '/stations/station_fabricator.glb', // Fallback to fabricator
  orbital_hab: '/stations/station_solcity.glb', // Fallback to city
};

export function StationVisual({ position, name, type, hideLabel = false }: { position: [number, number, number]; name: string; type: StationType; hideLabel?: boolean }) {
  const modelPath = stationModelPaths[type] || '/stations/station_solcity.glb';
  const { scene } = useGLTF(modelPath);
  
  // Clone the scene so each station instance is independent
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

  // Scale adjustments per station type
  const scale = useMemo(() => {
    switch (type) {
      case 'refinery': return 0.2;
      case 'farm': return 3.0;
      case 'shipyard': return 3.0;
      case 'trading_post': return 0.2;
      case 'city': return 2;
      case 'fabricator': return 2.0;
      default: return 1.0;
    }
  }, [type]);

  return (
    <group position={position as any}>
      <primitive object={clonedScene} scale={scale} />
      {!hideLabel && (
        <Html center distanceFactor={50}><div style={{ fontSize: 14, opacity: 0.5 }}>{name}</div></Html>
      )}
    </group>
  );
}

// Preload all station models for better performance
Object.values(stationModelPaths).forEach((path) => {
  useGLTF.preload(path);
});
