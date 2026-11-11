import type { Ship } from '../../../domain/types/world_types';
import type { Station } from '../../../domain/types/world_types';
import type { Contract } from '../../../domain/types/world_types';
import { UIIcon } from '../ui_icon';
import { SHIP_STATUS_PANEL_TOP_WITH_NAV, SHIP_STATUS_PANEL_TOP_WITHOUT_NAV, SHIP_STATUS_PANEL_RIGHT, SHIP_STATUS_PANEL_MIN_WIDTH } from '../../constants/layout_constants';
import { formatNumber } from '../../utils/number_format';
import { useGameStore } from '../../../state';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { repairCost, FIRE_DAMAGE_PER_SECOND, FIRE_SUPPRESSION_SECONDS } from '../../../systems/combat/ship_fire';
import { StealthIndicator } from './StealthIndicator';

interface ShipStatusPanelProps {
  ship: Ship;
  stations: Station[];
  contracts: Contract[];
  hasNav: boolean;
}

export function ShipStatusPanel({ ship, stations, contracts, hasNav }: ShipStatusPanelProps) {
  const state = useGameStore();
  const speed = Math.hypot(...ship.velocity);
  const target = state.npcTraders.find(n => n.id === state.selectedTargetId);
  const waypoint = stations.find(st => st.id === state.trackedStationId);
  const distance = waypoint ? Math.hypot(...waypoint.position.map((v, i) => v - ship.position[i])) : undefined;
  const activeContractsCount = contracts.filter(c => c.status === 'accepted').length;
  const dockedStation = ship.dockedStationId ? stations.find(s => s.id === ship.dockedStationId) : null;
  const cargoUsed = Object.values(ship.cargo).reduce((a, b) => a + b, 0);
  
  return (
    <div onPointerUp={e => { (e.target as HTMLElement).closest('button')?.blur(); }} style={{
      position: 'absolute',
      top: hasNav ? SHIP_STATUS_PANEL_TOP_WITH_NAV : SHIP_STATUS_PANEL_TOP_WITHOUT_NAV,
      right: SHIP_STATUS_PANEL_RIGHT,
      background: 'linear-gradient(135deg, rgba(11,18,32,0.95), rgba(15,23,42,0.95))',
      color: '#e5e7eb',
      padding: '14px 18px',
      borderRadius: 10,
      border: '2px solid rgba(59,130,246,0.3)',
      minWidth: SHIP_STATUS_PANEL_MIN_WIDTH,
      maxHeight: 'calc(100vh - 400px)',
      overflowY: 'auto',
      fontSize: 13,
      fontFamily: 'monospace',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      zIndex: 20,
    }}>
      {/* Status Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(59,130,246,0.2)',
      }}>
        <UIIcon 
          name={ship.dockedStationId ? 'status_docked' : 'status_traveling'} 
          size={24} 
          style={{ 
            filter: ship.dockedStationId 
              ? 'drop-shadow(0 0 8px #10b981)' 
              : 'drop-shadow(0 0 8px #60a5fa)' 
          }} 
        />
        <div>
          <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2, letterSpacing: '0.5px' }}>
            SHIP STATUS
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 15,
            color: ship.dockedStationId ? '#10b981' : '#60a5fa',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {ship.dockedStationId ? 'DOCKED' : 'IN FLIGHT'}
          </div>
        </div>
      </div>
      
      {/* Location Info */}
      {dockedStation && (
        <div style={{ 
          fontSize: 12, 
          opacity: 0.9,
          marginBottom: 10,
          padding: '6px 8px',
          background: 'rgba(16,185,129,0.1)',
          borderRadius: 6,
          borderLeft: '3px solid #10b981',
        }}>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 2 }}>LOCATION</div>
          <div style={{ fontWeight: 600, color: '#10b981' }}>{dockedStation.name}</div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="icon_credits" size={16} />
            <span style={{ fontSize: 11 }}>Credits</span>
          </div>
          <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>
            ${ship.credits.toLocaleString()}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_cargo" size={16} />
            <span style={{ fontSize: 11 }}>Cargo</span>
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14,
            color: cargoUsed >= ship.maxCargo ? '#ef4444' : '#60a5fa',
          }}>
            {cargoUsed} / {ship.maxCargo}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_engine" size={16} />
            <span style={{ fontSize: 11 }}>Engine</span>
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14,
            color: ship.enginePower > 0 ? '#22c55e' : '#6b7280',
          }}>
            {formatNumber(ship.enginePower * 100)}%
          </div>
        </div>
      </div>
      
      {ship.onFire && <div role="alert" style={{ marginTop: 12, padding: 10, border: '1px solid #fb923c', background: '#7c2d1233', color: '#fdba74' }}><strong>FIRE ALERT</strong><br />−{FIRE_DAMAGE_PER_SECOND} hull/s · Dock anywhere to extinguish.<br />{ship.hasFireSuppression ? `Auto-suppression in ${Math.max(0, FIRE_SUPPRESSION_SECONDS - (ship.fireSeconds ?? 0)).toFixed(1)}s` : 'No suppression system installed.'}</div>}
      <StealthIndicator />
      <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
        <label>Hull {Math.ceil(ship.hp)}/{ship.maxHp}<progress aria-label="Hull" max={ship.maxHp} value={ship.hp} /></label>
        <label>Energy {Math.floor(ship.energy)}/{ship.maxEnergy}<progress aria-label="Weapon energy" max={ship.maxEnergy} value={ship.energy} /></label>
        <div>Weapon: {ship.weapon.kind} • Speed: {speed.toFixed(1)} m/s</div>
        {state.gameTime < (state.recoveryGraceUntil ?? 0) && <div style={{ color: '#8dd6ff', fontSize: 12 }}>Recovery ceasefire: {Math.ceil(state.recoveryGraceUntil! - state.gameTime)}s — firing ends protection.</div>}
        {distance !== undefined && <div>{waypoint!.name}: {Math.ceil(distance)}m • ETA {speed > 1 ? `${Math.ceil(distance / speed)}s` : '—'}</div>}
        {state.missions.filter(m => m.status === 'active' && m.type === 'escort').map(m => <div key={m.id}>
          {m.title}: waves {[...state.escortStates.values()].find(e => e.missionId === m.id)?.wavesCompleted ?? 0}/{MISSION_TEMPLATES[m.id].waves ?? 0}
          {state.npcTraders.filter(n => n.missionId === m.id && n.isMissionEscort).map(n => <label key={n.id} style={{ display: 'block' }}>Escort {Math.ceil(n.hp)}/{n.maxHp}<progress aria-label="Escort hull" max={n.maxHp} value={n.hp} /><button onClick={() => { state.setTrackedStation(n.id); if (!state.ship.autopilot) state.toggleAutopilot(); }}>Follow escort</button></label>)}
        </div>)}
        {target && <div style={{ color: '#ffb48a' }}>Target: {target.role ?? 'ship'} • Hull {Math.ceil(target.hp)}/{target.maxHp}<br />Range {Math.round(Math.hypot(...target.position.map((v, i) => v - ship.position[i])))}m</div>}
        {!ship.dockedStationId && <>
          <button onClick={state.cycleTarget}>Target next (Tab)</button>
          <button onClick={state.toggleCruise}>{ship.cruise ? `Cruise ${Math.min(3, ship.cruiseSpool ?? 0).toFixed(1)}s / 3s` : 'Cruise drive (C)'}</button>
          <button onClick={state.toggleSilentRunning}>{ship.silentRunning ? 'Silent running ON — half speed, weapons off' : 'Silent running (H)'}</button>
          <button onClick={state.toggleAutopilot}>{ship.autopilot ? 'Cancel waypoint pilot' : 'Waypoint pilot (T)'}</button>
        </>}
        {ship.dockedStationId && <button onClick={state.repairShip}>Repair & recharge ({repairCost(ship)} credits)</button>}
      </div>
      {/* Active Contracts Indicator */}
      {activeContractsCount > 0 && (
        <div style={{
          marginTop: 10,
          padding: '6px 8px',
          background: 'rgba(59,130,246,0.15)',
          borderRadius: 6,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderLeft: '3px solid #3b82f6',
        }}>
          <UIIcon name="tab_missions" size={14} />
          <span style={{ opacity: 0.9 }}>
            {activeContractsCount} Active Contract{activeContractsCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

