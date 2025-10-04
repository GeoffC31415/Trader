/**
 * Faction reputation system
 * Handles reputation propagation and faction standing calculations
 */

import type { Station } from '../../domain/types/world_types';
import {
  FACTIONS,
  FACTION_PROPAGATION_MULTIPLIER,
  FACTION_REP_THRESHOLDS,
  getFactionForStation,
  getStationsInFaction,
  type FactionId,
} from '../../domain/constants/faction_constants';

export type FactionStanding = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';

/**
 * Get faction standing based on reputation value
 */
export function getFactionStanding(reputation: number): FactionStanding {
  if (reputation < FACTION_REP_THRESHOLDS.HOSTILE) return 'hostile';
  if (reputation < FACTION_REP_THRESHOLDS.UNFRIENDLY) return 'unfriendly';
  if (reputation < FACTION_REP_THRESHOLDS.FRIENDLY) return 'neutral';
  if (reputation < FACTION_REP_THRESHOLDS.ALLIED) return 'friendly';
  return 'allied';
}

/**
 * Get average reputation for a faction across all member stations
 */
export function getFactionReputation(factionId: FactionId, stations: Station[]): number {
  const memberStations = getStationsInFaction(factionId);
  const memberStationData = stations.filter(s => memberStations.includes(s.id));
  
  if (memberStationData.length === 0) return 0;
  
  const totalRep = memberStationData.reduce((sum, station) => sum + (station.reputation || 0), 0);
  return Math.round(totalRep / memberStationData.length);
}

/**
 * Get all faction reputations
 */
export function getAllFactionReputations(stations: Station[]): Record<FactionId, number> {
  return {
    sol_government: getFactionReputation('sol_government', stations),
    workers: getFactionReputation('workers', stations),
    corporate: getFactionReputation('corporate', stations),
    pirate: getFactionReputation('pirate', stations),
  };
}

/**
 * Apply reputation change with faction propagation
 * When a station's rep changes, other stations in the same faction change by FACTION_PROPAGATION_MULTIPLIER
 * 
 * @param stations - Current stations array
 * @param targetStationId - Station where reputation is directly affected
 * @param repChange - Amount of reputation change (positive or negative)
 * @returns Updated stations array with faction propagation applied
 */
export function applyReputationWithPropagation(
  stations: Station[],
  targetStationId: string,
  repChange: number
): Station[] {
  const targetFaction = getFactionForStation(targetStationId);
  
  if (!targetFaction) {
    // No faction, just apply to target station
    return stations.map(s =>
      s.id === targetStationId
        ? { ...s, reputation: clampReputation((s.reputation || 0) + repChange) }
        : s
    );
  }
  
  // Get all stations in the same faction
  const factionStations = getStationsInFaction(targetFaction);
  const propagatedChange = repChange * FACTION_PROPAGATION_MULTIPLIER;
  
  return stations.map(s => {
    if (s.id === targetStationId) {
      // Direct target gets full change
      return { ...s, reputation: clampReputation((s.reputation || 0) + repChange) };
    } else if (factionStations.includes(s.id)) {
      // Other faction members get propagated change
      return { ...s, reputation: clampReputation((s.reputation || 0) + propagatedChange) };
    }
    return s;
  });
}

/**
 * Apply reputation changes to multiple stations with faction propagation
 * Used for mission rewards that affect multiple factions
 * 
 * @param stations - Current stations array
 * @param reputationChanges - Map of stationId -> rep delta
 * @returns Updated stations array
 */
export function applyMultipleReputationChanges(
  stations: Station[],
  reputationChanges: Record<string, number>
): Station[] {
  let updatedStations = stations;
  
  // Track faction changes to avoid double-propagation
  const factionAdjustments: Record<FactionId, number> = {
    sol_government: 0,
    workers: 0,
    corporate: 0,
    pirate: 0,
  };
  
  // First, calculate all direct changes and faction propagations
  for (const [stationId, repChange] of Object.entries(reputationChanges)) {
    const faction = getFactionForStation(stationId);
    if (faction) {
      factionAdjustments[faction] += repChange * FACTION_PROPAGATION_MULTIPLIER;
    }
  }
  
  // Apply all changes
  updatedStations = updatedStations.map(station => {
    let newRep = station.reputation || 0;
    
    // Apply direct change if this station is a target
    if (reputationChanges[station.id] !== undefined) {
      newRep += reputationChanges[station.id];
    }
    
    // Apply faction propagation
    const faction = getFactionForStation(station.id);
    if (faction && factionAdjustments[faction] !== 0) {
      // Only apply propagation if this station wasn't a direct target
      if (reputationChanges[station.id] === undefined) {
        newRep += factionAdjustments[faction];
      }
    }
    
    return { ...station, reputation: clampReputation(newRep) };
  });
  
  return updatedStations;
}

/**
 * Check if station is hostile to player
 */
export function isStationHostile(station: Station): boolean {
  const rep = station.reputation || 0;
  return rep < FACTION_REP_THRESHOLDS.HOSTILE;
}

/**
 * Check if station is unfriendly to player
 */
export function isStationUnfriendly(station: Station): boolean {
  const rep = station.reputation || 0;
  return rep >= FACTION_REP_THRESHOLDS.HOSTILE && rep < FACTION_REP_THRESHOLDS.UNFRIENDLY;
}

/**
 * Check if player can dock at station
 */
export function canDockAtStation(station: Station): boolean {
  return !isStationHostile(station) && !station.isClosed;
}

/**
 * Get faction standing display info
 */
export function getFactionStandingDisplay(standing: FactionStanding): { name: string; color: string; description: string } {
  switch (standing) {
    case 'hostile':
      return {
        name: 'Hostile',
        color: '#ef4444',
        description: 'This faction will attack you on sight and refuse docking',
      };
    case 'unfriendly':
      return {
        name: 'Unfriendly',
        color: '#f97316',
        description: 'This faction charges high prices and offers no contracts',
      };
    case 'neutral':
      return {
        name: 'Neutral',
        color: '#6b7280',
        description: 'Standard prices and basic contracts available',
      };
    case 'friendly':
      return {
        name: 'Friendly',
        color: '#10b981',
        description: 'Price discounts and better contracts available',
      };
    case 'allied':
      return {
        name: 'Allied',
        color: '#fbbf24',
        description: 'Maximum benefits and exclusive missions available',
      };
  }
}

/**
 * Clamp reputation to valid range [-100, 100]
 */
function clampReputation(rep: number): number {
  return Math.max(-100, Math.min(100, rep));
}

/**
 * Get reputation change description for UI
 */
export function getReputationChangeDescription(
  stations: Station[],
  targetStationId: string,
  repChange: number
): string[] {
  const descriptions: string[] = [];
  const targetStation = stations.find(s => s.id === targetStationId);
  
  if (!targetStation) return descriptions;
  
  const targetFaction = getFactionForStation(targetStationId);
  const propagatedChange = repChange * FACTION_PROPAGATION_MULTIPLIER;
  
  // Direct change
  descriptions.push(`${targetStation.name}: ${repChange > 0 ? '+' : ''}${repChange}`);
  
  // Faction propagation
  if (targetFaction) {
    const factionStations = getStationsInFaction(targetFaction);
    const otherStations = stations.filter(s => 
      factionStations.includes(s.id) && s.id !== targetStationId
    );
    
    if (otherStations.length > 0) {
      const factionName = FACTIONS[targetFaction].name;
      descriptions.push(
        `${factionName} (other stations): ${propagatedChange > 0 ? '+' : ''}${propagatedChange.toFixed(1)}`
      );
    }
  }
  
  return descriptions;
}

