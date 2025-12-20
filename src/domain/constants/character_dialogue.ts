// Character dialogue lines - voice-ready conditional dialogue for all station personas
// Each line is 10-30 words, written for natural speech delivery

import type { DialogueLine } from '../types/character_types';

/**
 * Dialogue lines organized by station ID
 * Each character has 25-35 lines covering greetings, gossip, reactions, tips, and farewells
 */
export const CHARACTER_DIALOGUE: Record<string, DialogueLine[]> = {
  
  // ============================================================================
  // MIRA VALE - Sol City (Polished bureaucrat, believes in the system)
  // ============================================================================
  'sol-city': [
    // Greetings by reputation tier
    { id: 'mira_greet_stranger', text: "Welcome to Sol City. Please ensure your documentation is current before conducting business.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'neutral' },
    { id: 'mira_greet_acquaint', text: "Ah, you're becoming a regular. Good. Consistency is the foundation of reliable commerce.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'neutral' },
    { id: 'mira_greet_contact', text: "Good to see you again. Your trading record has been... satisfactory. We appreciate that.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'mira_greet_trusted', text: "Welcome back. Your reputation precedes you. Sol City values reliable partners.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'mira_greet_allied', text: "Always a pleasure. You've proven yourself a true friend to Sol City. How can we help today?", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'mira_greet_firstvisit', text: "First time in Sol City? You'll find everything properly organized here. Unlike some stations.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'neutral' },
    { id: 'mira_greet_longtime', text: "It's been a while. We were beginning to wonder if you'd found better markets elsewhere.", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'cold' },
    
    // Gossip about other characters
    { id: 'mira_gossip_sana', text: "Sana Whit keeps pushing boundaries at Greenfields. Regulations exist to protect everyone, even farmers.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'cold' },
    { id: 'mira_gossip_vex', text: "Vex Marrow and Hidden Cove claim to fight for freedom. Convenient how that freedom involves stealing cargo.", category: 'gossip', conditions: { referencesCharacter: 'hidden-cove' }, voiceTone: 'angry' },
    { id: 'mira_gossip_kalla', text: "Kalla Rook at Freeport operates in gray areas. Useful sometimes, but don't mistake convenience for alliance.", category: 'gossip', conditions: { referencesCharacter: 'freeport' }, voiceTone: 'neutral' },
    { id: 'mira_gossip_harlan', text: "Chief Harlan's union talk sounds noble until you realize supply chains don't run on sentiment.", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'cold' },
    { id: 'mira_gossip_rex', text: "Rex Calder runs a clean operation. If only everyone maintained such standards.", category: 'gossip', conditions: { referencesCharacter: 'sol-refinery' }, voiceTone: 'warm' },
    
    // Reactions to player choices
    { id: 'mira_react_sided_sol', text: "Your support during the Greenfields situation was noted. Sol City remembers those who uphold order.", category: 'reaction', conditions: { requiresAction: 'sided_with_sol_city' }, priority: 10, voiceTone: 'warm' },
    { id: 'mira_react_sided_green', text: "I heard about your involvement with Greenfields. Disappointing, but perhaps you didn't understand the stakes.", category: 'reaction', conditions: { requiresAction: 'sided_with_greenfields' }, priority: 10, voiceTone: 'cold' },
    { id: 'mira_react_enforced_law', text: "Taking action against Hidden Cove took courage. Sol City is proud to call you an ally.", category: 'reaction', conditions: { requiresAction: 'enforced_law' }, priority: 10, voiceTone: 'warm' },
    { id: 'mira_react_joined_pirates', text: "I should have you arrested for your association with pirates. Consider our tolerance... limited.", category: 'reaction', conditions: { requiresAction: 'joined_pirates' }, priority: 10, voiceTone: 'threatening' },
    { id: 'mira_react_broke_strike', text: "Your intervention during the union situation saved us considerable trouble. That won't be forgotten.", category: 'reaction', conditions: { requiresAction: 'broke_strike' }, priority: 8, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'mira_tip_pharma', text: "Our hospitals pay premium for pharmaceuticals. Ceres routes are reliable if you have the cargo space.", category: 'tip', voiceTone: 'neutral' },
    { id: 'mira_tip_fuel', text: "Fuel prices are high here. Smart traders stock up at Helios Refinery before visiting.", category: 'tip', voiceTone: 'neutral' },
    { id: 'mira_tip_luxury', text: "Luxury goods move well in the city core. Mind the spread and timing.", category: 'tip', conditions: { minRep: 20 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'mira_concern_pirates', text: "Pirate activity has increased near the outer routes. Our patrols are stretched thin.", category: 'concern', voiceTone: 'worried' },
    { id: 'mira_concern_stability', text: "The system needs stability now more than ever. Too many factions pulling in different directions.", category: 'concern', voiceTone: 'worried' },
    
    // Farewells
    { id: 'mira_farewell_neutral', text: "Safe travels. Remember, Sol City's markets are always open to lawful traders.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'mira_farewell_trusted', text: "Until next time. And thank you for conducting business properly.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'mira_memory_bigtrader', text: "Your trading volume has been impressive. Sol City appreciates substantial commerce partners.", category: 'memory', conditions: { requiresAction: 'big_trader' }, voiceTone: 'warm' },
    { id: 'mira_memory_missions', text: "Your mission record speaks well of you. We have additional opportunities for capable operators.", category: 'memory', conditions: { requiresAction: 'mission_hero' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // REX CALDER - Sol Refinery (Gruff, working-class, direct)
  // ============================================================================
  'sol-refinery': [
    // Greetings by reputation tier
    { id: 'rex_greet_stranger', text: "New here? No loitering near the pumps. Fill up, pay, and fly.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'cold' },
    { id: 'rex_greet_acquaint', text: "Back again? Good. Means the fuel's treating your engines right.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'neutral' },
    { id: 'rex_greet_contact', text: "Hey there. Prices are fair today. Probably won't stay that way.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'rex_greet_trusted', text: "Good to see a friendly face. These days I can't take that for granted.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'rex_greet_allied', text: "Look who's here! Always got time for you. What do you need?", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'rex_greet_firstvisit', text: "First time at Helios? Twenty-six years I've run these pumps. Best fuel in the system.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'neutral' },
    { id: 'rex_greet_longtime', text: "Wondered where you'd gotten to. Thought maybe Ceres finally lured you with their rigged prices.", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'neutral' },
    
    // Gossip about other characters
    { id: 'rex_gossip_ivo', text: "Ivo Renn at Ceres keeps messing with fuel prices. Can't prove it yet, but something stinks.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp' }, voiceTone: 'angry' },
    { id: 'rex_gossip_harlan', text: "Chief Harlan's good people. Workers gotta stick together, you know?", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'warm' },
    { id: 'rex_gossip_sana', text: "Sana at Greenfields? She's fighting the good fight. Farmers and refinery workers, we understand labor.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'warm' },
    { id: 'rex_gossip_kade', text: "Dr. Kade's too corporate for my taste, but at least she ain't actively screwing workers. Yet.", category: 'gossip', conditions: { referencesCharacter: 'aurum-fab' }, voiceTone: 'neutral' },
    { id: 'rex_gossip_mira', text: "Mira Vale means well, I think. Just too wrapped up in rules to see who they hurt.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'neutral' },
    
    // Reactions to player choices
    { id: 'rex_react_exposed_ceres', text: "You helped expose Ivo's manipulation. Can't tell you what that means. The system owes you.", category: 'reaction', conditions: { requiresAction: 'exposed_ceres' }, priority: 10, voiceTone: 'warm' },
    { id: 'rex_react_protected_ceres', text: "Heard you helped Ivo bury evidence. Didn't think you were that kind of pilot.", category: 'reaction', conditions: { requiresAction: 'protected_ceres' }, priority: 10, voiceTone: 'cold' },
    { id: 'rex_react_supported_strike', text: "You stood with us during the strike. That took guts. Workers remember loyalty.", category: 'reaction', conditions: { requiresAction: 'supported_strike' }, priority: 8, voiceTone: 'warm' },
    { id: 'rex_react_broke_strike', text: "You broke our strike. I understand business, but... we won't forget that.", category: 'reaction', conditions: { requiresAction: 'broke_strike' }, priority: 8, voiceTone: 'cold' },
    { id: 'rex_react_defended_convoy', text: "Those pirates would've killed my crews. You saved lives out there. Thank you.", category: 'reaction', conditions: { requiresAction: 'defended_refinery_convoy' }, priority: 10, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'rex_tip_fuel', text: "Buy refined fuel here, sell to Ceres for steady margins. Simple route, reliable money.", category: 'tip', voiceTone: 'neutral' },
    { id: 'rex_tip_electronics', text: "Electronics cost a fortune out here. Bring 'em from Aurum Fab if you want friends at the refinery.", category: 'tip', voiceTone: 'neutral' },
    { id: 'rex_tip_processing', text: "Got ore? We can crack it. Check your recipes before you sell raw goods elsewhere.", category: 'tip', conditions: { minRep: 20 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'rex_concern_prices', text: "Watch fuel inventory across stations. Someone's hoarding supply. I'd bet my boots it's Ivo.", category: 'concern', voiceTone: 'angry' },
    { id: 'rex_concern_union', text: "Union's organizing across stations. Corporate types are nervous. Good.", category: 'concern', voiceTone: 'amused' },
    
    // Farewells
    { id: 'rex_farewell_neutral', text: "Fly safe. And buy local fuel when you can. Keeps honest workers employed.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'rex_farewell_trusted', text: "Take care of yourself out there. The system needs more traders like you.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks  
    { id: 'rex_memory_frequent', text: "You've been good to this station. Regular business matters more than people think.", category: 'memory', conditions: { requiresAction: 'frequent_visitor' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // DR. ELIN KADE - Aurum Fabricator (Clinical, precise, emotionally detached)
  // ============================================================================
  'aurum-fab': [
    // Greetings by reputation tier
    { id: 'kade_greet_stranger', text: "State your requirements. Fabrication slots are allocated on a priority basis.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'cold' },
    { id: 'kade_greet_acquaint', text: "Your previous transactions were... adequate. How may we optimize today's interaction?", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'neutral' },
    { id: 'kade_greet_contact', text: "Ah. A return customer with satisfactory metrics. Efficiency breeds efficiency.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'neutral' },
    { id: 'kade_greet_trusted', text: "Good. Your reliability data supports priority allocation. I appreciate predictability.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'kade_greet_allied', text: "Excellent. Your partnership metrics are optimal. Aurum Fab values such correlations.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'kade_greet_firstvisit', text: "First interaction. Baseline established. Perform well, and future allocations will reflect it.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'neutral' },
    
    // Gossip about other characters
    { id: 'kade_gossip_harlan', text: "Chief Harlan's artisanal approach has nostalgic appeal. It does not, however, scale.", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'cold' },
    { id: 'kade_gossip_ivo', text: "Ivo Renn understands systemic efficiency. Our operational philosophies align favorably.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp' }, voiceTone: 'neutral' },
    { id: 'kade_gossip_sana', text: "Greenfields serves a function in supply chain logistics. Agricultural sentiment is irrelevant.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'cold' },
    { id: 'kade_gossip_mira', text: "Mira Vale's regulatory framework creates friction. Manageable, but suboptimal.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'neutral' },
    
    // Reactions to player choices
    { id: 'kade_react_chose_aurum', text: "Your support for centralized production was logical. Efficiency thanks you.", category: 'reaction', conditions: { requiresAction: 'chose_aurum_path' }, priority: 10, voiceTone: 'warm' },
    { id: 'kade_react_chose_drydock', text: "You chose Drydock's approach. Sentiment over optimization. Noted.", category: 'reaction', conditions: { requiresAction: 'chose_drydock_path' }, priority: 10, voiceTone: 'cold' },
    { id: 'kade_react_aurum_won', text: "The Ceres contract validated our model. Your contribution to that outcome was... significant.", category: 'reaction', conditions: { requiresAction: 'aurum_won_contract' }, priority: 10, voiceTone: 'warm' },
    { id: 'kade_react_corporate_win', text: "The union disruption was handled efficiently. Order preserves productivity.", category: 'reaction', conditions: { requiresAction: 'corporate_victory' }, priority: 8, voiceTone: 'neutral' },
    
    // Tips and trading advice
    { id: 'kade_tip_silicon', text: "Silicon and copper ore convert to microchips with superior margins. Optimize your cargo allocation.", category: 'tip', voiceTone: 'neutral' },
    { id: 'kade_tip_alloys', text: "Alloys perform well at shipyards. A two-hop route maximizes return on transport investment.", category: 'tip', voiceTone: 'neutral' },
    { id: 'kade_tip_materials', text: "Control raw materials, control markets. Elementary supply chain dynamics.", category: 'tip', conditions: { minRep: 30 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'kade_concern_drydock', text: "Drydock competes for the Ceres contract. Sentiment versus efficiency. The outcome is predetermined.", category: 'concern', voiceTone: 'neutral' },
    { id: 'kade_concern_union', text: "Union rhetoric is charming. Unfortunately, sentiment does not power a civilization.", category: 'concern', voiceTone: 'cold' },
    
    // Farewells
    { id: 'kade_farewell_neutral', text: "Transaction complete. Future interactions will be weighted by performance metrics.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'kade_farewell_trusted', text: "Optimal. Your reliability improves our system variance. We anticipate future correlations.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'kade_memory_bigtrader', text: "Volume analysis indicates significant transaction history. High-value partners receive priority.", category: 'memory', conditions: { requiresAction: 'big_trader' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // SANA WHIT - Greenfields (Warm, earthy, quietly fierce)
  // ============================================================================
  'greenfields': [
    // Greetings by reputation tier
    { id: 'sana_greet_stranger', text: "Welcome to Greenfields. We trade fair here. Hope you do too.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'neutral' },
    { id: 'sana_greet_acquaint', text: "Good to see you again. The harvest's looking strong this cycle.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'warm' },
    { id: 'sana_greet_contact', text: "Hey there, friend. Grab some fresh produce before the corps buy it all up.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'sana_greet_trusted', text: "There's that familiar face. Always glad when friends come calling.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'sana_greet_allied', text: "Family's here! Come on in, let me show you what's fresh.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'sana_greet_firstvisit', text: "First time at a real farm station? Take a breath. Air's different when it's not recycled.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'warm' },
    { id: 'sana_greet_longtime', text: "Been a while! Thought maybe Sol City had convinced you to stick to their approved suppliers.", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'amused' },
    
    // Gossip about other characters
    { id: 'sana_gossip_mira', text: "Mira Vale sent another inspection team. Found nothing, of course. They never do.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'cold' },
    { id: 'sana_gossip_harlan', text: "Chief Harlan understands what we're fighting for. Workers and farmers, same struggle.", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'warm' },
    { id: 'sana_gossip_kalla', text: "Kalla Rook offers direct trade. No middlemen, no tariffs. That's the future.", category: 'gossip', conditions: { referencesCharacter: 'freeport' }, voiceTone: 'warm' },
    { id: 'sana_gossip_rex', text: "Rex Calder's good people. Knows what it means to work with your hands.", category: 'gossip', conditions: { referencesCharacter: 'sol-refinery' }, voiceTone: 'warm' },
    { id: 'sana_gossip_ivo', text: "Ivo Renn charges fair rates, but that monopoly of his makes everyone nervous.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp' }, voiceTone: 'worried' },
    
    // Reactions to player choices
    { id: 'sana_react_sided_green', text: "You stood with us when it mattered. Greenfields doesn't forget loyalty like that.", category: 'reaction', conditions: { requiresAction: 'sided_with_greenfields' }, priority: 10, voiceTone: 'warm' },
    { id: 'sana_react_sided_sol', text: "I heard about Sol City. I won't pretend it doesn't sting. But doors aren't closed forever.", category: 'reaction', conditions: { requiresAction: 'sided_with_sol_city' }, priority: 10, voiceTone: 'cold' },
    { id: 'sana_react_independent', text: "We did it. Independent. Still can't believe it. Thank you for making this possible.", category: 'reaction', conditions: { requiresAction: 'greenfields_independent' }, priority: 10, voiceTone: 'warm' },
    { id: 'sana_react_controlled', text: "Sol City won. We're under their thumb now. But seeds remember how to grow.", category: 'reaction', conditions: { requiresAction: 'greenfields_controlled' }, priority: 10, voiceTone: 'cold' },
    { id: 'sana_react_supported_strike', text: "You supported the workers. That means something here. Solidarity isn't just a word.", category: 'reaction', conditions: { requiresAction: 'supported_strike' }, priority: 8, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'sana_tip_food', text: "Meat and grain sell best in Sol City. Refrigeration helps, but move fast either way.", category: 'tip', voiceTone: 'neutral' },
    { id: 'sana_tip_fertilizer', text: "Fertilizer's always scarce here. Bring it from industrial hubs and you'll find friends.", category: 'tip', voiceTone: 'neutral' },
    { id: 'sana_tip_sugar', text: "Sugar spikes at Freeport sometimes. Watch the ticker, move when it's right.", category: 'tip', conditions: { minRep: 20 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'sana_concern_inspections', text: "Watch for Sol City inspection ships. They're getting aggressive near our routes.", category: 'concern', voiceTone: 'worried' },
    { id: 'sana_concern_independence', text: "Independence isn't rebellion. It's self-determination. There's a difference.", category: 'concern', voiceTone: 'neutral' },
    
    // Farewells
    { id: 'sana_farewell_neutral', text: "Safe travels out there. And remember where your food comes from.", category: 'farewell', voiceTone: 'warm' },
    { id: 'sana_farewell_trusted', text: "Come back soon, hear? Door's always open for friends.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'sana_memory_frequent', text: "You've been good to us. Steady trade keeps this place alive. Thank you.", category: 'memory', conditions: { requiresAction: 'frequent_visitor' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // IVO RENN - Ceres Power Plant (Dry, calculating, subtle menace)
  // ============================================================================
  'ceres-pp': [
    // Greetings by reputation tier
    { id: 'ivo_greet_stranger', text: "New customer. Interesting. Power prices are posted. Questions cost extra.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'cold' },
    { id: 'ivo_greet_acquaint', text: "Back again. I keep records, you know. Everyone's patterns are... informative.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'neutral' },
    { id: 'ivo_greet_contact', text: "Reliable return customer. Good. Predictability has its rewards here.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'neutral' },
    { id: 'ivo_greet_trusted', text: "Ah, a familiar face. The grid appreciates consistent operators.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'ivo_greet_allied', text: "Welcome back. Your cooperation has been... profitable. Let's discuss opportunities.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'ivo_greet_firstvisit', text: "First visit to Ceres Power. Everything runs on my fuel. Remember that.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'threatening' },
    
    // Gossip about other characters
    { id: 'ivo_gossip_rex', text: "Rex Calder thinks free markets solve everything. Charming. Also naive.", category: 'gossip', conditions: { referencesCharacter: 'sol-refinery' }, voiceTone: 'amused' },
    { id: 'ivo_gossip_kade', text: "Dr. Kade understands systems thinking. A rare quality. We collaborate... occasionally.", category: 'gossip', conditions: { referencesCharacter: 'aurum-fab' }, voiceTone: 'neutral' },
    { id: 'ivo_gossip_mira', text: "Mira Vale keeps order. Order requires power. We have a... symbiotic relationship.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'neutral' },
    { id: 'ivo_gossip_harlan', text: "Union rhetoric is charming until hospitals go dark. Then priorities clarify.", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'cold' },
    { id: 'ivo_gossip_vex', text: "Vex Marrow and I have done business. Pirates can be... contractually useful.", category: 'gossip', conditions: { referencesCharacter: 'hidden-cove', minRep: 50 }, voiceTone: 'amused' },
    
    // Reactions to player choices
    { id: 'ivo_react_protected', text: "Your discretion regarding certain market dynamics was appreciated. Wise choice.", category: 'reaction', conditions: { requiresAction: 'protected_ceres' }, priority: 10, voiceTone: 'warm' },
    { id: 'ivo_react_exposed', text: "You shared information that was... strategically sensitive. I have a long memory.", category: 'reaction', conditions: { requiresAction: 'exposed_ceres' }, priority: 10, voiceTone: 'threatening' },
    { id: 'ivo_react_monopoly', text: "The fuel market is stabilized. Thanks to your assistance. The grid remembers its friends.", category: 'reaction', conditions: { requiresAction: 'fuel_monopoly_cemented' }, priority: 10, voiceTone: 'warm' },
    { id: 'ivo_react_corporate_win', text: "The strike situation resolved favorably. Efficiency over sentiment. As it should be.", category: 'reaction', conditions: { requiresAction: 'corporate_victory' }, priority: 8, voiceTone: 'neutral' },
    
    // Tips and trading advice
    { id: 'ivo_tip_batteries', text: "Batteries from here sell well in Sol City. City surcharges create opportunity.", category: 'tip', voiceTone: 'neutral' },
    { id: 'ivo_tip_fuel', text: "Refined fuel from Helios flips well here on slow days. Information is currency.", category: 'tip', voiceTone: 'neutral' },
    { id: 'ivo_tip_reserves', text: "Fuel reserves aren't hoarding. They're insurance against market volatility. Remember that.", category: 'tip', conditions: { minRep: 30 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'ivo_concern_competition', text: "Aurum and Drydock competing for our fabrication contracts. Competition benefits us.", category: 'concern', voiceTone: 'amused' },
    { id: 'ivo_concern_stability', text: "Nine years without grid failure. That's planning, not luck. Don't let idealists forget it.", category: 'concern', voiceTone: 'neutral' },
    
    // Farewells
    { id: 'ivo_farewell_neutral', text: "Power prices fluctuate. Return at optimal times. I'm sure you can figure out when.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'ivo_farewell_trusted', text: "Useful partners are rare. Don't disappoint me.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'neutral' },
    
    // Memory callbacks
    { id: 'ivo_memory_bigtrader', text: "Your transaction volume makes you interesting. Interesting people get opportunities.", category: 'memory', conditions: { requiresAction: 'big_trader' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // KALLA ROOK - Freeport (Street-smart, charming, hint of mischief)
  // ============================================================================
  'freeport': [
    // Greetings by reputation tier
    { id: 'kalla_greet_stranger', text: "New face! Welcome to Freeport. No questions, fair prices. Mostly.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'amused' },
    { id: 'kalla_greet_acquaint', text: "Hey, you came back! That means you either made money or learned something.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'warm' },
    { id: 'kalla_greet_contact', text: "There's my favorite trader! Well, one of them. I keep a list.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'kalla_greet_trusted', text: "Hey friend! Got some interesting opportunities. The kind I only share with people I trust.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'kalla_greet_allied', text: "Family's here! Come on, let me tell you what I've been hearing. You're gonna love this.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'kalla_greet_firstvisit', text: "First time at Freeport? Best advice I've got: keep your ears open and your cargo hold flexible.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'warm' },
    { id: 'kalla_greet_longtime', text: "Where've you been? I had deals going stale waiting for you!", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'amused' },
    
    // Gossip about other characters
    { id: 'kalla_gossip_vex', text: "Vex Marrow brings business, but brings heat too. Pirates are complicated neighbors.", category: 'gossip', conditions: { referencesCharacter: 'hidden-cove' }, voiceTone: 'neutral' },
    { id: 'kalla_gossip_mira', text: "Mira Vale would shut us down if she could prove anything. Good thing she can't.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'amused' },
    { id: 'kalla_gossip_sana', text: "Sana at Greenfields? Good product, fair prices, fighting the good fight. I like her.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'warm' },
    { id: 'kalla_gossip_harlan', text: "Chief Harlan deals straight. Always has. That's worth something in this business.", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'warm' },
    { id: 'kalla_gossip_ivo', text: "Ivo Renn knows more than he lets on. Man like that, you watch carefully.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp' }, voiceTone: 'worried' },
    
    // Reactions to player choices
    { id: 'kalla_react_peace', text: "You brokered peace between the factions. That took guts and smarts. I'm impressed.", category: 'reaction', conditions: { requiresAction: 'brokered_peace' }, priority: 10, voiceTone: 'warm' },
    { id: 'kalla_react_pirate', text: "Heard you're running with Vex now. Interesting choice. Just remember who your friends are.", category: 'reaction', conditions: { requiresAction: 'joined_pirates' }, priority: 10, voiceTone: 'neutral' },
    { id: 'kalla_react_law', text: "Siding with Sol City law enforcement? Bold. Hope you know what you're getting into.", category: 'reaction', conditions: { requiresAction: 'enforced_law' }, priority: 10, voiceTone: 'neutral' },
    { id: 'kalla_react_defended_conf', text: "You protected the peace conference. That took courage. Both sides wanted it dead.", category: 'reaction', conditions: { requiresAction: 'defended_peace_conference' }, priority: 10, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'kalla_tip_spreads', text: "Watch the spreads here. Freeport swings wild. Great for flipping if you time it right.", category: 'tip', voiceTone: 'neutral' },
    { id: 'kalla_tip_sugar', text: "Bring farm sugar or meat when Greenfields overflows. We'll take it off your hands.", category: 'tip', voiceTone: 'neutral' },
    { id: 'kalla_tip_alloys', text: "Alloys and chips clear quick on upgrade cycles. Watch what shipyard's busy.", category: 'tip', conditions: { minRep: 20 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'kalla_concern_peace', text: "Peace talks are risky business. But war is expensive. Someone has to try.", category: 'concern', voiceTone: 'worried' },
    { id: 'kalla_concern_freedom', text: "Free trade means free from everyone's rules. That's the dream, anyway.", category: 'concern', voiceTone: 'neutral' },
    
    // Farewells
    { id: 'kalla_farewell_neutral', text: "Safe flying! And hey, if you hear anything interesting, you know where to find me.", category: 'farewell', voiceTone: 'warm' },
    { id: 'kalla_farewell_trusted', text: "Take care of yourself. Good partners are hard to find.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'kalla_memory_frequent', text: "You're practically furniture here now. That's a compliment, by the way.", category: 'memory', conditions: { requiresAction: 'frequent_visitor' }, voiceTone: 'amused' },
  ],

  // ============================================================================
  // CHIEF HARLAN - Drydock (Blue-collar, loyal, weathered)
  // ============================================================================
  'drydock': [
    // Greetings by reputation tier
    { id: 'harlan_greet_stranger', text: "New pilot? Union rates are posted. We don't haggle, we build.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'neutral' },
    { id: 'harlan_greet_acquaint', text: "Back for more work? Good. Means we did it right the first time.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'neutral' },
    { id: 'harlan_greet_contact', text: "Hey there. Got time to look at your ship if you need it. Quality work, fair price.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'harlan_greet_trusted', text: "Good to see you! The crew's been asking about you. You made an impression.", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'harlan_greet_allied', text: "There's my favorite pilot! Come on in, let's talk about what you need.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'harlan_greet_firstvisit', text: "First time at a real shipyard? Mind the grease. It never leaves your boots.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'amused' },
    { id: 'harlan_greet_longtime', text: "Been a while! Thought maybe you found a shinier shipyard somewhere.", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'neutral' },
    
    // Gossip about other characters
    { id: 'harlan_gossip_kade', text: "Dr. Kade thinks automation beats craftsmanship. We'll see who Ceres chooses.", category: 'gossip', conditions: { referencesCharacter: 'aurum-fab' }, voiceTone: 'cold' },
    { id: 'harlan_gossip_sana', text: "Sana at Greenfields fights the same fight we do. Workers and farmers, we stick together.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'warm' },
    { id: 'harlan_gossip_rex', text: "Rex Calder understands solidarity. Good man. Honest worker.", category: 'gossip', conditions: { referencesCharacter: 'sol-refinery' }, voiceTone: 'warm' },
    { id: 'harlan_gossip_ivo', text: "Ivo Renn talks efficiency but means exploitation. I've seen his type before.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp' }, voiceTone: 'cold' },
    { id: 'harlan_gossip_kalla', text: "Kalla Rook knows everyone, keeps everyone's confidence. Useful friend to have.", category: 'gossip', conditions: { referencesCharacter: 'freeport' }, voiceTone: 'warm' },
    
    // Reactions to player choices
    { id: 'harlan_react_chose_drydock', text: "You backed us against Kade's automation push. That means something to these workers.", category: 'reaction', conditions: { requiresAction: 'chose_drydock_path' }, priority: 10, voiceTone: 'warm' },
    { id: 'harlan_react_chose_aurum', text: "Heard you went with Aurum Fab. Can't say I'm not disappointed.", category: 'reaction', conditions: { requiresAction: 'chose_aurum_path' }, priority: 10, voiceTone: 'cold' },
    { id: 'harlan_react_drydock_won', text: "We got that Ceres contract. Three hundred families secure. That's because of you.", category: 'reaction', conditions: { requiresAction: 'drydock_won_contract' }, priority: 10, voiceTone: 'warm' },
    { id: 'harlan_react_supported_strike', text: "You stood on the line with us. Workers remember who shows up when it matters.", category: 'reaction', conditions: { requiresAction: 'supported_strike' }, priority: 10, voiceTone: 'warm' },
    { id: 'harlan_react_broke_strike', text: "You broke our strike. I understand business pressure, but... some things stay broken.", category: 'reaction', conditions: { requiresAction: 'broke_strike' }, priority: 10, voiceTone: 'cold' },
    { id: 'harlan_react_union_win', text: "Union won. Fair wages, fair conditions. This is what we were fighting for.", category: 'reaction', conditions: { requiresAction: 'union_victory' }, priority: 10, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'harlan_tip_cargo', text: "Upgrade cargo before engines if you're a hauler. Volume beats speed for steady money.", category: 'tip', voiceTone: 'neutral' },
    { id: 'harlan_tip_chips', text: "Microchips from Aurum Fab sell well when we're busy. Watch our fabrication queue.", category: 'tip', voiceTone: 'neutral' },
    { id: 'harlan_tip_quality', text: "Quality takes time. Efficiency takes shortcuts. Choose wisely.", category: 'tip', conditions: { minRep: 30 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'harlan_concern_union', text: "Union's organizing across stations. Corporate types are scared. They should be.", category: 'concern', voiceTone: 'amused' },
    { id: 'harlan_concern_strike', text: "Strike talk's serious this time. System might get rocky. Stock up.", category: 'concern', voiceTone: 'worried' },
    
    // Farewells
    { id: 'harlan_farewell_neutral', text: "Fly safe. And remember who builds the ships that keep you alive.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'harlan_farewell_trusted', text: "Take care out there. You're always welcome at Drydock.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'harlan_memory_missions', text: "You've done good work for us. The crew respects that. I respect that.", category: 'memory', conditions: { requiresAction: 'mission_hero' }, voiceTone: 'warm' },
  ],

  // ============================================================================
  // VEX MARROW - Hidden Cove (Dangerous charm, playful threat)
  // ============================================================================
  'hidden-cove': [
    // Greetings by reputation tier
    { id: 'vex_greet_stranger', text: "Fresh meat! Welcome to Hidden Cove. Rules are different here. Not fewer. Different.", category: 'greeting', conditions: { maxRep: 9 }, voiceTone: 'threatening' },
    { id: 'vex_greet_acquaint', text: "Back again? Either you're brave or stupid. I like both.", category: 'greeting', conditions: { minRep: 10, maxRep: 29 }, voiceTone: 'amused' },
    { id: 'vex_greet_contact', text: "Hey, survivor! You're learning how things work out here. Good.", category: 'greeting', conditions: { minRep: 30, maxRep: 49 }, voiceTone: 'warm' },
    { id: 'vex_greet_trusted', text: "There's my favorite legitimate businessman. How's the pirate life treating you?", category: 'greeting', conditions: { minRep: 50, maxRep: 69 }, voiceTone: 'warm' },
    { id: 'vex_greet_allied', text: "Family's here! Come on, let's discuss some very profitable opportunities.", category: 'greeting', conditions: { minRep: 70 }, voiceTone: 'warm' },
    { id: 'vex_greet_firstvisit', text: "First time in the Cove? Smile, spacer. You're among entrepreneurs.", category: 'greeting', conditions: { isFirstVisit: true }, voiceTone: 'amused' },
    { id: 'vex_greet_longtime', text: "Long time! Thought maybe Sol City finally caught up with you.", category: 'greeting', conditions: { daysSinceVisit: 7 }, voiceTone: 'amused' },
    
    // Gossip about other characters
    { id: 'vex_gossip_mira', text: "Mira Vale calls us criminals. We call ourselves free. Perspective matters.", category: 'gossip', conditions: { referencesCharacter: 'sol-city' }, voiceTone: 'cold' },
    { id: 'vex_gossip_kalla', text: "Kalla Rook plays both sides. Smart woman. We respect that. Usually.", category: 'gossip', conditions: { referencesCharacter: 'freeport' }, voiceTone: 'neutral' },
    { id: 'vex_gossip_sana', text: "Sana Whit fights the same authority we do. Just more politely. For now.", category: 'gossip', conditions: { referencesCharacter: 'greenfields' }, voiceTone: 'amused' },
    { id: 'vex_gossip_harlan', text: "Workers and pirates share more history than either admits. Interesting, no?", category: 'gossip', conditions: { referencesCharacter: 'drydock' }, voiceTone: 'amused' },
    { id: 'vex_gossip_ivo', text: "Ivo Renn has hired us before. He will again. Everyone needs deniable assets.", category: 'gossip', conditions: { referencesCharacter: 'ceres-pp', minRep: 50 }, voiceTone: 'threatening' },
    
    // Reactions to player choices
    { id: 'vex_react_joined', text: "You threw in with us. Welcome to the family. No going back now.", category: 'reaction', conditions: { requiresAction: 'joined_pirates' }, priority: 10, voiceTone: 'warm' },
    { id: 'vex_react_enforced_law', text: "Heard you're playing cop for Sol City now. Disappointing. And dangerous.", category: 'reaction', conditions: { requiresAction: 'enforced_law' }, priority: 10, voiceTone: 'threatening' },
    { id: 'vex_react_peace', text: "Peace talks actually worked. I'm almost impressed. Almost.", category: 'reaction', conditions: { requiresAction: 'brokered_peace' }, priority: 10, voiceTone: 'amused' },
    { id: 'vex_react_attacked_sol', text: "Those Sol City turrets? Beautiful fireworks. You've got style.", category: 'reaction', conditions: { requiresAction: 'attacked_sol_defenses' }, priority: 10, voiceTone: 'warm' },
    
    // Tips and trading advice
    { id: 'vex_tip_fabrication', text: "You can fabricate here without Union papers. Mind the risks. And my cut.", category: 'tip', voiceTone: 'amused' },
    { id: 'vex_tip_luxury', text: "Luxury goods buy high when city patrols tighten. Fear is profitable.", category: 'tip', voiceTone: 'amused' },
    { id: 'vex_tip_minerals', text: "Rare minerals always find friends in the Cove. No questions about origin.", category: 'tip', conditions: { minRep: 20 }, voiceTone: 'neutral' },
    
    // Concerns and world state
    { id: 'vex_concern_sol', text: "Two generations of Sol City boots on necks. Maybe it's time to push back harder.", category: 'concern', voiceTone: 'angry' },
    { id: 'vex_concern_freedom', text: "Every system has pirates. We're just honest about what we are.", category: 'concern', voiceTone: 'neutral' },
    
    // Farewells
    { id: 'vex_farewell_neutral', text: "Fly fast, fly dark. And remember who your real friends are.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'vex_farewell_trusted', text: "Take care out there, partner. The Cove keeps its promises.", category: 'farewell', conditions: { minRep: 40 }, voiceTone: 'warm' },
    
    // Memory callbacks
    { id: 'vex_memory_bigtrader', text: "You've moved serious volume through here. That buys you a certain... consideration.", category: 'memory', conditions: { requiresAction: 'big_trader' }, voiceTone: 'warm' },
  ],
};

/**
 * Get dialogue lines for a specific station
 */
export function getCharacterDialogue(stationId: string): DialogueLine[] {
  return CHARACTER_DIALOGUE[stationId] || [];
}

/**
 * Get total dialogue line count
 */
export function getTotalDialogueCount(): number {
  return Object.values(CHARACTER_DIALOGUE).reduce((sum, lines) => sum + lines.length, 0);
}









