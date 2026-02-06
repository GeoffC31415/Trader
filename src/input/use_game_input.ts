import { useEffect, useRef } from 'react';
import { useGameStore } from '../state';
import { INPUT_ACTIONS } from './keyboard_bindings';
import type { InputAction } from './keyboard_bindings';
import { calculateLeadPosition, getWeaponStats } from '../systems/combat/weapon_systems';

/**
 * Game-specific input hook that integrates with game store actions
 */
export function useGameInput() {
  const pressed = useRef<Record<string, boolean>>({});
  const lastFacingDir = useRef<[number, number, number]>([0, 0, 1]);
  const tryDock = useGameStore(s => s.tryDock);
  const undock = useGameStore(s => s.undock);
  const mine = useGameStore(s => s.mine);
  const ship = useGameStore(s => s.ship);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code;
      
      // Handle action keys
      if (key === 'e') {
        tryDock();
        return;
      }
      if (key === 'q') {
        undock();
        return;
      }
      if (key === 'm') {
        mine();
        return;
      }
      if (key === 'tab' || code === 'Tab') {
        e.preventDefault();
        useGameStore.getState().cycleTarget();
        return;
      }
      if (key === 'escape' || code === 'Escape') {
        useGameStore.getState().clearTarget();
        return;
      }
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        
        // Calculate target position based on ship's forward direction
        const state = useGameStore.getState();
        const shipState = state.ship;
        const targetedNpcId = state.targetedNpcId;
        const targetedNpc = targetedNpcId ? state.npcTraders.find(n => n.id === targetedNpcId) : undefined;
        if (targetedNpc) {
          const stats = getWeaponStats(shipState.weapon);
          const projectileSpeed = stats.projectileSpeed;
          const leadPos = calculateLeadPosition(
            shipState.position,
            targetedNpc.position,
            targetedNpc.velocity || [0, 0, 0],
            projectileSpeed
          );
          state.fireWeapon(leadPos);
          return;
        }

        const vx = shipState.velocity[0];
        const vy = shipState.velocity[1];
        const vz = shipState.velocity[2];
        const speedSq = vx * vx + vy * vy + vz * vz;
        
        let dirX: number, dirY: number, dirZ: number;
        if (speedSq < 0.001) {
          [dirX, dirY, dirZ] = lastFacingDir.current;
        } else {
          const speed = Math.sqrt(speedSq);
          dirX = vx / speed;
          dirY = vy / speed;
          dirZ = vz / speed;
        }
        
        const fireRange = 100;
        const targetPos: [number, number, number] = [
          shipState.position[0] + dirX * fireRange,
          shipState.position[1] + dirY * fireRange,
          shipState.position[2] + dirZ * fireRange,
        ];
        
        state.fireWeapon(targetPos);
        return;
      }
      
      // Movement keys
      pressed.current[key] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressed.current[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tryDock, undock, mine]);

  // Update last facing direction when ship is moving
  useEffect(() => {
    const vx = ship.velocity[0];
    const vy = ship.velocity[1];
    const vz = ship.velocity[2];
    const speedSq = vx * vx + vy * vy + vz * vz;
    if (speedSq > 0.001) {
      const speed = Math.sqrt(speedSq);
      lastFacingDir.current = [vx / speed, vy / speed, vz / speed];
    }
  }, [ship.velocity]);

  return {
    pressed: pressed.current,
    lastFacingDir: lastFacingDir.current,
  };
}

