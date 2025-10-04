import type { StationInventory, Commodity } from '../../domain/types/economy_types';
import type { Planet, Station, AsteroidBelt } from '../../domain/types/world_types';
import { generateCommodities } from '../../systems/economy/commodities';
import { priceForStation } from '../../systems/economy/pricing';
import { SCALE, sp } from '../../domain/constants/world_constants';

export const commodities = generateCommodities();
export const commodityById: Record<string, Commodity> = Object.fromEntries(
  commodities.map(c => [c.id, c])
);

export const planets: Planet[] = [
  { id: 'sun', name: 'Sol', position: sp([0, 0, 0]), radius: 12 * SCALE, color: '#ffd27f', isStar: true },
  { id: 'aurum', name: 'Aurum', position: sp([40, 0, 0]), radius: 3 * SCALE, color: '#b08d57' },
  { id: 'ceres', name: 'Ceres', position: sp([-45, 0, 78]), radius: 2 * SCALE, color: '#7a8fa6' },
];

const baseStations: Station[] = [
  { id: 'sol-city', name: 'Sol City [Consumes: fuel/meds/lux]', type: 'city', position: sp([52, 0, 6]), inventory: {} as StationInventory, persona: {
    id: 'sol-city-rep',
    name: 'Mira Vale',
    title: 'Civic Trade Liaison',
    vibe: 'polished, efficient, civic-minded',
    avatarPrompt: 'futuristic trade liaison, mid-30s, sleek municipal attire, tasteful gold accents, calm confident expression, sci-fi spaceport backdrop, volumetric light, cinematic, 35mm, high detail',
    lines: [
      'Welcome to Sol City. Docking fees are waived for prompt traders.',
      'Keep it clean and keep it moving—city lanes are busy today.',
      'Union reps are on-site if you need processing rights.',
      'Greenfields keeps testing boundaries. Regulations exist for everyone\'s protection.',
      'Order requires constant maintenance. Some see tyranny, I see civilization.',
      'Hidden Cove claims to fight for freedom. Really, they just fight for profit.',
      'Chief Harlan\'s union talk sounds noble until supply chains collapse.',
    ],
    tips: [
      'Our hospitals pay premium for pharmaceuticals. Check Ceres routes.',
      'Fuel is pricey here; stock up at Helios Refinery first.',
      'Luxury goods sell best in the city core. Mind the spread.',
      'Agricultural inspections protect everyone. Even farmers who resent them.',
      'We maintain defensive systems for a reason. Pirates understand force.',
    ],
  } },
  { id: 'sol-refinery', name: 'Helios Refinery [Cheap: fuel/hydrogen]', type: 'refinery', position: sp([48, 0, -10]), inventory: {} as StationInventory, persona: {
    id: 'helios-rep',
    name: 'Rex Calder',
    title: 'Refinery Quartermaster',
    vibe: 'gruff, practical, no-nonsense',
    avatarPrompt: 'industrial refinery foreman, late-40s, grease-marked utility jacket, hard hat with visor, harsh industrial lighting, pipes and tanks background, gritty realism',
    lines: [
      'Fuel runs clean today. Prices won\'t stay this low.',
      'No loitering near the pumps. Fill, pay, fly.',
      'Hydrogen output is up—haulers get first priority.',
      'Something\'s off with fuel prices system-wide. Ivo Renn\'s name keeps coming up.',
      'Been refining for twenty-six years. Never seen market manipulation this blatant.',
      'Workers built this refinery. We\'ll be damned if corporations price us out.',
      'Granddad believed in free markets. I\'m trying to prove him right.',
    ],
    tips: [
      'Buy refined fuel here, sell to Ceres Power Plant for steady margins.',
      'Electronics cost a fortune out here—bring them from Aurum Fab.',
      'If you have ore, we can crack it. Check your recipes before selling.',
      'Watch fuel inventory levels across stations. Someone\'s hoarding supply.',
      'Union\'s organizing. Corporate types are nervous. Good.',
    ],
  } },
  { id: 'aurum-fab', name: 'Aurum Fabricator [Cheap: electronics/chips/alloys]', type: 'fabricator', position: sp([40, 0, -14]), inventory: {} as StationInventory, persona: {
    id: 'aurum-fab-rep',
    name: 'Dr. Elin Kade',
    title: 'Fabrication Overseer',
    vibe: 'precise, curious, a touch aloof',
    avatarPrompt: 'futuristic fabrication engineer, sharp features, lab coat over smart techwear, holographic schematics, cool color palette, studio lighting',
    lines: [
      'Inputs inform outputs—mind your ratios.',
      'Throughput is everything. Idle time is wasted time.',
      'We debug processes, not people. Be specific.',
      'Drydock produces quality work. But quality doesn\'t scale. Efficiency does.',
      'Centralized fabrication isn\'t monopoly, it\'s optimization. There\'s a difference.',
      'Union sentiment is... understandable. But sentiment doesn\'t power a civilization.',
      'Ceres wants exclusive suppliers. We intend to deliver first. And best.',
    ],
    tips: [
      'Bring silicon and copper ore—convert to microchips for better spreads.',
      'Alloys move well at shipyards; plan a two-hop route.',
      'Electronics sell alright at Freeport when stocks dip.',
      'Raw materials are leverage. Control supply, control markets.',
      'Automation isn\'t replacing workers, it\'s multiplying their output. Eventually.',
    ],
  } },
  { id: 'greenfields', name: 'Greenfields Farm [Food production: grain/meat/sugar]', type: 'farm', position: sp([44, 0, -4]), inventory: {} as StationInventory, persona: {
    id: 'greenfields-rep',
    name: 'Sana Whit',
    title: 'Agrarian Coop Steward',
    vibe: 'warm, grounded, canny',
    avatarPrompt: 'spacefaring agrarian steward, practical workwear with earth tones, hydroponic greenery, gentle smile, soft sunlight, pastoral sci-fi aesthetic',
    lines: [
      'Harvest came in sweet. Try the sugar before it\'s spoken for.',
      'We trade fair. Treat our growers fair back.',
      'Dock smooth. The chicks spook easy.',
      'Sol City calls it regulation. We call it control. There\'s a difference.',
      'Farmers fed this system for generations. Time we got respect instead of tariffs.',
      'Kalla Rook at Freeport sees our value. Direct trade is the future.',
      'Workers and farmers, we\'re not so different. Both getting squeezed by corporate types.',
    ],
    tips: [
      'Meat and grain sell best in Sol City. Refrigeration advised.',
      'Fertilizer is scarce here—source from industrial hubs for profit.',
      'Sugar sometimes spikes at Freeport; watch the ticker.',
      'Independence isn\'t rebellion. It\'s self-determination. Big difference.',
      'Watch for Sol City inspection ships. They\'re getting aggressive.',
    ],
  } },
  { id: 'ceres-pp', name: 'Ceres Power Plant [Cheap: batteries/fuel]', type: 'power_plant', position: sp([-56, 0, 86]), inventory: {} as StationInventory, persona: {
    id: 'ceres-pp-rep',
    name: 'Ivo Renn',
    title: 'Grid Balancer',
    vibe: 'methodical, dry humor, data-driven',
    avatarPrompt: 'power plant operator, minimalist utility suit, data tablet, cool cyan UI glow, turbine backdrop, clean sci-fi style',
    lines: [
      'Load\'s peaking in two hours. Move your batteries soon.',
      'Fuel rates are favorable—today. I\'d move quickly.',
      'Efficiency is a kindness to everyone\'s wallet.',
      'Rex Calder doesn\'t understand grid stability. Free markets crash when supply fluctuates.',
      'Nine years without power failure. That\'s not luck, that\'s planning.',
      'Aurum Fab and Drydock competing benefits us. Competition drives down fabrication costs.',
      'Union rhetoric is charming until hospitals go dark. Then people remember why we charge premiums.',
    ],
    tips: [
      'Buy batteries here and sell at Sol City for city surcharges.',
      'Refined fuel from Helios flips well here on slow days.',
      'Luxury goods are wasted here—take them coreward.',
      'Fuel reserves aren\'t hoarding, they\'re insurance against market volatility.',
      'Watch fabrication contracts. We need a reliable supplier for critical components.',
    ],
  } },
  { id: 'freeport', name: 'Freeport Station [Mixed market]', type: 'trading_post', position: sp([-40, 0, 70]), inventory: {} as StationInventory, persona: {
    id: 'freeport-rep',
    name: 'Kalla Rook',
    title: 'Free Merchant Convener',
    vibe: 'streetwise, charming, slightly rogue',
    avatarPrompt: 'charismatic spacer in patched jacket, eclectic pins, neon stall signs, lively bazaar vibe, bold color lighting',
    lines: [
      'No questions, fair prices—within reason.',
      'If you saw it for sale, you saw it first. Move fast.',
      'Rumor travels faster than ships. Listen closely.',
      'Greenfields wants direct trade. Cuts out Sol City middlemen. I\'m listening.',
      'Pirates and police both shop here. Peace is profitable. War is... complicated.',
      'Hidden Cove and Sol City might actually negotiate. Stranger things have happened.',
      'Workers and corporations fighting over scraps. I\'m offering neutral ground, for a modest fee.',
    ],
    tips: [
      'Watch spreads—Freeport swings. Great for flipping on dips.',
      'Bring farm sugar or meat when Greenfields overflows.',
      'Alloys and chips clear quick on upgrade cycles.',
      'Free trade means free from everyone\'s rules. That\'s the dream, anyway.',
      'Peace talks are risky. But war is expensive. Someone has to try.',
    ],
  } },
  { id: 'drydock', name: 'Drydock Shipyard [Upgrades available]', type: 'shipyard', position: sp([-30, 0, 90]), inventory: {} as StationInventory, persona: {
    id: 'drydock-rep',
    name: 'Chief Harlan',
    title: 'Dockmaster',
    vibe: 'seasoned, blunt, reliable',
    avatarPrompt: 'veteran dockmaster, heavy-duty coveralls, magnetic boots, sparks and scaffolds, warm rim light, cinematic portrait',
    lines: [
      'No cargo? No problem. We bolt speed onto dreams.',
      'Union rates posted. We don\'t haggle, we build.',
      'Mind the grease. It never leaves your boots.',
      'Dr. Kade thinks automation beats craftsmanship. We\'ll see who Ceres chooses.',
      'Workers built this system. Time we got paid like we matter.',
      'Three hundred people work this floor. Kade sees expenses. I see families.',
      'Union\'s organizing across stations. Corporate types are scared. They should be.',
    ],
    tips: [
      'Upgrade cargo before engines if you\'re a hauler.',
      'Microchips from Aurum Fab sell well when we\'re busy.',
      'Batteries move in bulk here during refits.',
      'Quality takes time. Efficiency takes shortcuts. Choose wisely.',
      'Strike talk\'s serious this time. System might get rocky. Stock up.',
    ],
  } },
  { id: 'hidden-cove', name: 'Hidden Cove [Pirate: All fabrication]', type: 'pirate', position: sp([0, 40, 160]), inventory: {} as StationInventory, persona: {
    id: 'hidden-cove-rep',
    name: 'Vex Marrow',
    title: 'Chief Quartermaster',
    vibe: 'dangerous, witty, disarming',
    avatarPrompt: 'pirate quartermaster, asymmetrical armor, scars and smirk, dim red cabin lights, contraband crates, high-contrast noir sci-fi',
    lines: [
      'Rules are different here. Not fewer. Different.',
      'If you can carry it, you can sell it. If you can sell it, you can leave.',
      'Smile, spacer. You\'re among entrepreneurs.',
      'Sol City calls us criminals. We call ourselves free. Perspective matters.',
      'Kalla Rook\'s talking peace. Interesting. Risky. But interesting.',
      'Every system has pirates. We\'re just honest about what we are.',
      'Two generations of Sol City boots on necks. Maybe it\'s time to push back.',
    ],
    tips: [
      'You can fabricate without the Union here—mind the risks.',
      'Luxury goods buy high when city patrols tighten.',
      'Rare minerals always find friends in the Cove.',
      'Freedom isn\'t free. But it\'s worth the price. Usually.',
      'Contracts from Hidden Cove pay well. Just... don\'t ask questions.',
    ],
  } },
];

export const stations: Station[] = baseStations.map((base) => {
  const meta = baseStations.map(s => ({ id: s.id, type: s.type, position: s.position }));
  const inv = priceForStation(base.type, commodities, base.position, meta, base.id);
  return { ...base, inventory: inv, reputation: 0 } as Station;
});

export const belts: AsteroidBelt[] = [
  { id: 'inner-belt', name: 'Common Belt', position: sp([0, 0, 0]), radius: 60 * SCALE, tier: 'common' },
  { id: 'outer-belt', name: 'Rare Belt', position: sp([0, 0, 0]), radius: 120 * SCALE, tier: 'rare' },
];


