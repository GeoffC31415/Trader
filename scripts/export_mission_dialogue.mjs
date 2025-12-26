/**
 * Export Mission Dialogue for Voice Generation
 * 
 * This script extracts all mission dialogue from mission_dialogue.ts
 * and exports it to a JSON format compatible with the voice generation pipeline.
 * 
 * Usage:
 *   node scripts/export_mission_dialogue.mjs
 * 
 * Output:
 *   docs/mission_dialogue_export.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Voice config mapping (same as regular dialogue)
const voiceConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'voice_config.json'), 'utf-8')
);

/**
 * Mission dialogue data - manually mirrored from mission_dialogue.ts
 * In a production setup, this would be imported directly or auto-generated.
 */
const missionDialogues = [
  // ============================================================================
  // ARC 1: GREENFIELDS INDEPENDENCE
  // ============================================================================
  {
    missionId: 'greenfields_stage_1',
    characterId: 'greenfields-rep',
    characterName: 'Sana Whit',
    stationId: 'greenfields',
    title: 'Breaking the Chain',
    lines: [
      // Introduction
      { id: 'green_s1_intro_1', phase: 'introduction', text: "[warmly] I remember my first years in this system. Working alongside Elin Kade at Titan Research, believing technology would solve everything.", emotionTag: 'warmly' },
      { id: 'green_s1_intro_2', phase: 'introduction', text: "[pauses] Then Lab 7 happened. Friends died because a decimal point was wrong. I learned that day—some problems can't be automated away.", emotionTag: 'somber' },
      { id: 'green_s1_intro_3', phase: 'introduction', text: "[determined] That's why I'm here, growing real food with real hands. Simple. Honest. But Sol City wants to complicate everything.", emotionTag: 'determined' },
      { id: 'green_s1_intro_4', phase: 'introduction', text: "[frustrated] Mira Vale—she was an inspector here once. Young, ambitious, convinced regulations protect people. Maybe they do, sometimes.", emotionTag: 'frustrated' },
      { id: 'green_s1_intro_5', phase: 'introduction', text: "[conspiratorially] But right now, her regulations are strangling us. I need luxury goods for a... private arrangement. Off the books.", emotionTag: 'conspiratorially' },
      { id: 'green_s1_intro_6', phase: 'introduction', text: "[urgently] Ten units. Don't fly near Sol City—their inspectors will confiscate anything that doesn't have proper stamps. Can you do this?", emotionTag: 'urgently' },
      // Acceptance
      { id: 'green_s1_accept', phase: 'acceptance', text: "[grateful] Thank you. The cooperative won't forget this. Now fly careful—and fly smart.", emotionTag: 'grateful' },
      // Key moments
      { id: 'green_s1_warning', phase: 'key_moment', text: "[alarmed] Warning! Sol City patrol detected. Change course immediately or they'll scan your cargo!", emotionTag: 'alarmed' },
      { id: 'green_s1_halfway', phase: 'key_moment', text: "[encouraging] You're doing great. Just a little further. The workers are already preparing the distribution lists.", emotionTag: 'encouraging' },
      // Completion
      { id: 'green_s1_complete_1', phase: 'completion_success', text: "[joyfully] You made it! [laughs] Look at these goods—Sol City thought they could starve us into compliance.", emotionTag: 'joyfully' },
      { id: 'green_s1_complete_2', phase: 'completion_success', text: "[warmly] My grandmother grew vegetables on a generation ship. She always said: 'Feed people, and you give them hope.'", emotionTag: 'warmly' },
      { id: 'green_s1_complete_3', phase: 'completion_success', text: "[seriously] This is just the beginning. Next time... we're going to need you for something bigger. Something that can't be undone.", emotionTag: 'seriously' },
      { id: 'green_s1_fail_1', phase: 'completion_failure', text: "[disappointed] Sol City got the cargo. [sighs] I expected too much, too soon. We'll find another way.", emotionTag: 'disappointed' },
    ],
  },
  
  {
    missionId: 'greenfields_stage_2',
    characterId: 'greenfields-rep',
    characterName: 'Sana Whit',
    stationId: 'greenfields',
    title: 'The Census - Greenfields Side',
    lines: [
      { id: 'green_s2_intro_1', phase: 'introduction', text: "[intensely] Sol City has been conducting 'agricultural inspections.' What they're really doing is building a case against us.", emotionTag: 'intensely' },
      { id: 'green_s2_intro_2', phase: 'introduction', text: "[bitterly] Mira Vale and I worked together once, briefly. I thought we understood each other. But she filed a regulatory report that nearly destroyed us.", emotionTag: 'bitterly' },
      { id: 'green_s2_intro_3', phase: 'introduction', text: "[pauses] She sees rules. I see families. We stopped being friends that day.", emotionTag: 'somber' },
      { id: 'green_s2_intro_4', phase: 'introduction', text: "[urgently] There are data chips in Sol City that contain the real inspection logs. The ones showing their inspectors planted evidence.", emotionTag: 'urgently' },
      { id: 'green_s2_intro_5', phase: 'introduction', text: "[quietly] If you get those chips to me, we expose the corruption. If you take them to Mira instead... [pauses] well, you'd be helping her finish what she started.", emotionTag: 'quietly' },
      { id: 'green_s2_intro_6', phase: 'introduction', text: "[earnestly] This is the moment, pilot. Which future do you want to build?", emotionTag: 'earnestly' },
      { id: 'green_s2_accept', phase: 'acceptance', text: "[hopefully] Whatever you decide... remember that farmers fed this system for generations. We deserve respect, not regulation.", emotionTag: 'hopefully' },
      { id: 'green_s2_complete_greenfields_1', phase: 'completion_success', text: "[overwhelmed] These logs... I knew they were lying, but seeing the proof... [voice breaks] My husband Marcus always believed we'd be vindicated.", emotionTag: 'emotional' },
      { id: 'green_s2_complete_greenfields_2', phase: 'completion_success', text: "[determined] Sol City is going to raise prices on us. Make things harder. But they can't bury the truth anymore.", emotionTag: 'determined' },
      { id: 'green_s2_complete_greenfields_3', phase: 'completion_success', text: "[warmly] You chose our side. That means something. Greenfields will remember.", emotionTag: 'warmly' },
    ],
  },
  
  {
    missionId: 'greenfields_stage_2_sol',
    characterId: 'sol-city-rep',
    characterName: 'Mira Vale',
    stationId: 'sol-city',
    title: 'The Census - Sol City Side',
    lines: [
      { id: 'sol_s2_intro_1', phase: 'introduction', text: "[professionally] I was eleven years old during the Freeport Riots. My father worked seventy-two hours straight to restore order.", emotionTag: 'professionally' },
      { id: 'sol_s2_intro_2', phase: 'introduction', text: "[pauses] I hid in a cargo container while people died outside. Screaming. Fire. Chaos. All because supply chains broke down.", emotionTag: 'haunted' },
      { id: 'sol_s2_intro_3', phase: 'introduction', text: "[firmly] That's why I believe in regulation. Not because I enjoy paperwork—because I've seen what happens without it.", emotionTag: 'firmly' },
      { id: 'sol_s2_intro_4', phase: 'introduction', text: "[concerned] Sana Whit is running unregistered grow operations. Modified seeds. Undocumented compounds. One contaminated crop could sicken thousands.", emotionTag: 'concerned' },
      { id: 'sol_s2_intro_5', phase: 'introduction', text: "[directly] I need you to report what you find there. Unregistered operations. Violations. The truth.", emotionTag: 'directly' },
      { id: 'sol_s2_intro_6', phase: 'introduction', text: "[quietly] Sana and I worked together once. I filed a report on minor violations. She saw it as betrayal. [pauses] I saw it as doing my job.", emotionTag: 'quietly' },
      { id: 'sol_s2_accept', phase: 'acceptance', text: "[formally] Your cooperation is noted. Sol City values traders who understand that order protects everyone.", emotionTag: 'formally' },
      { id: 'sol_s2_complete_1', phase: 'completion_success', text: "[satisfied] Documentation received. Violations confirmed. [pauses] This isn't about punishment—it's about accountability.", emotionTag: 'satisfied' },
      { id: 'sol_s2_complete_2', phase: 'completion_success', text: "[softly] I know Sana thinks I'm the enemy. Maybe to her, I am. But someone has to maintain standards.", emotionTag: 'softly' },
      { id: 'sol_s2_complete_3', phase: 'completion_success', text: "[professionally] You've proven yourself a friend to Sol City. Future opportunities will reflect that. Thank you.", emotionTag: 'professionally' },
    ],
  },
  
  {
    missionId: 'greenfields_stage_3',
    characterId: 'greenfields-rep',
    characterName: 'Sana Whit',
    stationId: 'greenfields',
    title: 'Supply Cut',
    lines: [
      { id: 'green_s3_intro_1', phase: 'introduction', text: "[heavily] Harvest season. Should be a celebration. Instead, I'm asking you to destroy ships.", emotionTag: 'heavily' },
      { id: 'green_s3_intro_2', phase: 'introduction', text: "[bitterly] Sol City is intercepting our grain convoys. 'Quality inspections,' they call it. Legalized theft is what it is.", emotionTag: 'bitterly' },
      { id: 'green_s3_intro_3', phase: 'introduction', text: "[pauses] I knew the pilots on those convoys once. Shared meals. Shared dreams. [voice hardens] Then they sold out to Sol City security contracts.", emotionTag: 'hardening' },
      { id: 'green_s3_intro_4', phase: 'introduction', text: "[intensely] Three convoys are heading to Sol City right now. If they arrive, Mira Vale uses that grain to prove she controls our food supply.", emotionTag: 'intensely' },
      { id: 'green_s3_intro_5', phase: 'introduction', text: "[quietly] Destroy them. Let Sol City feel what scarcity means. [pauses] Maybe then they'll negotiate in good faith.", emotionTag: 'quietly' },
      { id: 'green_s3_intro_6', phase: 'introduction', text: "[steeling herself] This is economic warfare. The kind that echoes through ledgers and stomachs. Are you ready to cross this line?", emotionTag: 'steeling' },
      { id: 'green_s3_accept', phase: 'acceptance', text: "[grimly] Then go. And may whatever gods you believe in forgive us both.", emotionTag: 'grimly' },
      { id: 'green_s3_convoy_1', phase: 'key_moment', text: "[quietly] First convoy down. [pauses] I hope they had escape pods. I hope... [trails off]", emotionTag: 'conflicted' },
      { id: 'green_s3_convoy_2', phase: 'key_moment', text: "[hardening] Sol City will call this terrorism. We call it survival. History decides who was right.", emotionTag: 'hardening' },
      { id: 'green_s3_complete_1', phase: 'completion_success', text: "[exhausted] It's done. Grain prices in Sol City will spike within the hour. Mira Vale will be scrambling.", emotionTag: 'exhausted' },
      { id: 'green_s3_complete_2', phase: 'completion_success', text: "[quietly] Some nights I still dream about Lab 7. The screaming. The chemical smell. [pauses] Now I'll dream about grain convoys too.", emotionTag: 'haunted' },
      { id: 'green_s3_complete_3', phase: 'completion_success', text: "[resolutely] But freedom isn't free. My grandmother knew that. Crossed half the galaxy in a tin can to find somewhere to grow things in peace.", emotionTag: 'resolutely' },
      { id: 'green_s3_complete_4', phase: 'completion_success', text: "[warmly] One more step. The final delivery. After that... Greenfields stands alone. Independent. The way it should be.", emotionTag: 'warmly' },
    ],
  },
  
  {
    missionId: 'sol_city_stage_3',
    characterId: 'sol-city-rep',
    characterName: 'Mira Vale',
    stationId: 'sol-city',
    title: 'Agricultural Compliance Escort',
    lines: [
      { id: 'sol_s3_intro_1', phase: 'introduction', text: "[tensely] We have evidence of agricultural violations at Greenfields. Unregistered grow operations. Unauthorized seed modifications.", emotionTag: 'tensely' },
      { id: 'sol_s3_intro_2', phase: 'introduction', text: "[seriously] This isn't about control. One contaminated crop could sicken thousands. These regulations exist for a reason.", emotionTag: 'seriously' },
      { id: 'sol_s3_intro_3', phase: 'introduction', text: "[introducing] Inspector Chavez has been doing this for twenty-three years. She's never needed an armed escort before.", emotionTag: 'concerned' },
      { id: 'sol_s3_intro_4', phase: 'introduction', text: "[grimly] Intelligence suggests Sana Whit has hired Hidden Cove pirates to prevent this inspection. Vex Marrow's people. Dangerous.", emotionTag: 'grimly' },
      { id: 'sol_s3_intro_5', phase: 'introduction', text: "[pauses] I was stationed at Greenfields once. Young inspector. Sana was kind to me then. [voice hardens] Before she decided the rules didn't apply to farmers.", emotionTag: 'hardening' },
      { id: 'sol_s3_intro_6', phase: 'introduction', text: "[firmly] Protect Inspector Chavez. Get her to Greenfields. Let her do her job. That's all I ask.", emotionTag: 'firmly' },
      { id: 'sol_s3_accept', phase: 'acceptance', text: "[formally] Sol City is grateful. Inspector Chavez's shuttle will launch momentarily. Protect her with your life if necessary.", emotionTag: 'formally' },
      { id: 'sol_s3_pirates', phase: 'key_moment', text: "[alarmed] Pirate contacts on scope! Hidden Cove signatures. Protect the inspector!", emotionTag: 'alarmed' },
      { id: 'sol_s3_wave', phase: 'key_moment', text: "[relieved] Wave repelled. [pauses] More incoming. They really don't want this inspection to happen.", emotionTag: 'relieved' },
      { id: 'sol_s3_complete_1', phase: 'completion_success', text: "[relieved] Inspector Chavez has arrived safely. The inspection is proceeding. You've done well.", emotionTag: 'relieved' },
      { id: 'sol_s3_complete_2', phase: 'completion_success', text: "[quietly] Sana will hate me more now. [pauses] But I didn't create the rules. I just enforce them.", emotionTag: 'quietly' },
      { id: 'sol_s3_complete_3', phase: 'completion_success', text: "[professionally] One final task remains. Enforcement contracts must be distributed. Greenfields will comply... or face consequences.", emotionTag: 'professionally' },
    ],
  },
  
  {
    missionId: 'greenfields_stage_4',
    characterId: 'greenfields-rep',
    characterName: 'Sana Whit',
    stationId: 'greenfields',
    title: 'New Markets - Independence Finale',
    lines: [
      { id: 'green_s4_intro_1', phase: 'introduction', text: "[emotionally] Come in. Sit. [pauses] The kitchen smells like fresh bread. My grandmother's recipe. Same one she baked on the generation ship.", emotionTag: 'emotionally' },
      { id: 'green_s4_intro_2', phase: 'introduction', text: "[spreading papers] This contract... it's not just paper. It's everything we've fought for. Kalla Rook at Freeport is buying direct.", emotionTag: 'hopeful' },
      { id: 'green_s4_intro_3', phase: 'introduction', text: "[voice breaking] No Sol City inspectors. No middleman tariffs. No compliance fees bleeding us dry quarter after quarter.", emotionTag: 'emotional' },
      { id: 'green_s4_intro_4', phase: 'introduction', text: "[looking outside] See them? Workers loading crates by hand. Singing old work songs from Earth. [smiles] Nobody remembers where the songs come from anymore.", emotionTag: 'nostalgic' },
      { id: 'green_s4_intro_5', phase: 'introduction', text: "[firmly] Thirty units of food. Grain and meat—the harvest of free farmers going to free traders.", emotionTag: 'firmly' },
      { id: 'green_s4_intro_6', phase: 'introduction', text: "[intensely] This is our shot. One chance to prove we can stand on our own. Get this cargo to Freeport, and we rewrite the rules.", emotionTag: 'intensely' },
      { id: 'green_s4_intro_7', phase: 'introduction', text: "[quietly] My husband Marcus is sick. [pauses] He might not see what we're building. But he'll know it happened. That matters.", emotionTag: 'quietly' },
      { id: 'green_s4_accept', phase: 'acceptance', text: "[gathering herself] The agricultural revolution begins now. Fly safe. Fly proud. And thank you... for everything.", emotionTag: 'gathering strength' },
      { id: 'green_s4_complete_1', phase: 'completion_success', text: "[overcome] You did it. [laughs through tears] Kalla just confirmed—the cargo arrived. The contract is signed. We're independent!", emotionTag: 'overcome' },
      { id: 'green_s4_complete_2', phase: 'completion_success', text: "[laughing] Listen to them! [sound of cheering] The whole station is celebrating. Haven't heard that sound in... I don't know how long.", emotionTag: 'joyful' },
      { id: 'green_s4_complete_3', phase: 'completion_success', text: "[warmly] My old colleague Elin would call this 'suboptimal resource allocation.' [chuckles] I call it freedom.", emotionTag: 'warmly' },
      { id: 'green_s4_complete_4', phase: 'completion_success', text: "[sincerely] You changed history today. Greenfields will never forget the pilot who believed in us when nobody else did.", emotionTag: 'sincerely' },
      { id: 'green_s4_complete_5', phase: 'completion_success', text: "[raising a glass] To the harvest. To independence. To everyone who said it couldn't be done. [drinks] Now let's show the system what farmers can build.", emotionTag: 'triumphant' },
    ],
  },
  
  // ============================================================================
  // ARC 2: FABRICATION WARS
  // ============================================================================
  {
    missionId: 'fabrication_wars_aurum_stage_1',
    characterId: 'aurum-fab-rep',
    characterName: 'Dr. Elin Kade',
    stationId: 'aurum-fab',
    title: 'Patent Wars - Aurum Path',
    lines: [
      { id: 'fab_aurum_s1_intro_1', phase: 'introduction', text: "[clinically] I spent eight years at Titan Research. My partner was brilliant—intuitive, passionate, everything I'm not.", emotionTag: 'clinically' },
      { id: 'fab_aurum_s1_intro_2', phase: 'introduction', text: "[pauses] Then Lab 7 happened. A decimal point. One small human error. Three people died. Including my mentor.", emotionTag: 'controlled' },
      { id: 'fab_aurum_s1_intro_3', phase: 'introduction', text: "[flatly] My partner fled technology entirely. I... went the other direction. If humans make errors, design systems where errors can't happen.", emotionTag: 'flatly' },
      { id: 'fab_aurum_s1_intro_4', phase: 'introduction', text: "[businesslike] Chief Harlan at Drydock represents everything I oppose. Artisanal fabrication. 'Craftsmanship.' Three hundred workers doing what machines could do better.", emotionTag: 'businesslike' },
      { id: 'fab_aurum_s1_intro_5', phase: 'introduction', text: "[precisely] He has schematics I need. Alloy formulas. Intellectual property that would accelerate our automation by months.", emotionTag: 'precisely' },
      { id: 'fab_aurum_s1_intro_6', phase: 'introduction', text: "[directly] Dock at Drydock. Access their systems. Download the data. Return here. [pauses] Can you operate with precision?", emotionTag: 'directly' },
      { id: 'fab_aurum_s1_accept', phase: 'acceptance', text: "[approvingly] Efficiency begets efficiency. Your reliability metrics will be updated accordingly. Proceed.", emotionTag: 'approvingly' },
      { id: 'fab_aurum_s1_download', phase: 'key_moment', text: "[calmly] Data transfer in progress. Maintain your position. Interruptions create... complications.", emotionTag: 'calmly' },
      { id: 'fab_aurum_s1_complete_1', phase: 'completion_success', text: "[pleased] Data received. Analyzing now. [pauses] These formulas will save approximately four hundred labor-hours per cycle.", emotionTag: 'pleased' },
      { id: 'fab_aurum_s1_complete_2', phase: 'completion_success', text: "[quietly] Chief Harlan will consider this theft. He doesn't understand that information wants to be optimized, not hoarded.", emotionTag: 'quietly' },
      { id: 'fab_aurum_s1_complete_3', phase: 'completion_success', text: "[businesslike] Your partnership value has increased significantly. Expect priority allocation on future transactions.", emotionTag: 'businesslike' },
    ],
  },
  
  {
    missionId: 'fabrication_wars_drydock_stage_1',
    characterId: 'drydock-rep',
    characterName: 'Chief Harlan',
    stationId: 'drydock',
    title: 'Patent Wars - Drydock Path',
    lines: [
      { id: 'fab_dry_s1_intro_1', phase: 'introduction', text: "[gruffly] My father died on this floor. Shot by company security during the Shipyard Strikes. I was twenty-two.", emotionTag: 'gruffly' },
      { id: 'fab_dry_s1_intro_2', phase: 'introduction', text: "[heavily] Watched him fall. Watched him bleed. [pauses] The strike succeeded. Workers got their demands. Dad became a martyr.", emotionTag: 'heavily' },
      { id: 'fab_dry_s1_intro_3', phase: 'introduction', text: "[steeling himself] That's why I do what I do. Three hundred workers here. Three hundred families. They're not 'labor costs.' They're people.", emotionTag: 'steeling' },
      { id: 'fab_dry_s1_intro_4', phase: 'introduction', text: "[frustrated] Dr. Kade at Aurum Fab thinks automation is progress. She looks at my floor and sees inefficiency. I look at it and see lives.", emotionTag: 'frustrated' },
      { id: 'fab_dry_s1_intro_5', phase: 'introduction', text: "[conspiratorially] We've developed fake schematics. Wrong enough to send her research in circles for months. I need you to plant them.", emotionTag: 'conspiratorially' },
      { id: 'fab_dry_s1_intro_6', phase: 'introduction', text: "[directly] Dock at Aurum Fab. Upload the data chip. Let Kade waste her precious efficiency chasing ghosts. Can you do this for us?", emotionTag: 'directly' },
      { id: 'fab_dry_s1_accept', phase: 'acceptance', text: "[warmly] Union thanks you. Workers thank you. [chuckles] And I personally owe you a drink when this is done.", emotionTag: 'warmly' },
      { id: 'fab_dry_s1_complete_1', phase: 'completion_success', text: "[laughs] Kade's probably running those schematics through her precious algorithms right now. [grins] Let her optimize nonsense.", emotionTag: 'amused' },
      { id: 'fab_dry_s1_complete_2', phase: 'completion_success', text: "[seriously] This buys us time. Time to prove that quality beats efficiency. Time to show Ceres who they should trust.", emotionTag: 'seriously' },
      { id: 'fab_dry_s1_complete_3', phase: 'completion_success', text: "[warmly] You're one of us now. The crew's already talking about you. That's rare. That means something.", emotionTag: 'warmly' },
    ],
  },
  
  // ============================================================================
  // ARC 3: ENERGY MONOPOLY
  // ============================================================================
  {
    missionId: 'energy_monopoly_stage_1',
    characterId: 'helios-rep',
    characterName: 'Rex Calder',
    stationId: 'sol-refinery',
    title: 'The Audit Trail',
    lines: [
      { id: 'energy_s1_intro_1', phase: 'introduction', text: "[gruffly] Twenty-six years I've worked these pipes. My grandfather helped build them. Dad ran them before me.", emotionTag: 'gruffly' },
      { id: 'energy_s1_intro_2', phase: 'introduction', text: "[bitterly] Twelve years ago, my brother Marcus died right here. Pressure seal failure. Could have been prevented if the company hadn't cut corners.", emotionTag: 'bitterly' },
      { id: 'energy_s1_intro_3', phase: 'introduction', text: "[angrily] Spent three years fighting for accountability. Won a settlement. Nobody went to jail. Company paid a fine worth one day's profits.", emotionTag: 'angrily' },
      { id: 'energy_s1_intro_4', phase: 'introduction', text: "[suspiciously] Now I see the same patterns at Ceres Power Plant. Ivo Renn is manipulating fuel prices. I can't prove it. Yet.", emotionTag: 'suspiciously' },
      { id: 'energy_s1_intro_5', phase: 'introduction', text: "[conspiratorially] I need you to dock at Ceres. Install this monitoring device. Thirty seconds, undetected. Then get out.", emotionTag: 'conspiratorially' },
      { id: 'energy_s1_intro_6', phase: 'introduction', text: "[determinedly] If Renn is doing what I think he's doing, this device will prove it. Workers across the system are getting squeezed by his 'market fluctuations.'", emotionTag: 'determinedly' },
      { id: 'energy_s1_accept', phase: 'acceptance', text: "[gratefully] Good. My grandfather believed in free markets. Said they regulate themselves. [darkly] Time to prove whether that's still true.", emotionTag: 'gratefully' },
      { id: 'energy_s1_installing', phase: 'key_moment', text: "[tensely] Installing now. Keep your head down. Renn's people are everywhere. Don't give them a reason to look closer.", emotionTag: 'tensely' },
      { id: 'energy_s1_complete_1', phase: 'completion_success', text: "[relieved] Device is active. Already picking up data. [studies readout] Holy... look at these transaction patterns.", emotionTag: 'relieved' },
      { id: 'energy_s1_complete_2', phase: 'completion_success', text: "[angrily] Renn is buying fuel at market rates, then restricting supply to jack up prices. Forty percent increase in six months. People are going under.", emotionTag: 'angrily' },
      { id: 'energy_s1_complete_3', phase: 'completion_success', text: "[determinedly] Now we have proof. Question is: what do we do with it? This could change everything... or get us both killed.", emotionTag: 'determinedly' },
    ],
  },
  
  // ============================================================================
  // ARC 4: PIRATE ACCORDS
  // ============================================================================
  {
    missionId: 'pirate_accords_stage_1',
    characterId: 'freeport-rep',
    characterName: 'Kalla Rook',
    stationId: 'freeport',
    title: 'Diplomatic Pouch',
    lines: [
      { id: 'pirate_s1_intro_1', phase: 'introduction', text: "[casually] Used to work intelligence, you know. Eight years gathering secrets for people who didn't deserve them.", emotionTag: 'casually' },
      { id: 'pirate_s1_intro_2', phase: 'introduction', text: "[darkly] Found corruption at the top. Filed a report. Got framed for the crime I exposed. Eighteen months in detention.", emotionTag: 'darkly' },
      { id: 'pirate_s1_intro_3', phase: 'introduction', text: "[lighter] Escaped during a 'transport malfunction.' [winks] Now I run Freeport. Neutral ground. Everyone's welcome if they can pay.", emotionTag: 'lighter' },
      { id: 'pirate_s1_intro_4', phase: 'introduction', text: "[seriously] Here's the thing: Sol City and Hidden Cove have been at each other's throats for years. Bad for business. Worse for people caught in the middle.", emotionTag: 'seriously' },
      { id: 'pirate_s1_intro_5', phase: 'introduction', text: "[hopefully] I've drafted a peace proposal. Vex Marrow at Hidden Cove has agreed to read it. But someone needs to deliver it.", emotionTag: 'hopefully' },
      { id: 'pirate_s1_intro_6', phase: 'introduction', text: "[warning] Thirty percent chance of pirate ambush en route. Not everyone in Vex's organization wants peace. [shrugs] Still interested?", emotionTag: 'warning' },
      { id: 'pirate_s1_accept', phase: 'acceptance', text: "[pleased] Brave pilot! Information is the real currency, and right now, this message is worth more than cargo. Fly fast.", emotionTag: 'pleased' },
      { id: 'pirate_s1_complete_1', phase: 'completion_success', text: "[excited] Vex received the proposal! [laughs] I honestly didn't think you'd make it. No offense.", emotionTag: 'excited' },
      { id: 'pirate_s1_complete_2', phase: 'completion_success', text: "[thoughtfully] Now comes the hard part. Both sides have to choose: keep fighting, or try something new.", emotionTag: 'thoughtfully' },
      { id: 'pirate_s1_complete_3', phase: 'completion_success', text: "[earnestly] Thank you for carrying hope across the void. That sounds dramatic. [chuckles] But it's true.", emotionTag: 'earnestly' },
    ],
  },
  
  {
    missionId: 'pirate_accords_stage_2_vex',
    characterId: 'hidden-cove-rep',
    characterName: 'Vex Marrow',
    stationId: 'hidden-cove',
    title: 'Choose Your Side - Vex Introduction',
    lines: [
      { id: 'vex_s2_intro_1', phase: 'introduction', text: "[playfully] Lieutenant Vincent Markov. That was my name once. Decorated three times for valor. I believed in the law.", emotionTag: 'playfully' },
      { id: 'vex_s2_intro_2', phase: 'introduction', text: "[darkening] Then I found out my commanding officer was running protection rackets with the pirates I was hunting. Classic.", emotionTag: 'darkening' },
      { id: 'vex_s2_intro_3', phase: 'introduction', text: "[bitterly] I refused to participate. Got framed. Sentenced to twenty years. [laughs] Never arrived at the prison.", emotionTag: 'bitterly' },
      { id: 'vex_s2_intro_4', phase: 'introduction', text: "[seriously] The pirates who intercepted my transport offered me a choice: die as a lawman, or live as something else.", emotionTag: 'seriously' },
      { id: 'vex_s2_intro_5', phase: 'introduction', text: "[firmly] I chose to live. Built Hidden Cove into what it is. We're not criminals—we're the honest alternative to a corrupt system.", emotionTag: 'firmly' },
      { id: 'vex_s2_intro_6', phase: 'introduction', text: "[testing] Now Kalla wants peace talks. [pauses] Question is: are you here to help us negotiate... or to help Sol City finish what they started?", emotionTag: 'testing' },
      { id: 'vex_s2_accept', phase: 'acceptance', text: "[approvingly] Interesting choice, pilot. Choose your path carefully. Not everyone survives the crossroads.", emotionTag: 'approvingly' },
      { id: 'vex_s2_complete_pirate_1', phase: 'completion_success', text: "[triumphantly] You chose freedom! Sol City's defenses are crumbling. The boot is off our neck!", emotionTag: 'triumphantly' },
      { id: 'vex_s2_complete_pirate_2', phase: 'completion_success', text: "[seriously] I still have my patrol badge, you know. Look at it sometimes. Wonder about the man I was.", emotionTag: 'seriously' },
      { id: 'vex_s2_complete_pirate_3', phase: 'completion_success', text: "[resolutely] That man believed in justice. [pauses] So do I. Just a different kind. Welcome to the family.", emotionTag: 'resolutely' },
    ],
  },
  
  // ============================================================================
  // ARC 5: UNION CRISIS
  // ============================================================================
  {
    missionId: 'union_crisis_stage_1',
    characterId: 'drydock-rep',
    characterName: 'Chief Harlan',
    stationId: 'drydock',
    title: 'Organize the Stations',
    lines: [
      { id: 'union_s1_intro_1', phase: 'introduction', text: "[heavily] I'm fifty-three years old. Half my life on this floor. Started when I was twenty, sweeping debris.", emotionTag: 'heavily' },
      { id: 'union_s1_intro_2', phase: 'introduction', text: "[pauses] After my father was killed, I could have become a firebrand. Led riots. Burned things down. Instead, I learned every job in this yard.", emotionTag: 'reflective' },
      { id: 'union_s1_intro_3', phase: 'introduction', text: "[proudly] Now I can do any job here better than anyone. That's why workers follow me. Not because of speeches. Because I'm one of them.", emotionTag: 'proudly' },
      { id: 'union_s1_intro_4', phase: 'introduction', text: "[urgently] We're organizing across stations. Biggest union push in thirty years. But we need help spreading the word.", emotionTag: 'urgently' },
      { id: 'union_s1_intro_5', phase: 'introduction', text: "[determinedly] Five stations. Fifteen minutes. Deliver these pamphlets. Rex at the Refinery is already with us. Sana at Greenfields. Now we need everyone else.", emotionTag: 'determinedly' },
      { id: 'union_s1_intro_6', phase: 'introduction', text: "[quietly] Doctor says I've got respiratory damage. Decades of shipyard particulates. [pauses] Haven't told my family yet. But I need to finish what my father started first.", emotionTag: 'quietly' },
      { id: 'union_s1_accept', phase: 'acceptance', text: "[warmly] Workers built this system. Time we got paid like we matter. Go. And thank you for standing with us.", emotionTag: 'warmly' },
      { id: 'union_s1_delivery', phase: 'key_moment', text: "[encouragingly] First station reached! Workers are reading the pamphlets. The conversation is starting. Keep moving!", emotionTag: 'encouragingly' },
      { id: 'union_s1_momentum', phase: 'key_moment', text: "[excitedly] Three stations! Rex just commed—the refinery workers are talking strike. We have momentum!", emotionTag: 'excitedly' },
      { id: 'union_s1_complete_1', phase: 'completion_success', text: "[joyfully] All stations reached! [laughs] Every station in the system is talking about workers' rights. Corporate types are nervous.", emotionTag: 'joyfully' },
      { id: 'union_s1_complete_2', phase: 'completion_success', text: "[seriously] My father would be proud. He died believing workers could stand together. [voice breaks] Took thirty years, but we're doing it.", emotionTag: 'emotionally' },
      { id: 'union_s1_complete_3', phase: 'completion_success', text: "[determinedly] Next step: the strike. Or breaking it. Dr. Kade is already offering bounties for strikebreakers. Time to choose your side.", emotionTag: 'determinedly' },
    ],
  },
];

/**
 * Build export structure
 */
function buildExport() {
  const exportData = {
    generatedAt: new Date().toISOString(),
    description: 'Mission dialogue export for ElevenLabs voice generation',
    totalLines: 0,
    emotionTagsUsed: new Set(),
    missions: [],
  };
  
  for (const mission of missionDialogues) {
    const config = voiceConfig[mission.stationId];
    if (!config) {
      console.warn(`⚠️  No voice config for station: ${mission.stationId}`);
      continue;
    }
    
    const missionExport = {
      missionId: mission.missionId,
      title: mission.title,
      characterName: mission.characterName,
      stationId: mission.stationId,
      voiceDirection: config.description,
      gender: config.gender,
      ageRange: config.ageRange,
      lineCount: mission.lines.length,
      lines: [],
    };
    
    for (const line of mission.lines) {
      // Extract emotion tags from text
      const emotionTags = [];
      const tagMatches = line.text.match(/\[([^\]]+)\]/g);
      if (tagMatches) {
        tagMatches.forEach(tag => {
          const tagContent = tag.slice(1, -1);
          emotionTags.push(tagContent);
          exportData.emotionTagsUsed.add(tagContent);
        });
      }
      
      missionExport.lines.push({
        id: line.id,
        text: line.text,
        phase: line.phase,
        voiceTone: line.emotionTag || 'neutral',
        emotionTags: emotionTags.length > 0 ? emotionTags : undefined,
        suggestedFilename: `missions/${mission.stationId}/${mission.missionId}/${line.id}.mp3`,
      });
      
      exportData.totalLines++;
    }
    
    missionExport.linesWithEmotionTags = missionExport.lines.filter(l => l.emotionTags).length;
    exportData.missions.push(missionExport);
  }
  
  // Convert Set to sorted array
  exportData.emotionTagsUsed = Array.from(exportData.emotionTagsUsed).sort();
  
  return exportData;
}

/**
 * Main
 */
function main() {
  console.log('📋 Exporting mission dialogue for voice generation...\n');
  
  const exportData = buildExport();
  
  // Write to docs folder
  const outputPath = path.join(__dirname, '..', 'docs', 'mission_dialogue_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  
  console.log('═'.repeat(60));
  console.log('📊 EXPORT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Total missions: ${exportData.missions.length}`);
  console.log(`   Total lines: ${exportData.totalLines}`);
  console.log(`   Emotion tags used: ${exportData.emotionTagsUsed.length}`);
  console.log('═'.repeat(60));
  
  console.log('\n📁 Missions by character:\n');
  
  const byCharacter = {};
  for (const mission of exportData.missions) {
    const key = `${mission.characterName} (${mission.stationId})`;
    if (!byCharacter[key]) {
      byCharacter[key] = { count: 0, lines: 0 };
    }
    byCharacter[key].count++;
    byCharacter[key].lines += mission.lineCount;
  }
  
  for (const [char, stats] of Object.entries(byCharacter)) {
    console.log(`   ${char}: ${stats.count} mission(s), ${stats.lines} lines`);
  }
  
  console.log(`\n✅ Exported to: ${outputPath}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Run: node scripts/generate_mission_voices.mjs --preview');
  console.log('   2. Run: node scripts/generate_mission_voices.mjs');
}

main();

