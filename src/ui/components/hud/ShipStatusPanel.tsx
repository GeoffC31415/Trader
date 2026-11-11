import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useReducedMotion } from '../../../shared/hooks/use_reduced_motion';

interface ShipStatusPanelProps {
  ship: Ship;
  stations: Station[];
  contracts: Contract[];
  hasNav: boolean;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function StatusBar({
  label,
  value,
  max,
  color,
  background,
  isDanger,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  background: string;
  isDanger?: boolean;
}) {
  const pct = clamp01(max > 0 ? value / max : 0);
  const dangerPulse = isDanger ? 'shipStatusDangerPulse 1.1s ease-in-out infinite' : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.9 }}>
          {Math.max(0, Math.round(value))} / {Math.max(0, Math.round(max))}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label === 'Energy' ? 'Weapon energy' : label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.max(0, Math.min(max, value))}
        style={{
          height: 8,
          borderRadius: 999,
          background,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxShadow: isDanger ? '0 0 12px rgba(239,68,68,0.25)' : undefined,
        }}
      >
        <div
          style={{
            width: `${Math.round(pct * 100)}%`,
            height: '100%',
            background: color,
            boxShadow: `0 0 10px ${color}`,
            animation: dangerPulse,
            transition: 'width 120ms linear',
          }}
        />
      </div>
    </div>
  );
}

export function ShipStatusPanel({ ship, stations, contracts, hasNav }: ShipStatusPanelProps) {
  const state = useGameStore();
  const reduced = useReducedMotion();
  const speed = Math.hypot(...ship.velocity);
  const target = state.npcTraders.find(n => n.id === state.selectedTargetId);
  const waypoint = stations.find(st => st.id === state.trackedStationId);
  const distance = waypoint ? Math.hypot(...waypoint.position.map((v, i) => v - ship.position[i])) : undefined;
  const activeContractsCount = contracts.filter(c => c.status === 'accepted').length;
  const dockedStation = ship.dockedStationId ? stations.find(s => s.id === ship.dockedStationId) : null;
  const cargoUsed = Object.values(ship.cargo).reduce((a, b) => a + b, 0);
  const weaponLabel = ship.weapon?.kind ? ship.weapon.kind.toUpperCase() : 'UNKNOWN';
  const isHpDanger = ship.maxHp > 0 ? ship.hp / ship.maxHp <= 0.25 : false;

  const [displayCredits, setDisplayCredits] = useState<number>(ship.credits);
  const displayCreditsRef = useRef<number>(ship.credits);

  // Animate credit changes (short easing, low overhead).
  useEffect(() => {
    const from = displayCreditsRef.current;
    const to = ship.credits;
    if (from === to) return;

    if (reduced) { displayCreditsRef.current = to; setDisplayCredits(to); return; }
    const durationMs = 320;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      displayCreditsRef.current = value;
      setDisplayCredits(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ship.credits, reduced]);

  const prevStatsRef = useRef<{ credits: number; hp: number }>({ credits: ship.credits, hp: ship.hp });
  const flashTimeoutRef = useRef<number | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  // Flash on damage (hp drop) and credit changes.
  useEffect(() => {
    const prev = prevStatsRef.current;
    let nextFlash: string | null = null;
    if (ship.hp < prev.hp) nextFlash = '#ef4444';
    else if (ship.credits > prev.credits) nextFlash = '#10b981';
    else if (ship.credits < prev.credits) nextFlash = '#f59e0b';

    prevStatsRef.current = { credits: ship.credits, hp: ship.hp };
    if (reduced) { setFlashColor(null); return; }
    if (!nextFlash) return;

    setFlashColor(nextFlash);
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => setFlashColor(null), 240);
    return () => { if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current); };
  }, [ship.credits, ship.hp, reduced]);

  const cargoPct = useMemo(() => clamp01(ship.maxCargo > 0 ? cargoUsed / ship.maxCargo : 0), [cargoUsed, ship.maxCargo]);
  const enginePct = useMemo(() => clamp01(ship.enginePower), [ship.enginePower]);
  
  return (
    <div onPointerUp={e => { (e.target as HTMLElement).closest('button')?.blur(); }} style={{
      position: 'absolute',
      top: hasNav ? SHIP_STATUS_PANEL_TOP_WITH_NAV : SHIP_STATUS_PANEL_TOP_WITHOUT_NAV,
      right: SHIP_STATUS_PANEL_RIGHT,
      background: 'linear-gradient(135deg, rgba(11,18,32,0.95), rgba(15,23,42,0.95))',
      color: '#e5e7eb',
      padding: '14px 18px',
      borderRadius: 10,
      border: flashColor ? `2px solid ${flashColor}` : '2px solid rgba(59,130,246,0.3)',
      minWidth: SHIP_STATUS_PANEL_MIN_WIDTH,
      maxHeight: 'calc(100vh - 400px)',
      overflowY: 'auto',
      fontSize: 13,
      fontFamily: 'monospace',
      boxShadow: [
        '0 8px 24px rgba(0,0,0,0.5)',
        'inset 0 1px 0 rgba(255,255,255,0.1)',
        flashColor ? `0 0 26px ${flashColor}55` : undefined,
      ].filter(Boolean).join(', '),
      backdropFilter: 'blur(8px)',
      zIndex: 20,
    }}>
      <style>{`
        @keyframes shipStatusDangerPulse {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.45); }
          100% { filter: brightness(1); }
        }
      `}</style>
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
        <div style={{
          marginLeft: 'auto',
          textAlign: 'right',
          opacity: 0.9,
        }}>
          <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2, letterSpacing: '0.5px' }}>
            WEAPON
          </div>
          <div style={{
            fontWeight: 800,
            fontSize: 12,
            color: ship.dockedStationId ? '#a7f3d0' : '#bfdbfe',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}>
            {weaponLabel}
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
            ${Math.round(displayCredits).toLocaleString()}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_cargo" size={16} />
            <span style={{ fontSize: 11 }}>Cargo</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: 14,
              color: cargoUsed >= ship.maxCargo ? '#ef4444' : '#60a5fa',
            }}>
              {cargoUsed} / {ship.maxCargo}
            </div>
            <div style={{ width: 92, height: 4, background: 'rgba(255,255,255,0.10)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(cargoPct * 100)}%`,
                height: '100%',
                background: cargoPct >= 1 ? 'linear-gradient(90deg, #ef4444, #fb7185)' : 'linear-gradient(90deg, #60a5fa, #22d3ee)',
                transition: 'width 120ms linear',
              }} />
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_engine" size={16} />
            <span style={{ fontSize: 11 }}>Engine</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: 14,
              color: ship.enginePower > 0 ? '#22c55e' : '#6b7280',
            }}>
              {formatNumber(ship.enginePower * 100)}%
            </div>
            <div style={{ width: 92, height: 4, background: 'rgba(255,255,255,0.10)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(enginePct * 100)}%`,
                height: '100%',
                background: enginePct > 0 ? 'linear-gradient(90deg, #22c55e, #a7f3d0)' : 'linear-gradient(90deg, #6b7280, #9ca3af)',
                transition: 'width 120ms linear',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Combat Stats */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatusBar
          label="Hull"
          value={ship.hp}
          max={ship.maxHp}
          color={isHpDanger ? 'linear-gradient(90deg, #ef4444, #fb7185)' : 'linear-gradient(90deg, #ef4444, #f97316)'}
          background="rgba(239,68,68,0.12)"
          isDanger={isHpDanger && !reduced}
        />
        <StatusBar
          label="Energy"
          value={ship.energy}
          max={ship.maxEnergy}
          color="linear-gradient(90deg, #60a5fa, #22d3ee)"
          background="rgba(96,165,250,0.12)"
        />
      </div>
      
      {ship.onFire && <div role="alert" style={{ marginTop: 12, padding: 10, border: '1px solid #fb923c', background: '#7c2d1233', color: '#fdba74' }}><strong>FIRE ALERT</strong><br />−{FIRE_DAMAGE_PER_SECOND} hull/s · Dock anywhere to extinguish.<br />{ship.hasFireSuppression ? `Auto-suppression in ${Math.max(0, FIRE_SUPPRESSION_SECONDS - (ship.fireSeconds ?? 0)).toFixed(1)}s` : 'No suppression system installed.'}</div>}
      <StealthIndicator />
      <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
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

