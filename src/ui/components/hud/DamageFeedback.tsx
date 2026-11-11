import { useGameStore } from '../../../state';
import { impactStrength } from '../../../systems/combat/feedback';
import { useReducedMotion } from '../../../shared/hooks/use_reduced_motion';

export function DamageFeedback() {
  const hits = useGameStore(s => s.combatImpacts);
  const time = useGameStore(s => s.gameTime);
  const reduced = useReducedMotion();
  const recent = hits?.filter(hit => hit.targetId === 'player' && time - hit.at < 0.7) ?? [];
  if (!recent.length) return null;
  const last = recent[recent.length - 1];
  const fade = Math.max(0, 1 - (time - last.at) / 0.7);
  const alpha = Math.min(0.55, impactStrength(last.damage) * 0.25) * fade;
  return <div aria-label="Incoming damage" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 32, boxShadow: reduced ? 'none' : `inset 0 0 85px 20px rgba(255,65,40,${alpha})` }}>
    <div role="status" style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', background: '#271215dd', color: '#ffb4a1', border: '1px solid #ff8060', borderRadius: 6, padding: '6px 12px', opacity: fade }}>Hull hit: −{Math.ceil(last.damage)}</div>
  </div>;
}
