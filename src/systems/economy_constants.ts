export const economy_constants = {
	// Distance-based premium (QUADRATIC: premium = k * (distance/norm)^2)
	// Short routes = tiny profit, long routes = big profit (up to 3-4x)
	// World scale: short routes ~200 units, long routes ~1500-1800 units
	k_dist_by_category: {
		tech: 3.0,        // Microchips, nanomaterials - highest tier, 4x on long hauls
		industrial: 2.5,  // Machinery, alloys - ~3x for long routes
		energy: 2.5,      // Batteries - also ~3x per user feedback
		medical: 2.5,     // Pharmaceuticals reward distance
		luxury: 2.0,      // Luxury goods have good margins already
		fuel: 1.8,        // Refined fuel - mid-tier
		consumer: 1.5,    // Textiles etc - moderate bonus
		food: 1.2,        // Food - smaller distance bonus
		gas: 1.0,         // Gases - base premium
		raw: 0.8,         // Raw materials - smallest premium (bulky, cheap)
	},
	max_distance_premium: 2.5,
	// Normalize distances by this scale (matches actual world: stations span ~200-1800 units)
	distance_norm: 1500,

	// Stock-driven scarcity curve
	k_stock: 1.0,
	min_stock_multiplier: 0.5,
	max_stock_multiplier: 3.0,
	min_buy_stock_multiplier: 0.5,
	max_buy_stock_multiplier: 2.0,

	// Affinity nudges (multiplicative, applied to both base buy/sell before volatility)
	// Keys: station type -> category -> { buy, sell }
	affinity: {
		city: {
			medical: { buy: 1.12, sell: 1.15 },
			luxury: { buy: 1.1, sell: 1.12 },
			energy: { buy: 1.06, sell: 1.08 },
		},
		power_plant: {
			fuel: { buy: 1.1, sell: 1.08 },
			energy: { buy: 1.08, sell: 1.08 },
		},
		fabricator: {
			tech: { buy: 1.06, sell: 1.1 },
			raw: { buy: 0.9, sell: 0.95 },
		},
		refinery: {
			raw: { buy: 0.92, sell: 0.96 },
			industrial: { buy: 1.05, sell: 1.06 },
		},
		farm: {
			food: { buy: 0.92, sell: 0.94 },
			consumer: { buy: 0.96, sell: 0.98 },
		},
		research: {
			tech: { buy: 1.08, sell: 1.12 },
			medical: { buy: 1.08, sell: 1.12 },
		},
		trading_post: {},
		orbital_hab: {
			consumer: { buy: 1.06, sell: 1.08 },
			energy: { buy: 1.06, sell: 1.08 },
		},
		shipyard: {
			industrial: { buy: 1.08, sell: 1.12 },
			tech: { buy: 1.05, sell: 1.1 },
			energy: { buy: 1.10, sell: 1.15 },  // Ships need batteries for power systems
		},
		pirate: {
			luxury: { buy: 1.08, sell: 1.12 },
		},
	} as Record<string, Record<string, { buy: number; sell: number }>>, // loose typing for simplicity

	// Fabrication profitability floors by output category
	// These add to (input_cost * ratio) to ensure crafting is profitable
	// Higher values for hard-to-produce items at end of production chains
	craft_floor_margin: {
		tech: 300,        // Microchips, nanomaterials - multi-step, high value
		industrial: 150,  // Machinery, alloys - important tier 2 goods
		medical: 200,     // Pharmaceuticals - valuable end product
		luxury: 150,      // Luxury goods - crafted from multiple inputs
		energy: 100,      // Batteries - tier 2
		fuel: 50,         // Refined fuel - tier 1
		consumer: 40,     // Textiles, etc - tier 1
		food: 25,         // Meat processing - simple
		gas: 25,          // Oxygen from water - simple
		raw: 20,          // Minimal for raw (rarely crafted)
	},

	// Featured arbitrage seeding
	featured: {
		count: 3,
		min_multiplier: 1.5,
		max_multiplier: 1.8,
		candidate_categories: ['tech', 'medical', 'luxury', 'energy', 'industrial'] as const,
	},
};
