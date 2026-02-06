import { useMemo } from 'react';
import { useGameStore } from '../../../state';
import { UIIcon } from '../ui_icon';

export function DeathScreen() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const respawnPlayer = useGameStore(s => s.respawnPlayer);

  const isVisible = (ship.isDead || ship.hp <= 0) && !ship.dockedStationId;
  const respawnStation = useMemo(() => {
    if (!ship.lastDockedStationId) return undefined;
    return stations.find(s => s.id === ship.lastDockedStationId);
  }, [stations, ship.lastDockedStationId]);

  if (!isVisible) return null;

  const creditsPenaltyMultiplier = 0.9;
  const nextCredits = Math.max(0, Math.floor(ship.credits * creditsPenaltyMultiplier));
  const lostCredits = Math.max(0, ship.credits - nextCredits);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'radial-gradient(circle at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.92) 60%, rgba(0,0,0,0.97) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: 'min(640px, 100%)',
          borderRadius: 14,
          border: '1px solid rgba(239,68,68,0.45)',
          background: 'linear-gradient(135deg, rgba(10,15,25,0.96), rgba(20,10,12,0.96))',
          boxShadow: '0 18px 60px rgba(0,0,0,0.65), 0 0 60px rgba(239,68,68,0.15)',
          padding: 18,
          color: '#e5e7eb',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <UIIcon name="status_traveling" size={20} style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.65))' }} />
          <div>
            <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: '0.6px' }}>EMERGENCY SIGNAL</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fecaca', letterSpacing: '0.6px' }}>
              SHIP DESTROYED
            </div>
          </div>
        </div>

        <div style={{
          padding: 12,
          borderRadius: 10,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)',
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          <div><span style={{ opacity: 0.75 }}>Respawn:</span> <span style={{ fontWeight: 800 }}>{respawnStation?.name ?? 'Nearest safe port'}</span></div>
          <div><span style={{ opacity: 0.75 }}>Credit penalty:</span> <span style={{ fontWeight: 800, color: '#fbbf24' }}>${lostCredits.toLocaleString()}</span> (10%)</div>
          <div><span style={{ opacity: 0.75 }}>Cargo loss:</span> <span style={{ fontWeight: 800, color: '#fca5a5' }}>ALL</span></div>
        </div>

        <button
          onClick={() => respawnPlayer()}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.45)',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.75), rgba(37,99,235,0.75))',
            color: '#eff6ff',
            fontWeight: 900,
            letterSpacing: '0.8px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: '0 10px 30px rgba(37,99,235,0.25)',
          }}
        >
          Respawn
        </button>
      </div>
    </div>
  );
}

