// Choice mission system - handles branching paths and permanent effects

import type { Mission, MissionChoice, MissionArc } from '../../domain/types/mission_types';
import type { GameState, Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { generateCommodities } from '../economy/commodities';

const commodity_category_by_id: Record<string, string> = Object.fromEntries(
  generateCommodities().map(c => [c.id, c.category])
);

function add_unique(values: string[] | undefined, value: string): string[] {
  const next = values ? [...values] : [];
  if (!next.includes(value)) next.push(value);
  return next;
}

function scale_inventory_prices(params: {
  inventory: StationInventory;
  multiplier: number;
  predicate: (commodityId: string) => boolean;
}): StationInventory {
  const { inventory, multiplier, predicate } = params;
  const next: StationInventory = { ...inventory };

  for (const commodityId of Object.keys(next)) {
    if (!predicate(commodityId)) continue;
    const item = next[commodityId];
    if (!item) continue;
    next[commodityId] = {
      ...item,
      buy: Math.max(1, Math.round(item.buy * multiplier)),
      sell: Math.max(1, Math.round(item.sell * multiplier)),
    };
  }

  return next;
}

function reduce_inventory_stock(params: {
  inventory: StationInventory;
  multiplier: number;
}): StationInventory {
  const { inventory, multiplier } = params;
  const next: StationInventory = { ...inventory };
  for (const commodityId of Object.keys(next)) {
    const item = next[commodityId];
    if (!item) continue;
    if (item.stock === undefined) continue;
    next[commodityId] = {
      ...item,
      stock: Math.max(0, Math.floor(item.stock * multiplier)),
    };
  }
  return next;
}

/**
 * Apply permanent effects from mission choices to game state
 * These effects persist for the rest of the game
 */
export function applyChoicePermanentEffects(
  gameState: GameState,
  effects: string[]
): Partial<GameState> {
  let stations = gameState.stations;
  let pirateAggressionMultiplier = gameState.pirateAggressionMultiplier;
  let unlockedFeatures = gameState.unlockedFeatures;
  let permanentEffects = gameState.permanentEffects;
  let timedEffects = gameState.timedEffects;
  
  for (const effect of effects) {
    switch (effect) {
      // Arc 1: Greenfields Independence
      case 'sol_city_price_increase_greenfields':
        // Sol City raises prices for food goods by 15%
        stations = stations.map(station =>
          station.id === 'sol-city'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 1.15,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'food',
                }),
              }
            : station
        );
        break;
        
      case 'greenfields_stock_drop':
        // Apply an immediate stock drop (timed effect system is currently not consumed elsewhere)
        stations = stations.map(station =>
          station.id === 'greenfields'
            ? { ...station, inventory: reduce_inventory_stock({ inventory: station.inventory, multiplier: 0.7 }) }
            : station
        );
        break;
        
      case 'greenfields_independence':
      case 'greenfields_independent': {
        // Greenfields gets cheaper food prices
        stations = stations.map(station =>
          station.id === 'greenfields'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 0.95,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'food',
                }),
              }
            : station
        );
        unlockedFeatures = add_unique(unlockedFeatures, 'greenfields_independence');
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'price_discount', stationId: 'greenfields', commodityCategory: 'food', discount: 0.05 },
        ];
        break;
      }

      case 'greenfields_food_discount':
        stations = stations.map(station =>
          station.id === 'greenfields'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 0.9,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'food',
                }),
              }
            : station
        );
        break;
        
      case 'sol_city_goods_discount':
      case 'sol_city_control_bonus':
        stations = stations.map(station =>
          station.id === 'sol-city'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 0.95,
                  predicate: () => true,
                }),
              }
            : station
        );
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'price_discount', stationId: 'sol-city', commodityCategory: 'all', discount: 0.05 },
        ];
        break;

      case 'sol_city_grain_spike':
        // Price spike for grain at Sol City (story consequence)
        stations = stations.map(station =>
          station.id === 'sol-city'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 1.25,
                  predicate: commodityId => commodityId === 'grain',
                }),
              }
            : station
        );
        break;

      case 'greenfields_fabrication_lockdown':
        // Not currently enforced by economy systems; track as a feature flag.
        unlockedFeatures = add_unique(unlockedFeatures, 'greenfields_fabrication_lockdown');
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `greenfields_fabrication_lockdown_${Date.now()}`,
            type: 'fabrication_disabled',
            targetStations: ['greenfields'],
            expiresAt: Date.now() + 600_000,
          },
        ];
        break;

      case 'greenfields_controlled':
        unlockedFeatures = add_unique(unlockedFeatures, 'greenfields_controlled');
        break;
        
      // Arc 2: Fabrication Wars
      case 'aurum_production_boost':
        // Aurum Fab gets 10% production speed boost (recipes need less input)
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'production_efficiency', stationId: 'aurum-fab', efficiency: 1.1 },
        ];
        break;
        
      case 'drydock_production_boost':
        // Drydock gets 10% production speed boost
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'production_efficiency', stationId: 'drydock', efficiency: 1.1 },
        ];
        break;
        
      case 'aurum_fabrication_discount':
        // Winner gets -10% fabrication costs
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'fabrication_discount', stationId: 'aurum-fab', discount: 0.1 },
        ];
        break;
        
      case 'drydock_fabrication_discount':
        // Winner gets -10% fabrication costs
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'fabrication_discount', stationId: 'drydock', discount: 0.1 },
        ];
        break;

      case 'drydock_fabrication_disabled_temp':
        unlockedFeatures = add_unique(unlockedFeatures, 'drydock_fabrication_disabled_temp');
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `drydock_fabrication_disabled_${Date.now()}`,
            type: 'fabrication_disabled',
            targetStations: ['drydock'],
            expiresAt: Date.now() + 600_000,
          },
        ];
        break;

      case 'aurum_fabrication_disabled_temp':
        unlockedFeatures = add_unique(unlockedFeatures, 'aurum_fabrication_disabled_temp');
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `aurum_fabrication_disabled_${Date.now()}`,
            type: 'fabrication_disabled',
            targetStations: ['aurum-fab'],
            expiresAt: Date.now() + 600_000,
          },
        ];
        break;

      case 'drydock_fabrication_price_increase':
        stations = stations.map(station =>
          station.id === 'drydock'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 1.15,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'industrial',
                }),
              }
            : station
        );
        unlockedFeatures = add_unique(unlockedFeatures, 'drydock_fabrication_price_increase');
        break;

      case 'aurum_fabrication_price_increase':
        stations = stations.map(station =>
          station.id === 'aurum-fab'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 1.15,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'industrial',
                }),
              }
            : station
        );
        unlockedFeatures = add_unique(unlockedFeatures, 'aurum_fabrication_price_increase');
        break;

      case 'aurum_exclusive_supplier':
      case 'drydock_exclusive_supplier':
        unlockedFeatures = add_unique(unlockedFeatures, effect);
        break;
        
      // Arc 3: Energy Monopoly
      case 'ceres_fuel_price_drop':
      case 'fuel_prices_reduced':
        // Fuel prices drop at Ceres PP
        stations = stations.map(station =>
          station.id === 'ceres-pp'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 0.8,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'fuel',
                }),
              }
            : station
        );
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'price_discount', stationId: 'ceres-pp', commodityCategory: 'fuel', discount: 0.2 },
        ];
        break;
        
      case 'fuel_shortage_continues':
      case 'fuel_shortage':
        // Fuel prices rise system-wide
        stations = stations.map(station => ({
          ...station,
          inventory: scale_inventory_prices({
            inventory: station.inventory,
            multiplier: 1.15,
            predicate: commodityId => commodity_category_by_id[commodityId] === 'fuel',
          }),
        }));
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `fuel_shortage_${Date.now()}`,
            type: 'price_increase',
            commodityCategory: 'fuel',
            multiplier: 1.15,
            expiresAt: Date.now() + 600_000,
          },
        ];
        break;
        
      case 'fuel_prices_normalized':
      case 'fuel_normalize':
        // Fuel prices normalize -10% everywhere
        stations = stations.map(station => ({
          ...station,
          inventory: scale_inventory_prices({
            inventory: station.inventory,
            multiplier: 0.9,
            predicate: commodityId => commodity_category_by_id[commodityId] === 'fuel',
          }),
        }));
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'price_discount', stationId: 'all', commodityCategory: 'fuel', discount: 0.1 },
        ];
        break;

      case 'ceres_fuel_discount':
        stations = stations.map(station =>
          station.id === 'ceres-pp'
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 0.9,
                  predicate: commodityId => commodity_category_by_id[commodityId] === 'fuel',
                }),
              }
            : station
        );
        break;

      case 'energy_transparency':
      case 'ceres_monopoly_maintained':
      case 'refinery_convoy_protection':
      case 'refinery_convoys_disrupted':
      case 'freeport_refinery_established':
      case 'ceres_fuel_monopoly_permanent':
        unlockedFeatures = add_unique(unlockedFeatures, effect);
        break;
        
      // Arc 4: Pirate Accords
      case 'sol_city_hostile':
        // Sol City marks you as hostile
        stations = stations.map(station =>
          station.id === 'sol-city'
            ? { ...station, reputation: -75, isHostile: true }
            : station
        );
        break;
        
      case 'hidden_cove_hostile':
        // Hidden Cove closes permanently
        stations = stations.map(station =>
          station.id === 'hidden-cove'
            ? { ...station, reputation: -100, isHostile: true, isClosed: true }
            : station
        );
        break;
        
      case 'pirate_attacks_increase':
        // Pirate attacks increase 50%
        pirateAggressionMultiplier = (pirateAggressionMultiplier || 1.0) * 1.5;
        break;
        
      case 'pirate_attacks_decrease':
        // Pirate attacks decrease 50%
        pirateAggressionMultiplier = (pirateAggressionMultiplier || 1.0) * 0.5;
        break;
        
      case 'black_market_access':
        // Hidden Cove unlocks black market
        unlockedFeatures = add_unique(unlockedFeatures, 'black_market');
        break;
        
      case 'bounty_hunting_unlocked':
        // Bounty hunting missions unlock
        unlockedFeatures = add_unique(unlockedFeatures, 'bounty_hunting');
        break;

      case 'peace_agreement_active':
      case 'sol_city_weakened':
        unlockedFeatures = add_unique(unlockedFeatures, effect);
        break;
        
      // Arc 5: Union Crisis
      case 'union_victory':
      case 'fabrication_cost_decrease':
      case 'union_wins':
        permanentEffects = [
          ...(permanentEffects || []),
          { type: 'fabrication_discount', stationId: 'all', discount: 0.1 },
        ];
        unlockedFeatures = add_unique(unlockedFeatures, 'union_victory');
        break;
        
      case 'worker_strike_success':
      case 'corporate_price_increase_temp': {
        // Corporate stations raise prices temporarily
        const corporateStations = new Set(['sol-city', 'aurum-fab', 'ceres-pp']);
        stations = stations.map(station =>
          corporateStations.has(station.id)
            ? {
                ...station,
                inventory: scale_inventory_prices({
                  inventory: station.inventory,
                  multiplier: 1.2,
                  predicate: () => true,
                }),
              }
            : station
        );
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `corporate_price_increase_${Date.now()}`,
            type: 'price_increase',
            targetStations: [...corporateStations],
            commodityCategory: 'all',
            multiplier: 1.2,
            expiresAt: Date.now() + 480_000,
          },
        ];
        break;
      }

      case 'worker_stations_fabrication_lockdown_temp':
      case 'corporate_wins':
        timedEffects = [
          ...(timedEffects || []),
          {
            id: `worker_lockout_${Date.now()}`,
            type: 'fabrication_disabled',
            targetStations: ['greenfields', 'drydock', 'sol-refinery'],
            expiresAt: Date.now() + 300_000,
          },
        ];
        break;

      case 'strike_broken':
      case 'worker_rights_improved':
      case 'corporate_victory':
      case 'union_weakened':
      case 'fabrication_efficiency_improved':
        unlockedFeatures = add_unique(unlockedFeatures, effect);
        break;
    }
  }
  
  const next: Partial<GameState> = {};
  if (stations !== gameState.stations) next.stations = stations;
  if (pirateAggressionMultiplier !== gameState.pirateAggressionMultiplier)
    next.pirateAggressionMultiplier = pirateAggressionMultiplier;
  if (unlockedFeatures !== gameState.unlockedFeatures) next.unlockedFeatures = unlockedFeatures;
  if (permanentEffects !== gameState.permanentEffects) next.permanentEffects = permanentEffects;
  if (timedEffects !== gameState.timedEffects) next.timedEffects = timedEffects;
  return next;
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
    'sol_city_grain_spike': 'Sol City grain prices spike',
    'greenfields_fabrication_lockdown': 'Greenfields fabrication locked down',
    'greenfields_independence': 'Greenfields establishes independence',
    'greenfields_food_discount': 'Greenfields food prices discounted',
    'greenfields_controlled': 'Greenfields is brought under control',
    'sol_city_goods_discount': 'Sol City goods discounted',
    'greenfields_independent': 'Greenfields food prices permanently -5%',
    'sol_city_control_bonus': 'Sol City prices permanently -5%',
    'aurum_production_boost': 'Aurum Fab production +10% efficiency',
    'drydock_production_boost': 'Drydock production +10% efficiency',
    'drydock_fabrication_disabled_temp': 'Drydock fabrication temporarily disabled',
    'aurum_fabrication_disabled_temp': 'Aurum fabrication temporarily disabled',
    'drydock_fabrication_price_increase': 'Drydock industrial prices increase',
    'aurum_fabrication_price_increase': 'Aurum industrial prices increase',
    'aurum_exclusive_supplier': 'Aurum becomes exclusive supplier',
    'drydock_exclusive_supplier': 'Drydock becomes exclusive supplier',
    'aurum_fabrication_discount': 'Aurum Fab fabrication costs -10%',
    'drydock_fabrication_discount': 'Drydock fabrication costs -10%',
    'ceres_fuel_price_drop': 'Ceres PP fuel prices drop',
    'ceres_fuel_discount': 'Ceres PP fuel discounted',
    'fuel_prices_reduced': 'Ceres PP fuel prices -20%',
    'fuel_shortage_continues': 'Fuel shortage continues (prices rise)',
    'fuel_shortage': 'All fuel prices +15% for 10 minutes',
    'fuel_prices_normalized': 'Fuel prices normalize (system-wide)',
    'fuel_normalize': 'All fuel prices -10%',
    'energy_transparency': 'Energy market transparency increases',
    'ceres_monopoly_maintained': 'Ceres monopoly maintained',
    'refinery_convoy_protection': 'Refinery convoys protected',
    'refinery_convoys_disrupted': 'Refinery convoys disrupted',
    'freeport_refinery_established': 'Freeport establishes micro-refinery',
    'ceres_fuel_monopoly_permanent': 'Ceres fuel monopoly becomes permanent',
    'sol_city_hostile': 'Sol City becomes hostile',
    'hidden_cove_hostile': 'Hidden Cove closes permanently',
    'pirate_attacks_increase': 'Pirate attacks increase 50%',
    'pirate_attacks_decrease': 'Pirate attacks decrease 50%',
    'black_market_access': 'Unlock black market trading',
    'bounty_hunting_unlocked': 'Unlock bounty hunting missions',
    'peace_agreement_active': 'Peace agreement becomes active',
    'sol_city_weakened': 'Sol City defenses weakened',
    'worker_strike_success': 'Worker strike succeeds',
    'corporate_price_increase_temp': 'Corporate prices increase temporarily',
    'strike_broken': 'Strike is broken',
    'worker_stations_fabrication_lockdown_temp': 'Worker fabrication temporarily disabled',
    'union_victory': 'Union wins: fabrication costs drop',
    'fabrication_cost_decrease': 'Fabrication costs decrease',
    'worker_rights_improved': 'Worker rights improve',
    'corporate_victory': 'Corporations win negotiations',
    'union_weakened': 'Union influence weakens',
    'fabrication_efficiency_improved': 'Fabrication efficiency improves',
    'union_wins': 'Fabrication costs -10% everywhere',
    'corporate_wins': 'Worker stations lose fabrication for 10 minutes',
  };
  
  return descriptions[effect] || effect;
}

