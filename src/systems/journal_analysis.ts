import type { GameState, Station } from '../domain/types/world_types';
import type { JournalData, TradeTotals } from '../domain/types/journal_types';
import { addTotals, emptyTotals } from './journal';
import { processRecipes, findRecipeForStation } from './economy/recipes';
import { getProductionForStation } from './economy/production';
import { canDockAtStation } from './reputation/faction_system';
import { canTradeCommodity } from '../state/modules/economy';

export function summarizeLedger(journal: JournalData, stationId = '', commodityId = '') {
  let total = emptyTotals(); const byStation: Record<string, TradeTotals> = {}, byCommodity: Record<string, TradeTotals> = {};
  for (const [station, goods] of Object.entries(journal.ledger)) for (const [commodity, value] of Object.entries(goods)) {
    if (stationId && station !== stationId || commodityId && commodity !== commodityId) continue;
    total = addTotals(total, value); byStation[station] = addTotals(byStation[station] ?? emptyTotals(), value); byCommodity[commodity] = addTotals(byCommodity[commodity] ?? emptyTotals(), value);
  }
  return { total, byStation, byCommodity };
}

export function manufacturingDirectory(s: Pick<GameState, 'stations' | 'ship' | 'missions'>) {
  return s.stations.flatMap(station => (processRecipes[station.type] ?? [])
    // The runtime selects the FIRST recipe for a given input, not every authored duplicate.
    .filter(recipe => findRecipeForStation(station.type, recipe.inputId) === recipe)
    .map(recipe => {
      const input = Math.ceil(recipe.inputPerOutput * (station.fabricationMultiplier ?? 1));
      const requirements = [
        ...(!canDockAtStation(station) ? ['Docking unavailable'] : []),
        ...(station.fabricationDisabled ? ['Fabrication suspended'] : []),
        ...(station.id === 'sol-city' && recipe.outputId === 'luxury_goods' && s.missions.some(m => m.id === 'greenfields_stage_1' && m.status === 'active') ? ['Covert order forbids Sol City manufacture'] : []),
        ...(station.type !== 'pirate' && !s.ship.hasUnionMembership ? ['Union membership'] : []),
        ...(!canTradeCommodity(s.ship, recipe.inputId) || !canTradeCommodity(s.ship, recipe.outputId) ? ['Cargo equipment required'] : []),
      ];
      return { station, ...recipe, input, requirements };
    }));
}
export function stationProductionDirectory(stations: Station[]) {
  return stations.flatMap(station => [...getProductionForStation(station.type), ...(station.independentRefinery ? [{ commodityId: 'refined_fuel', ratePerMinute: 12, maxStock: 300 }] : [])].map(p => ({ station, ...p, ratePerMinute: p.ratePerMinute * (station.productionMultiplier ?? 1) })));
}
