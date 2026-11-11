import { useEffect, useState } from 'react';
import { useGameStore } from '../../../state';
import { ContractsSection } from '../market/ContractsSection';
import { MissionsSection } from '../market/MissionsSection';
import { MissionChoiceDialog } from '../mission_choice_dialog';
import { GraphicsQualityControl } from './GraphicsQualityControl';
import type { Mission } from '../../../domain/types/mission_types';

export function MissionLog() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Mission | null>(null);
  const s = useGameStore();
  useEffect(() => {
    const interval = window.setInterval(() => { const state = useGameStore.getState(); if (state.hasChosenStarter && !state.paused) state.saveGame(); }, 30000);
    return () => window.clearInterval(interval);
  }, []);
  const station = s.stations.find(st => st.id === s.ship.dockedStationId) ?? s.stations[0];
  return <>
    <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 50, display: 'flex', gap: 6 }}>
      <GraphicsQualityControl />
      <button onClick={() => setOpen(!open)}>Mission log</button>
      <button onClick={s.saveGame} disabled={!s.hasChosenStarter}>Save</button>
      <button onClick={() => { if (!s.hasChosenStarter || window.confirm('Replace current progress with the saved campaign?')) s.loadGame(); }}>Load</button>
      <button onClick={s.togglePause}>{s.paused ? 'Resume' : 'Pause (P)'}</button>
    </div>
    {s.opportunity && <aside aria-label="Optional travel opportunity" style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', width: 320, padding: 12, background: '#102333ee', color: 'white', border: '1px solid #709da9', zIndex: 40 }}>
      <strong>Optional: {s.opportunity.kind}</strong> • {Math.ceil(s.opportunity.expiresAt - s.gameTime)}s left
      <p>{s.opportunity.kind === 'bounty' ? `Destroy the marked raider for ${s.opportunity.reward} credits. The reward requires an actual confirmed kill.` : s.opportunity.kind === 'salvage' ? `Recover ${s.opportunity.quantity} alloys. ${s.opportunity.risky ? 'WARNING: a raider is monitoring this cache.' : 'No hostile activity detected.'}` : `Supply ${s.opportunity.quantity} ${s.opportunity.commodityId.replace(/_/g, ' ')} for ${s.opportunity.reward} credits and local reputation.`}</p>
      <p>{Math.ceil(Math.hypot(...s.opportunity.position.map((v, i) => v - s.ship.position[i])))}m • {s.opportunity.kind === 'procurement' ? 'Dock at requesting station' : 'Approach within 100m'}</p>
      <button onClick={() => s.setTrackedStation(s.opportunity!.id)}>Set waypoint (T to pilot)</button>
      <button onClick={() => s.resolveOpportunity('complete')}>Complete</button>
      <button onClick={() => s.resolveOpportunity('relay')}>Relay coordinates</button>
      <button onClick={() => s.resolveOpportunity('decline')}>Ignore</button>
    </aside>}
    {s.paused && <div style={{ position: 'absolute', top: '45%', left: '45%', zIndex: 45, background: '#07111eee', padding: 20 }}>Paused — deadlines and simulation frozen. <button onClick={s.togglePause}>Resume</button></div>}
    {open && <div role="dialog" aria-label="Mission log" style={{ position: 'absolute', top: 70, left: 12, bottom: 65, width: 'min(560px, 92vw)', overflowY: 'auto', padding: 16, background: '#091422fa', border: '1px solid #738bad', zIndex: 60, color: 'white' }}>
      <button onClick={() => setOpen(false)}>Close log</button>
      {s.unlockedFeatures?.includes('bounty_hunting') && <button onClick={s.requestBounty}>Request Sol City bounty (180s cooldown)</button>}
      <p>Flight: WASD / R F • E dock • Q undock • Space fire • Tab target • C cruise • H silent running • T waypoint pilot • P pause. Planning in flight does not pause unless you choose Pause.</p>
      <MissionsSection station={station} stations={s.stations} missionArcs={s.missionArcs}
        stationMissions={s.missions.filter(m => m.status === 'offered' && m.availableAt.includes(s.ship.dockedStationId ?? ''))}
        activeMissions={s.missions.filter(m => m.status === 'active')}
        failedMissions={s.missions.filter(m => m.status === 'failed' || m.status === 'cancelled')}
        repLockedNextMissions={[]} dockedStationId={s.ship.dockedStationId}
        onAcceptMission={s.acceptMission} onAbandonMission={s.abandonMission} onSetChoiceDialog={setChoice} />
      {(s.contracts?.some(c => c.status === 'accepted')) && <ContractsSection station={station} stations={s.stations} stationContracts={[]} activeContracts={s.contracts.filter(c => c.status === 'accepted')} onAcceptContract={s.acceptContract} onAbandonContract={s.abandonContract} onSetTrackedStation={s.setTrackedStation} />}
      {(s.appliedEffects?.length ?? 0) > 0 && <section><h3>World consequences</h3><ul>{s.appliedEffects!.map(e => <li key={e.id}>{e.id.replace(/_/g, ' ')}</li>)}</ul></section>}
    </div>}
    {choice && <MissionChoiceDialog mission={choice} onCancel={() => setChoice(null)} onChoose={(choiceId) => { s.makeMissionChoice(choice.id, choiceId); setChoice(null); }} />}
  </>;
}
