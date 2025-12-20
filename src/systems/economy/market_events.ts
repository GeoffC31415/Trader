/**
 * Market Events System
 * 
 * Random events that significantly affect prices at specific stations or system-wide.
 * Events spawn rarely (every 5-10 minutes) but have high impact.
 */

import type { Station } from '../../domain/types/world_types';
import type { MarketEvent } from '../../domain/types/world_types';

/**
 * Event templates that can be instantiated
 */
export interface MarketEventTemplate {
  title: string;
  description: string;
  effects: Array<{
    stationId?: string; // specific station ID or undefined for all stations
    commodityId?: string; // specific commodity ID or category
    commodityCategory?: string; // category filter (e.g., 'food', 'tech')
    priceMultiplier: number; // 0.5 = 50% off, 2.0 = double price
  }>;
  duration: number; // seconds (180-300 = 3-5 min)
  weight: number; // relative probability weight
}

/**
 * Available market event templates
 */
export const marketEventTemplates: MarketEventTemplate[] = [
  {
    title: 'Mining Strike',
    description: 'Workers at mining stations have gone on strike. Ore prices have skyrocketed system-wide.',
    effects: [
      { commodityCategory: 'raw', priceMultiplier: 1.8 }, // +80% for all raw materials
    ],
    duration: 240, // 4 minutes
    weight: 1.0,
  },
  {
    title: 'Festival at Sol City',
    description: 'A major festival is underway. Luxury goods are in high demand.',
    effects: [
      { stationId: 'sol-city', commodityCategory: 'luxury', priceMultiplier: 1.6 }, // +60% at Sol City
    ],
    duration: 300, // 5 minutes
    weight: 0.8,
  },
  {
    title: 'Power Grid Instability',
    description: 'Ceres Power Plant reports grid instability. Battery demand has surged.',
    effects: [
      { stationId: 'ceres-pp', commodityId: 'batteries', priceMultiplier: 2.0 }, // +100% at Ceres
    ],
    duration: 180, // 3 minutes
    weight: 1.0,
  },
  {
    title: 'Bumper Harvest',
    description: 'Farms report exceptional yields. Food prices have dropped.',
    effects: [
      { commodityCategory: 'food', priceMultiplier: 0.6 }, // -40% for all food
    ],
    duration: 300, // 5 minutes
    weight: 0.7,
  },
  {
    title: 'Medical Emergency',
    description: 'Outbreak reported at orbital habitats. Pharmaceutical demand is critical.',
    effects: [
      { commodityId: 'pharmaceuticals', priceMultiplier: 2.0 }, // +100% system-wide
      { commodityId: 'medical_supplies', priceMultiplier: 1.5 }, // +50% system-wide
    ],
    duration: 240, // 4 minutes
    weight: 0.9,
  },
  {
    title: 'Fabrication Surge',
    description: 'Manufacturing orders have spiked. Industrial goods prices are up.',
    effects: [
      { commodityCategory: 'industrial', priceMultiplier: 1.4 }, // +40% system-wide
    ],
    duration: 300, // 5 minutes
    weight: 0.8,
  },
];

/**
 * Generate a random market event based on templates
 */
export function generateMarketEvent(stations: Station[]): MarketEvent | null {
  if (marketEventTemplates.length === 0) return null;

  // Weighted random selection
  const totalWeight = marketEventTemplates.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedTemplate: MarketEventTemplate | null = null;
  for (const template of marketEventTemplates) {
    random -= template.weight;
    if (random <= 0) {
      selectedTemplate = template;
      break;
    }
  }

  if (!selectedTemplate) {
    selectedTemplate = marketEventTemplates[0]; // Fallback
  }

  // Instantiate the event
  const eventId = `event:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  return {
    id: eventId,
    title: selectedTemplate.title,
    description: selectedTemplate.description,
    effects: selectedTemplate.effects.map(e => ({
      stationId: e.stationId,
      commodityId: e.commodityId,
      commodityCategory: e.commodityCategory,
      priceMultiplier: e.priceMultiplier,
    })),
    startedAt: Date.now(),
    duration: selectedTemplate.duration * 1000, // Convert to ms
  };
}

/**
 * Check if a new event should spawn (rare: 1 per 5-10 minutes on average)
 */
export function shouldSpawnEvent(
  lastEventTime: number | undefined,
  currentTime: number
): boolean {
  if (!lastEventTime) {
    // First event can spawn after 2 minutes
    return currentTime - (Date.now() - 120000) > 120000;
  }

  // Average 7.5 minutes between events (450000 ms)
  // Using exponential distribution: P(spawn) increases over time
  const timeSinceLastEvent = currentTime - lastEventTime;
  const averageInterval = 450000; // 7.5 minutes
  const probability = 1 - Math.exp(-timeSinceLastEvent / averageInterval);
  
  return Math.random() < probability;
}

/**
 * Get active events (not expired)
 */
export function getActiveEvents(
  events: MarketEvent[],
  currentTime: number
): MarketEvent[] {
  return events.filter(
    event => currentTime - event.startedAt < event.duration
  );
}

/**
 * Get price multiplier for a commodity at a station from active events
 */
export function getEventPriceMultiplier(
  activeEvents: MarketEvent[],
  stationId: string,
  commodityId: string,
  commodityCategory: string
): number {
  let multiplier = 1.0;

  for (const event of activeEvents) {
    for (const effect of event.effects) {
      // Check if this effect applies
      const stationMatch = !effect.stationId || effect.stationId === stationId;
      const commodityMatch =
        effect.commodityId === commodityId ||
        effect.commodityCategory === commodityCategory;

      if (stationMatch && commodityMatch) {
        multiplier *= effect.priceMultiplier;
      }
    }
  }

  return multiplier;
}

