import type { TrustRecord, AllyAssistToken } from '../domain/types/world_types';
import type { NarrativeContext } from '../domain/types/mission_types';

export function tierForScore(score: number): -2 | -1 | 0 | 1 | 2 {
  if (score <= -2) return -2;
  if (score <= -1) return -1;
  if (score >= 2) return 2;
  if (score >= 1) return 1;
  return 0;
}

export function setTrust(current: TrustRecord | undefined, delta: number, now: number): TrustRecord {
  const prevScore = current?.score ?? 0;
  const step = Math.sign(delta);
  const nextScore = Math.max(-2, Math.min(2, prevScore + step)); // cap and normalize to ±1 steps
  return {
    score: nextScore,
    tier: tierForScore(nextScore),
    lastChangeAt: now,
  };
}

export function hasUnconsumedToken(tokens: AllyAssistToken[] | undefined, by: string): boolean {
  if (!tokens) return false;
  return tokens.some(t => !t.consumed && t.by === by);
}

export function grantAssist(by: string, type: AllyAssistToken['type'], description: string, now: number): AllyAssistToken {
  const id = `${by}:${type}:${now}`;
  return { id, by, type, description, createdAt: now };
}

export function defaultAssistForStation(by: string): { type: AllyAssistToken['type']; description: string } {
  switch (by) {
    case 'greenfields':
      return { type: 'discount', description: 'Agri goods discount (next purchase)' };
    case 'sol-city':
      return { type: 'waiver', description: 'Inspection/tariff waiver (once)' };
    case 'aurum-fab':
      return { type: 'fabrication_rush', description: 'Rush fabrication slot (once)' };
    case 'drydock':
      return { type: 'repair', description: 'Emergency repair to full HP (once)' };
    case 'ceres-pp':
      return { type: 'refuel', description: 'Free refuel or fuel price lock (once)' };
    case 'sol-refinery':
      return { type: 'discount', description: 'Fuel discount (once)' };
    case 'hidden-cove':
      return { type: 'escort', description: 'Escort flight in hostile sector (once)' };
    case 'freeport':
      return { type: 'waiver', description: 'Safe passage window (once)' };
    default:
      return { type: 'waiver', description: 'Favor available (once)' };
  }
}

export function computeTrustDeltas(missionId: string, ctx: NarrativeContext = {}): Array<{ by: string; delta: number }> {
  const deltas: Array<{ by: string; delta: number }> = [];

  const add = (by: string, delta: number) => deltas.push({ by, delta: Math.max(-1, Math.min(1, delta)) });

  const id = missionId;
  if (id.includes('greenfields')) { add('greenfields', +1); add('sol-city', -1); }
  if (id.includes('sol_city')) { add('sol-city', +1); add('greenfields', -1); }
  if (id.includes('drydock')) { add('drydock', +1); add('aurum-fab', -1); }
  if (id.includes('aurum')) { add('aurum-fab', +1); add('drydock', -1); }
  if (id.includes('refinery')) { add('sol-refinery', +1); add('ceres-pp', -1); }
  if (id.includes('ceres')) { add('ceres-pp', +1); add('sol-refinery', -1); }
  if (id.includes('pirate')) { add('hidden-cove', +1); add('sol-city', -1); }
  if (id.includes('law')) { add('sol-city', +1); add('hidden-cove', -1); }
  if (id.includes('peace')) { add('freeport', +1); }

  // Small method-based nudges
  if (ctx.stealthUsed) add('greenfields', +1);
  if ((ctx.enemiesDestroyed ?? 0) === 0 && (id.includes('sol_city') || id.includes('law'))) add('sol-city', +1);
  if ((ctx.timeElapsedSec ?? 9999) < 600 && id.includes('aurum')) add('aurum-fab', +1);
  if ((ctx.enemiesDestroyed ?? 0) > 0 && id.includes('hidden-cove')) add('hidden-cove', +1);

  // Cap per-character to ±1 total per mission
  const summed: Record<string, number> = {};
  for (const d of deltas) {
    summed[d.by] = Math.max(-1, Math.min(1, (summed[d.by] ?? 0) + d.delta));
  }

  return Object.entries(summed).map(([by, delta]) => ({ by, delta }));
}

export function getTrustTiersSnapshot(relationships: Record<string, TrustRecord> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!relationships) return out;
  for (const [k, v] of Object.entries(relationships)) {
    out[k] = v.tier;
  }
  return out;
}

// Phase 3: balancing helpers
export function canGrantToken(now: number, rel: TrustRecord | undefined, existing: AllyAssistToken[] | undefined, by: string, globalCap = 3, cooldownMs = 60_000): boolean {
  const unconsumed = (existing || []).filter(t => !t.consumed).length;
  if (unconsumed >= globalCap) return false;
  if (!rel) return true;
  if (rel.lastAssistGrantedAt && now - rel.lastAssistGrantedAt < cooldownMs) return false;
  const hasUnconsumedFromBy = (existing || []).some(t => !t.consumed && t.by === by);
  if (hasUnconsumedFromBy) return false;
  return true;
}

export function maybeProbabilityGrant(prob0to1: number): boolean {
  return Math.random() < Math.max(0, Math.min(1, prob0to1));
}



