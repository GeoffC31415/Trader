import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../state';
import * as music from './music_audio';
import { gameConfig } from '../../config/game_config';

/** No autoplay before consent; starter selection starts the very first exploration track. */
export function useMusicController(): void {
  const docked = useGameStore(s => s.ship.dockedStationId);
  const chosen = useGameStore(s => s.hasChosenStarter);
  const projectiles = useGameStore(s => s.projectiles);
  const aggression = useGameStore(s => s.npcAggression);
  const [gesture, setGesture] = useState(0);
  const lastTrack = useRef<string>();
  const inCombat = projectiles.length > 0 || Object.values(aggression).some(a => a.isAggressive);
  const enabled = gameConfig.audio?.musicEnabled ?? true;
  const volume = gameConfig.audio?.musicVolume ?? 0.7;
  useEffect(() => {
    music.preloadManifest();
    const interact = (event: Event) => {
      if (event instanceof KeyboardEvent && event.repeat) return;
      setGesture(n => n + 1);
    };
    document.addEventListener('pointerdown', interact, true);
    document.addEventListener('keydown', interact, true);
    return () => { document.removeEventListener('pointerdown', interact, true); document.removeEventListener('keydown', interact, true); };
  }, []);
  useEffect(() => { music.setVolume(volume); }, [volume]);
  useEffect(() => {
    if (!enabled) { lastTrack.current = undefined; void music.stopAll(); return; }
    if (!chosen || !gesture) return;
    const track = docked ?? (inCombat ? 'ambient_combat' : 'ambient_exploring');
    if (lastTrack.current === track && music.getPlaybackState().playing) return;
    let cancelled = false;
    const request = docked ? music.playStation(docked) : music.playAmbient(inCombat ? 'combat' : 'exploring');
    request.then(() => { if (!cancelled && music.getPlaybackState().trackId === track) lastTrack.current = track; }).catch(() => {
      // A denied/failed play is not a successful initialization. Next gesture retries.
      if (!cancelled) lastTrack.current = undefined;
    });
    return () => { cancelled = true; };
  }, [chosen, docked, inCombat, gesture, enabled]);
}
