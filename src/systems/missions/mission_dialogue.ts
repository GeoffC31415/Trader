/**
 * Mission Dialogue & Monologues
 * 
 * Voice-ready dialogue for story missions. Each mission has:
 * - Introduction monologue (when mission is offered)
 * - Acceptance line (short confirmation when player accepts)
 * - Key moment dialogue (at critical points during mission)
 * - Completion monologue (when mission is finished)
 * 
 * All text is designed for ElevenLabs voice generation:
 * - Natural speech patterns with [emotion tags]
 * - 10-50 words per line for audio timing
 * - Character voice consistency from backstories
 */

export type MissionDialogue = {
  missionId: string;
  characterId: string; // Who delivers this dialogue
  characterName: string;
  stationId: string;
  
  // Opening monologue when mission is first shown to player
  introduction: {
    lines: DialogueLine[];
    audioPath?: string; // Generated audio path
  };
  
  // Short line when player accepts mission
  acceptance: DialogueLine;
  
  // Key moment dialogue (shown during mission at critical points)
  keyMoments?: {
    triggerId: string; // e.g., 'halfway', 'enemy_spotted', 'objective_complete'
    lines: DialogueLine[];
  }[];
  
  // Completion monologue
  completion: {
    success: {
      lines: DialogueLine[];
    };
    failure?: {
      lines: DialogueLine[];
    };
  };
};

export type DialogueLine = {
  id: string;
  text: string;
  emotionTag?: string;
  pauseAfterMs?: number; // Suggested pause after this line
};

// ============================================================================
// ARC 1: GREENFIELDS INDEPENDENCE
// ============================================================================

export const GREENFIELDS_STAGE_1_DIALOGUE: MissionDialogue = {
  missionId: 'greenfields_stage_1',
  characterId: 'greenfields-rep',
  characterName: 'Sana Whit',
  stationId: 'greenfields',
  
  introduction: {
    lines: [
      {
        id: 'green_s1_intro_1',
        text: "[warmly] I remember my first years in this system. Working alongside Elin Kade at Titan Research, believing technology would solve everything.",
        emotionTag: 'warmly',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s1_intro_2', 
        text: "[pauses] Then Lab 7 happened. Friends died because a decimal point was wrong. I learned that day—some problems can't be automated away.",
        emotionTag: 'somber',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s1_intro_3',
        text: "[determined] That's why I'm here, growing real food with real hands. Simple. Honest. But Sol City wants to complicate everything.",
        emotionTag: 'determined',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s1_intro_4',
        text: "[frustrated] Mira Vale—she was an inspector here once. Young, ambitious, convinced regulations protect people. Maybe they do, sometimes.",
        emotionTag: 'frustrated',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s1_intro_5',
        text: "[conspiratorially] But right now, her regulations are strangling us. I need luxury goods for a... private arrangement. Off the books.",
        emotionTag: 'conspiratorially',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s1_intro_6',
        text: "[urgently] Ten units. Don't fly near Sol City—their inspectors will confiscate anything that doesn't have proper stamps. Can you do this?",
        emotionTag: 'urgently',
      },
    ],
  },
  
  acceptance: {
    id: 'green_s1_accept',
    text: "[grateful] Thank you. The cooperative won't forget this. Now fly careful—and fly smart.",
    emotionTag: 'grateful',
  },
  
  keyMoments: [
    {
      triggerId: 'near_sol_city',
      lines: [
        {
          id: 'green_s1_warning',
          text: "[alarmed] Warning! Sol City patrol detected. Change course immediately or they'll scan your cargo!",
          emotionTag: 'alarmed',
        },
      ],
    },
    {
      triggerId: 'halfway',
      lines: [
        {
          id: 'green_s1_halfway',
          text: "[encouraging] You're doing great. Just a little further. The workers are already preparing the distribution lists.",
          emotionTag: 'encouraging',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'green_s1_complete_1',
          text: "[joyfully] You made it! [laughs] Look at these goods—Sol City thought they could starve us into compliance.",
          emotionTag: 'joyfully',
          pauseAfterMs: 800,
        },
        {
          id: 'green_s1_complete_2',
          text: "[warmly] My grandmother grew vegetables on a generation ship. She always said: 'Feed people, and you give them hope.'",
          emotionTag: 'warmly',
          pauseAfterMs: 600,
        },
        {
          id: 'green_s1_complete_3',
          text: "[seriously] This is just the beginning. Next time... we're going to need you for something bigger. Something that can't be undone.",
          emotionTag: 'seriously',
        },
      ],
    },
    failure: {
      lines: [
        {
          id: 'green_s1_fail_1',
          text: "[disappointed] Sol City got the cargo. [sighs] I expected too much, too soon. We'll find another way.",
          emotionTag: 'disappointed',
        },
      ],
    },
  },
};

export const GREENFIELDS_STAGE_2_DIALOGUE: MissionDialogue = {
  missionId: 'greenfields_stage_2',
  characterId: 'greenfields-rep',
  characterName: 'Sana Whit',
  stationId: 'greenfields',
  
  introduction: {
    lines: [
      {
        id: 'green_s2_intro_1',
        text: "[intensely] Sol City has been conducting 'agricultural inspections.' What they're really doing is building a case against us.",
        emotionTag: 'intensely',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s2_intro_2',
        text: "[bitterly] Mira Vale and I worked together once, briefly. I thought we understood each other. But she filed a regulatory report that nearly destroyed us.",
        emotionTag: 'bitterly',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s2_intro_3',
        text: "[pauses] She sees rules. I see families. We stopped being friends that day.",
        emotionTag: 'somber',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s2_intro_4',
        text: "[urgently] There are data chips in Sol City that contain the real inspection logs. The ones showing their inspectors planted evidence.",
        emotionTag: 'urgently',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s2_intro_5',
        text: "[quietly] If you get those chips to me, we expose the corruption. If you take them to Mira instead... [pauses] well, you'd be helping her finish what she started.",
        emotionTag: 'quietly',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s2_intro_6',
        text: "[earnestly] This is the moment, pilot. Which future do you want to build?",
        emotionTag: 'earnestly',
      },
    ],
  },
  
  acceptance: {
    id: 'green_s2_accept',
    text: "[hopefully] Whatever you decide... remember that farmers fed this system for generations. We deserve respect, not regulation.",
    emotionTag: 'hopefully',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'green_s2_complete_greenfields_1',
          text: "[overwhelmed] These logs... I knew they were lying, but seeing the proof... [voice breaks] My husband Marcus always believed we'd be vindicated.",
          emotionTag: 'emotional',
          pauseAfterMs: 1000,
        },
        {
          id: 'green_s2_complete_greenfields_2',
          text: "[determined] Sol City is going to raise prices on us. Make things harder. But they can't bury the truth anymore.",
          emotionTag: 'determined',
          pauseAfterMs: 600,
        },
        {
          id: 'green_s2_complete_greenfields_3',
          text: "[warmly] You chose our side. That means something. Greenfields will remember.",
          emotionTag: 'warmly',
        },
      ],
    },
  },
};

// Sol City side of Stage 2
export const GREENFIELDS_STAGE_2_SOL_DIALOGUE: MissionDialogue = {
  missionId: 'greenfields_stage_2',
  characterId: 'sol-city-rep',
  characterName: 'Mira Vale',
  stationId: 'sol-city',
  
  introduction: {
    lines: [
      {
        id: 'sol_s2_intro_1',
        text: "[professionally] I was eleven years old during the Freeport Riots. My father worked seventy-two hours straight to restore order.",
        emotionTag: 'professionally',
        pauseAfterMs: 800,
      },
      {
        id: 'sol_s2_intro_2',
        text: "[pauses] I hid in a cargo container while people died outside. Screaming. Fire. Chaos. All because supply chains broke down.",
        emotionTag: 'haunted',
        pauseAfterMs: 1000,
      },
      {
        id: 'sol_s2_intro_3',
        text: "[firmly] That's why I believe in regulation. Not because I enjoy paperwork—because I've seen what happens without it.",
        emotionTag: 'firmly',
        pauseAfterMs: 600,
      },
      {
        id: 'sol_s2_intro_4',
        text: "[concerned] Sana Whit is running unregistered grow operations. Modified seeds. Undocumented compounds. One contaminated crop could sicken thousands.",
        emotionTag: 'concerned',
        pauseAfterMs: 800,
      },
      {
        id: 'sol_s2_intro_5',
        text: "[directly] I need you to report what you find there. Unregistered operations. Violations. The truth.",
        emotionTag: 'directly',
        pauseAfterMs: 600,
      },
      {
        id: 'sol_s2_intro_6',
        text: "[quietly] Sana and I worked together once. I filed a report on minor violations. She saw it as betrayal. [pauses] I saw it as doing my job.",
        emotionTag: 'quietly',
      },
    ],
  },
  
  acceptance: {
    id: 'sol_s2_accept',
    text: "[formally] Your cooperation is noted. Sol City values traders who understand that order protects everyone.",
    emotionTag: 'formally',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'sol_s2_complete_1',
          text: "[satisfied] Documentation received. Violations confirmed. [pauses] This isn't about punishment—it's about accountability.",
          emotionTag: 'satisfied',
          pauseAfterMs: 800,
        },
        {
          id: 'sol_s2_complete_2',
          text: "[softly] I know Sana thinks I'm the enemy. Maybe to her, I am. But someone has to maintain standards.",
          emotionTag: 'softly',
          pauseAfterMs: 600,
        },
        {
          id: 'sol_s2_complete_3',
          text: "[professionally] You've proven yourself a friend to Sol City. Future opportunities will reflect that. Thank you.",
          emotionTag: 'professionally',
        },
      ],
    },
  },
};

// Stage 3 - Greenfields path (combat)
export const GREENFIELDS_STAGE_3_DIALOGUE: MissionDialogue = {
  missionId: 'greenfields_stage_3',
  characterId: 'greenfields-rep',
  characterName: 'Sana Whit',
  stationId: 'greenfields',
  
  introduction: {
    lines: [
      {
        id: 'green_s3_intro_1',
        text: "[heavily] Harvest season. Should be a celebration. Instead, I'm asking you to destroy ships.",
        emotionTag: 'heavily',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s3_intro_2',
        text: "[bitterly] Sol City is intercepting our grain convoys. 'Quality inspections,' they call it. Legalized theft is what it is.",
        emotionTag: 'bitterly',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s3_intro_3',
        text: "[pauses] I knew the pilots on those convoys once. Shared meals. Shared dreams. [voice hardens] Then they sold out to Sol City security contracts.",
        emotionTag: 'hardening',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s3_intro_4',
        text: "[intensely] Three convoys are heading to Sol City right now. If they arrive, Mira Vale uses that grain to prove she controls our food supply.",
        emotionTag: 'intensely',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s3_intro_5',
        text: "[quietly] Destroy them. Let Sol City feel what scarcity means. [pauses] Maybe then they'll negotiate in good faith.",
        emotionTag: 'quietly',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s3_intro_6',
        text: "[steeling herself] This is economic warfare. The kind that echoes through ledgers and stomachs. Are you ready to cross this line?",
        emotionTag: 'steeling',
      },
    ],
  },
  
  acceptance: {
    id: 'green_s3_accept',
    text: "[grimly] Then go. And may whatever gods you believe in forgive us both.",
    emotionTag: 'grimly',
  },
  
  keyMoments: [
    {
      triggerId: 'first_convoy_destroyed',
      lines: [
        {
          id: 'green_s3_convoy_1',
          text: "[quietly] First convoy down. [pauses] I hope they had escape pods. I hope... [trails off]",
          emotionTag: 'conflicted',
        },
      ],
    },
    {
      triggerId: 'second_convoy_destroyed',
      lines: [
        {
          id: 'green_s3_convoy_2',
          text: "[hardening] Sol City will call this terrorism. We call it survival. History decides who was right.",
          emotionTag: 'hardening',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'green_s3_complete_1',
          text: "[exhausted] It's done. Grain prices in Sol City will spike within the hour. Mira Vale will be scrambling.",
          emotionTag: 'exhausted',
          pauseAfterMs: 800,
        },
        {
          id: 'green_s3_complete_2',
          text: "[quietly] Some nights I still dream about Lab 7. The screaming. The chemical smell. [pauses] Now I'll dream about grain convoys too.",
          emotionTag: 'haunted',
          pauseAfterMs: 1000,
        },
        {
          id: 'green_s3_complete_3',
          text: "[resolutely] But freedom isn't free. My grandmother knew that. Crossed half the galaxy in a tin can to find somewhere to grow things in peace.",
          emotionTag: 'resolutely',
          pauseAfterMs: 600,
        },
        {
          id: 'green_s3_complete_4',
          text: "[warmly] One more step. The final delivery. After that... Greenfields stands alone. Independent. The way it should be.",
          emotionTag: 'warmly',
        },
      ],
    },
  },
};

// Stage 3 - Sol City path (escort)
export const SOL_CITY_STAGE_3_DIALOGUE: MissionDialogue = {
  missionId: 'sol_city_stage_3',
  characterId: 'sol-city-rep',
  characterName: 'Mira Vale',
  stationId: 'sol-city',
  
  introduction: {
    lines: [
      {
        id: 'sol_s3_intro_1',
        text: "[tensely] We have evidence of agricultural violations at Greenfields. Unregistered grow operations. Unauthorized seed modifications.",
        emotionTag: 'tensely',
        pauseAfterMs: 600,
      },
      {
        id: 'sol_s3_intro_2',
        text: "[seriously] This isn't about control. One contaminated crop could sicken thousands. These regulations exist for a reason.",
        emotionTag: 'seriously',
        pauseAfterMs: 800,
      },
      {
        id: 'sol_s3_intro_3',
        text: "[introducing] Inspector Chavez has been doing this for twenty-three years. She's never needed an armed escort before.",
        emotionTag: 'concerned',
        pauseAfterMs: 600,
      },
      {
        id: 'sol_s3_intro_4',
        text: "[grimly] Intelligence suggests Sana Whit has hired Hidden Cove pirates to prevent this inspection. Vex Marrow's people. Dangerous.",
        emotionTag: 'grimly',
        pauseAfterMs: 800,
      },
      {
        id: 'sol_s3_intro_5',
        text: "[pauses] I was stationed at Greenfields once. Young inspector. Sana was kind to me then. [voice hardens] Before she decided the rules didn't apply to farmers.",
        emotionTag: 'hardening',
        pauseAfterMs: 1000,
      },
      {
        id: 'sol_s3_intro_6',
        text: "[firmly] Protect Inspector Chavez. Get her to Greenfields. Let her do her job. That's all I ask.",
        emotionTag: 'firmly',
      },
    ],
  },
  
  acceptance: {
    id: 'sol_s3_accept',
    text: "[formally] Sol City is grateful. Inspector Chavez's shuttle will launch momentarily. Protect her with your life if necessary.",
    emotionTag: 'formally',
  },
  
  keyMoments: [
    {
      triggerId: 'pirates_detected',
      lines: [
        {
          id: 'sol_s3_pirates',
          text: "[alarmed] Pirate contacts on scope! Hidden Cove signatures. Protect the inspector!",
          emotionTag: 'alarmed',
        },
      ],
    },
    {
      triggerId: 'wave_complete',
      lines: [
        {
          id: 'sol_s3_wave',
          text: "[relieved] Wave repelled. [pauses] More incoming. They really don't want this inspection to happen.",
          emotionTag: 'relieved',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'sol_s3_complete_1',
          text: "[relieved] Inspector Chavez has arrived safely. The inspection is proceeding. You've done well.",
          emotionTag: 'relieved',
          pauseAfterMs: 600,
        },
        {
          id: 'sol_s3_complete_2',
          text: "[quietly] Sana will hate me more now. [pauses] But I didn't create the rules. I just enforce them.",
          emotionTag: 'quietly',
          pauseAfterMs: 800,
        },
        {
          id: 'sol_s3_complete_3',
          text: "[professionally] One final task remains. Enforcement contracts must be distributed. Greenfields will comply... or face consequences.",
          emotionTag: 'professionally',
        },
      ],
    },
  },
};

// Stage 4 - Greenfields path (finale)
export const GREENFIELDS_STAGE_4_DIALOGUE: MissionDialogue = {
  missionId: 'greenfields_stage_4',
  characterId: 'greenfields-rep',
  characterName: 'Sana Whit',
  stationId: 'greenfields',
  
  introduction: {
    lines: [
      {
        id: 'green_s4_intro_1',
        text: "[emotionally] Come in. Sit. [pauses] The kitchen smells like fresh bread. My grandmother's recipe. Same one she baked on the generation ship.",
        emotionTag: 'emotionally',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s4_intro_2',
        text: "[spreading papers] This contract... it's not just paper. It's everything we've fought for. Kalla Rook at Freeport is buying direct.",
        emotionTag: 'hopeful',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s4_intro_3',
        text: "[voice breaking] No Sol City inspectors. No middleman tariffs. No compliance fees bleeding us dry quarter after quarter.",
        emotionTag: 'emotional',
        pauseAfterMs: 800,
      },
      {
        id: 'green_s4_intro_4',
        text: "[looking outside] See them? Workers loading crates by hand. Singing old work songs from Earth. [smiles] Nobody remembers where the songs come from anymore.",
        emotionTag: 'nostalgic',
        pauseAfterMs: 1000,
      },
      {
        id: 'green_s4_intro_5',
        text: "[firmly] Thirty units of food. Grain and meat—the harvest of free farmers going to free traders.",
        emotionTag: 'firmly',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s4_intro_6',
        text: "[intensely] This is our shot. One chance to prove we can stand on our own. Get this cargo to Freeport, and we rewrite the rules.",
        emotionTag: 'intensely',
        pauseAfterMs: 600,
      },
      {
        id: 'green_s4_intro_7',
        text: "[quietly] My husband Marcus is sick. [pauses] He might not see what we're building. But he'll know it happened. That matters.",
        emotionTag: 'quietly',
      },
    ],
  },
  
  acceptance: {
    id: 'green_s4_accept',
    text: "[gathering herself] The agricultural revolution begins now. Fly safe. Fly proud. And thank you... for everything.",
    emotionTag: 'gathering strength',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'green_s4_complete_1',
          text: "[overcome] You did it. [laughs through tears] Kalla just confirmed—the cargo arrived. The contract is signed. We're independent!",
          emotionTag: 'overcome',
          pauseAfterMs: 1000,
        },
        {
          id: 'green_s4_complete_2',
          text: "[laughing] Listen to them! [sound of cheering] The whole station is celebrating. Haven't heard that sound in... I don't know how long.",
          emotionTag: 'joyful',
          pauseAfterMs: 800,
        },
        {
          id: 'green_s4_complete_3',
          text: "[warmly] My old colleague Elin would call this 'suboptimal resource allocation.' [chuckles] I call it freedom.",
          emotionTag: 'warmly',
          pauseAfterMs: 600,
        },
        {
          id: 'green_s4_complete_4',
          text: "[sincerely] You changed history today. Greenfields will never forget the pilot who believed in us when nobody else did.",
          emotionTag: 'sincerely',
          pauseAfterMs: 800,
        },
        {
          id: 'green_s4_complete_5',
          text: "[raising a glass] To the harvest. To independence. To everyone who said it couldn't be done. [drinks] Now let's show the system what farmers can build.",
          emotionTag: 'triumphant',
        },
      ],
    },
  },
};

// ============================================================================
// ARC 2: FABRICATION WARS
// ============================================================================

export const FABRICATION_WARS_AURUM_S1_DIALOGUE: MissionDialogue = {
  missionId: 'fabrication_wars_aurum_stage_1',
  characterId: 'aurum-fab-rep',
  characterName: 'Dr. Elin Kade',
  stationId: 'aurum-fab',
  
  introduction: {
    lines: [
      {
        id: 'fab_aurum_s1_intro_1',
        text: "[clinically] I spent eight years at Titan Research. My partner was brilliant—intuitive, passionate, everything I'm not.",
        emotionTag: 'clinically',
        pauseAfterMs: 800,
      },
      {
        id: 'fab_aurum_s1_intro_2',
        text: "[pauses] Then Lab 7 happened. A decimal point. One small human error. Three people died. Including my mentor.",
        emotionTag: 'controlled',
        pauseAfterMs: 1000,
      },
      {
        id: 'fab_aurum_s1_intro_3',
        text: "[flatly] My partner fled technology entirely. I... went the other direction. If humans make errors, design systems where errors can't happen.",
        emotionTag: 'flatly',
        pauseAfterMs: 800,
      },
      {
        id: 'fab_aurum_s1_intro_4',
        text: "[businesslike] Chief Harlan at Drydock represents everything I oppose. Artisanal fabrication. 'Craftsmanship.' Three hundred workers doing what machines could do better.",
        emotionTag: 'businesslike',
        pauseAfterMs: 600,
      },
      {
        id: 'fab_aurum_s1_intro_5',
        text: "[precisely] He has schematics I need. Alloy formulas. Intellectual property that would accelerate our automation by months.",
        emotionTag: 'precisely',
        pauseAfterMs: 600,
      },
      {
        id: 'fab_aurum_s1_intro_6',
        text: "[directly] Dock at Drydock. Access their systems. Download the data. Return here. [pauses] Can you operate with precision?",
        emotionTag: 'directly',
      },
    ],
  },
  
  acceptance: {
    id: 'fab_aurum_s1_accept',
    text: "[approvingly] Efficiency begets efficiency. Your reliability metrics will be updated accordingly. Proceed.",
    emotionTag: 'approvingly',
  },
  
  keyMoments: [
    {
      triggerId: 'downloading',
      lines: [
        {
          id: 'fab_aurum_s1_download',
          text: "[calmly] Data transfer in progress. Maintain your position. Interruptions create... complications.",
          emotionTag: 'calmly',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'fab_aurum_s1_complete_1',
          text: "[pleased] Data received. Analyzing now. [pauses] These formulas will save approximately four hundred labor-hours per cycle.",
          emotionTag: 'pleased',
          pauseAfterMs: 800,
        },
        {
          id: 'fab_aurum_s1_complete_2',
          text: "[quietly] Chief Harlan will consider this theft. He doesn't understand that information wants to be optimized, not hoarded.",
          emotionTag: 'quietly',
          pauseAfterMs: 600,
        },
        {
          id: 'fab_aurum_s1_complete_3',
          text: "[businesslike] Your partnership value has increased significantly. Expect priority allocation on future transactions.",
          emotionTag: 'businesslike',
        },
      ],
    },
  },
};

export const FABRICATION_WARS_DRYDOCK_S1_DIALOGUE: MissionDialogue = {
  missionId: 'fabrication_wars_drydock_stage_1',
  characterId: 'drydock-rep',
  characterName: 'Chief Harlan',
  stationId: 'drydock',
  
  introduction: {
    lines: [
      {
        id: 'fab_dry_s1_intro_1',
        text: "[gruffly] My father died on this floor. Shot by company security during the Shipyard Strikes. I was twenty-two.",
        emotionTag: 'gruffly',
        pauseAfterMs: 1000,
      },
      {
        id: 'fab_dry_s1_intro_2',
        text: "[heavily] Watched him fall. Watched him bleed. [pauses] The strike succeeded. Workers got their demands. Dad became a martyr.",
        emotionTag: 'heavily',
        pauseAfterMs: 1000,
      },
      {
        id: 'fab_dry_s1_intro_3',
        text: "[steeling himself] That's why I do what I do. Three hundred workers here. Three hundred families. They're not 'labor costs.' They're people.",
        emotionTag: 'steeling',
        pauseAfterMs: 800,
      },
      {
        id: 'fab_dry_s1_intro_4',
        text: "[frustrated] Dr. Kade at Aurum Fab thinks automation is progress. She looks at my floor and sees inefficiency. I look at it and see lives.",
        emotionTag: 'frustrated',
        pauseAfterMs: 600,
      },
      {
        id: 'fab_dry_s1_intro_5',
        text: "[conspiratorially] We've developed fake schematics. Wrong enough to send her research in circles for months. I need you to plant them.",
        emotionTag: 'conspiratorially',
        pauseAfterMs: 600,
      },
      {
        id: 'fab_dry_s1_intro_6',
        text: "[directly] Dock at Aurum Fab. Upload the data chip. Let Kade waste her precious efficiency chasing ghosts. Can you do this for us?",
        emotionTag: 'directly',
      },
    ],
  },
  
  acceptance: {
    id: 'fab_dry_s1_accept',
    text: "[warmly] Union thanks you. Workers thank you. [chuckles] And I personally owe you a drink when this is done.",
    emotionTag: 'warmly',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'fab_dry_s1_complete_1',
          text: "[laughs] Kade's probably running those schematics through her precious algorithms right now. [grins] Let her optimize nonsense.",
          emotionTag: 'amused',
          pauseAfterMs: 800,
        },
        {
          id: 'fab_dry_s1_complete_2',
          text: "[seriously] This buys us time. Time to prove that quality beats efficiency. Time to show Ceres who they should trust.",
          emotionTag: 'seriously',
          pauseAfterMs: 600,
        },
        {
          id: 'fab_dry_s1_complete_3',
          text: "[warmly] You're one of us now. The crew's already talking about you. That's rare. That means something.",
          emotionTag: 'warmly',
        },
      ],
    },
  },
};

// ============================================================================
// ARC 3: ENERGY MONOPOLY
// ============================================================================

export const ENERGY_MONOPOLY_S1_DIALOGUE: MissionDialogue = {
  missionId: 'energy_monopoly_stage_1',
  characterId: 'helios-rep',
  characterName: 'Rex Calder',
  stationId: 'sol-refinery',
  
  introduction: {
    lines: [
      {
        id: 'energy_s1_intro_1',
        text: "[gruffly] Twenty-six years I've worked these pipes. My grandfather helped build them. Dad ran them before me.",
        emotionTag: 'gruffly',
        pauseAfterMs: 800,
      },
      {
        id: 'energy_s1_intro_2',
        text: "[bitterly] Twelve years ago, my brother Marcus died right here. Pressure seal failure. Could have been prevented if the company hadn't cut corners.",
        emotionTag: 'bitterly',
        pauseAfterMs: 1000,
      },
      {
        id: 'energy_s1_intro_3',
        text: "[angrily] Spent three years fighting for accountability. Won a settlement. Nobody went to jail. Company paid a fine worth one day's profits.",
        emotionTag: 'angrily',
        pauseAfterMs: 800,
      },
      {
        id: 'energy_s1_intro_4',
        text: "[suspiciously] Now I see the same patterns at Ceres Power Plant. Ivo Renn is manipulating fuel prices. I can't prove it. Yet.",
        emotionTag: 'suspiciously',
        pauseAfterMs: 600,
      },
      {
        id: 'energy_s1_intro_5',
        text: "[conspiratorially] I need you to dock at Ceres. Install this monitoring device. Thirty seconds, undetected. Then get out.",
        emotionTag: 'conspiratorially',
        pauseAfterMs: 600,
      },
      {
        id: 'energy_s1_intro_6',
        text: "[determinedly] If Renn is doing what I think he's doing, this device will prove it. Workers across the system are getting squeezed by his 'market fluctuations.'",
        emotionTag: 'determinedly',
      },
    ],
  },
  
  acceptance: {
    id: 'energy_s1_accept',
    text: "[gratefully] Good. My grandfather believed in free markets. Said they regulate themselves. [darkly] Time to prove whether that's still true.",
    emotionTag: 'gratefully',
  },
  
  keyMoments: [
    {
      triggerId: 'installing',
      lines: [
        {
          id: 'energy_s1_installing',
          text: "[tensely] Installing now. Keep your head down. Renn's people are everywhere. Don't give them a reason to look closer.",
          emotionTag: 'tensely',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'energy_s1_complete_1',
          text: "[relieved] Device is active. Already picking up data. [studies readout] Holy... look at these transaction patterns.",
          emotionTag: 'relieved',
          pauseAfterMs: 800,
        },
        {
          id: 'energy_s1_complete_2',
          text: "[angrily] Renn is buying fuel at market rates, then restricting supply to jack up prices. Forty percent increase in six months. People are going under.",
          emotionTag: 'angrily',
          pauseAfterMs: 800,
        },
        {
          id: 'energy_s1_complete_3',
          text: "[determinedly] Now we have proof. Question is: what do we do with it? This could change everything... or get us both killed.",
          emotionTag: 'determinedly',
        },
      ],
    },
  },
};

// ============================================================================
// ARC 4: PIRATE ACCORDS
// ============================================================================

export const PIRATE_ACCORDS_S1_DIALOGUE: MissionDialogue = {
  missionId: 'pirate_accords_stage_1',
  characterId: 'freeport-rep',
  characterName: 'Kalla Rook',
  stationId: 'freeport',
  
  introduction: {
    lines: [
      {
        id: 'pirate_s1_intro_1',
        text: "[casually] Used to work intelligence, you know. Eight years gathering secrets for people who didn't deserve them.",
        emotionTag: 'casually',
        pauseAfterMs: 800,
      },
      {
        id: 'pirate_s1_intro_2',
        text: "[darkly] Found corruption at the top. Filed a report. Got framed for the crime I exposed. Eighteen months in detention.",
        emotionTag: 'darkly',
        pauseAfterMs: 1000,
      },
      {
        id: 'pirate_s1_intro_3',
        text: "[lighter] Escaped during a 'transport malfunction.' [winks] Now I run Freeport. Neutral ground. Everyone's welcome if they can pay.",
        emotionTag: 'lighter',
        pauseAfterMs: 600,
      },
      {
        id: 'pirate_s1_intro_4',
        text: "[seriously] Here's the thing: Sol City and Hidden Cove have been at each other's throats for years. Bad for business. Worse for people caught in the middle.",
        emotionTag: 'seriously',
        pauseAfterMs: 800,
      },
      {
        id: 'pirate_s1_intro_5',
        text: "[hopefully] I've drafted a peace proposal. Vex Marrow at Hidden Cove has agreed to read it. But someone needs to deliver it.",
        emotionTag: 'hopefully',
        pauseAfterMs: 600,
      },
      {
        id: 'pirate_s1_intro_6',
        text: "[warning] Thirty percent chance of pirate ambush en route. Not everyone in Vex's organization wants peace. [shrugs] Still interested?",
        emotionTag: 'warning',
      },
    ],
  },
  
  acceptance: {
    id: 'pirate_s1_accept',
    text: "[pleased] Brave pilot! Information is the real currency, and right now, this message is worth more than cargo. Fly fast.",
    emotionTag: 'pleased',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'pirate_s1_complete_1',
          text: "[excited] Vex received the proposal! [laughs] I honestly didn't think you'd make it. No offense.",
          emotionTag: 'excited',
          pauseAfterMs: 800,
        },
        {
          id: 'pirate_s1_complete_2',
          text: "[thoughtfully] Now comes the hard part. Both sides have to choose: keep fighting, or try something new.",
          emotionTag: 'thoughtfully',
          pauseAfterMs: 600,
        },
        {
          id: 'pirate_s1_complete_3',
          text: "[earnestly] Thank you for carrying hope across the void. That sounds dramatic. [chuckles] But it's true.",
          emotionTag: 'earnestly',
        },
      ],
    },
  },
};

export const PIRATE_ACCORDS_VEX_INTRO_DIALOGUE: MissionDialogue = {
  missionId: 'pirate_accords_stage_2',
  characterId: 'hidden-cove-rep',
  characterName: 'Vex Marrow',
  stationId: 'hidden-cove',
  
  introduction: {
    lines: [
      {
        id: 'vex_s2_intro_1',
        text: "[playfully] Lieutenant Vincent Markov. That was my name once. Decorated three times for valor. I believed in the law.",
        emotionTag: 'playfully',
        pauseAfterMs: 800,
      },
      {
        id: 'vex_s2_intro_2',
        text: "[darkening] Then I found out my commanding officer was running protection rackets with the pirates I was hunting. Classic.",
        emotionTag: 'darkening',
        pauseAfterMs: 1000,
      },
      {
        id: 'vex_s2_intro_3',
        text: "[bitterly] I refused to participate. Got framed. Sentenced to twenty years. [laughs] Never arrived at the prison.",
        emotionTag: 'bitterly',
        pauseAfterMs: 800,
      },
      {
        id: 'vex_s2_intro_4',
        text: "[seriously] The pirates who intercepted my transport offered me a choice: die as a lawman, or live as something else.",
        emotionTag: 'seriously',
        pauseAfterMs: 600,
      },
      {
        id: 'vex_s2_intro_5',
        text: "[firmly] I chose to live. Built Hidden Cove into what it is. We're not criminals—we're the honest alternative to a corrupt system.",
        emotionTag: 'firmly',
        pauseAfterMs: 600,
      },
      {
        id: 'vex_s2_intro_6',
        text: "[testing] Now Kalla wants peace talks. [pauses] Question is: are you here to help us negotiate... or to help Sol City finish what they started?",
        emotionTag: 'testing',
      },
    ],
  },
  
  acceptance: {
    id: 'vex_s2_accept',
    text: "[approvingly] Interesting choice, pilot. Choose your path carefully. Not everyone survives the crossroads.",
    emotionTag: 'approvingly',
  },
  
  completion: {
    success: {
      lines: [
        {
          id: 'vex_s2_complete_pirate_1',
          text: "[triumphantly] You chose freedom! Sol City's defenses are crumbling. The boot is off our neck!",
          emotionTag: 'triumphantly',
          pauseAfterMs: 800,
        },
        {
          id: 'vex_s2_complete_pirate_2',
          text: "[seriously] I still have my patrol badge, you know. Look at it sometimes. Wonder about the man I was.",
          emotionTag: 'seriously',
          pauseAfterMs: 1000,
        },
        {
          id: 'vex_s2_complete_pirate_3',
          text: "[resolutely] That man believed in justice. [pauses] So do I. Just a different kind. Welcome to the family.",
          emotionTag: 'resolutely',
        },
      ],
    },
  },
};

// ============================================================================
// ARC 5: UNION CRISIS
// ============================================================================

export const UNION_CRISIS_S1_DIALOGUE: MissionDialogue = {
  missionId: 'union_crisis_stage_1',
  characterId: 'drydock-rep',
  characterName: 'Chief Harlan',
  stationId: 'drydock',
  
  introduction: {
    lines: [
      {
        id: 'union_s1_intro_1',
        text: "[heavily] I'm fifty-three years old. Half my life on this floor. Started when I was twenty, sweeping debris.",
        emotionTag: 'heavily',
        pauseAfterMs: 800,
      },
      {
        id: 'union_s1_intro_2',
        text: "[pauses] After my father was killed, I could have become a firebrand. Led riots. Burned things down. Instead, I learned every job in this yard.",
        emotionTag: 'reflective',
        pauseAfterMs: 1000,
      },
      {
        id: 'union_s1_intro_3',
        text: "[proudly] Now I can do any job here better than anyone. That's why workers follow me. Not because of speeches. Because I'm one of them.",
        emotionTag: 'proudly',
        pauseAfterMs: 600,
      },
      {
        id: 'union_s1_intro_4',
        text: "[urgently] We're organizing across stations. Biggest union push in thirty years. But we need help spreading the word.",
        emotionTag: 'urgently',
        pauseAfterMs: 600,
      },
      {
        id: 'union_s1_intro_5',
        text: "[determinedly] Five stations. Fifteen minutes. Deliver these pamphlets. Rex at the Refinery is already with us. Sana at Greenfields. Now we need everyone else.",
        emotionTag: 'determinedly',
        pauseAfterMs: 800,
      },
      {
        id: 'union_s1_intro_6',
        text: "[quietly] Doctor says I've got respiratory damage. Decades of shipyard particulates. [pauses] Haven't told my family yet. But I need to finish what my father started first.",
        emotionTag: 'quietly',
      },
    ],
  },
  
  acceptance: {
    id: 'union_s1_accept',
    text: "[warmly] Workers built this system. Time we got paid like we matter. Go. And thank you for standing with us.",
    emotionTag: 'warmly',
  },
  
  keyMoments: [
    {
      triggerId: 'first_delivery',
      lines: [
        {
          id: 'union_s1_delivery',
          text: "[encouragingly] First station reached! Workers are reading the pamphlets. The conversation is starting. Keep moving!",
          emotionTag: 'encouragingly',
        },
      ],
    },
    {
      triggerId: 'three_delivered',
      lines: [
        {
          id: 'union_s1_momentum',
          text: "[excitedly] Three stations! Rex just commed—the refinery workers are talking strike. We have momentum!",
          emotionTag: 'excitedly',
        },
      ],
    },
  ],
  
  completion: {
    success: {
      lines: [
        {
          id: 'union_s1_complete_1',
          text: "[joyfully] All stations reached! [laughs] Every station in the system is talking about workers' rights. Corporate types are nervous.",
          emotionTag: 'joyfully',
          pauseAfterMs: 800,
        },
        {
          id: 'union_s1_complete_2',
          text: "[seriously] My father would be proud. He died believing workers could stand together. [voice breaks] Took thirty years, but we're doing it.",
          emotionTag: 'emotionally',
          pauseAfterMs: 1000,
        },
        {
          id: 'union_s1_complete_3',
          text: "[determinedly] Next step: the strike. Or breaking it. Dr. Kade is already offering bounties for strikebreakers. Time to choose your side.",
          emotionTag: 'determinedly',
        },
      ],
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get dialogue for a specific mission
 */
export function getMissionDialogue(missionId: string): MissionDialogue | undefined {
  const allDialogue: MissionDialogue[] = [
    GREENFIELDS_STAGE_1_DIALOGUE,
    GREENFIELDS_STAGE_2_DIALOGUE,
    GREENFIELDS_STAGE_2_SOL_DIALOGUE,
    GREENFIELDS_STAGE_3_DIALOGUE,
    SOL_CITY_STAGE_3_DIALOGUE,
    GREENFIELDS_STAGE_4_DIALOGUE,
    FABRICATION_WARS_AURUM_S1_DIALOGUE,
    FABRICATION_WARS_DRYDOCK_S1_DIALOGUE,
    ENERGY_MONOPOLY_S1_DIALOGUE,
    PIRATE_ACCORDS_S1_DIALOGUE,
    PIRATE_ACCORDS_VEX_INTRO_DIALOGUE,
    UNION_CRISIS_S1_DIALOGUE,
  ];
  
  return allDialogue.find(d => d.missionId === missionId);
}

/**
 * Get all dialogue for a character
 */
export function getDialogueByCharacter(characterId: string): MissionDialogue[] {
  const allDialogue: MissionDialogue[] = [
    GREENFIELDS_STAGE_1_DIALOGUE,
    GREENFIELDS_STAGE_2_DIALOGUE,
    GREENFIELDS_STAGE_2_SOL_DIALOGUE,
    GREENFIELDS_STAGE_3_DIALOGUE,
    SOL_CITY_STAGE_3_DIALOGUE,
    GREENFIELDS_STAGE_4_DIALOGUE,
    FABRICATION_WARS_AURUM_S1_DIALOGUE,
    FABRICATION_WARS_DRYDOCK_S1_DIALOGUE,
    ENERGY_MONOPOLY_S1_DIALOGUE,
    PIRATE_ACCORDS_S1_DIALOGUE,
    PIRATE_ACCORDS_VEX_INTRO_DIALOGUE,
    UNION_CRISIS_S1_DIALOGUE,
  ];
  
  return allDialogue.filter(d => d.characterId === characterId);
}

/**
 * Get all dialogue lines for audio generation export
 */
export function getAllDialogueLinesForExport(): {
  missionId: string;
  characterName: string;
  stationId: string;
  lineId: string;
  text: string;
  emotionTag?: string;
  phase: 'introduction' | 'acceptance' | 'key_moment' | 'completion_success' | 'completion_failure';
  suggestedFilename: string;
}[] {
  const allDialogue: MissionDialogue[] = [
    GREENFIELDS_STAGE_1_DIALOGUE,
    GREENFIELDS_STAGE_2_DIALOGUE,
    GREENFIELDS_STAGE_2_SOL_DIALOGUE,
    GREENFIELDS_STAGE_3_DIALOGUE,
    SOL_CITY_STAGE_3_DIALOGUE,
    GREENFIELDS_STAGE_4_DIALOGUE,
    FABRICATION_WARS_AURUM_S1_DIALOGUE,
    FABRICATION_WARS_DRYDOCK_S1_DIALOGUE,
    ENERGY_MONOPOLY_S1_DIALOGUE,
    PIRATE_ACCORDS_S1_DIALOGUE,
    PIRATE_ACCORDS_VEX_INTRO_DIALOGUE,
    UNION_CRISIS_S1_DIALOGUE,
  ];
  
  const result: ReturnType<typeof getAllDialogueLinesForExport> = [];
  
  for (const dialogue of allDialogue) {
    // Introduction lines
    for (const line of dialogue.introduction.lines) {
      result.push({
        missionId: dialogue.missionId,
        characterName: dialogue.characterName,
        stationId: dialogue.stationId,
        lineId: line.id,
        text: line.text,
        emotionTag: line.emotionTag,
        phase: 'introduction',
        suggestedFilename: `missions/${dialogue.stationId}/${dialogue.missionId}/${line.id}.mp3`,
      });
    }
    
    // Acceptance line
    result.push({
      missionId: dialogue.missionId,
      characterName: dialogue.characterName,
      stationId: dialogue.stationId,
      lineId: dialogue.acceptance.id,
      text: dialogue.acceptance.text,
      emotionTag: dialogue.acceptance.emotionTag,
      phase: 'acceptance',
      suggestedFilename: `missions/${dialogue.stationId}/${dialogue.missionId}/${dialogue.acceptance.id}.mp3`,
    });
    
    // Key moment lines
    if (dialogue.keyMoments) {
      for (const moment of dialogue.keyMoments) {
        for (const line of moment.lines) {
          result.push({
            missionId: dialogue.missionId,
            characterName: dialogue.characterName,
            stationId: dialogue.stationId,
            lineId: line.id,
            text: line.text,
            emotionTag: line.emotionTag,
            phase: 'key_moment',
            suggestedFilename: `missions/${dialogue.stationId}/${dialogue.missionId}/${line.id}.mp3`,
          });
        }
      }
    }
    
    // Completion success lines
    for (const line of dialogue.completion.success.lines) {
      result.push({
        missionId: dialogue.missionId,
        characterName: dialogue.characterName,
        stationId: dialogue.stationId,
        lineId: line.id,
        text: line.text,
        emotionTag: line.emotionTag,
        phase: 'completion_success',
        suggestedFilename: `missions/${dialogue.stationId}/${dialogue.missionId}/${line.id}.mp3`,
      });
    }
    
    // Completion failure lines
    if (dialogue.completion.failure) {
      for (const line of dialogue.completion.failure.lines) {
        result.push({
          missionId: dialogue.missionId,
          characterName: dialogue.characterName,
          stationId: dialogue.stationId,
          lineId: line.id,
          text: line.text,
          emotionTag: line.emotionTag,
          phase: 'completion_failure',
          suggestedFilename: `missions/${dialogue.stationId}/${dialogue.missionId}/${line.id}.mp3`,
        });
      }
    }
  }
  
  return result;
}

