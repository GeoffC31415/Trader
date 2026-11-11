export type Warehouse = { goods: Record<string, number>; freshness: Record<string, number> };
export type Fund = { price: number; units: number; invested: number };
export type AssetSnapshot = { at: number; value: number };
export type FinanceEntry = { id: number; at: number; message: string; cashDelta?: number };
export type FinanceState = {
  version: 1;
  savings: number;
  loan: { principal: number; interest: number; dueAt: number };
  funds: Record<string, Fund>;
  warehouses: Record<string, Warehouse>;
  lastAccrualAt: number;
  lastInterestAt: number;
  navHistory: AssetSnapshot[];
  lastNavAt: number;
  sequence: number;
  entries: FinanceEntry[];
};
export type FinanceAction = 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'invest' | 'redeem' | 'redeemAll';
