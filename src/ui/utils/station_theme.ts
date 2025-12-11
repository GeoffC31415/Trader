import type { StationType } from '../../domain/types/economy_types';

export function getHallLabel(type: StationType): string {
  if (type === 'city') return 'Civic Exchange';
  if (type === 'refinery') return 'Refinery Office';
  if (type === 'fabricator') return 'Assembly Exchange';
  if (type === 'farm') return 'Co-op Market';
  if (type === 'power_plant') return 'Grid Exchange';
  if (type === 'trading_post') return 'Bazaar';
  if (type === 'shipyard') return 'Shipyard Office';
  if (type === 'pirate') return 'Quarterdeck Market';
  if (type === 'mine') return 'Mining Exchange';
  if (type === 'research') return 'Research Market';
  if (type === 'orbital_hab') return 'Habitat Exchange';
  return 'Trading Hall';
}

export const stationTypeColors: Record<StationType, { primary: string; secondary: string; glow: string }> = {
  city: { primary: '#3b82f6', secondary: '#60a5fa', glow: '#3b82f680' },
  refinery: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#f59e0b80' },
  fabricator: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#8b5cf680' },
  farm: { primary: '#10b981', secondary: '#34d399', glow: '#10b98180' },
  power_plant: { primary: '#eab308', secondary: '#fde047', glow: '#eab30880' },
  trading_post: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#06b6d480' },
  shipyard: { primary: '#ec4899', secondary: '#f472b6', glow: '#ec489980' },
  pirate: { primary: '#ef4444', secondary: '#f87171', glow: '#ef444480' },
  mine: { primary: '#78716c', secondary: '#a8a29e', glow: '#78716c80' },
  research: { primary: '#06b6d4', secondary: '#67e8f9', glow: '#06b6d480' },
  orbital_hab: { primary: '#a855f7', secondary: '#c084fc', glow: '#a855f780' },
};

