import { useState } from 'react';
import type { Contract, NpcTrader, Ship, Station } from '../../../domain/types/world_types';
import type { Mission } from '../../../domain/types/mission_types';
import { contractUnitPayout } from '../../../state/modules/missions';
import { formatNumber } from '../../utils/number_format';

interface ObjectiveHUDProps {
  missions: Mission[];
  contracts: Contract[];
  activeEscorts: NpcTrader[];
  trackedStationId?: string;
  stations: Station[];
  ship: Ship;
  onSetTrackedStation: (id?: string) => void;
}

/** All live assignments share a compact, selectable tracker. Finished jobs never linger. */
export function ObjectiveHUD({ missions, contracts, activeEscorts, trackedStationId, stations, ship, onSetTrackedStation }: ObjectiveHUDProps) {
  const [selected, setSelected] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [overview, setOverview] = useState(false);
  const stories = missions.filter(m => m.status === 'active');
  const deliveries = contracts.filter(c => c.status === 'accepted');
  const assignments = [
    ...stories.map(m => ({ id: m.id, title: m.title, target: m.objectives.find(o => !o.completed && !o.failed && o.type !== 'avoid_detection')?.targetStation ?? m.objectives.find(o => !o.completed && o.type === 'visit')?.target })),
    ...deliveries.map(c => ({ id: c.id, title: `Deliver ${c.units} ${c.commodityId.replace(/_/g, ' ')} → ${stations.find(st => st.id === c.toId)?.name ?? c.toId}`, target: c.toId })),
  ];
  const current = assignments.find(a => a.id === selected) ?? assignments[0];
  const mission = stories.find(m => m.id === current?.id);
  const contract = deliveries.find(c => c.id === current?.id);
  const waypoint = stations.find(st => st.id === trackedStationId);
  const distance = waypoint ? Math.hypot(...waypoint.position.map((v, i) => v - ship.position[i])) : undefined;
  if (!assignments.length && !waypoint) return null;
  const select = (id: string) => {
    setSelected(id); setOverview(false);
    const target = assignments.find(a => a.id === id)?.target;
    if (target) onSetTrackedStation(target);
  };
  return <section aria-label="Active assignments" style={{ position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 25, width: 'min(460px, calc(100vw - 32px))', color: '#e5e7eb' }}>
    {minimized ? <button onClick={() => setMinimized(false)}>Show assignments ({assignments.length})</button> : <div style={{ background: '#0b1220ef', border: '1px solid #52647d', borderRadius: 10, padding: 12, maxHeight: '38vh', overflowY: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <strong>{assignments.length ? `Active assignments (${assignments.length})` : 'Navigation'}</strong>
        <button onClick={() => setMinimized(true)}>Hide objectives</button>
      </header>
      {assignments.length > 1 && <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select aria-label="Tracked assignment" value={current.id} onChange={e => select(e.target.value)} style={{ minWidth: 0, flex: 1 }}>
          {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <button onClick={() => setOverview(!overview)}>{overview ? 'Details' : 'All assignments'}</button>
      </div>}
      {overview ? <ul>{assignments.map(a => <li key={a.id}><button onClick={() => select(a.id)}>{a.title}</button></li>)}</ul> : <>
        {mission && <div>
          <strong style={{ color: '#b9a4ff' }}>{mission.title}</strong>
          <ul style={{ paddingLeft: 18, margin: '8px 0', fontSize: 12 }}>{mission.objectives.filter(o => !o.optional).map(o => <li key={o.id} style={{ opacity: o.completed ? 0.6 : 1 }}>
            {o.failed ? '✗' : o.completed ? '✓' : '○'} {o.description} {o.quantity && o.quantity > 1 ? `(${Math.floor(o.current)}/${o.quantity})` : ''}
          </li>)}</ul>
        </div>}
        {contract && <div>
          <strong>Deliver {contract.units} {contract.commodityId.replace(/_/g, ' ')} to {stations.find(st => st.id === contract.toId)?.name ?? contract.toId}</strong>
          <div style={{ margin: '8px 0', fontSize: 12 }}>Progress: {contract.deliveredUnits ?? 0} / {contract.units} delivered · Held: {(ship.cargo[contract.commodityId] ?? 0) + activeEscorts.filter(n => n.commodityId === contract.commodityId).reduce((q, n) => q + (n.escortCargoUsed ?? 0), 0)}</div>
          <progress aria-label="Delivery progress" max={contract.units} value={contract.deliveredUnits ?? 0} style={{ width: '100%' }} />
          <div style={{ fontSize: 11, opacity: 0.8 }}>Any legal supplier. Sell at the destination to fulfill this order.</div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#8dd6ff' }}>Fresh-cargo floor: {contractUnitPayout(contract).toLocaleString()} cr / unit · Completion bonus: {(contract.rewardBonus ?? 0).toLocaleString()} cr</div>
        </div>}
        {current?.target && <button style={{ marginTop: 8 }} onClick={() => onSetTrackedStation(current.target)}>Set waypoint</button>}
      </>}
      {waypoint && <div style={{ marginTop: 8, fontSize: 12 }}>Navigation waypoint: {waypoint.name} — {formatNumber(distance!)}m <button onClick={() => onSetTrackedStation(undefined)}>Clear waypoint</button></div>}
    </div>}
  </section>;
}
