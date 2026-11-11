import type { GameState } from '../../domain/types/world_types';
export function hasBlockingOverlay(s: GameState): boolean {
  return !!(s.blockingDialog || s.dockIntroVisibleId || s.missionCelebrationData || s.celebrationVisible);
}
export function isSimulationBlocked(s: GameState): boolean {
  return !s.hasChosenStarter || s.paused || hasBlockingOverlay(s);
}
