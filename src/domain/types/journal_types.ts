export type JournalKind = 'milestone' | 'trade' | 'reputation' | 'politics' | 'ship' | 'mission' | 'world' | 'safety' | 'industry' | 'finance';
export type JournalEvent = {
  id: number;
  at: number; // simulation seconds, never wall clock
  kind: JournalKind;
  title: string;
  detail: string;
  reputation?: Array<{ stationId: string; before: number; after: number }>;
  factions?: Record<string, number>;
  political?: { freedom: number; labor: number };
};
export type TradeTotals = {
  transactions: number;
  bought: number;
  sold: number;
  spent: number;
  revenue: number;
  knownProfit: number;
  unknownCostSales: number;
};
export type JournalData = {
  version: 1;
  startedAt: number;
  legacy: boolean;
  sequence: number;
  events: JournalEvent[];
  // Cumulative since recording began; independent of the bounded receipt/event windows.
  ledger: Record<string, Record<string, TradeTotals>>;
  otherIncome: number;
  otherSpending: number;
};
