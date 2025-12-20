import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FreighterModel } from './ships/FreighterModel';
import { ClipperModel } from './ships/ClipperModel';
import { MinerModel } from './ships/MinerModel';
import { useGameStore } from '../../state';

export function Ship({ turnLeft = false, turnRight = false }: { turnLeft?: boolean; turnRight?: boolean }) {
  const ship = useGameStore(s => s.ship);
  const hasRig = ship.canMine;
  const hasNav = !!ship.hasNavigationArray;
  const groupRef = useRef<THREE.Group>(null);
  const power = ship.enginePower || 0;

  useFrame((_: unknown, dt: number) => {
    const g = groupRef.current;
    if (!g) return;
    const vx = ship.velocity[0];
    const vy = ship.velocity[1];
    const vz = ship.velocity[2];
    const speedSq = vx*vx + vy*vy + vz*vz;
    if (speedSq < 1e-5) return;
    const dir = new THREE.Vector3(vx, vy, vz).normalize();
    const from = new THREE.Vector3(0, 0, 1);
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(from, dir);
    const s = 1 - Math.exp(-10 * dt);
    g.quaternion.slerp(targetQuat, s);
  });
  return (
    <group ref={groupRef} position={ship.position as any}>
      {ship.kind === 'freighter' && (
        <FreighterModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'heavy_freighter' && (
        <FreighterModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'clipper' && (
        <ClipperModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'racer' && (
        <ClipperModel power={power} hasRig={hasRig} />
      )}
      {ship.kind === 'miner' && (
        <MinerModel power={power} />
      )}
      {ship.kind === 'industrial_miner' && (
        <MinerModel power={power} />
      )}
      {hasNav && (
        <group position={[1.5, 0.6, 1.2]} rotation={[0, Math.PI / 6, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 12]} />
            <meshStandardMaterial color={new THREE.Color('#9ca3af')} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2.5, 0, 0]} castShadow>
            <coneGeometry args={[0.35, 0.25, 18]} />
            <meshStandardMaterial color={new THREE.Color('#a1a1aa')} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}


