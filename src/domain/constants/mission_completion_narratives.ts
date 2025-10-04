// Mission completion narratives - shown after mission success

export type MissionCompletionNarrative = {
  missionId: string;
  title: string;
  epilogue: string; // Main narrative text
  outcomes: string[]; // Bullet points of what changed
  quote?: {
    text: string;
    speaker: string;
  };
};

export const MISSION_COMPLETION_NARRATIVES: Record<string, MissionCompletionNarrative> = {
  
  // ============================================================================
  // Arc 1: Greenfields Independence
  // ============================================================================
  
  greenfields_stage_1: {
    missionId: 'greenfields_stage_1',
    title: 'Seeds of Rebellion',
    epilogue: 'The luxury goods arrived safely at Greenfields, slipping past Sol City\'s detection grid like smoke through fingers. Sana Whit stands at the loading dock, watching her people unload crates that represent more than contraband—they represent possibility. "This is how it starts," she tells you, her voice quiet but firm. "Small acts of defiance that grow into movements." Through the viewport, you can see Sol City\'s towers glinting in the distance, unaware that the agricultural revolution has already begun.',
    outcomes: [
      'Greenfields receives critical supplies outside Sol City oversight',
      'Agricultural independence movement gains momentum',
      'Sol City\'s regulatory grip begins to weaken',
      'Future smuggling routes established',
    ],
    quote: {
      text: 'They control the regulations. But they can\'t control the harvest.',
      speaker: 'Sana Whit',
    },
  },
  
  greenfields_stage_3: {
    missionId: 'greenfields_stage_3',
    title: 'The Price of Freedom',
    epilogue: 'Three convoys destroyed. Three crews who won\'t make it home. The aftermath is debris fields and distress beacons that eventually go silent. Back at Greenfields, Sana Whit reviews the casualty reports with something between triumph and grief. "I knew those pilots," she says quietly. "Shared meals with their families. But they chose Sol City\'s coin over their roots." Grain prices at Sol City spike immediately—your actions reverberating through market feeds across the system. Economic warfare has real victims. Real consequences. Real change.',
    outcomes: [
      'Sol City grain supply severely disrupted',
      'Food prices spike 40% at Sol City stations',
      'Agricultural leverage shifts to Greenfields',
      'Three trader families mourn their losses',
    ],
    quote: {
      text: 'Revolution isn\'t bloodless. But neither is oppression.',
      speaker: 'Sana Whit',
    },
  },
  
  greenfields_stage_4: {
    missionId: 'greenfields_stage_4',
    title: 'New Markets, New Dawn',
    epilogue: 'The cargo bay at Freeport opens to receive thirty units of agricultural goods bearing the mark of free farmers. Kalla Rook personally oversees the transfer, making sure every worker on the dock understands the significance: this is the first major trade outside Sol City\'s regulatory framework in fifteen years. Word spreads through comms channels within minutes. Other stations watch carefully. Sana Whit\'s gamble paid off—Greenfields proved they can stand alone. The agricultural station is independent now, for better or worse. History will judge whether this was liberation or chaos. But today, at least, it feels like freedom.',
    outcomes: [
      'Greenfields achieves full trade independence',
      'Direct partnerships established with Freeport',
      'Food prices at Greenfields drop permanently (-5%)',
      'Sol City loses agricultural monopoly',
      'Farmers celebrate first autonomous harvest',
    ],
    quote: {
      text: 'We fed the system for generations. Now we feed who we choose.',
      speaker: 'Sana Whit',
    },
  },
  
  sol_city_stage_3: {
    missionId: 'sol_city_stage_3',
    title: 'By the Book',
    epilogue: 'Inspector Chavez completes her audit at Greenfields under your armed protection. Her findings are damning—fourteen regulatory violations, each documented with bureaucratic precision. The pirates never stood a chance against your weapons; the inspection report is the real threat. Back at Sol City, Mira Vale reviews the data with satisfaction. "This isn\'t about punishment," she explains, though her actions suggest otherwise. "It\'s about accountability." Greenfields\' fabrication access is temporarily revoked pending compliance. Regulations have teeth. You helped them bite.',
    outcomes: [
      'Greenfields subjected to regulatory lockdown',
      'Fabrication access suspended temporarily',
      'Sol City authority reinforced through enforcement',
      'Agricultural violations officially documented',
      'Inspector Chavez completes her twenty-fourth year of service',
    ],
    quote: {
      text: 'Law applies equally. Even when it\'s unpopular.',
      speaker: 'Inspector Chavez',
    },
  },
  
  sol_city_stage_4: {
    missionId: 'sol_city_stage_4',
    title: 'Contracts and Control',
    epilogue: 'Four stations. Four enforcement contracts delivered with Sol City\'s official seal. Each document represents a tightening of regulatory control—tariffs, inspections, compliance fees that make Greenfields produce expensive and complicated to trade. You watch market feeds update in real-time as stations adjust their pricing. Greenfields\' independence movement didn\'t fail—it was strangled with paperwork. Mira Vale watches the same feeds with neither triumph nor regret, just the quiet satisfaction of a job completed. "Civilization requires maintenance," she says. "Even when people hate the mechanics." Order restored. Freedom reduced. The system functions.',
    outcomes: [
      'Enforcement contracts bind four major stations',
      'Greenfields produce requires certification for all trades',
      'Additional tariffs fund Sol City regulatory apparatus',
      'All goods from Sol City discounted permanently (-5%)',
      'Agricultural independence crushed through bureaucracy',
    ],
    quote: {
      text: 'They called it oppression. I call it Tuesday.',
      speaker: 'Mira Vale',
    },
  },
  
  // ============================================================================
  // Arc 2: Fabrication Wars
  // ============================================================================
  
  fabrication_wars_aurum_stage_1: {
    missionId: 'fabrication_wars_aurum_stage_1',
    title: 'Industrial Espionage',
    epilogue: 'The data chip containing Drydock\'s alloy formula sits in Dr. Kade\'s lab, already being reverse-engineered by her best analysts. "Elegant work," she admits, studying the molecular diagrams. "Harlan\'s team has real talent. Inefficiently applied, but real." Within hours, Aurum Fab begins producing superior alloys at 10% faster rates. Drydock will notice the market shift soon. Chief Harlan will know exactly what happened. Corporate espionage dressed as competition. The fabrication wars just escalated.',
    outcomes: [
      'Aurum Fab gains access to proprietary alloy formula',
      'Production efficiency increases 10%',
      'Drydock loses competitive advantage',
      'Industrial espionage normalized',
    ],
    quote: {
      text: 'Intellectual property is just property. And property can be acquired.',
      speaker: 'Dr. Elin Kade',
    },
  },
  
  fabrication_wars_stage_2_aurum: {
    missionId: 'fabrication_wars_stage_2_aurum',
    title: 'Cornering the Market',
    epilogue: 'The raw materials arrive at Aurum Fab—every available unit of copper ore and silicon from three stations. Dr. Kade reviews the inventory manifest with clinical satisfaction. Somewhere across the system, Drydock\'s fabrication floor is going silent. Workers standing idle. Machines sitting cold. "Economic warfare is elegant because it\'s reversible," Dr. Kade explains. "No one dies. They just... lose." But you think about those three hundred workers at Drydock, wondering how they\'ll feed their families while the floor stays dark. Elegant, maybe. Bloodless, technically. Harmless? That\'s harder to argue.',
    outcomes: [
      'All available copper ore and silicon secured',
      'Drydock fabrication capacity drops to zero temporarily',
      'Aurum Fab stockpiles critical materials',
      'Worker families at Drydock face uncertain future',
    ],
    quote: {
      text: 'Control the inputs, control the future. It\'s really quite simple.',
      speaker: 'Dr. Elin Kade',
    },
  },
  
  fabrication_wars_stage_3_aurum: {
    missionId: 'fabrication_wars_stage_3_aurum',
    title: 'Supply Chain Sabotage',
    epilogue: 'Five traders destroyed. Five ships that were just trying to make a living caught in a corporate war they didn\'t start. Their cargo—electronics and alloys bound for Drydock—now drifts as debris. You collect what you can salvage, but mostly you collect the weight of what you\'ve done. Dr. Kade calls it "market correction." Drydock calls it murder. The truth is probably somewhere between. What\'s certain is that Drydock\'s fabrication recovery just got much more expensive. And somewhere, families are filing insurance claims that won\'t cover the grief.',
    outcomes: [
      'Five independent traders killed in action',
      'Drydock emergency supplies destroyed',
      'Fabrication prices at Drydock increase 25%',
      'Aurum Fab\'s market dominance expands',
      'Five families grieve',
    ],
    quote: {
      text: 'Efficiency creates abundance. Eventually. For survivors.',
      speaker: 'Dr. Elin Kade',
    },
  },
  
  fabrication_wars_stage_4_aurum: {
    missionId: 'fabrication_wars_stage_4_aurum',
    title: 'The Efficiency Doctrine',
    epilogue: 'Your ship docks at Ceres Power Plant first. Fifty units of precisely fabricated goods, every specification met, every deadline beaten. Drydock\'s ship arrives three minutes later—too late. Ivo Renn doesn\'t even open their cargo bay. "First delivery wins. Contract terms were clear." Dr. Kade receives the confirmation with neither joy nor surprise, just the quiet satisfaction of a theorem proved. Aurum Fab is now the exclusive supplier to Ceres for five years. Centralized production won. Automated efficiency beat human craftsmanship. Progress, maybe. But Chief Harlan\'s face on the departing Drydock ship suggests this isn\'t over.',
    outcomes: [
      'Aurum Fab wins exclusive 5-year supply contract with Ceres',
      'Centralized fabrication model validated',
      'All fabrication at Aurum Fab discounted permanently (-10%)',
      'Drydock loses major income stream',
      'Automation triumphs over artisan work',
    ],
    quote: {
      text: 'The future belongs to systems, not sentiment.',
      speaker: 'Dr. Elin Kade',
    },
  },
  
  fabrication_wars_drydock_stage_1: {
    missionId: 'fabrication_wars_drydock_stage_1',
    title: 'Sabotage and Solidarity',
    epilogue: 'The false schematics sit in Aurum Fab\'s database now, a digital poison pill that will corrupt their research for months. Chief Harlan doesn\'t celebrate—he just returns to the floor, helping workers finish a particularly complex alloy job. "Didn\'t want it to come to this," he tells you. "Rather compete on quality than tricks." But Dr. Kade forced his hand by playing dirty first. Sometimes you fight back with the weapons you\'re given, even if you hate the fight.',
    outcomes: [
      'Aurum Fab\'s research corrupted by false data',
      'Drydock gains temporary competitive breathing room',
      'Industrial sabotage enters the fabrication wars',
      'Worker morale at Drydock improves',
    ],
    quote: {
      text: 'We\'d rather build than break. But we\'ll do both if we have to.',
      speaker: 'Chief Harlan',
    },
  },
  
  fabrication_wars_stage_2_drydock: {
    missionId: 'fabrication_wars_stage_2_drydock',
    title: 'Workers Strike Back',
    epilogue: 'The raw materials arrive at Drydock just ahead of Aurum Fab\'s buyers. Chief Harlan personally oversees the unloading, every unit of copper ore and silicon representing saved jobs. "Kade thinks she can starve us out," he says, watching workers secure the cargo. "Underestimates what people will do to protect their families." Somewhere at Aurum Fab, production lines are shutting down as they run out of materials. The corporate giant just discovered that workers can fight dirty too when their livelihoods are threatened.',
    outcomes: [
      'Critical raw materials secured for Drydock',
      'Aurum Fab fabrication temporarily disabled',
      'Worker solidarity demonstrates market power',
      'Three hundred jobs at Drydock protected',
    ],
    quote: {
      text: 'We built this system with our hands. We\'ll defend it the same way.',
      speaker: 'Chief Harlan',
    },
  },
  
  fabrication_wars_stage_3_drydock: {
    missionId: 'fabrication_wars_stage_3_drydock',
    title: 'The Human Cost',
    epilogue: 'Five convoys destroyed. Five independent traders who took Aurum Fab\'s money and paid with their lives. Chief Harlan reviews the casualty list with visible anguish—these weren\'t corporate soldiers, just people trying to earn. "I\'m asking you to do something I never thought I\'d ask," he said. And you did it. Aurum Fab\'s supply chain is crippled. Their prices spike. Three hundred workers at Drydock keep their jobs. The math works out. The morality doesn\'t. But when corporations play chess with people\'s livelihoods, someone has to protect the pawns. Even if it means becoming a piece yourself.',
    outcomes: [
      'Five supply convoys destroyed',
      'Aurum Fab fabrication costs spike 25%',
      'Drydock retains market competitiveness',
      'Three hundred worker families protected',
      'Five trader families mourn',
    ],
    quote: {
      text: 'I\'ll carry this weight. But I won\'t apologize for protecting my people.',
      speaker: 'Chief Harlan',
    },
  },
  
  fabrication_wars_stage_4_drydock: {
    missionId: 'fabrication_wars_stage_4_drydock',
    title: 'Craftsmanship Vindicated',
    epilogue: 'Your ship docks at Ceres first. Fifty units of fabricated goods, each one inspected by hand, each one bearing the mark of human excellence. Ivo Renn examines a sample component, turning it in the light. "Quality differential is measurable," he admits. Then he signs the contract. Drydock wins. Five years of guaranteed business. Three hundred workers erupt in celebration on the floor below. Chief Harlan just nods once, exhausted but vindicated. Human craftsmanship can compete. Workers can win. Sometimes. When they\'re willing to pay the price. And you helped them pay it.',
    outcomes: [
      'Drydock wins exclusive 5-year supply contract with Ceres',
      'Artisan craftsmanship model validated',
      'All fabrication at Drydock discounted permanently (-10%)',
      'Worker-owned production proves competitive',
      'Three hundred families secure stable future',
    ],
    quote: {
      text: 'We didn\'t just win a contract. We proved we matter.',
      speaker: 'Chief Harlan',
    },
  },
  
  // ============================================================================
  // Arc 3: Energy Monopoly
  // ============================================================================
  
  energy_monopoly_stage_1: {
    missionId: 'energy_monopoly_stage_1',
    title: 'Evidence Gathered',
    epilogue: 'The monitoring device did its work. Thirty seconds at Ceres Power Plant, sensors recording every fuel transaction, every price manipulation, every artificial supply restriction. You undock before security notices anything unusual. Back at Sol Refinery, Rex Calder reviews the data with hands that shake—not from age, but from vindication. "Proof," he says, voice rough. "Finally, proof." The evidence is damning. Ivo Renn has been systematically manipulating fuel markets for months. Now comes the hard part: deciding what to do about it.',
    outcomes: [
      'Comprehensive evidence of price manipulation collected',
      'Ivo Renn\'s fuel hoarding documented',
      'Market manipulation patterns revealed',
      'Rex Calder gains leverage',
    ],
    quote: {
      text: 'Numbers don\'t lie. But they can be buried. Not anymore.',
      speaker: 'Rex Calder',
    },
  },
  
  energy_monopoly_stage_3_refinery: {
    missionId: 'energy_monopoly_stage_3_refinery',
    title: 'Convoy Protection',
    epilogue: 'Four waves of pirates repelled. Three fuel convoys safely delivered. Rex Calder removes his combat armor with visible relief—this isn\'t the job he signed up for, but it\'s the job that needed doing. The convoy pilots thank you personally, each one aware they might not have made it home without your protection. "Ivo paid premium rates for our deaths," one pilot tells you. "You worked for basic ethics." The convoys completed their deliveries. Fuel prices begin normalizing. Ivo Renn\'s monopoly just took a major hit. Free markets, defended with guns.',
    outcomes: [
      'Three fuel convoys delivered safely',
      'Four waves of hired pirates destroyed',
      'Fuel supply to remote stations restored',
      'Ivo Renn\'s retaliation fails',
      'Free market principles defended by force',
    ],
    quote: {
      text: 'Sometimes the only way to protect trade freedom is with weapons. I hate that.',
      speaker: 'Rex Calder',
    },
  },
  
  energy_monopoly_stage_4_refinery: {
    missionId: 'energy_monopoly_stage_4_refinery',
    title: 'Breaking the Monopoly',
    epilogue: 'Forty units of rare minerals arrive at Freeport. Engineers from three stations gather for the installation of the system\'s second refinery—smaller than Sol\'s, but independent. Kalla Rook oversees the setup with barely contained excitement. "This changes everything," she says. "No more single-point control. No more manufactured scarcity." Rex Calder watches the work via video feed from Sol Refinery, and there\'s something approaching hope in his weathered face. His grandfather believed markets would regulate themselves if kept free. Today, they proved him right. Fuel prices normalize across the system. One station can\'t corner the market anymore. Economic freedom, built with rare earth minerals and stubborn idealism.',
    outcomes: [
      'Independent micro-refinery established at Freeport',
      'Fuel monopoly permanently broken',
      'All fuel prices normalize (-10% system-wide)',
      'Three stations contribute engineering support',
      'Free market principles restored',
    ],
    quote: {
      text: 'My grandfather would be proud. Free markets work when you keep them free.',
      speaker: 'Rex Calder',
    },
  },
  
  energy_monopoly_stage_3_ceres: {
    missionId: 'energy_monopoly_stage_3_ceres',
    title: 'Market Consolidation',
    epilogue: 'Three convoys destroyed. Rex Calder\'s attempt to flood the market with cheap fuel ends in debris fields and insurance claims. Ivo Renn reviews the operation reports with neither satisfaction nor remorse. "Infrastructure depends on stability," he explains, highlighting grid dependency charts. "Rex threatened that stability. Actions have consequences." Fuel prices stabilize at Ceres\' preferred rates. The monopoly holds. Maybe Ivo\'s right—maybe consistent power to eight stations is worth the cost of market manipulation. Or maybe you just helped an oppressor maintain control with a convincing justification. The hospitals have power. The convoys have funerals. Math is complicated.',
    outcomes: [
      'Three refinery convoys destroyed',
      'Sol Refinery\'s market challenge crushed',
      'Ceres monopoly reinforced through violence',
      'Grid stability maintained at cost of freedom',
      'Three crews didn\'t make it home',
    ],
    quote: {
      text: 'I don\'t need to be liked. I need to keep the lights on.',
      speaker: 'Ivo Renn',
    },
  },
  
  energy_monopoly_stage_4_ceres: {
    missionId: 'energy_monopoly_stage_4_ceres',
    title: 'Total Market Control',
    epilogue: 'Twelve minutes. Five stations. Every unit of refined fuel in the system, now sitting in Ceres Power Plant\'s storage tanks. Ivo Renn studies real-time market feeds showing panic buying, price spikes, and desperate station managers trying to secure emergency reserves that don\'t exist. "Grid failures kill thousands," he says calmly. "Market volatility kills thousands. I prevent both." Ceres now controls 90% of the system\'s fuel supply. Stability, purchased with monopolistic control. Nine years without a power failure. No station can match that record. Is this oppression? Or just efficiency taken to its logical conclusion? Hospitals have guaranteed power. Traders face guaranteed prices. Freedom is reduced. Safety is increased. Choose your values.',
    outcomes: [
      'Ceres controls 90% of system fuel supply',
      'Permanent monopoly established',
      'Fuel discount available exclusively at Ceres (-15%)',
      'Market volatility eliminated through control',
      'Economic freedom sacrificed for grid stability',
    ],
    quote: {
      text: 'Nine years without failure. I\'ll carry the moral weight if it keeps the lights on.',
      speaker: 'Ivo Renn',
    },
  },
  
  // ============================================================================
  // Arc 4: Pirate Accords
  // ============================================================================
  
  pirate_accords_stage_1: {
    missionId: 'pirate_accords_stage_1',
    title: 'Diplomatic Channels',
    epilogue: 'The diplomatic pouch arrives at Hidden Cove intact—you fought off one pirate ambush en route, proving Kalla Rook\'s concerns justified. Vex Marrow opens the sealed container personally, reading the peace proposal with an expression you can\'t quite read. "Interesting," is all Vex says. But the fact that the message was received matters. Communication channels are open. Freeport remains neutral ground. War isn\'t inevitable. Maybe. Hidden Cove hasn\'t rejected negotiation outright. Sol City hasn\'t launched a preemptive strike. This is what diplomacy looks like: small steps toward conversation instead of the usual escalation toward violence.',
    outcomes: [
      'Peace proposal successfully delivered',
      'Communication channel established between factions',
      'Diplomatic option remains viable',
      'Freeport positioned as neutral mediator',
      'One pirate ambush repelled',
    ],
    quote: {
      text: 'We\'re listening. That\'s more than Sol City usually gets.',
      speaker: 'Vex Marrow',
    },
  },
  
  pirate_accords_stage_3_pirate: {
    missionId: 'pirate_accords_stage_3_pirate',
    title: 'Revolution\'s Price',
    epilogue: 'Three defense turrets destroyed. Sol City\'s primary approach vectors now vulnerable. The station isn\'t defenseless—far from it—but the symbolic damage is devastating. Vex Marrow watches the tactical feeds with fierce satisfaction. "We proved they can bleed," Vex says. Around Hidden Cove, pirates are celebrating. But you see the other side in the casualty reports: station security personnel killed at their posts. Civilian ships caught near the battle zone. Revolution has a cost, and tonight someone else is paying it. Sol City will retaliate. This war is far from over. Maybe it\'s justified. Maybe it\'s necessary. Maybe it\'s both. But it\'s definitely happening, and you just escalated it.',
    outcomes: [
      'Three Sol City defense turrets destroyed',
      'Hidden Cove proves ability to strike authority',
      'Black market access granted permanently',
      'Sol City defensive capabilities weakened',
      'Counter-retaliation inevitable',
      'Security personnel casualties',
    ],
    quote: {
      text: 'They call this terrorism. We call it self-defense. Language depends on power.',
      speaker: 'Vex Marrow',
    },
  },
  
  pirate_accords_stage_3_law: {
    missionId: 'pirate_accords_stage_3_law',
    title: 'Order Restored',
    epilogue: 'Three turrets destroyed. Hidden Cove\'s defensive perimeter breached. Sol City security forces move in for the lockdown as you withdraw. The pirate station isn\'t destroyed—Mira Vale kept her word about due process—but it\'s contained. Neutralized. You watch the security vessels establish a blockade, cutting Hidden Cove off from the system. Some pirates will escape. Some will be arrested. Some will die resisting. Mira Vale reviews the operation with professional satisfaction. "The law applies to everyone," she says. "Today we proved it." But you think about the traders at Hidden Cove who just wanted a place to operate freely. About the families who built lives in that station. About how justice and oppression can look identical from different angles.',
    outcomes: [
      'Hidden Cove defensive turrets destroyed',
      'Station temporarily locked down by Sol City',
      'Bounty hunting system activated',
      'Pirate threat reduced system-wide',
      'Hidden Cove marked permanently hostile to you',
      'Pirate attacks increase 50% in retaliation',
    ],
    quote: {
      text: 'Rule of law means everyone accountable. Even the sympathetic ones.',
      speaker: 'Mira Vale',
    },
  },
  
  pirate_accords_stage_3_peace: {
    missionId: 'pirate_accords_stage_3_peace',
    title: 'Against All Odds',
    epilogue: 'Two waves of extremists repelled. Sol City hardliners who wanted Vex dead. Pirate zealots who wanted Mira dead. Both factions preferring war to the messy complexity of peace. You defended the conference from both sides—your weapons making no distinction between law enforcement and pirate ideology, just threats to negotiation. Inside the hall, Mira Vale and Vex Marrow signed an agreement neither one completely likes. That\'s how you know it might actually work. Freeport becomes official neutral ground. Pirate attacks decrease by treaty. Sol City agrees to reduce patrols. Nobody won. Nobody lost completely. That\'s called compromise. It feels unsatisfying. It\'s also the only path where most people survive.',
    outcomes: [
      'Peace agreement signed between Sol City and Hidden Cove',
      'Pirate attacks decrease 50% system-wide',
      'Freeport recognized as neutral ground',
      'Both extremist attacks repelled',
      'Reputation increased with all three factions',
      'Trade routes safer for all participants',
    ],
    quote: {
      text: 'Peace isn\'t pretty. But it beats the alternative. Usually.',
      speaker: 'Kalla Rook',
    },
  },
  
  // ============================================================================
  // Arc 5: Union Crisis
  // ============================================================================
  
  union_crisis_stage_1: {
    missionId: 'union_crisis_stage_1',
    title: 'The Word Spreads',
    epilogue: 'Five stations visited. Five sets of union pamphlets delivered. Fifteen minutes of pure logistics that will echo through the system for months. At each station, workers gathered around to read the proposals: fair wages, safe conditions, profit sharing, recognition. Chief Harlan watches the response through comms channels—arguments breaking out in break rooms, corporate managers getting nervous, workers getting organized. "This is how it starts," he says. "Not with violence. With conversation. With people realizing they deserve better." The union is organizing. Corporate stations are monitoring. The labor crisis is no longer theoretical. It\'s here.',
    outcomes: [
      'Union pamphlets distributed system-wide',
      'Worker consciousness raised across five stations',
      'Corporate security increases at all stations',
      'Labor organizing gains momentum',
      'System-wide conversation about worker rights begins',
    ],
    quote: {
      text: 'You can\'t stop an idea whose time has come. We\'re just helping it arrive.',
      speaker: 'Chief Harlan',
    },
  },
  
  union_crisis_stage_3_union: {
    missionId: 'union_crisis_stage_3_union',
    title: 'The Strike That Worked',
    epilogue: 'The data arrives at Freeport—six stations\' worth of operating costs, profit margins, and labor expenses. Real numbers that prove what workers always suspected: there\'s enough. Enough profit to pay fair wages. Enough margin to improve conditions. Enough wealth being hoarded at the top. Kalla Rook presides over the negotiations with surprising skill. Dr. Kade arrives with charts. Chief Harlan arrives with resolve. They argue for six hours straight. Then they sign. The union wins. Not everything they wanted. But enough. Fabrication costs drop as worker efficiency improves. Rights are codified. Profit-sharing becomes standard. Three hundred families at Drydock exhale in relief. Thousands more across the system take notice. Workers won. This time.',
    outcomes: [
      'Union secures binding agreements with major stations',
      'All fabrication costs decrease permanently (-10%)',
      'Worker rights formally codified',
      'Profit-sharing programs established',
      'Labor movement legitimized across system',
      'Corporate stations agree to fair negotiation',
    ],
    quote: {
      text: 'We didn\'t win everything. But we won enough. And we proved we could.',
      speaker: 'Chief Harlan',
    },
  },
  
  union_crisis_stage_3_corporate: {
    missionId: 'union_crisis_stage_3_corporate',
    title: 'The Strike That Broke',
    epilogue: 'The strike is broken. Workers return to stations with nothing to show for their organizing except bruised pride and depleted savings. Dr. Kade presides over the "negotiations" at Freeport with data that proves her point: union demands were economically unsustainable. The numbers work. The logic holds. Chief Harlan sits across from her looking defeated but not destroyed. "You won this round," he says. "But the conversation isn\'t over." Kade just nods. She knows he\'s right. Fabrication efficiency improves under corporate control. Stations run smoothly. Workers return to their stations, their organizing effort failed but not forgotten. You helped break the strike. Helped maintain corporate power. Helped keep the system running smoothly at the cost of worker leverage. Choose your values. Live with your choices.',
    outcomes: [
      'Strike broken, workers return without gains',
      'Corporate fabrication efficiency optimized',
      'Union movement set back years',
      'Fabrication efficiency improved under corporate control',
      'Worker morale at historic low',
      'Corporate stations gain precedent for resisting labor demands',
    ],
    quote: {
      text: 'Sometimes the moral choice is defending efficiency over sentiment.',
      speaker: 'Dr. Elin Kade',
    },
  },
};

// Helper function to get narrative by mission ID
export function getMissionCompletionNarrative(missionId: string): MissionCompletionNarrative | undefined {
  return MISSION_COMPLETION_NARRATIVES[missionId];
}

