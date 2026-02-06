import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../../state';

export function DamageVignette() {
  const lastDamageTime = useGameStore(s => s.lastDamageTime);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!lastDamageTime) return;
    setPulseKey(k => k + 1);
  }, [lastDamageTime]);

  const isVisible = !!lastDamageTime;
  const alpha = useMemo(() => {
    if (!lastDamageTime) return 0;
    const age = Date.now() - lastDamageTime;
    const duration = 380;
    const t = Math.max(0, Math.min(1, age / duration));
    return (1 - t) * 0.55;
  }, [lastDamageTime, pulseKey]);

  if (!isVisible || alpha <= 0.01) return null;

  return (
    <div
      key={pulseKey}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        pointerEvents: 'none',
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(239,68,68,${alpha}) 100%)`,
        animation: 'damageVignetteFlash 380ms ease-out 1',
      }}
    >
      <style>{`
        @keyframes damageVignetteFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

