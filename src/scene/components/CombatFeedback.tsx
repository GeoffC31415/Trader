import { Html } from '@react-three/drei';
import { useGameStore } from '../../state';
import { hullSeverity, impactStrength } from '../../systems/combat/feedback';
import { useReducedMotion } from '../../shared/hooks/use_reduced_motion';

/** Procedural, bounded effects: no downloaded textures, lights or shadow casters. */
export function CombatFeedback() {
  const impacts = useGameStore(s => s.combatImpacts ?? []);
  const time = useGameStore(s => s.gameTime);
  const ship = useGameStore(s => s.ship);
  const npcs = useGameStore(s => s.npcTraders);
  const low = useGameStore(s => s.graphicsQuality === 'low');
  const reduced = useReducedMotion();
  const entities = [{ id: 'player', ...ship }, ...npcs].filter(n => n.hp > 0 && (hullSeverity(n.hp, n.maxHp) > 0.3 || ('onFire' in n && n.onFire)));
  return <group>
    {impacts.slice(low ? -8 : -20).map(hit => {
      const age = Math.max(0, time - hit.at);
      if (age > 0.7) return null;
      const strength = impactStrength(hit.damage);
      const radius = (1.5 + strength * 2) * (reduced ? 1 : 1 + age * 3);
      return <group key={hit.id} position={hit.position}>
        <mesh scale={radius}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={hit.targetId === 'player' ? '#ff765c' : '#ffdf83'} transparent opacity={(1 - age / 0.7) * 0.6} depthWrite={false} wireframe />
        </mesh>
        {!reduced && Array.from({ length: low ? 3 : 6 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * radius, Math.cos(i * 1.7) * radius, Math.cos(i * 2.4) * radius]} scale={0.2 + strength * 0.25}>
          <octahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#ffd992" transparent opacity={1 - age / 0.7} depthWrite={false} />
        </mesh>)}
        <Html center position={[0, radius + 2, 0]} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
          <span style={{ fontSize: 12 + strength * 3, fontWeight: 800, color: hit.targetId === 'player' ? '#ff927d' : '#ffe29b', textShadow: '0 1px 4px #000', opacity: 1 - age / 0.7 }}>−{Math.ceil(hit.damage)}</span>
        </Html>
      </group>;
    })}
    {entities.map(entity => {
      const severity = Math.max(hullSeverity(entity.hp, entity.maxHp), 'onFire' in entity && entity.onFire ? 0.7 : 0);
      const burning = entity.id === 'player' ? !!ship.onFire : severity > 0.65;
      const count = reduced ? 1 : low ? 3 : 7;
      const velocity = entity.velocity ?? [0, 0, 0];
      const speed = Math.max(1, Math.hypot(...velocity));
      return <group key={entity.id} position={entity.position}>
        {Array.from({ length: count }, (_, i) => {
          const phase = reduced ? 0.25 : (time * 0.7 + i / count) % 1;
          return <mesh key={i} position={[-velocity[0] / speed * phase * 12 + Math.sin(i * 2) * phase, 1 + phase * 9, -velocity[2] / speed * phase * 12]} scale={(0.7 + phase * 2.5) * severity * 2}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={burning && phase < 0.4 ? '#ff7d32' : '#75808a'} transparent opacity={(1 - phase) * (burning ? 0.65 : 0.4)} depthWrite={false} />
          </mesh>;
        })}
      </group>;
    })}
  </group>;
}
