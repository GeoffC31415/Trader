import type { Contract, Objective, TradeEntry } from '../../domain/types/world_types';

/**
 * Generates an objective ID from a contract ID
 */
export function getObjectiveIdFromContract(contractId: string): string {
  return `obj:${contractId}`;
}

/**
 * Calculate actual purchase cost from trade log
 * Uses the most recent buy trades for the commodity to determine actual cost
 */
function calculatePurchaseCostFromTrades(
  commodityId: string,
  quantity: number,
  tradeLog: TradeEntry[]
): number {
  // Get all buy trades for this commodity, most recent first
  const buyTrades = tradeLog
    .filter(t => t.type === 'buy' && t.commodityId === commodityId)
    .reverse();

  if (buyTrades.length === 0) return 0;

  let remainingQty = quantity;
  let totalCost = 0;

  // Work backwards through trades to match the quantity
  for (const trade of buyTrades) {
    if (remainingQty <= 0) break;
    
    const qtyFromThisTrade = Math.min(remainingQty, trade.quantity);
    totalCost += qtyFromThisTrade * trade.unitPrice;
    remainingQty -= qtyFromThisTrade;
  }

  // If we still have remaining quantity, use the oldest trade's price
  if (remainingQty > 0 && buyTrades.length > 0) {
    totalCost += remainingQty * buyTrades[buyTrades.length - 1].unitPrice;
  }

  return totalCost;
}

/**
 * Processes contract completion logic
 * Returns updated state fields for contract completion
 */
export function processContractCompletion(params: {
  activeContract: Contract;
  nowDelivering: number;
  unitSellPrice: number;
  tradeLog: TradeEntry[];
  contracts: Contract[];
  objectives: Objective[];
  activeObjectiveId?: string;
}): {
  contracts: Contract[];
  objectives: Objective[];
  activeObjectiveId?: string;
  celebrationBuyCost: number;
  celebrationSellRevenue: number;
  celebrationBonusAmount: number;
  bonusCredits: number;
} {
  const {
    activeContract,
    nowDelivering,
    unitSellPrice,
    tradeLog,
    contracts,
    objectives,
    activeObjectiveId,
  } = params;

  // Apply contract pricing
  let unitPay = unitSellPrice;
  if (activeContract.sellMultiplier && activeContract.sellMultiplier > 1) {
    unitPay = Math.max(1, Math.round(unitSellPrice * activeContract.sellMultiplier));
  }

  const bonusReward = activeContract.rewardBonus || 0;
  
  // Calculate costs from actual trade log
  const purchaseCost = calculatePurchaseCostFromTrades(
    activeContract.commodityId,
    nowDelivering,
    tradeLog
  );
  const sellRevenue = unitPay * nowDelivering;
  const celebrationBuyCost = purchaseCost;
  const celebrationSellRevenue = sellRevenue;
  const celebrationBonusAmount = bonusReward;

  // Update contracts and objectives
  const updatedContracts = contracts.map(c => 
    c.id === activeContract.id 
      ? { ...c, status: 'completed' as const, deliveredUnits: activeContract.units } 
      : c
  );

  const objectiveId = getObjectiveIdFromContract(activeContract.id);
  const updatedObjectives = objectives.map(o => 
    o.id === objectiveId 
      ? { ...o, status: 'completed' as const } 
      : o
  );

  const updatedActiveObjectiveId = activeObjectiveId === objectiveId 
    ? undefined 
    : activeObjectiveId;

  return {
    contracts: updatedContracts,
    objectives: updatedObjectives,
    activeObjectiveId: updatedActiveObjectiveId,
    celebrationBuyCost,
    celebrationSellRevenue,
    celebrationBonusAmount,
    bonusCredits: bonusReward,
  };
}

/**
 * Processes partial contract delivery
 * Returns updated contracts with new delivery progress
 */
export function processPartialDelivery(params: {
  activeContract: Contract;
  newTotalDelivered: number;
  contracts: Contract[];
}): Contract[] {
  const { activeContract, newTotalDelivered, contracts } = params;

  return contracts.map(c => 
    c.id === activeContract.id 
      ? { ...c, deliveredUnits: newTotalDelivered } 
      : c
  );
}

