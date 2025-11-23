/**
 * Buy Action - Action Composition Pattern
 * 
 * Handles buying commodities, including:
 * - Contract tracking
 * - Ally assist token usage
 * - Tutorial progression
 */

import type { GameState } from '../../../domain/types/world_types';
import { buyCommodity } from '../../modules/economy';

/**
 * Create buy action with dependency injection
 * 
 * @param getState - Function to get current state
 * @param setState - Function to update state
 * @returns Buy action function
 */
export function createBuyAction(
  getState: () => GameState,
  setState: (updates: Partial<GameState>) => void
) {
  return (commodityId: string, quantity: number) => {
    const state = getState();
    
    // Find active contract for this commodity
    const activeContract = (state.contracts || []).find(
      c => c.status === 'accepted' && c.commodityId === commodityId
    );

    // Handle pending assist tokens (discount, waiver, refuel)
    let priceMultiplier: number | undefined = undefined;
    const pending = (state as any).pendingAssist as GameState['pendingAssist'] | undefined;
    const station = state.ship.dockedStationId;
    if (pending && station && pending.by === station) {
      // Scope: refuel only applies to refined_fuel at ceres-pp, discount applies at station, waiver is 1.0
      if (pending.type === 'refuel' && commodityId === 'refined_fuel' && station === 'ceres-pp') {
        priceMultiplier = pending.multiplier;
      } else if (pending.type === 'discount') {
        priceMultiplier = pending.multiplier;
      } else if (pending.type === 'waiver') {
        priceMultiplier = 1.0;
      }
    }

    // Delegate to economy module for core buying logic
    const result = buyCommodity(
      state.ship,
      state.stations,
      state.npcTraders,
      state.avgCostByCommodity,
      commodityId,
      quantity,
      activeContract,
      priceMultiplier
    );

    if (!result) {
      setState({}); // No changes
      return;
    }

    const tradeLog = [...state.tradeLog, result.trade];
    
    // Handle tutorial progression
    let tutorialStep = state.tutorialStep;
    if (
      state.tutorialActive &&
      state.tutorialStep === 'buy_fuel' &&
      commodityId === 'refined_fuel'
    ) {
      tutorialStep = 'deliver_fuel';
    }

    // Compose final update
    setState({
      ship: result.ship,
      stations: result.stations,
      npcTraders: result.npcTraders,
      avgCostByCommodity: result.avgCostByCommodity,
      tradeLog,
      pendingAssist: undefined, // Clear pendingAssist after use
      tutorialStep,
    });
  };
}

