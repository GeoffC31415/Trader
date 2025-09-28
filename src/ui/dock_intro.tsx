import { useMemo } from 'react';
import { useGameStore } from '../state/game_state';

// Import all generated avatars as URLs via Vite's glob import
const avatarModules = import.meta.glob('../../generated_avatars/*.png', { eager: true, as: 'url' }) as Record<string, string>;

function toSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_\.\s]/gi, '_').replace(/\s+/g, ' ').trim();
}

export function DockIntro() {
  const stationId = useGameStore(s => s.dockIntroVisibleId);
  const stations = useGameStore(s => s.stations);
  const dismiss = useGameStore(s => s.dismissDockIntro);
  const station = useMemo(() => stations.find(s => s.id === stationId), [stations, stationId]);
  const persona = station?.persona;
  const line = useMemo(() => {
    if (!persona) return undefined;
    const pool = [...(persona.lines || []), ...(persona.tips || [])];
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [stationId]);
  const avatarUrl = useMemo(() => {
    if (!station || !persona) return undefined;
    const target = `${toSafeFilename(station.id)} - ${toSafeFilename(persona.name)}.png`;
    let found: string | undefined;
    for (const [key, url] of Object.entries(avatarModules)) {
      if (key.endsWith(target)) { found = url; break; }
    }
    return found;
  }, [stationId]);

  if (!stationId || !station) return null;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      }}
    >
      <div style={{ background: 'rgba(12,15,22,1.0)', padding: 20, borderRadius: 12, width: 680, color: '#e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 10, opacity: 0.9 }}>Docked: {station.name}</div>
        {persona && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {avatarUrl && (
              <img src={avatarUrl} alt={`${persona.name} avatar`} style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }} />
            )}
            <div style={{ fontWeight: 700 }}>{persona.name}</div>
            <div style={{ opacity: 0.8, fontSize: 12, marginTop: -6 }}>{persona.title}</div>
            {line && (
              <div style={{ opacity: 0.95, fontStyle: 'italic', marginTop: 8 }}>
                "{line}"
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={dismiss}>Continue</button>
        </div>
      </div>
    </div>
  );
}


