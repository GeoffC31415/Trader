export const economy_constants = {
	// Distance-based premium
	k_dist_by_category: {
		tech: 0.35,
		medical: 0.35,
		luxury: 0.35,
		industrial: 0.25,
		energy: 0.25,
		fuel: 0.25,
		consumer: 0.2,
		food: 0.2,
		gas: 0.18,
		raw: 0.18,
	},
	max_distance_premium: 0.4,
	// Normalize distances by this scale (in world units)
	distance_norm: 120,

	// Stock-driven scarcity curve
	k_stock: 0.5,
	min_stock_multiplier: 0.85,
	max_stock_multiplier: 1.35,
	min_buy_stock_multiplier: 0.9,
	max_buy_stock_multiplier: 1.25,

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
		},
		pirate: {
			luxury: { buy: 1.08, sell: 1.12 },
		},
	} as Record<string, Record<string, { buy: number; sell: number }>>, // loose typing for simplicity

	// Fabrication profitability floors by output category
	craft_floor_margin: {
		industrial: 30,
		tech: 80,
		medical: 100,
		luxury: 100,
		energy: 40,
		consumer: 20,
		food: 15,
		fuel: 25,
		gas: 15,
		raw: 15,
	},

	// Featured arbitrage seeding
	featured: {
		count: 3,
		min_multiplier: 1.5,
		max_multiplier: 1.8,
		candidate_categories: ['tech', 'medical', 'luxury', 'energy', 'industrial'] as const,
	},
};
