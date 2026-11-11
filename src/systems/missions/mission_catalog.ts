import type { MissionTemplate, MissionObjective } from '../../domain/types/mission_types';
import { generateCommodities } from '../economy/commodities';
const commodities = new Set(generateCommodities().map(c => c.id));
const fabricated = ['steel', 'alloys', 'machinery', 'electronics', 'microchips', 'batteries', 'textiles'];

/** Migrate the original narrative templates to explicit, executable contracts. */
export function buildMissionCatalog(legacy: Record<string, MissionTemplate>): Record<string, MissionTemplate> {
  const catalog = structuredClone(legacy);
  const branch: Record<string, string> = {
    greenfields_stage_3: 'side_greenfields', greenfields_stage_4: 'side_greenfields',
    sol_city_stage_3: 'side_sol_city', sol_city_stage_4: 'side_sol_city',
    energy_monopoly_stage_3_refinery: 'expose_ceres', energy_monopoly_stage_4_refinery: 'expose_ceres',
    energy_monopoly_stage_3_ceres: 'protect_ceres', energy_monopoly_stage_4_ceres: 'protect_ceres',
    pirate_accords_stage_3_pirate: 'join_pirates', pirate_accords_stage_3_law: 'enforce_law', pirate_accords_stage_3_peace: 'broker_peace',
    union_crisis_stage_3_union: 'support_strike', union_crisis_stage_3_corporate: 'break_strike',
  };
  for (const t of Object.values(catalog)) {
    t.branch = branch[t.id];
    if (t.type === 'choice') {
      t.description = `Choose the political direction of ${t.title}. This is a commitment, not a cargo or combat assignment. Review the consequences before confirming; the following mission carries out your chosen policy.`;
      for (const c of t.choiceOptions ?? []) {
        c.description = `Commit to ${c.label}. Apply the listed political consequences and unlock this route. No unlisted delivery, raid, or timed boycott is required.`;
        c.nextMissionId ??= c.rewards.unlocks?.find(id => catalog[id]?.arcId === t.arcId && catalog[id].stage === t.stage + 1);
      }
    }
    for (const o of t.objectiveTemplates) {
      if (o.type === 'deliver' && o.target && !commodities.has(o.target)) {
        if (o.target === 'fabricated_goods_mixed') o.basket = fabricated;
        else o.missionItem = true;
      }
    }
    const visits = t.objectiveTemplates.filter(o => o.type === 'visit');
    for (const o of t.objectiveTemplates.filter(o => o.type === 'deliver' && o.missionItem)) {
      o.prerequisites = visits.map(v => v.id);
    }
  }
  catalog.fabrication_wars_stage_3.deprecated = true;
  catalog.greenfields_stage_1.advance = 7000;
  catalog.greenfields_stage_1.description += ' A one-time 7,000 credit procurement grant covers the luxury cargo; the completion reward is separate.';
  for (const side of ['aurum', 'drydock']) {
    const t = catalog[`fabrication_wars_stage_2_${side}`];
    t.branch = side; t.advance = 4000;
    t.description = `Purchase 20 copper ore and 20 silicon, then deliver both cargo lots to ${side === 'aurum' ? 'Aurum Fab' : 'Drydock'} within eight minutes. A one-time 4,000 credit procurement grant is provided. Partial deliveries are accepted.`;
    t.objectiveTemplates = [
      { id: 'collect_copper', type: 'collect', description: 'Purchase 20 copper ore', target: 'copper_ore', quantity: 20 },
      { id: 'collect_silicon', type: 'collect', description: 'Purchase 20 silicon', target: 'silicon', quantity: 20 },
      ...['copper_ore', 'silicon'].map((target): Omit<MissionObjective, 'current' | 'completed'> => ({
        id: `deliver_${target}`, type: 'deliver', target, targetStation: side === 'aurum' ? 'aurum-fab' : 'drydock', quantity: 20,
        description: `Hand over 20 ${target.replace('_', ' ')}`, prerequisites: ['collect_copper', 'collect_silicon'],
      })),
    ];
    catalog[`fabrication_wars_stage_3_${side}`].branch = side;
    catalog[`fabrication_wars_stage_4_${side}`].branch = side;
    catalog[`fabrication_wars_stage_4_${side}`].description = 'Procure and deliver 50 fabricated units to Ceres Power Plant. Eligible cargo: steel, alloys, machinery, electronics, microchips, batteries, textiles. Partial deliveries count. This is a supply contract, not a race against an invisible rival.';
  }
  const fuel = catalog.energy_monopoly_stage_4_ceres;
  fuel.advance = 5000;
  fuel.description = 'Purchase 50 refined fuel and hand it over to Ceres within twelve minutes. A one-time 5,000 credit procurement grant is supplied. Any legal supplier is acceptable; partial deliveries count.';
  fuel.objectiveTemplates[0].description = 'Purchase 50 refined fuel';
  Object.assign(fuel.objectiveTemplates[1], { target: 'refined_fuel', quantity: 50, prerequisites: ['buy_fuel_all'], description: 'Hand over 50 refined fuel at Ceres' });
  catalog.energy_monopoly_stage_3_ceres.timeLimit = 600;
  catalog.greenfields_stage_4.requiredUpgrades = ['tempcargo'];
  for (const id of ['fabrication_wars_aurum_stage_1', 'energy_monopoly_stage_1']) {
    const t = catalog[id];
    const wait = t.objectiveTemplates.find(o => o.type === 'wait')!;
    const first = t.objectiveTemplates[0];
    wait.targetStation = first.target;
    wait.prerequisites = [first.id];
    wait.description = 'Complete the covert operation (30 seconds docked, or in silent running within 100m; interruptions pause progress)';
    for (const o of t.objectiveTemplates.slice(2)) o.prerequisites = [wait.id];
    t.objectiveTemplates.push({ id: 'remain_covert', type: 'avoid_detection', target: first.target, description: 'Avoid confirmed security detection during approach' });
  }
  catalog.sol_city_stage_3.waves = 3;
  catalog.sol_city_stage_3.survivorsRequired = 1;
  catalog.energy_monopoly_stage_3_refinery.waves = 4;
  catalog.energy_monopoly_stage_3_refinery.survivorsRequired = 2;
  catalog.energy_monopoly_stage_3_refinery.description = 'Launch a three-ship fuel convoy together to Freeport. Protect at least two ships through four bounded ambush waves. Stay near the convoy; launch only when ready.';
  for (const o of catalog.energy_monopoly_stage_3_refinery.objectiveTemplates.filter(o => o.type === 'escort')) o.targetStation = 'freeport';
  const peace = catalog.pirate_accords_stage_3_peace;
  peace.waves = 2; peace.survivorsRequired = 1;
  peace.objectiveTemplates = [
    { id: 'survive_attacks', type: 'defend', description: 'Repel both extremist attacks', quantity: 2 },
    { id: 'protect_conference', type: 'escort', description: 'Keep the conference security vessel alive', target: 'conference_security', targetStation: 'freeport', quantity: 1 },
  ];
  catalog.pirate_accords_stage_1.description = 'Collect the diplomatic pouch from Freeport and deliver it to Hidden Cove. This diplomatic courier assignment guarantees safe custody of the sealed document; no random ambush is required.';
  return catalog;
}
