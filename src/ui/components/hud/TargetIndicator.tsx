import { useMemo } from 'react';
import { useGameStore } from '../../../state';
import { UIIcon } from '../ui_icon';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function TargetIndicator() {
  const ship = useGameStore(s => s.ship);
  const npcTraders = useGameStore(s => s.npcTraders);
  const targetedNpcId = useGameStore(s => s.targetedNpcId);
  const clearTarget = useGameStore(s => s.clearTarget);

  const target = useMemo(() => {
    if (!targetedNpcId) return undefined;
    return npcTraders.find(n => n.id === targetedNpcId);
  }, [npcTraders, targetedNpcId]);

  if (!target || ship.dockedStationId) return null;

  const dx = target.position[0] - ship.position[0];
  const dy = target.position[1] - ship.position[1];
  const dz = target.position[2] - ship.position[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const hpPct = clamp01(target.maxHp > 0 ? target.hp / target.maxHp : 0);

  return (
    <div
      style={{
        position: 'absolute',
        top: 88,
        left: 18,
        zIndex: 60,
        background: 'linear-gradient(135deg, rgba(11,18,32,0.92), rgba(15,23,42,0.92))',
        border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: 10,
        padding: '10px 12px',
        color: '#e5e7eb',
        fontFamily: 'monospace',
        minWidth: 240,
        boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <UIIcon name="tab_missions" size={16} />
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.6px' }}>TARGET LOCK</div>
        <button
          onClick={() => clearTarget()}
          style={{
            marginLeft: 'auto',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(0,0,0,0.25)',
            color: '#e5e7eb',
            borderRadius: 8,
            padding: '2px 8px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 11,
            opacity: 0.9,
          }}
          title="Clear target (Esc)"
        >
          ESC
        </button>
      </div>

      <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
        {target.kind ?? target.shipKind ?? 'contact'} • {target.fromId}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.85, marginBottom: 6 }}>
        <div>DIST</div>
        <div style={{ fontWeight: 800 }}>{Math.floor(distance)}m</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
        <div>HP</div>
        <div style={{ fontWeight: 800 }}>{Math.max(0, Math.round(target.hp))}/{Math.max(1, Math.round(target.maxHp))}</div>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.round(hpPct * 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ef4444, #fb7185)',
            boxShadow: '0 0 10px rgba(239,68,68,0.45)',
            transition: 'width 120ms linear',
          }}
        />
      </div>

      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.65 }}>
        Tab: cycle targets • Space: fire at lock
      </div>
    </div>
  );
}

