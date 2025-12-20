/**
 * NPC Module
 * 
 * Handles NPC trader movement, pathfinding, escort behavior, and stock delivery.
 */

import { distance } from '../../shared/math/vec3';
import { planNpcPath } from '../npc';
import type { NpcTrader, Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';

/**
 * Result of NPC updates including stock changes
 */
export interface NpcUpdateResult {
  npcTraders: NpcTrader[];
  stationStockDelta: Record<string, Record<string, number>>;
}

/**
 * Update all NPC traders for one frame
 * Handles contract escorts, mission escorts, and regular traders
 * 
 * @param npcTraders - Current NPC traders
 * @param stations - All stations (for pathfinding)
 * @param playerShip - Player ship state (for escort formation)
 * @param dt - Delta time in seconds
 * @returns Updated NPCs and stock changes
 */
export function updateNpcTraders(
  npcTraders: NpcTrader[],
  stations: Station[],
  playerShip: { position: [number, number, number]; velocity: [number, number, number] },
  dt: number
): NpcUpdateResult {
  const stationById: Record<string, Station> = Object.fromEntries(
    stations.map(s => [s.id, s])
  );
  const stationStockDelta: Record<string, Record<string, number>> = {};

  const updatedNpcTraders = npcTraders.map((npc): NpcTrader => {
    // Contract escorts follow the player ship in formation
    if (npc.isEscort) {
      return updateContractEscort(npc, playerShip, dt);
    }

    // Mission escorts follow their path to destination
    if (npc.isMissionEscort) {
      return updateMissionEscort(npc, stationById, dt);
    }

    // Regular NPC traders continue their trading routes
    return updateRegularTrader(npc, stationById, stationStockDelta, dt);
  });

  return { npcTraders: updatedNpcTraders, stationStockDelta };
}

/**
 * Update contract escort NPCs (follow player in formation)
 */
function updateContractEscort(
  npc: NpcTrader,
  playerShip: { position: [number, number, number]; velocity: [number, number, number] },
  dt: number
): NpcTrader {
  const playerPos = playerShip.position;
  const playerVel = playerShip.velocity;

  // Formation offset based on escort index: 0 = left flank, 1 = right flank
  const escortIndex = parseInt(npc.id.split(':')[2] || '0');
  const isLeftFlank = escortIndex === 0;

  // Calculate player's forward direction from velocity (or default forward if stationary)
  let forwardX = playerVel[0];
  let forwardZ = playerVel[2];
  const speedSq = forwardX * forwardX + forwardZ * forwardZ;

  if (speedSq < 0.01) {
    // If player is stationary, use default forward direction (negative Z in world space)
    forwardX = 0;
    forwardZ = -1;
  } else {
    // Normalize forward direction
    const speed = Math.sqrt(speedSq);
    forwardX /= speed;
    forwardZ /= speed;
  }

  // Calculate right vector (perpendicular to forward)
  const rightX = -forwardZ;
  const rightZ = forwardX;

  // Formation position: offset to side and slightly behind
  const sideOffset = isLeftFlank ? -18 : 18; // Left or right flank
  const backOffset = -12; // Slightly behind player

  const targetX = playerPos[0] + rightX * sideOffset + forwardX * backOffset;
  const targetY = playerPos[1];
  const targetZ = playerPos[2] + rightZ * sideOffset + forwardZ * backOffset;

  // Move towards formation position
  const dx = targetX - npc.position[0];
  const dy = targetY - npc.position[1];
  const dz = targetZ - npc.position[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist > 3) {
    // Move if not in formation
    // Move at a speed proportional to distance, with a cap based on player velocity
    const playerSpeed = Math.sqrt(
      playerVel[0] * playerVel[0] +
        playerVel[1] * playerVel[1] +
        playerVel[2] * playerVel[2]
    );
    const npcSpeed = npc.speed || 10;
    const maxSpeed = Math.max(playerSpeed * 1.2, npcSpeed); // Slightly faster to catch up
    const speed = Math.min(maxSpeed * dt, dist);
    const ux = dx / Math.max(1e-6, dist);
    const uy = dy / Math.max(1e-6, dist);
    const uz = dz / Math.max(1e-6, dist);
    const position: [number, number, number] = [
      npc.position[0] + ux * speed,
      npc.position[1] + uy * speed,
      npc.position[2] + uz * speed,
    ];
    return { ...npc, position, velocity: playerVel }; // Store player velocity for orientation
  }

  return { ...npc, velocity: playerVel }; // Update velocity even when in position
}

/**
 * Update mission escort NPCs (follow path to destination)
 */
function updateMissionEscort(
  npc: NpcTrader,
  stationById: Record<string, Station>,
  dt: number
): NpcTrader {
  const dest = stationById[npc.toId];
  if (!dest) return npc;

  const npcSpeed = npc.speed || 8; // Mission escorts move at medium speed
  const step = npcSpeed * dt;
  let path = npc.path;
  let progress = npc.pathProgress ?? 0;

  if (!path || path.length < 2) {
    // Generate path if missing
    const from = stationById[npc.fromId];
    if (from) {
      path = planNpcPath(from, dest, npc.position);
      progress = 0;
    }
  }

  if (path && path.length > 0) {
    let position: [number, number, number] = npc.position;
    let cursor = Math.floor(progress);

    while (cursor < path.length) {
      const target = path[cursor];
      const dx = target[0] - position[0];
      const dy = target[1] - position[1];
      const dz = target[2] - position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= step) {
        position = [target[0], target[1], target[2]];
        progress = cursor + 1;
        cursor += 1;
        continue;
      }

      const ux = dx / Math.max(1e-6, dist);
      const uy = dy / Math.max(1e-6, dist);
      const uz = dz / Math.max(1e-6, dist);
      position = [
        position[0] + ux * step,
        position[1] + uy * step,
        position[2] + uz * step,
      ];
      progress = cursor + step / dist;
      break;
    }

    return { ...npc, position, path, pathProgress: progress };
  }

  return npc;
}

/**
 * Update regular trading NPC (follows trade routes)
 */
function updateRegularTrader(
  npc: NpcTrader,
  stationById: Record<string, Station>,
  stationStockDelta: Record<string, Record<string, number>>,
  dt: number
): NpcTrader {
  const dest = stationById[npc.toId];
  const src = stationById[npc.fromId];
  if (!dest || !src) return npc;

  const npcSpeed = npc.speed || 10; // Default speed for regular traders
  const step = npcSpeed * dt;
  let path = npc.path;
  let cursor = npc.pathCursor ?? 0;

  if (!path || path.length < 2) {
    // Lazy plan in case older saves or missing
    const from = stationById[npc.fromId];
    path = planNpcPath(from, dest, npc.position);
    cursor = 1;
  }

  let position: [number, number, number] = npc.position;

  while (cursor < (path?.length || 0)) {
    const target = path![cursor];
    const dx = target[0] - position[0];
    const dy = target[1] - position[1];
    const dz = target[2] - position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist <= step) {
      position = [target[0], target[1], target[2]];
      cursor += 1;
      continue;
    }

    const ux = dx / Math.max(1e-6, dist);
    const uy = dy / Math.max(1e-6, dist);
    const uz = dz / Math.max(1e-6, dist);
    position = [
      position[0] + ux * step,
      position[1] + uy * step,
      position[2] + uz * step,
    ];
    break;
  }

  // Arrived at end of path -> deliver and reverse route
  if (cursor >= (path?.length || 0)) {
    // NPCs trade 20-50 units (noticeable impact on market)
    const deliver = 20 + Math.floor(Math.random() * 31); // 20-50 range
    // Only process commodity delivery if NPC is carrying a commodity
    if (npc.commodityId) {
      const srcInv = src.inventory[npc.commodityId];
      const dstInv = dest.inventory[npc.commodityId];
      if (
        srcInv &&
        srcInv.canSell !== false &&
        dstInv &&
        dstInv.canBuy !== false
      ) {
        // Check source stock: don't drain below 20% of target stock
        // Target stock is typically 50 (normal) or 200 (cheap/boosted)
        const currentStock = (srcInv.stock || 0) + (stationStockDelta[src.id]?.[npc.commodityId] || 0);
        const targetStock = srcInv.stock || 50; // Use current stock as proxy for target
        const minStock = Math.max(10, Math.floor(targetStock * 0.2)); // At least 20% of target, min 10
        
        // Only trade if source has enough stock
        if (currentStock >= minStock + deliver) {
          stationStockDelta[src.id] = stationStockDelta[src.id] || {};
          stationStockDelta[src.id][npc.commodityId] =
            (stationStockDelta[src.id][npc.commodityId] || 0) - deliver;
          stationStockDelta[dest.id] = stationStockDelta[dest.id] || {};
          stationStockDelta[dest.id][npc.commodityId] =
            (stationStockDelta[dest.id][npc.commodityId] || 0) + deliver;
        }
      }
    }
    // Reverse route; plan curved path back
    const backPath = planNpcPath(dest, src, dest.position);
    return {
      ...npc,
      position: [dest.position[0], dest.position[1], dest.position[2]],
      fromId: npc.toId,
      toId: npc.fromId,
      path: backPath,
      pathCursor: 1,
    };
  }

  return { ...npc, position, path, pathCursor: cursor };
}

/**
 * Apply stock deltas to stations
 * 
 * @param stations - Current stations
 * @param stationStockDelta - Stock changes by station and commodity
 * @returns Updated stations with new stock levels
 */
export function applyStockDeltas(
  stations: Station[],
  stationStockDelta: Record<string, Record<string, number>>
): Station[] {
  if (Object.keys(stationStockDelta).length === 0) {
    return stations;
  }

  return stations.map(s => {
    const delta = stationStockDelta[s.id];
    if (!delta) return s;

    const inv: StationInventory = { ...s.inventory };
    for (const cid of Object.keys(delta)) {
      const item = inv[cid];
      if (!item) continue;
      const nextStock = Math.max(0, (item.stock || 0) + delta[cid]);
      inv[cid] = { ...item, stock: nextStock };
    }

    return { ...s, inventory: inv };
  });
}

