/**
 * Character Backstories
 * 
 * Deep narrative histories for each station character, designed to inform
 * dialogue, mission arcs, and character interactions. Each backstory includes:
 * - Formative childhood/early experiences
 * - Key turning points and trauma
 * - Connections to other characters
 * - Motivations driving current behavior
 */

export type CharacterBackstory = {
  characterId: string;
  stationId: string;
  name: string;
  summary: string;
  backstory: string;
  keyConnections: {
    characterId: string;
    relationship: string;
    sharedHistory: string;
  }[];
  formativeEvents: string[];
  coreMotivations: string[];
  secrets: string[];
};

export const characterBackstories: CharacterBackstory[] = [
  // ============================================================================
  // MIRA VALE - Sol City Civic Trade Liaison
  // ============================================================================
  {
    characterId: 'sol-city-rep',
    stationId: 'sol-city',
    name: 'Mira Vale',
    summary: 'A colonial administrator\'s daughter who witnessed the chaos of the Freeport Riots as a child, now dedicated to maintaining order at any cost.',
    backstory: `
Mira Vale was born aboard the administrative vessel *Covenant Principle* during the Second Expansion, the daughter of Deputy Colonial Administrator Darius Vale. Her earliest memories are of polished corridors, formal dinners, and the quiet hum of systems running perfectly. Her father believed that civilization was a fragile thing—a garden that required constant tending lest the weeds of chaos overtake it.

When Mira was eleven, her family was stationed at Freeport during what history calls the "Freeport Riots"—a week of violence sparked by a supply shortage that spiraled into looting, sabotage, and three hundred deaths. Mira remembers hiding in a cargo container while fires burned outside, listening to screaming she couldn't identify as celebration or terror. Her father worked seventy-two hours straight to restore order, and when it was over, he told her: "Without structure, people become animals. Remember that."

She excelled in the Colonial Administrative Academy, graduating top of her class in logistics and trade regulation. Her first posting was as a junior trade inspector at Greenfields Farm, where she crossed paths with a young agronomist named Sana Whit. They worked together briefly—Mira found Sana's passion admirable but naive. When Mira flagged Greenfields for regulatory violations (minor but clear), Sana took it as a personal betrayal. The friendship never recovered.

At twenty-eight, Mira was assigned to Sol City as assistant to the aging Trade Liaison. When he died unexpectedly (heart failure during a budget meeting), she was thrust into the role. She's held it for eight years now, and her methods have drawn criticism—some call her approach "authoritarian," she calls it "consistent."

She genuinely believes that the system—with all its paperwork and protocols—protects people from themselves. She's seen what happens when the rules break down. She will never let that happen to Sol City.

What keeps her up at night: She knows Ivo Renn is manipulating fuel prices. She can't prove it. And worse, she needs his cooperation to keep the lights on in Sol City's hospitals. The moral compromise gnaws at her.
    `,
    keyConnections: [
      {
        characterId: 'greenfields-rep',
        relationship: 'complicated',
        sharedHistory: 'Former colleagues at Greenfields; Mira\'s regulatory report damaged their relationship permanently.'
      },
      {
        characterId: 'ceres-pp-rep',
        relationship: 'uneasy alliance',
        sharedHistory: 'Mira suspects Ivo\'s price manipulation but needs his cooperation. They share coded, careful communications.'
      },
      {
        characterId: 'hidden-cove-rep',
        relationship: 'hostile',
        sharedHistory: 'Vex Marrow\'s pirates killed three of Mira\'s inspectors last year. She\'s authorized lethal force against Hidden Cove vessels.'
      },
      {
        characterId: 'freeport-rep',
        relationship: 'suspicious tolerance',
        sharedHistory: 'Mira was a child during the Freeport Riots. Kalla\'s casual relationship with order makes her viscerally uncomfortable.'
      }
    ],
    formativeEvents: [
      'Survived the Freeport Riots at age 11, hiding in a cargo container while violence raged outside',
      'Graduated top of her class at the Colonial Administrative Academy',
      'First posting at Greenfields ended with a regulatory conflict with Sana Whit',
      'Took over as Sol City Trade Liaison after her predecessor\'s sudden death'
    ],
    coreMotivations: [
      'Prevent chaos and maintain order—she\'s seen what happens when systems fail',
      'Protect Sol City\'s citizens, even from themselves',
      'Prove that bureaucracy is a force for good, not oppression'
    ],
    secrets: [
      'She knows Ivo Renn is manipulating fuel prices but can\'t prove it',
      'She was engaged once, to a freighter pilot who disappeared in the outer belt—she never talks about it',
      'She secretly admires Sana\'s conviction, even as she opposes her methods'
    ]
  },

  // ============================================================================
  // REX CALDER - Helios Refinery Quartermaster
  // ============================================================================
  {
    characterId: 'helios-rep',
    stationId: 'sol-refinery',
    name: 'Rex Calder',
    summary: 'Third-generation refinery worker who inherited his grandfather\'s belief in honest labor and fair markets, now fighting against corporate manipulation.',
    backstory: `
Rex Calder's grandfather, Jeb Calder, was one of the original construction crew who built Helios Refinery sixty years ago. The Calder family has worked these pipes and pumps ever since. Rex grew up with fuel in his veins and grease under his fingernails, learning the trade from his father at age fourteen when child labor laws were suggestions rather than rules.

His grandfather believed passionately in free markets—"Let the work speak for itself," Jeb would say. "Fair prices find fair workers." Rex internalized this philosophy. He saw the refinery as proof that honest labor could build something lasting.

The turning point came twelve years ago. Rex's younger brother, Marcus, was killed in a refinery accident—a pressure seal failure that could have been prevented with proper maintenance. The company had cut corners to boost quarterly profits. Rex spent three years fighting for accountability, burning through his savings on lawyers. He won a settlement, but the executives responsible were never charged. The company paid a fine equivalent to one day's profits.

That's when Rex started listening to the union organizers. He realized that "free markets" only worked when the playing field was level—and it hadn't been level in decades. He rose through the refinery ranks, becoming quartermaster five years ago, and has used his position to push back against corporate interference.

His ongoing feud with Ivo Renn started when Rex noticed statistical anomalies in fuel pricing. He's spent two years gathering evidence that Ceres Power Plant is manipulating markets—buying up fuel reserves, creating artificial scarcity, then selling at premium prices. He can't prove it yet. But he will.

His friendship with Chief Harlan goes back fifteen years—they met at a worker's rights conference and bonded over shared experiences. Rex was best man at Harlan's wedding, and he's godfather to Harlan's youngest daughter.
    `,
    keyConnections: [
      {
        characterId: 'ceres-pp-rep',
        relationship: 'hostile',
        sharedHistory: 'Rex has spent two years gathering evidence of Ivo\'s price manipulation. Their conflict is personal and professional.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'close friends',
        sharedHistory: 'Rex was best man at Harlan\'s wedding. They met fifteen years ago at a worker\'s rights conference.'
      },
      {
        characterId: 'greenfields-rep',
        relationship: 'allied',
        sharedHistory: 'Rex and Sana bonded over shared labor struggles. He supplies fuel to Greenfields at cost when he can.'
      },
      {
        characterId: 'aurum-fab-rep',
        relationship: 'wary respect',
        sharedHistory: 'Rex distrusts Dr. Kade\'s corporate mindset but acknowledges her competence. They\'ve negotiated supply contracts fairly.'
      }
    ],
    formativeEvents: [
      'Grew up in the refinery, learning the trade from his father at age 14',
      'Lost his brother Marcus in a preventable refinery accident 12 years ago',
      'Spent three years fighting for accountability after Marcus\'s death; won a settlement but no criminal charges',
      'Became quartermaster five years ago, began investigating Ivo Renn\'s price manipulation'
    ],
    coreMotivations: [
      'Honor his grandfather\'s belief in honest work and fair markets',
      'Protect refinery workers from corporate exploitation',
      'Expose Ivo Renn\'s fuel manipulation and bring him to justice'
    ],
    secrets: [
      'He has a hidden data cache with partial evidence of Ivo\'s price manipulation',
      'He still blames himself for not being present when Marcus died',
      'He\'s been approached by Hidden Cove to smuggle fuel; he refused, but kept the contact information "just in case"'
    ]
  },

  // ============================================================================
  // DR. ELIN KADE - Aurum Fabricator Overseer
  // ============================================================================
  {
    characterId: 'aurum-fab-rep',
    stationId: 'aurum-fab',
    name: 'Dr. Elin Kade',
    summary: 'A prodigy engineer who lost her research partner to a lab accident caused by "human error," now devoted to eliminating inefficiency and human fallibility from industrial processes.',
    backstory: `
Elin Kade was identified as gifted at age six, when she disassembled and reassembled a household fabrication unit "to see how it worked." By twelve, she was auditing university engineering courses. By eighteen, she held her first patent. By twenty-two, she had her doctorate in industrial systems optimization.

Her early career was at the Titan Research Collective, where she partnered with Dr. Sana Okonjo (later Sana Whit) on biotech applications for space agriculture. They were an unlikely pair—Elin the systems theorist, Sana the hands-on agronomist—but their work on hydroponic efficiency won a Colonial Science Award. More importantly, they became close friends. Elin was maid of honor at Sana's wedding.

Then came the accident.

A contamination event in Lab 7. A junior technician misread a decimal point—a simple human error—and the resulting chemical reaction killed three researchers, including Dr. Chen, Elin's mentor and the closest thing she had to a father figure. Sana was in the adjacent lab and barely escaped. The trauma changed both women, but in opposite directions.

Sana left industrial technology entirely, retreating to Greenfields to work with "simple, honest agriculture." She saw the accident as proof that technology had outpaced humanity's ability to manage it safely.

Elin drew the opposite conclusion: the problem wasn't technology, it was human error. If systems were designed correctly—if human judgment was removed from critical processes—such tragedies could be prevented. She threw herself into automation research, eventually taking over Aurum Fabricator.

Her relationship with Sana is complicated. They haven't spoken directly in eight years, but Elin follows Greenfields' agricultural reports with unusual interest. Some part of her still misses her friend. A larger part is angry that Sana "gave up."

Her rivalry with Chief Harlan is philosophical: she genuinely believes automation will improve worker safety and output. She doesn't understand why he opposes something that would objectively help people.
    `,
    keyConnections: [
      {
        characterId: 'greenfields-rep',
        relationship: 'estranged friends',
        sharedHistory: 'Former research partners at Titan Research Collective. The Lab 7 accident drove them apart—Sana fled technology, Elin embraced it harder.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'professional rival',
        sharedHistory: 'Competing for the Ceres fabrication contract. Elin finds Harlan\'s anti-automation stance frustrating and irrational.'
      },
      {
        characterId: 'ceres-pp-rep',
        relationship: 'collaborative',
        sharedHistory: 'Elin and Ivo share a systems-thinking approach. They\'ve worked together on grid efficiency projects.'
      },
      {
        characterId: 'sol-city-rep',
        relationship: 'tolerated',
        sharedHistory: 'Mira\'s regulations create friction, but Elin respects her systematic approach even while finding it inefficient.'
      }
    ],
    formativeEvents: [
      'Identified as gifted at age 6 after disassembling a fabrication unit',
      'Partnered with Sana Okonjo (Whit) at Titan Research Collective; won a Colonial Science Award together',
      'Lost her mentor Dr. Chen in the Lab 7 accident, caused by human error',
      'Took over Aurum Fabricator, dedicated to eliminating human error through automation'
    ],
    coreMotivations: [
      'Eliminate human error from critical systems—prevent tragedies like Lab 7',
      'Prove that automation is progress, not a threat to workers',
      'Win the Ceres contract and establish Aurum Fab as the system\'s premier fabricator'
    ],
    secrets: [
      'She still has Sana\'s wedding photo in her desk drawer',
      'She experiences vivid nightmares about the Lab 7 accident',
      'She\'s secretly funded anonymous care for the families of Lab 7 victims for eight years'
    ]
  },

  // ============================================================================
  // SANA WHIT - Greenfields Agrarian Coop Steward
  // ============================================================================
  {
    characterId: 'greenfields-rep',
    stationId: 'greenfields',
    name: 'Sana Whit',
    summary: 'A former biotech researcher who abandoned technology after a lab disaster, now leading an agrarian cooperative fighting for independence from Sol City\'s regulatory control.',
    backstory: `
Sana Okonjo was born on a generation ship, the *Green Promise*, where her parents tended the hydroponic gardens that fed three thousand colonists during a twelve-year journey. She grew up with her hands in soil substitutes, learning that food was sacred—the difference between life and death in the void.

Her brilliance with biosystems earned her a scholarship to the Titan Research Collective, where she partnered with a young systems engineer named Elin Kade. They were opposites—Sana tactile and intuitive, Elin analytical and precise—but their work on agricultural efficiency was groundbreaking. Sana still remembers the late nights, the shared meals, the fierce debates that became the foundation of genuine friendship.

Then Lab 7 happened.

Sana was in the adjacent laboratory when the contamination alarm sounded. She remembers the chemical smell, the screaming, the sight of colleagues she'd known for years dying in agony. She barely escaped. Three people didn't, including Dr. Chen, whom both she and Elin had loved like a father.

The investigation blamed human error—a decimal point misread by a junior technician. But Sana saw something deeper: a system so complex that a single mistake could kill. She questioned everything she'd believed about technology's promise.

She left Titan within the month, abandoning her patents and her career. She married her partner Marcus Whit (no relation to Rex Calder's brother) and moved to Greenfields Farm, where she could work with "simple, honest things." She rose quickly to Coop Steward, driven by the same intensity that had made her a brilliant researcher.

Her conflict with Sol City began when Mira Vale—her former colleague from Sana's brief regulatory inspection posting—began imposing increasingly strict agricultural controls. Sana sees these regulations as exactly the kind of overcomplicated systems that cause disasters. She's fighting for the right to manage Greenfields' own affairs.

She hasn't spoken to Elin in eight years. Part of her still mourns the friendship. A larger part is angry that Elin responded to tragedy by doubling down on the very things that caused it.

Her alliance with Chief Harlan and Rex Calder is based on shared values: workers and farmers, hands that build and grow, standing together against corporate abstraction.
    `,
    keyConnections: [
      {
        characterId: 'aurum-fab-rep',
        relationship: 'estranged friends',
        sharedHistory: 'Former research partners and close friends at Titan Research Collective. The Lab 7 accident broke their friendship—they chose opposite paths.'
      },
      {
        characterId: 'sol-city-rep',
        relationship: 'adversarial',
        sharedHistory: 'Mira was a junior inspector at Greenfields early in her career. Her regulatory report felt like a betrayal to Sana.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'allied',
        sharedHistory: 'Sana and Harlan connected through labor advocacy networks. They share meals whenever possible and coordinate on political strategy.'
      },
      {
        characterId: 'freeport-rep',
        relationship: 'trusted partner',
        sharedHistory: 'Kalla Rook offers direct trade that bypasses Sol City tariffs. Sana sees her as a key ally for Greenfields\' independence.'
      },
      {
        characterId: 'helios-rep',
        relationship: 'allied',
        sharedHistory: 'Rex supplies Greenfields with discounted fuel when he can. They share a bond of practical solidarity.'
      }
    ],
    formativeEvents: [
      'Born and raised on the generation ship *Green Promise*, learning that food is sacred',
      'Partnered with Elin Kade at Titan Research Collective; they were close friends and award-winning collaborators',
      'Survived the Lab 7 accident that killed her mentor; fled technology in the aftermath',
      'Built Greenfields into a thriving cooperative; now fights Sol City for agricultural independence'
    ],
    coreMotivations: [
      'Protect Greenfields from overreach—bureaucratic, corporate, or technological',
      'Prove that simpler systems are safer and more humane',
      'Build a coalition of workers and farmers strong enough to demand independence'
    ],
    secrets: [
      'She still has nightmares about Lab 7—the smell of chemicals, the screaming',
      'She keeps a small box of mementos from her research days, including a photo of her and Elin winning their award',
      'Her husband Marcus is terminally ill with a degenerative condition; she hasn\'t told anyone outside the family'
    ]
  },

  // ============================================================================
  // IVO RENN - Ceres Power Plant Grid Balancer
  // ============================================================================
  {
    characterId: 'ceres-pp-rep',
    stationId: 'ceres-pp',
    name: 'Ivo Renn',
    summary: 'A former corporate crisis manager who discovered that controlling energy means controlling everything, now running the system\'s power grid with calculated ruthlessness.',
    backstory: `
Ivo Renn was born into poverty on a failing colony world called Veris II. His childhood was defined by power rationing—rolling blackouts, frozen nights, the constant anxiety of wondering if the lights would stay on. When he was fourteen, the power grid failed completely during a winter storm. His mother and younger sister didn't survive the cold.

He swore he would never be powerless again.

Ivo clawed his way through corporate bureaucracy, working as a logistics analyst, then a crisis manager for a mining consortium. He had a gift for seeing systems as they truly were—not as they were supposed to work, but as they actually functioned. He found inefficiencies, exploited leverage points, and made himself indispensable.

When Ceres Power Plant came up for new management fifteen years ago, Ivo saw an opportunity. He positioned himself as the candidate who could guarantee grid stability. He delivered on that promise—nine years without a power failure—but his methods were less advertised. He understood that controlling energy meant controlling everything. Fuel prices, fabrication schedules, even political decisions—all flowed through his grid.

His market manipulation began as "stabilization"—building reserves to prevent shortages. Over time, it became more deliberate. He buys fuel when prices are low, restricts supply to create scarcity, then sells when prices peak. It's technically legal, if you have the right lawyers. Rex Calder suspects but can't prove it.

His relationship with Mira Vale is transactional. They each have leverage over the other, and both know it. Their communications are models of careful diplomatic language, hiding the knife beneath every word.

He's hired Hidden Cove pirates for "supply disruption" on competitors. He'd deny it under oath, and the evidence is buried deep. Vex Marrow knows things about Ivo that could destroy him—which is why Ivo keeps paying.

Ivo tells himself that everything he does is necessary. That stability requires control. That the system would collapse without him. He might even believe it.
    `,
    keyConnections: [
      {
        characterId: 'helios-rep',
        relationship: 'adversarial',
        sharedHistory: 'Rex has been investigating Ivo\'s price manipulation for two years. Ivo considers him a nuisance but underestimates his determination.'
      },
      {
        characterId: 'sol-city-rep',
        relationship: 'mutual exploitation',
        sharedHistory: 'Mira suspects Ivo\'s manipulation but needs his cooperation. They communicate in coded, careful terms.'
      },
      {
        characterId: 'aurum-fab-rep',
        relationship: 'collaborative',
        sharedHistory: 'Ivo and Elin share a systems-thinking approach. He finds her useful and predictable.'
      },
      {
        characterId: 'hidden-cove-rep',
        relationship: 'dangerous alliance',
        sharedHistory: 'Ivo has hired Hidden Cove for "supply disruption." Vex knows things about Ivo that could destroy him.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'contemptuous',
        sharedHistory: 'Ivo finds union rhetoric tiresome. He views Harlan as a sentimental obstacle to efficiency.'
      }
    ],
    formativeEvents: [
      'Lost his mother and sister in a power grid failure on Veris II at age 14',
      'Rose through corporate ranks as a crisis manager, developing his systems-thinking approach',
      'Took control of Ceres Power Plant 15 years ago; achieved 9 years without power failure',
      'Began market manipulation as "stabilization"; it evolved into deliberate price control'
    ],
    coreMotivations: [
      'Never be powerless again—control is safety',
      'Maintain grid stability at any cost (it\'s also profitable)',
      'Prove that efficiency and control are superior to sentiment and democracy'
    ],
    secrets: [
      'He\'s paid Hidden Cove pirates to disrupt competitors\' fuel shipments',
      'His price manipulation data is stored in an encrypted cache that would destroy his reputation if exposed',
      'He still has nightmares about the cold—about being fourteen and helpless as his family froze'
    ]
  },

  // ============================================================================
  // KALLA ROOK - Freeport Free Merchant Convener
  // ============================================================================
  {
    characterId: 'freeport-rep',
    stationId: 'freeport',
    name: 'Kalla Rook',
    summary: 'A former intelligence operative who went freelance after her agency burned her, now running Freeport as neutral ground where information is the real currency.',
    backstory: `
Kalla Rook's original name is classified—even she doesn't use it anymore. She was recruited by Colonial Intelligence at nineteen, trained in tradecraft, and deployed as a field operative specializing in economic intelligence. For eight years, she gathered information on trade routes, corporate dealings, and political corruption. She was good at her job.

Too good, it turned out. Her investigation into a fuel smuggling ring led her to a senior Colonial Intelligence official who was profiting from the operation. When she filed her report, she was ordered to bury it. When she refused, she was framed for the very corruption she'd exposed. She spent eighteen months in a detention facility before escaping during a prison transport malfunction that she may have engineered.

She disappeared into the gray zones between stations, building a new identity and a new network. Eventually, she found Freeport—a trading post that had always existed on the margins of legality. She made herself useful, then indispensable, then inevitable. When the previous convener died (natural causes, probably), she was the obvious successor.

Kalla runs Freeport as neutral ground—a place where Sol City inspectors and Hidden Cove pirates can sit at adjacent tables. Information is her real currency. She knows more secrets than anyone in the system, and she trades them carefully, never revealing more than necessary.

She maintains contacts with everyone: Rex Calder for labor intelligence, Mira Vale for regulatory gossip, Vex Marrow for underworld information. She's the person you call when you need to find something or someone. Her price is rarely credits—she prefers favors.

Her ongoing project is peace talks between Sol City and Hidden Cove. She's seen enough violence to know it's bad for business. She's also seen enough corruption to know that neither side is righteous. If anyone can broker a treaty, it's her—but she's realistic about the odds.

She genuinely likes most of the people she deals with. She also maintains detailed contingency files on each of them, just in case.
    `,
    keyConnections: [
      {
        characterId: 'hidden-cove-rep',
        relationship: 'cautious friendship',
        sharedHistory: 'Kalla and Vex go back fifteen years, to when she first arrived at the margins. They respect each other\'s competence.'
      },
      {
        characterId: 'sol-city-rep',
        relationship: 'wary mutual interest',
        sharedHistory: 'Mira finds Kalla\'s ambiguity troubling but useful. They exchange information carefully.'
      },
      {
        characterId: 'greenfields-rep',
        relationship: 'trusted ally',
        sharedHistory: 'Kalla facilitates direct trade for Greenfields, bypassing Sol City tariffs. She admires Sana\'s conviction.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'friendly respect',
        sharedHistory: 'Harlan deals straight, which Kalla values. She\'s helped him gather information on corporate maneuvers.'
      },
      {
        characterId: 'ceres-pp-rep',
        relationship: 'professional distance',
        sharedHistory: 'Kalla knows about Ivo\'s hidden activities. She keeps that information as insurance.'
      }
    ],
    formativeEvents: [
      'Recruited by Colonial Intelligence at 19; served 8 years as a field operative',
      'Exposed corruption by a senior intelligence official; was framed and imprisoned for 18 months',
      'Escaped during a transport malfunction; built a new identity in the gray zones',
      'Rose to lead Freeport as convener; now runs it as neutral ground where information is currency'
    ],
    coreMotivations: [
      'Maintain Freeport as neutral ground—peace is profitable',
      'Collect information as insurance against a system that once betrayed her',
      'Broker peace between Sol City and Hidden Cove (good for business, and maybe good for people)'
    ],
    secrets: [
      'She maintains detailed contingency files on every major figure in the system',
      'She knows about Ivo Renn\'s pirate payments but keeps it as leverage rather than exposing him',
      'She still has nightmares about her time in detention; she sleeps with a weapon under her pillow'
    ]
  },

  // ============================================================================
  // CHIEF HARLAN - Drydock Shipyard Dockmaster
  // ============================================================================
  {
    characterId: 'drydock-rep',
    stationId: 'drydock',
    name: 'Chief Harlan',
    summary: 'A veteran shipbuilder whose father was killed in a union conflict, now leading the fight for workers\' rights while competing against automation for his shipyard\'s future.',
    backstory: `
Chief Harlan (he rarely uses his first name, Marcus) is third-generation Drydock. His grandmother was on the original construction crew. His father, Thomas Harlan, was a union organizer who was killed during the Shipyard Strikes of thirty years ago—shot by company security during a confrontation at the gates. Marcus was twenty-two and standing beside his father when it happened.

The strike ended in a negotiated settlement that gave workers most of what they'd demanded. Thomas Harlan became a martyr. His son became a symbol—the boy who watched his father die for workers' rights.

Marcus could have become a union firebrand, but he chose a different path. He went back to the floor, learned every job in the shipyard, and rose through the ranks on merit. When he became Dockmaster fifteen years ago, it was because he could do any job in the yard better than anyone else. The workers respect him because he's one of them.

His marriage to Elena produced three children, all of whom work somewhere in the system. His youngest daughter is a medical technician at Sol City Hospital; Rex Calder is her godfather. His eldest son works at the refinery under Rex. Family and union are intertwined in the Harlan world.

The competition with Aurum Fab for the Ceres fabrication contract isn't just business—it's philosophical. Dr. Kade represents everything Harlan fears: automation that replaces workers, efficiency that discards craftsmanship, progress that leaves families behind. He doesn't hate Kade personally, but he cannot allow her vision to win.

His alliance with Rex Calder and Sana Whit is the foundation of what he calls the "Workers' Coalition"—a loose network of labor advocates across stations. They're organizing for a system-wide strike if necessary. Corporate types are nervous. They should be.

He still visits his father's memorial every year on the anniversary of the Shipyard Strikes. He still makes promises about finishing what his father started.
    `,
    keyConnections: [
      {
        characterId: 'helios-rep',
        relationship: 'close friends',
        sharedHistory: 'Rex was best man at Harlan\'s wedding and godfather to his youngest daughter. They\'ve been allies for fifteen years.'
      },
      {
        characterId: 'greenfields-rep',
        relationship: 'allied',
        sharedHistory: 'Harlan and Sana coordinate through the Workers\' Coalition. They share meals and political strategy when possible.'
      },
      {
        characterId: 'aurum-fab-rep',
        relationship: 'philosophical rival',
        sharedHistory: 'Competing for the Ceres contract. Harlan finds Kade\'s automation push threatening to three hundred families.'
      },
      {
        characterId: 'ceres-pp-rep',
        relationship: 'hostile distrust',
        sharedHistory: 'Harlan views Ivo as everything wrong with corporate thinking. Their few interactions have been coldly professional.'
      },
      {
        characterId: 'freeport-rep',
        relationship: 'friendly respect',
        sharedHistory: 'Kalla has helped Harlan gather intelligence on corporate maneuvers. He appreciates her straightforward dealing.'
      }
    ],
    formativeEvents: [
      'Watched his father Thomas die during the Shipyard Strikes at age 22',
      'Rose through Drydock ranks on merit, learning every job in the yard',
      'Became Dockmaster 15 years ago; leads 300 workers and their families',
      'Founded the Workers\' Coalition with Rex Calder and other labor advocates'
    ],
    coreMotivations: [
      'Finish what his father started—secure lasting rights and dignity for workers',
      'Protect Drydock\'s families from automation and corporate efficiency',
      'Win the Ceres contract and prove that craftsmanship beats automation'
    ],
    secrets: [
      'He keeps his father\'s blood-stained work jacket in a sealed case; he\'s never washed it',
      'He\'s been diagnosed with early-stage respiratory disease from decades of shipyard particulates; he hasn\'t told his family',
      'He secretly worries that automation might actually be inevitable, and he\'s just delaying the future'
    ]
  },

  // ============================================================================
  // VEX MARROW - Hidden Cove Chief Quartermaster
  // ============================================================================
  {
    characterId: 'hidden-cove-rep',
    stationId: 'hidden-cove',
    name: 'Vex Marrow',
    summary: 'A former Sol City patrol officer who was framed for corruption after refusing to participate in evidence tampering, now leading pirates he once hunted.',
    backstory: `
Vex Marrow was once Lieutenant Vincent Markov, Sol City Patrol Division, decorated three times for valor. He believed in the law. He believed in the system. He arrested pirates with genuine conviction that he was protecting people.

Then he discovered the Blackledger Operation.

His commanding officer, Captain Aldrich, was running a protection racket—extorting freighters in exchange for safe passage, then splitting the proceeds with select pirate crews. When Vex refused to participate and threatened to file a report, he found himself accused of the very corruption he'd tried to expose. Evidence appeared. Witnesses testified. His own patrol logs were altered.

The trial was a formality. He was sentenced to twenty years in the Outer Reach Detention Facility. He never arrived—the transport was intercepted by the very pirates he'd once hunted. They offered him a choice: die as a lawman, or live as something else.

He chose to live.

He spent five years working his way up in the pirate fleets, earning respect through competence rather than brutality. When the previous quartermaster of Hidden Cove died in a dispute over cargo division, Vex stepped in. He reorganized the Cove, established codes of conduct, and built it into something more than a raider haven. He calls it "honest criminality"—they steal, yes, but from corporations and governments, not individual traders. They have rules.

His grudge against Sol City is personal and institutional. He knows Aldrich is still in command, still running protection rackets. He's gathered evidence over the years, waiting for the right moment to expose him. Part of him still wants justice through legal channels. A larger part knows that's a fantasy.

His relationship with Kalla Rook goes back fifteen years—she was one of the first legitimate contacts who treated him as more than a common criminal. They have an understanding: Freeport is neutral ground, and Hidden Cove respects that.

His relationship with Ivo Renn is darker. Ivo pays well for "supply disruption"—attacks on competitors' fuel shipments. Vex takes the money, but he keeps records. Insurance.
    `,
    keyConnections: [
      {
        characterId: 'sol-city-rep',
        relationship: 'hostile',
        sharedHistory: 'Vex was framed by Sol City\'s corrupt system. His grudge is personal. Mira represents everything he once believed in and now despises.'
      },
      {
        characterId: 'freeport-rep',
        relationship: 'cautious friendship',
        sharedHistory: 'Kalla was one of the first to treat Vex as more than a criminal. They\'ve known each other fifteen years.'
      },
      {
        characterId: 'ceres-pp-rep',
        relationship: 'paid arrangement',
        sharedHistory: 'Ivo pays Hidden Cove for "supply disruption." Vex keeps records of every transaction as insurance.'
      },
      {
        characterId: 'greenfields-rep',
        relationship: 'respectful',
        sharedHistory: 'Vex sees Sana\'s fight against Sol City as aligned with his own. They\'ve never met directly, but he admires her resistance.'
      },
      {
        characterId: 'drydock-rep',
        relationship: 'complicated respect',
        sharedHistory: 'Vex knows pirates and workers share more history than either admits. He respects Harlan\'s convictions.'
      }
    ],
    formativeEvents: [
      'Served as a decorated Sol City patrol officer; believed in the system',
      'Discovered the Blackledger Operation—his commanding officer running a protection racket',
      'Framed for corruption after refusing to participate; sentenced to 20 years',
      'Rescued by pirates during transport; rebuilt himself as Hidden Cove\'s quartermaster'
    ],
    coreMotivations: [
      'Expose Sol City\'s corruption—prove he was framed',
      'Build Hidden Cove into something more than a raider haven',
      'Protect his people from both law enforcement and rival pirates'
    ],
    secrets: [
      'He still has his Sol City patrol badge; he looks at it sometimes when he\'s alone',
      'He\'s gathered evidence against Captain Aldrich for years; he\'s waiting for the right moment',
      'He secretly funds an orphanage on a distant station—children of pirates who didn\'t come home'
    ]
  }
];

/**
 * Get backstory for a specific character
 */
export function getBackstoryByCharacterId(characterId: string): CharacterBackstory | undefined {
  return characterBackstories.find(b => b.characterId === characterId);
}

/**
 * Get backstory by station ID
 */
export function getBackstoryByStationId(stationId: string): CharacterBackstory | undefined {
  return characterBackstories.find(b => b.stationId === stationId);
}

/**
 * Get all connections involving a specific character
 */
export function getCharacterConnections(characterId: string): {
  character: CharacterBackstory;
  connections: CharacterBackstory[];
}[] {
  const result: { character: CharacterBackstory; connections: CharacterBackstory[] }[] = [];
  
  for (const backstory of characterBackstories) {
    const relevantConnections = backstory.keyConnections.filter(
      conn => conn.characterId === characterId
    );
    
    if (relevantConnections.length > 0) {
      const connectedBackstories = relevantConnections
        .map(conn => getBackstoryByCharacterId(conn.characterId))
        .filter((b): b is CharacterBackstory => b !== undefined);
      
      result.push({
        character: backstory,
        connections: connectedBackstories
      });
    }
  }
  
  return result;
}

/**
 * Get shared history between two characters
 */
export function getSharedHistory(characterId1: string, characterId2: string): string | undefined {
  const backstory1 = getBackstoryByCharacterId(characterId1);
  if (!backstory1) return undefined;
  
  const connection = backstory1.keyConnections.find(
    conn => conn.characterId === characterId2
  );
  
  return connection?.sharedHistory;
}

