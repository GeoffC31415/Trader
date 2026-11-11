import type { Station } from '../../../domain/types/world_types';
import type { Mission, MissionArc } from '../../../domain/types/mission_types';
import { useGameStore } from '../../../state';
import { objectiveReady } from '../../../systems/missions/mission_validator';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { missionBlocker } from '../../../state/modules/mission_runtime';
import { distance } from '../../../shared/math/vec3';

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
const panel = { border: '1px solid #52647d', borderRadius: 8, padding: 14, marginBottom: 12, background: '#101d30' };
export function MissionsSection(props: MissionsSectionProps) {
  const state = useGameStore();
  return <div className="scrollable-content">
    <h3>Story contracts</h3>
    {props.stationMissions.map(m => {
      const blocker = missionBlocker(state, m.id);
      return <section key={m.id} style={panel}>
        <h4>{m.title}</h4><p>{m.description}</p>
        <ul>{m.objectives.map(o => <li key={o.id}>{o.description}</li>)}</ul>
        {m.timeLimit && <p>Time limit: {Math.ceil(m.timeLimit / 60)} simulation minutes (paused when game is paused).</p>}
        {MISSION_TEMPLATES[m.id].advance && <p>One-time procurement grant: {MISSION_TEMPLATES[m.id].advance!.toLocaleString()} credits.</p>}
        <p>Reward: {m.rewards.credits.toLocaleString()} credits</p>
        <button disabled={!!blocker} title={blocker} onClick={() => m.type === 'choice' ? props.onSetChoiceDialog(m) : props.onAcceptMission(m.id)}>{m.type === 'choice' ? 'Choose path' : 'Accept mission'}</button>
        {blocker && <p role="status">{blocker}</p>}
      </section>;
    })}
    {props.repLockedNextMissions.map(m => <section key={m.missionId} style={panel}><h4>{m.title} (locked)</h4>{m.deficits.map(d => <p key={d.stationId}>{d.stationId}: {d.current}/{d.required} reputation</p>)}</section>)}
    <h3>Active missions</h3>
    {props.activeMissions.map(m => <section key={m.id} style={panel}>
      <h4>{m.title}</h4>
      {m.timeLimit !== undefined && <p role="timer">Remaining: {Math.max(0, Math.ceil(m.timeLimit - (state.gameTime - (m.acceptedAt ?? state.gameTime))))} seconds</p>}
      {m.type === 'escort' && !m.launched && <p><button onClick={() => state.launchMission(m.id)}>Launch convoy / begin defense</button> Prepare weapons and undock before launching.</p>}
      {m.objectives.map(o => {
        const ready = objectiveReady(m, o);
        const station = props.stations.find(st => st.id === (o.targetStation ?? (o.type === 'visit' ? o.target : undefined)));
        const contact = !!station && distance(state.ship.position, station.position) <= 100 && (o.missionItem || o.type === 'visit');
        const local = !!station && (state.ship.dockedStationId === station.id || contact);
        const canInteract = local && ready && !o.completed && !o.failed && ['deliver', 'visit', 'wait'].includes(o.type);
        return <div key={o.id} style={{ padding: '6px 0', opacity: o.completed ? 0.6 : 1 }}>
          {o.failed ? '✗' : o.completed ? '✓' : '○'} {o.description} {o.quantity && o.quantity > 1 ? `(${Math.floor(o.current)}/${o.quantity})` : ''}
          {!ready && !o.completed && <small> — Complete the preceding objective first</small>}
          {station && !o.completed && <button onClick={() => state.setTrackedStation(station.id)}>Track {station.name}</button>}
          {canInteract && (o.type === 'wait' ? <>
            <button onClick={() => m.interaction ? state.stopInstallDevice() : state.startInstallDevice(m.id, o.id)}>{m.interaction ? 'Pause operation' : 'Begin / resume operation'}</button>
            <small> Automatically completes; leaving pauses progress. No precision hold required.</small>
          </> : <button onClick={() => state.completeMissionObjective(m.id, o.id)}>{o.type === 'visit' ? 'Contact / acknowledge' : 'Hand over cargo / document'}</button>)}
        </div>;
      })}
      <button onClick={() => props.onAbandonMission(m.id)}>Abandon (retry available)</button>
    </section>)}
    {props.failedMissions.map(m => <section key={m.id} style={panel}>
      <h4>{m.title} — {m.status}</h4><p>{m.failureReason ?? 'Mission ended'}</p>
      <button onClick={() => state.retryMission(m.id)}>Reset attempt</button><small> Then accept again at the issuer. Procurement grants are not repeated.</small>
    </section>)}
  </div>;
}
