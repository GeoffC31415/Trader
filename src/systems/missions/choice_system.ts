// Choice mission system - handles branching paths and permanent effects

import type { Mission, MissionChoice, MissionArc } from '../../domain/types/mission_types';
import type { GameState, Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';

/**
 * Apply permanent effects from mission choices to game state
 * These effects persist for the rest of the game
 */
export function applyChoicePermanentEffects(
  gameState: GameState,
  effects: string[]
): Partial<GameState> {
  let updates: Partial<GameState> = {};
  
  for (const effect of effects) {
    switch (effect) {
      // Arc 1: Greenfields Independence
      case 'sol_city_price_increase_greenfields':
        // Sol City raises prices for Greenfields goods by 15%
        updates = {
          ...updates,
          stations: gameState.stations.map(station => {
            if (station.id === 'sol-city') {
              const newInventory = { ...station.inventory };
              // Increase buy prices for food goods
              Object.keys(newInventory).forEach(commodityId => {
                if (commodityId === 'food' || commodityId === 'grains') {
                  const item = newInventory[commodityId];
                  if (item) {
                    newInventory[commodityId] = {
                      ...item,
                      buy: Math.round(item.buy * 1.15),
                    };
                  }
                }
              });
              return { ...station, inventory: newInventory };
            }
            return station;
          }),
        };
        break;
        
      case 'greenfields_stock_drop':
        // Greenfields stock drops by 30% temporarily
        // This is handled by a timed effect in the store
        updates = {
          ...updates,
          timedEffects: [
            ...(gameState.timedEffects || []),
            {
              id: `greenfields_stock_drop_${Date.now()}`,
              type: 'stock_reduction',
              targetStation: 'greenfields',
              multiplier: 0.7, // 30% reduction
              expiresAt: Date.now() + 120000, // 2 minutes in milliseconds
            },
          ],
        };
        break;
        
      case 'greenfields_independent':
        // Greenfields gets permanent -5% food prices
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'price_discount',
              stationId: 'greenfields',
              commodityCategory: 'food',
              discount: 0.05,
            },
          ],
        };
        break;
        
      case 'sol_city_control_bonus':
        // Sol City gets -5% on all goods
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'price_discount',
              stationId: 'sol-city',
              commodityCategory: 'all',
              discount: 0.05,
            },
          ],
        };
        break;
        
      // Arc 2: Fabrication Wars
      case 'aurum_production_boost':
        // Aurum Fab gets 10% production speed boost (recipes need less input)
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'production_efficiency',
              stationId: 'aurum-fab',
              efficiency: 1.1, // 10% more efficient
            },
          ],
        };
        break;
        
      case 'drydock_production_boost':
        // Drydock gets 10% production speed boost
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'production_efficiency',
              stationId: 'drydock',
              efficiency: 1.1,
            },
          ],
        };
        break;
        
      case 'aurum_fabrication_discount':
        // Winner gets -10% fabrication costs
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'fabrication_discount',
              stationId: 'aurum-fab',
              discount: 0.1,
            },
          ],
        };
        break;
        
      case 'drydock_fabrication_discount':
        // Winner gets -10% fabrication costs
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'fabrication_discount',
              stationId: 'drydock',
              discount: 0.1,
            },
          ],
        };
        break;
        
      // Arc 3: Energy Monopoly
      case 'fuel_prices_reduced':
        // Fuel prices drop -20% at Ceres PP
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'price_discount',
              stationId: 'ceres-pp',
              commodityCategory: 'fuel',
              discount: 0.2,
            },
          ],
        };
        break;
        
      case 'fuel_shortage':
        // All fuel prices +15% for 10 minutes
        updates = {
          ...updates,
          timedEffects: [
            ...(gameState.timedEffects || []),
            {
              id: `fuel_shortage_${Date.now()}`,
              type: 'price_increase',
              commodityCategory: 'fuel',
              multiplier: 1.15,
              expiresAt: Date.now() + 600000, // 10 minutes in milliseconds
            },
          ],
        };
        break;
        
      case 'fuel_normalize':
        // Fuel prices normalize -10% everywhere
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'price_discount',
              stationId: 'all',
              commodityCategory: 'fuel',
              discount: 0.1,
            },
          ],
        };
        break;
        
      // Arc 4: Pirate Accords
      case 'sol_city_hostile':
        // Sol City marks you as hostile
        updates = {
          ...updates,
          stations: gameState.stations.map(station => {
            if (station.id === 'sol-city') {
              return {
                ...station,
                reputation: -75, // Hostile status
                isHostile: true,
              };
            }
            return station;
          }),
        };
        break;
        
      case 'hidden_cove_hostile':
        // Hidden Cove closes permanently
        updates = {
          ...updates,
          stations: gameState.stations.map(station => {
            if (station.id === 'hidden-cove') {
              return {
                ...station,
                reputation: -100, // Maximum hostile
                isHostile: true,
                isClosed: true,
              };
            }
            return station;
          }),
        };
        break;
        
      case 'pirate_attacks_increase':
        // Pirate attacks increase 50%
        updates = {
          ...updates,
          pirateAggressionMultiplier: (gameState.pirateAggressionMultiplier || 1.0) * 1.5,
        };
        break;
        
      case 'pirate_attacks_decrease':
        // Pirate attacks decrease 50%
        updates = {
          ...updates,
          pirateAggressionMultiplier: (gameState.pirateAggressionMultiplier || 1.0) * 0.5,
        };
        break;
        
      case 'black_market_access':
        // Hidden Cove unlocks black market
        updates = {
          ...updates,
          unlockedFeatures: [
            ...(gameState.unlockedFeatures || []),
            'black_market',
          ],
        };
        break;
        
      case 'bounty_hunting_unlocked':
        // Bounty hunting missions unlock
        updates = {
          ...updates,
          unlockedFeatures: [
            ...(gameState.unlockedFeatures || []),
            'bounty_hunting',
          ],
        };
        break;
        
      // Arc 5: Union Crisis
      case 'union_wins':
        // All stations pay +15% for labor but fabrication costs drop -10%
        updates = {
          ...updates,
          permanentEffects: [
            ...(gameState.permanentEffects || []),
            {
              type: 'fabrication_discount',
              stationId: 'all',
              discount: 0.1,
            },
          ],
        };
        break;
        
      case 'corporate_wins':
        // Worker stations lose upgrades temporarily
        updates = {
          ...updates,
          timedEffects: [
            ...(gameState.timedEffects || []),
            {
              id: `worker_lockout_${Date.now()}`,
              type: 'fabrication_disabled',
              targetStations: ['greenfields', 'drydock', 'sol-refinery'],
              expiresAt: Date.now() + 600000, // 10 minutes in milliseconds
            },
          ],
        };
        break;
    }
  }
  
  return updates;
}

/**
 * Get the next mission(s) that should unlock based on a choice
 */
export function getUnlockedMissionsFromChoice(
  arc: MissionArc,
  mission: Mission,
  choice: MissionChoice
): string[] {
  const unlocked: string[] = [];
  
  // Add specific next mission if defined
  if (choice.nextMissionId) {
    unlocked.push(choice.nextMissionId);
  }
  
  // Add any missions from rewards.unlocks
  if (choice.rewards.unlocks) {
    unlocked.push(...choice.rewards.unlocks);
  }
  
  return unlocked;
}

/**
 * Check if a choice mission has been presented to the player
 * Used to prevent showing the same choice mission multiple times
 */
export function hasChoiceBeenMade(
  arc: MissionArc,
  stage: number
): boolean {
  const choiceKey = `stage_${stage}_choice`;
  return choiceKey in arc.choicesMade;
}

/**
 * Get the choice that was made for a specific stage
 */
export function getChoiceForStage(
  arc: MissionArc,
  stage: number
): string | undefined {
  const choiceKey = `stage_${stage}_choice`;
  return arc.choicesMade[choiceKey];
}

/**
 * Validate if a choice is available based on arc state
 */
export function isChoiceAvailable(
  mission: Mission,
  choice: MissionChoice,
  gameState: GameState
): { available: boolean; reason?: string } {
  // Check reputation requirements from choice rewards
  if (choice.rewards.reputationChanges) {
    for (const [stationId, repChange] of Object.entries(choice.rewards.reputationChanges)) {
      const station = gameState.stations.find(s => s.id === stationId);
      if (station) {
        const currentRep = station.reputation || 0;
        // Warn if negative rep change would make station hostile
        if (repChange < 0 && currentRep + repChange < -50) {
          return {
            available: true, // Still available, just warn
            reason: `Warning: This will make you hostile to ${station.persona?.name || stationId}`,
          };
        }
      }
    }
  }
  
  return { available: true };
}

/**
 * Format choice consequences for UI display
 */
export function formatChoiceConsequences(choice: MissionChoice): string[] {
  const formatted: string[] = [];
  
  // Add explicit consequences
  if (choice.consequences) {
    formatted.push(...choice.consequences);
  }
  
  // Add reputation changes
  if (choice.rewards.reputationChanges) {
    for (const [stationId, change] of Object.entries(choice.rewards.reputationChanges)) {
      if (change > 0) {
        formatted.push(`+${change} reputation with ${stationId}`);
      } else {
        formatted.push(`${change} reputation with ${stationId}`);
      }
    }
  }
  
  // Add permanent effects (user-friendly descriptions)
  if (choice.rewards.permanentEffects) {
    for (const effect of choice.rewards.permanentEffects) {
      formatted.push(getEffectDescription(effect));
    }
  }
  
  return formatted;
}

/**
 * Get user-friendly description for permanent effect
 */
function getEffectDescription(effect: string): string {
  const descriptions: Record<string, string> = {
    'sol_city_price_increase_greenfields': 'Sol City raises food prices by 15%',
    'greenfields_stock_drop': 'Greenfields stock drops 30% for 2 minutes',
    'greenfields_independent': 'Greenfields food prices permanently -5%',
    'sol_city_control_bonus': 'Sol City prices permanently -5%',
    'aurum_production_boost': 'Aurum Fab production +10% efficiency',
    'drydock_production_boost': 'Drydock production +10% efficiency',
    'aurum_fabrication_discount': 'Aurum Fab fabrication costs -10%',
    'drydock_fabrication_discount': 'Drydock fabrication costs -10%',
    'fuel_prices_reduced': 'Ceres PP fuel prices -20%',
    'fuel_shortage': 'All fuel prices +15% for 10 minutes',
    'fuel_normalize': 'All fuel prices -10%',
    'sol_city_hostile': 'Sol City becomes hostile',
    'hidden_cove_hostile': 'Hidden Cove closes permanently',
    'pirate_attacks_increase': 'Pirate attacks increase 50%',
    'pirate_attacks_decrease': 'Pirate attacks decrease 50%',
    'black_market_access': 'Unlock black market trading',
    'bounty_hunting_unlocked': 'Unlock bounty hunting missions',
    'union_wins': 'Fabrication costs -10% everywhere',
    'corporate_wins': 'Worker stations lose fabrication for 10 minutes',
  };
  
  return descriptions[effect] || effect;
}

