import { Commodity, StationInventory, StationType, generateCommodities, priceForStation } from '../systems/economy';
import { SCALE, sp } from './constants';
import type { Planet, Station, AsteroidBelt } from './types';

export const commodities: Commodity[] = generateCommodities();
export const commodityById: Record<string, Commodity> = Object.fromEntries(
  commodities.map(c => [c.id, c])
);

export const planets: Planet[] = [
  { id: 'sun', name: 'Sol', position: sp([0, 0, 0]), radius: 12 * SCALE, color: '#ffd27f', isStar: true },
  // Orbits around the sun
  { id: 'aurum', name: 'Aurum', position: sp([40, 0, 0]), radius: 6 * SCALE, color: '#b08d57' },
  { id: 'ceres', name: 'Ceres', position: sp([-45, 0, 78]), radius: 4 * SCALE, color: '#7a8fa6' },
];

export const stations: Station[] = [
  // Near Aurum
  { id: 'sol-city', name: 'Sol City [Consumes: fuel/meds/lux]', type: 'city', position: sp([52, 0, 6]), inventory: priceForStation('city', commodities) },
  { id: 'sol-refinery', name: 'Helios Refinery [Cheap: fuel/hydrogen]', type: 'refinery', position: sp([48, 0, -10]), inventory: priceForStation('refinery', commodities) },
  { id: 'aurum-fab', name: 'Aurum Fabricator [Cheap: electronics/chips/alloys]', type: 'fabricator', position: sp([40, 0, -14]), inventory: priceForStation('fabricator', commodities) },
  { id: 'greenfields', name: 'Greenfields Farm [Food production: grain/meat/sugar]', type: 'farm', position: sp([44, 0, -4]), inventory: priceForStation('farm', commodities) },
  // Near Ceres
  { id: 'ceres-pp', name: 'Ceres Power Plant [Cheap: batteries/fuel]', type: 'power_plant', position: sp([-56, 0, 86]), inventory: priceForStation('power_plant', commodities) },
  { id: 'freeport', name: 'Freeport Station [Mixed market]', type: 'trading_post', position: sp([-40, 0, 70]), inventory: priceForStation('trading_post', commodities) },
  { id: 'drydock', name: 'Drydock Shipyard [Upgrades available]', type: 'shipyard', position: sp([-30, 0, 90]), inventory: priceForStation('shipyard', commodities) },
  // Pirate outpost, off the system plane (y != 0) and far from core
  { id: 'hidden-cove', name: 'Hidden Cove [Pirate: All fabrication]', type: 'pirate', position: sp([0, 40, 160]), inventory: priceForStation('pirate', commodities) },
];

export const belts: AsteroidBelt[] = [
  { id: 'inner-belt', name: 'Common Belt', position: sp([0, 0, 0]), radius: 60 * SCALE, tier: 'common' },
  { id: 'outer-belt', name: 'Rare Belt', position: sp([0, 0, 0]), radius: 120 * SCALE, tier: 'rare' },
];


