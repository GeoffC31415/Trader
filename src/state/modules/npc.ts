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
 * Handles contract escorts, mission escorts, hostile pirates, and regular traders
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
  
  // Find escort NPCs for pirates to target
  const escortNpcs = npcTraders.filter(n => n.isMissionEscort && n.hp > 0);

  const updatedNpcTraders = npcTraders.map((npc): NpcTrader => {
    // Contract escorts follow the player ship in formation
    if (npc.isEscort) {
      return updateContractEscort(npc, playerShip, dt);
    }

    // Mission escorts follow their path to destination
    if (npc.isMissionEscort) {
      return updateMissionEscort(npc, stationById, dt);
    }

    // Hostile pirates chase and attack escort ships
    if (npc.isHostile && npc.isMissionTarget && npc.hp > 0) {
      return updateHostilePirate(npc, escortNpcs, playerShip, dt);
    }

    // Regular NPC traders continue their trading routes
    return updateRegularTrader(npc, stationById, stationStockDelta, dt);
  });

  return { npcTraders: updatedNpcTraders, stationStockDelta };
}

/**
 * Update hostile pirate NPCs (orbit around nearest escort or player)
 */
function updateHostilePirate(
  npc: NpcTrader,
  escortNpcs: NpcTrader[],
  playerShip: { position: [number, number, number]; velocity: [number, number, number] },
  dt: number
): NpcTrader {
  const pirateSpeed = 12; // Pirates move at a medium-fast speed
  const orbitDistance = 50; // Distance to orbit around target
  const orbitSpeed = 0.5; // Radians per second for orbit
  
  // Find nearest escort to chase
  let targetPos: [number, number, number] | null = null;
  let nearestDist = Infinity;
  
  // First priority: chase mission escorts
  for (const escort of escortNpcs) {
    if (escort.missionId === npc.missionId) {
      const dist = distance(npc.position, escort.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        targetPos = escort.position;
      }
    }
  }
  
  // Fallback: chase player if no escorts found
  if (!targetPos) {
    targetPos = playerShip.position;
    nearestDist = distance(npc.position, targetPos);
  }
  
  // Calculate vector from target to pirate
  const dx = npc.position[0] - targetPos[0];
  const dy = npc.position[1] - targetPos[1];
  const dz = npc.position[2] - targetPos[2];
  const dist = Math.sqrt(dx * dx + dz * dz); // Distance in XZ plane for orbit
  
  // If too far, move towards the orbit distance
  if (dist > orbitDistance * 1.5) {
    // Approach the target until within orbit range
    const step = pirateSpeed * dt;
    const totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const ux = -dx / totalDist;
    const uy = -dy / totalDist;
    const uz = -dz / totalDist;
    
    const newPosition: [number, number, number] = [
      npc.position[0] + ux * step,
      npc.position[1] + uy * step,
      npc.position[2] + uz * step,
    ];
    
    return { ...npc, position: newPosition, velocity: [ux * pirateSpeed, uy * pirateSpeed, uz * pirateSpeed] };
  }
  
  // If too close, move outward
  if (dist < orbitDistance * 0.5) {
    const step = pirateSpeed * dt * 0.5; // Move out slower
    const ux = dx / Math.max(dist, 1);
    const uz = dz / Math.max(dist, 1);
    
    const newPosition: [number, number, number] = [
      npc.position[0] + ux * step,
      npc.position[1], // Keep Y stable
      npc.position[2] + uz * step,
    ];
    
    return { ...npc, position: newPosition, velocity: [ux * pirateSpeed * 0.5, 0, uz * pirateSpeed * 0.5] };
  }
  
  // Within orbit range - orbit around the target
  // Calculate current angle from target
  const currentAngle = Math.atan2(dz, dx);
  
  // Use NPC id hash to vary orbit direction and speed slightly
  const idHash = npc.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const orbitDirection = (idHash % 2 === 0) ? 1 : -1; // Clockwise or counter-clockwise
  const speedVariation = 0.8 + (idHash % 5) * 0.1; // 0.8 to 1.2x speed
  
  // Calculate new angle
  const newAngle = currentAngle + orbitDirection * orbitSpeed * speedVariation * dt;
  
  // Calculate new position on orbit
  const newX = targetPos[0] + Math.cos(newAngle) * orbitDistance;
  const newZ = targetPos[2] + Math.sin(newAngle) * orbitDistance;
  
  // Gradually adjust Y to match target (with some variation)
  const targetY = targetPos[1] + ((idHash % 20) - 10); // Slight Y offset based on ID
  const newY = npc.position[1] + (targetY - npc.position[1]) * dt * 0.5;
  
  const newPosition: [number, number, number] = [newX, newY, newZ];
  
  // Calculate velocity based on orbit movement
  const velX = (newX - npc.position[0]) / dt;
  const velY = (newY - npc.position[1]) / dt;
  const velZ = (newZ - npc.position[2]) / dt;
  
  return { ...npc, position: newPosition, velocity: [velX, velY, velZ] };
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
 * Find the best route to stabilize low-stock commodities
 * Prioritizes commodities that are critically low at any station
 */
function findStabilizingRoute(
  currentStation: Station,
  stations: Station[],
  stationStockDelta: Record<string, Record<string, number>>
): { toStation: Station; commodityId: string } | null {
  type RouteCandidate = {
    toStation: Station;
    fromStation: Station;
    commodityId: string;
    urgency: number; // Lower ratio = more urgent
    surplus: number; // How much surplus the source has
  };

  const candidates: RouteCandidate[] = [];

  // Find all stations with low stock commodities
  for (const destStation of stations) {
    if (destStation.id === currentStation.id) continue;

    for (const [commodityId, item] of Object.entries(destStation.inventory)) {
      if (item.canBuy === false) continue; // Station doesn't buy this
      
      const currentStock = (item.stock || 0) + (stationStockDelta[destStation.id]?.[commodityId] || 0);
      const targetStock = item.stock || 50;
      const ratio = currentStock / Math.max(1, targetStock);
      
      // Only consider if stock is below 60% (getting low)
      if (ratio >= 0.6) continue;

      // Check if current station can supply this commodity
      const srcItem = currentStation.inventory[commodityId];
      if (!srcItem || srcItem.canSell === false) continue;
      
      const srcStock = (srcItem.stock || 0) + (stationStockDelta[currentStation.id]?.[commodityId] || 0);
      const srcTarget = srcItem.stock || 50;
      const srcRatio = srcStock / Math.max(1, srcTarget);
      
      // Only supply if source has surplus (>80% stock)
      if (srcRatio <= 0.8) continue;
      
      candidates.push({
        toStation: destStation,
        fromStation: currentStation,
        commodityId,
        urgency: ratio, // Lower is more urgent
        surplus: srcStock - srcTarget * 0.5, // How much we can spare
      });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by urgency (lowest stock ratio first), then by surplus
  candidates.sort((a, b) => {
    const urgencyDiff = a.urgency - b.urgency;
    if (Math.abs(urgencyDiff) > 0.1) return urgencyDiff;
    return b.surplus - a.surplus; // Prefer higher surplus
  });

  const best = candidates[0];
  return { toStation: best.toStation, commodityId: best.commodityId };
}

/**
 * Update regular trading NPC (follows trade routes)
 * NPCs dynamically choose routes to stabilize low-stock commodities
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

  // Arrived at end of path -> deliver and pick new route
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
        const currentStock = (srcInv.stock || 0) + (stationStockDelta[src.id]?.[npc.commodityId] || 0);
        const targetStock = srcInv.stock || 50;
        const minStock = Math.max(10, Math.floor(targetStock * 0.2));
        
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
    
    // Try to find a route that helps stabilize low-stock commodities
    const stations = Object.values(stationById);
    const stabilizingRoute = findStabilizingRoute(dest, stations, stationStockDelta);
    
    if (stabilizingRoute) {
      // Found a route to help a low-stock station
      const newPath = planNpcPath(dest, stabilizingRoute.toStation, dest.position);
      return {
        ...npc,
        position: [dest.position[0], dest.position[1], dest.position[2]],
        fromId: dest.id,
        toId: stabilizingRoute.toStation.id,
        commodityId: stabilizingRoute.commodityId,
        path: newPath,
        pathCursor: 1,
      };
    }
    
    // No urgent routes found, just reverse the current route
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

import { recalculatePriceForStock, getTargetStock } from '../../systems/economy/pricing';

/**
 * Apply stock deltas to stations
 * 
 * Recalculates prices from BASE values when stock changes,
 * preventing any price compounding over time.
 * 
 * @param stations - Current stations
 * @param stationStockDelta - Stock changes by station and commodity
 * @returns Updated stations with new stock levels and adjusted prices
 */
export function applyStockDeltas(
  stations: Station[],
  stationStockDelta: Record<string, Record<string, number>>
): Station[] {
  if (Object.keys(stationStockDelta).length === 0) {
    return stations;
  }

  // Create stationsMeta once for all stations
  const stationsMeta = stations.map(s => ({ id: s.id, type: s.type, position: s.position }));

  return stations.map(s => {
    const delta = stationStockDelta[s.id];
    if (!delta) return s;

    const inv: StationInventory = { ...s.inventory };
    for (const cid of Object.keys(delta)) {
      const item = inv[cid];
      if (!item) continue;
      
      const nextStock = Math.max(0, (item.stock || 0) + delta[cid]);
      
      // Recalculate prices from BASE values to prevent compounding
      const targetStock = getTargetStock(s.type, cid);
      const newPrices = recalculatePriceForStock(
        s.type,
        cid,
        item.buy,
        item.sell,
        nextStock,
        targetStock,
        s.position,
        stationsMeta
      );
      
      inv[cid] = { 
        ...item, 
        stock: nextStock,
        buy: newPrices.buy,
        sell: newPrices.sell,
      };
    }

    return { ...s, inventory: inv };
  });
}

