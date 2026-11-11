import type { Station } from '../../../domain/types/world_types';
import type { Mission, MissionArc } from '../../../domain/types/mission_types';
import { useGameStore } from '../../../state';
import { objectiveReady } from '../../../systems/missions/mission_validator';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { missionBlocker } from '../../../state/modules/mission_runtime';
import { procurementBudget } from '../../../state/helpers/procurement_budget';
import { distance } from '../../../shared/math/vec3';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SciFiButton } from '../shared/SciFiButton';
import { SectionHeader } from '../shared/SectionHeader';
import { stationTypeColors } from '../../utils/station_theme';

interface MissionsSectionProps {
  station: Station; stations: Station[]; stationMissions: Mission[]; activeMissions: Mission[]; failedMissions: Mission[];
  repLockedNextMissions: { arcId: string; arcName: string; stage: number; missionId: string; title: string; description: string; deficits: { stationId: string; required: number; current: number; missing: number }[] }[];
  missionArcs: MissionArc[];
  onAcceptMission: (id: string) => void; onAbandonMission: (id: string) => void;
  onSetChoiceDialog: (mission: Mission) => void; dockedStationId?: string;
  onCompleteObjective?: (missionId: string, objectiveId: string) => void;
  onStartInstallDevice?: (missionId: string, objectiveId: string) => void;
  onStopInstallDevice?: () => void;
}
export function MissionsSection(props: MissionsSectionProps) {
  const state = useGameStore();
  const type = props.station.type;
  const colors = stationTypeColors[type];
  const card = { border: `1px solid ${colors.primary}60`, borderLeft: `4px solid ${colors.primary}`, borderRadius: 8, padding: 16, marginBottom: 12, background: `${colors.primary}10` };
  const stationName = (id: string) => props.stations.find(st => st.id === id)?.name ?? id.replace(/[-_]/g, ' ');
  return <div className="scrollable-content">
    <SciFiPanel stationType={type}>
      <SectionHeader stationType={type}>Story contracts</SectionHeader>
      {!props.stationMissions.length && !props.repLockedNextMissions.length && <p style={{ opacity: 0.7 }}>No new story contracts here. Check your active assignments or visit another station.</p>}
      {props.stationMissions.map(m => {
        const blocker = missionBlocker(state, m.id);
        const budget = m.procurementBudget ?? procurementBudget(state, m);
        return <article key={m.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <h4 style={{ margin: '0 0 8px', color: colors.secondary, fontSize: 17 }}>{m.title}</h4>
              <p style={{ margin: '0 0 12px', whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: 13 }}>{m.description}</p>
              <ul style={{ paddingLeft: 20, fontSize: 12 }}>{m.objectives.map(o => <li key={o.id}>{o.description}</li>)}</ul>
              {m.timeLimit && <p>Time limit: {Math.ceil(m.timeLimit / 60)} simulation minutes.</p>}
              {budget > 0 && <p style={{ color: '#8dd6ff', fontSize: 12 }}>{m.fundingGranted ? 'Procurement budget already paid; retries do not pay it again.' : `One-time procurement budget on acceptance: ${budget.toLocaleString()} credits.`} Recorded cargo cost above that budget is reimbursed at handover.</p>}
              {m.objectives.some(o => o.type === 'deliver' && !o.missionItem) && <p style={{ fontSize: 12, opacity: 0.8 }}>Story cargo is handed over, not sold at the market. {budget > 0 ? 'The completion fee is separate from procurement funding.' : 'Procurement costs come out of the listed reward.'}</p>}
              {blocker && <p role="status" style={{ color: '#ffc864' }}>{blocker}</p>}
            </div>
            <aside style={{ textAlign: 'right', marginLeft: 'auto', flex: '0 0 160px' }}>
              <div style={{ fontSize: 11, color: colors.secondary, letterSpacing: 1 }}>COMPLETION FEE</div>
              <div style={{ fontSize: 24, color: '#4ade80', fontFamily: 'monospace', margin: '6px 0 12px' }}>{m.rewards.credits.toLocaleString()} cr</div>
              <SciFiButton stationType={type} disabled={!!blocker} title={blocker} style={{ width: '100%' }} onClick={() => m.type === 'choice' ? props.onSetChoiceDialog(m) : props.onAcceptMission(m.id)}>{m.type === 'choice' ? 'Choose path' : 'Accept mission'}</SciFiButton>
            </aside>
          </div>
        </article>;
      })}
      {props.repLockedNextMissions.map(m => <article key={m.missionId} style={card}>
        <h4 style={{ color: colors.secondary, marginTop: 0 }}>{m.title} — Reputation locked</h4>
        {m.deficits.filter(d => d.missing > 0).map(d => <p key={d.stationId}>{stationName(d.stationId)}: {d.current} / {d.required} reputation · {d.missing} more required</p>)}
      </article>)}
    </SciFiPanel>
    <SciFiPanel stationType={type}>
      <SectionHeader stationType={type}>Active missions</SectionHeader>
      {!props.activeMissions.length && <p style={{ opacity: 0.7 }}>No active story missions.</p>}
      {props.activeMissions.map(m => <article key={m.id} style={card}>
        <h4 style={{ color: colors.secondary, marginTop: 0 }}>{m.title}</h4>
        {m.timeLimit !== undefined && <p role="timer">Remaining: {Math.max(0, Math.ceil(m.timeLimit - (state.gameTime - (m.acceptedAt ?? state.gameTime))))} seconds</p>}
        {m.type === 'escort' && !m.launched && <p><SciFiButton stationType={type} onClick={() => state.launchMission(m.id)}>Launch convoy / begin defense</SciFiButton> Prepare weapons and undock before launching.</p>}
        {(m.procurementBudget ?? MISSION_TEMPLATES[m.id].advance ?? 0) > 0 && <p style={{ fontSize: 12 }}>Procurement budget: {(m.procurementBudget ?? MISSION_TEMPLATES[m.id].advance ?? 0).toLocaleString()} cr · Excess cost reimbursed: {Math.round(m.procurementReimbursed ?? 0).toLocaleString()} cr · Completion fee: {m.rewards.credits.toLocaleString()} cr</p>}
        {m.objectives.map(o => {
          const ready = objectiveReady(m, o);
          const station = props.stations.find(st => st.id === (o.targetStation ?? (o.type === 'visit' ? o.target : undefined)));
          const contact = !!station && distance(state.ship.position, station.position) <= 100 && (o.missionItem || o.type === 'visit' || (o.type === 'wait' && state.ship.silentRunning));
          const local = !!station && (state.ship.dockedStationId === station.id || contact);
          const held = o.missionItem ? m.items?.[o.target ?? ''] ?? 0 : (o.basket ?? (o.target ? [o.target] : [])).reduce((n, id) => n + (state.ship.cargo[id] ?? 0) + state.npcTraders.filter(npc => npc.isEscort && npc.commodityId === id).reduce((q, npc) => q + (npc.escortCargoUsed ?? 0), 0), 0);
          const canInteract = local && ready && !o.completed && !o.failed && ['deliver', 'visit', 'wait'].includes(o.type);
          return <div key={o.id} style={{ padding: '8px 0', borderTop: `1px solid ${colors.primary}30`, opacity: o.completed ? 0.6 : 1, fontSize: 12 }}>
            <div>{o.failed ? '✗' : o.completed ? '✓' : '○'} {o.description} {o.quantity && o.quantity > 1 ? `(${Math.floor(o.current)}/${o.quantity})` : ''}</div>
            {!ready && !o.completed && <small>Complete the preceding objective first.</small>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {station && !o.completed && <SciFiButton stationType={type} onClick={() => state.setTrackedStation(station.id)}>Track {station.name}</SciFiButton>}
              {canInteract && (o.type === 'wait' ? <>
                <SciFiButton stationType={type} onClick={() => m.interaction ? state.stopInstallDevice() : state.startInstallDevice(m.id, o.id)}>{m.interaction ? 'Pause operation' : 'Begin / resume operation'}</SciFiButton>
                <small>Leaving pauses progress. No precision hold required.</small>
              </> : <SciFiButton stationType={type} disabled={o.type === 'deliver' && held <= 0} title={o.type === 'deliver' && held <= 0 ? 'Acquire the required cargo or document first' : undefined} onClick={() => state.completeMissionObjective(m.id, o.id)}>{o.type === 'visit' ? 'Contact / acknowledge' : 'Hand over cargo / document'}</SciFiButton>)}
            </div>
          </div>;
        })}
        <SciFiButton stationType={type} variant="danger" style={{ marginTop: 12 }} onClick={() => props.onAbandonMission(m.id)}>Abandon (retry available)</SciFiButton>
      </article>)}
    </SciFiPanel>
    {props.failedMissions.length > 0 && <SciFiPanel stationType={type}>
      <SectionHeader stationType={type}>Ended attempts</SectionHeader>
      {props.failedMissions.map(m => <article key={m.id} style={card}>
        <h4>{m.title} — {m.status}</h4><p>{m.failureReason ?? 'Mission ended'}</p>
        <SciFiButton stationType={type} onClick={() => state.retryMission(m.id)}>Reset attempt</SciFiButton><p style={{ fontSize: 12 }}>Then accept again at the issuer. Procurement grants are not repeated.</p>
      </article>)}
    </SciFiPanel>}
  </div>;
}
