import { useMemo, useEffect } from 'react';
import { useGameStore } from '../state';

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

  useEffect(() => {
    if (!stationId) return;
    const onKey = (e: KeyboardEvent) => {
      const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
      if (isSpace) {
        e.preventDefault();
        e.stopPropagation();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [stationId, dismiss]);

  if (!stationId || !station) return null;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      }}
    >
      <div style={{ background: 'rgba(12,15,22,1.0)', padding: 20, borderRadius: 12, width: '50vw', height: '50vh', color: '#e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 12, opacity: 0.9 }}>Docked: {station.name}</div>
        {persona && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={`${persona.name} avatar`}
                  style={{
                    width: 'min(22vw, 40vh)',
                    height: 'min(22vw, 40vh)',
                    objectFit: 'cover',
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{persona.name}</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>{persona.title}</div>
              {line && (
                <div style={{ opacity: 0.95, fontStyle: 'italic', fontSize: 18, lineHeight: 1.45, textAlign: 'left' }}>
                  "{line}"
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={dismiss}>Continue</button>
        </div>
      </div>
    </div>
  );
}


