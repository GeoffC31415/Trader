import { Grid, ContactShadows } from '@react-three/drei';
import React from 'react';

export function PlaneGrid() {
  return (
    <>
      <Grid
        infiniteGrid
        cellSize={2}
        cellThickness={0.6}
        sectionSize={20}
        sectionThickness={1.0}
        fadeDistance={120}
        fadeStrength={2}
        followCamera
        position={[0, -0.01, 0] as any}
        args={[400, 400] as any}
      />
      <ContactShadows
        position={[0, -0.02, 0] as any}
        opacity={0.6}
        width={200}
        height={200}
        blur={2}
        far={40}
        resolution={1024}
        color="#000000"
        frames={1}
      />
    </>
  );
}


