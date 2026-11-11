import type { Station } from '../../domain/types/world_types';
import { DOCKING_RANGE_WORLD } from '../../domain/constants/game_constants';
import { distance } from '../../shared/math/vec3';

/** One shared berth selection rule for the prompt, E docking and navigation. */
export function dockingCandidate(stations: Station[], position: [number, number, number], stationId?: string): Station | undefined {
  return stations.filter(st => (!stationId || st.id === stationId) && distance(st.position, position) < DOCKING_RANGE_WORLD)
    .sort((a, b) => distance(a.position, position) - distance(b.position, position))[0];
}
