import { useState, useMemo } from 'react';
import { useGameStore } from '../state';
import { generateCommodities } from '../systems/economy/commodities';
import { MISSION_ARCS } from '../domain/constants/mission_constants';

const primaryColor = '#f59e0b'; // amber for debug
const secondaryColor = '#fbbf24';
const glowColor = '#f59e0b80';

export function DebugPanel() {
  const isTestMode = useGameStore(s => s.isTestMode);
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const missionArcs = useGameStore(s => s.missionArcs);
  const missions = useGameStore(s => s.missions);
  
  // Debug actions
  const debugSetCredits = useGameStore(s => s.debugSetCredits);
  const debugSetReputation = useGameStore(s => s.debugSetReputation);
  const debugSetAllReputation = useGameStore(s => s.debugSetAllReputation);
  const debugAddCargo = useGameStore(s => s.debugAddCargo);
  const debugClearCargo = useGameStore(s => s.debugClearCargo);
  const debugSetShipStat = useGameStore(s => s.debugSetShipStat);
  const debugSetMaxCargo = useGameStore(s => s.debugSetMaxCargo);
  const debugSetHp = useGameStore(s => s.debugSetHp);
  const debugSetEnergy = useGameStore(s => s.debugSetEnergy);
  const debugToggleUpgrade = useGameStore(s => s.debugToggleUpgrade);
  const debugSetMissionArcStage = useGameStore(s => s.debugSetMissionArcStage);
  const debugCompleteMission = useGameStore(s => s.debugCompleteMission);
  const debugFailMission = useGameStore(s => s.debugFailMission);

  // Local state for inputs
  const [creditsInput, setCreditsInput] = useState(ship.credits.toString());
  const [selectedStation, setSelectedStation] = useState(stations[0]?.id || '');
  const [repInput, setRepInput] = useState('50');
  const [allRepInput, setAllRepInput] = useState('50');
  const [selectedCommodity, setSelectedCommodity] = useState('refined_fuel');
  const [cargoQtyInput, setCargoQtyInput] = useState('10');
  const [accInput, setAccInput] = useState(ship.stats.acc.toString());
  const [vmaxInput, setVmaxInput] = useState(ship.stats.vmax.toString());
  const [dragInput, setDragInput] = useState(ship.stats.drag.toString());
  const [maxCargoInput, setMaxCargoInput] = useState(ship.maxCargo.toString());
  const [hpInput, setHpInput] = useState(ship.hp.toString());
  const [energyInput, setEnergyInput] = useState(ship.energy.toString());
  const [selectedArcId, setSelectedArcId] = useState(missionArcs[0]?.id || 'greenfields_independence');
  const [arcStageInput, setArcStageInput] = useState('1');
  const [selectedArcStatus, setSelectedArcStatus] = useState<'locked' | 'available' | 'in_progress' | 'completed'>('available');

  const commodities = useMemo(() => generateCommodities(), []);
  const arcOptions = useMemo(() => Object.values(MISSION_ARCS), []);
  
  // Get active missions
  const activeMissions = useMemo(
    () => missions.filter(m => m.status === 'active'),
    [missions]
  );

  if (!isTestMode) {
    return (
      <div className="panel">
        <div style={{
          background: 'linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%)',
          border: `2px solid ${primaryColor}`,
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: secondaryColor }}>
            DEBUG MODE NOT AVAILABLE
          </div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            Start a new game with the Test Ship to access debug features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .debug-panel {
          background: linear-gradient(135deg, rgba(20,15,10,0.95) 0%, rgba(25,18,12,0.98) 100%);
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .debug-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);
          animation: scanline-debug 2s linear infinite;
        }
        @keyframes scanline-debug {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .debug-section-header {
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.1em;
          color: ${secondaryColor};
          margin-bottom: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid ${primaryColor}40;
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .debug-section-header::before {
          content: '⚙';
          color: ${primaryColor};
        }
        .debug-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .debug-label {
          font-size: 12px;
          min-width: 90px;
          color: #d4d4d4;
        }
        .debug-input {
          background: rgba(0,0,0,0.4);
          border: 1px solid ${primaryColor}60;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: monospace;
          color: #fff;
          width: 100px;
        }
        .debug-input:focus {
          outline: none;
          border-color: ${primaryColor};
          box-shadow: 0 0 8px ${glowColor};
        }
        .debug-select {
          background: rgba(0,0,0,0.4);
          border: 1px solid ${primaryColor}60;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 12px;
          color: #fff;
          flex: 1;
        }
        .debug-select:focus {
          outline: none;
          border-color: ${primaryColor};
        }
        .debug-btn {
          background: linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20);
          border: 1px solid ${primaryColor};
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: ${secondaryColor};
          cursor: pointer;
          transition: all 0.2s;
          font-family: monospace;
        }
        .debug-btn:hover {
          background: linear-gradient(135deg, ${primaryColor}60, ${primaryColor}30);
          box-shadow: 0 0 12px ${glowColor};
        }
        .debug-btn-danger {
          border-color: #ef4444;
          color: #f87171;
          background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1));
        }
        .debug-btn-danger:hover {
          background: linear-gradient(135deg, rgba(239,68,68,0.5), rgba(239,68,68,0.2));
        }
        .debug-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid ${primaryColor}40;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .debug-toggle:hover {
          background: rgba(0,0,0,0.5);
          border-color: ${primaryColor};
        }
        .debug-toggle-active {
          border-color: #10b981;
          background: rgba(16,185,129,0.15);
        }
        .debug-toggle-indicator {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 2px solid #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .debug-toggle-active .debug-toggle-indicator {
          border-color: #10b981;
          background: #10b981;
          color: #000;
        }
        .scrollable-content-debug {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content-debug::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content-debug::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content-debug::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content-debug::-webkit-scrollbar-thumb:hover {
          background: ${secondaryColor};
        }
        .cargo-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: ${primaryColor}20;
          border: 1px solid ${primaryColor}40;
          border-radius: 12px;
          font-size: 11px;
          margin: 2px;
        }
        .rep-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-family: monospace;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }
      `}</style>

      <div className="panel">
        <div style={{
          background: `linear-gradient(90deg, ${primaryColor}40, transparent)`,
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>🛠️</span>
          <span style={{ fontWeight: 700, color: secondaryColor, fontFamily: 'monospace' }}>
            DEBUG MODE ACTIVE
          </span>
        </div>

        <div className="scrollable-content-debug">
          
          {/* Credits Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Credits</div>
            <div className="debug-row">
              <span className="debug-label">Current:</span>
              <span style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                ${ship.credits.toLocaleString()}
              </span>
            </div>
            <div className="debug-row">
              <input
                type="number"
                className="debug-input"
                value={creditsInput}
                onChange={e => setCreditsInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    debugSetCredits(parseInt(creditsInput) || 0);
                  }
                }}
              />
              <button className="debug-btn" onClick={() => debugSetCredits(parseInt(creditsInput) || 0)}>
                Set Credits
              </button>
              <button className="debug-btn" onClick={() => { debugSetCredits(999999); setCreditsInput('999999'); }}>
                Max
              </button>
              <button className="debug-btn" onClick={() => { debugSetCredits(0); setCreditsInput('0'); }}>
                Reset
              </button>
            </div>
          </div>

          {/* Reputation Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Station Reputation</div>
            <div className="debug-row">
              <select
                className="debug-select"
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
              >
                {stations.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.reputation ?? 0})
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="debug-input"
                value={repInput}
                min={0}
                max={100}
                onChange={e => setRepInput(e.target.value)}
                style={{ width: 60 }}
              />
              <button className="debug-btn" onClick={() => debugSetReputation(selectedStation, parseInt(repInput) || 0)}>
                Set
              </button>
            </div>
            <div className="debug-row">
              <span className="debug-label">All Stations:</span>
              <input
                type="number"
                className="debug-input"
                value={allRepInput}
                min={0}
                max={100}
                onChange={e => setAllRepInput(e.target.value)}
                style={{ width: 60 }}
              />
              <button className="debug-btn" onClick={() => debugSetAllReputation(parseInt(allRepInput) || 0)}>
                Set All
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
              {[0, 25, 50, 75, 100].map(val => (
                <button 
                  key={val} 
                  className="debug-btn" 
                  onClick={() => { debugSetAllReputation(val); setAllRepInput(val.toString()); }}
                  style={{ padding: '4px 8px' }}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Cargo Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Cargo ({Object.values(ship.cargo).reduce((a, b) => a + b, 0)}/{ship.maxCargo})</div>
            <div className="debug-row">
              <select
                className="debug-select"
                value={selectedCommodity}
                onChange={e => setSelectedCommodity(e.target.value)}
              >
                {commodities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                className="debug-input"
                value={cargoQtyInput}
                onChange={e => setCargoQtyInput(e.target.value)}
                style={{ width: 60 }}
              />
              <button className="debug-btn" onClick={() => debugAddCargo(selectedCommodity, parseInt(cargoQtyInput) || 0)}>
                Add
              </button>
              <button className="debug-btn" onClick={() => debugAddCargo(selectedCommodity, -(parseInt(cargoQtyInput) || 0))}>
                Remove
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {Object.entries(ship.cargo).filter(([, qty]) => qty > 0).length === 0 ? (
                <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>Empty cargo hold</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(ship.cargo).filter(([, qty]) => qty > 0).map(([id, qty]) => {
                    const commodity = commodities.find(c => c.id === id);
                    return (
                      <div key={id} className="cargo-badge">
                        <span>{commodity?.name || id}</span>
                        <span style={{ fontWeight: 700 }}>×{qty}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="debug-btn debug-btn-danger" onClick={debugClearCargo}>
                Clear All Cargo
              </button>
            </div>
          </div>

          {/* Ship Stats Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Ship Stats</div>
            <div className="debug-row">
              <span className="debug-label">Acceleration:</span>
              <input
                type="number"
                className="debug-input"
                value={accInput}
                step={0.5}
                onChange={e => setAccInput(e.target.value)}
              />
              <button className="debug-btn" onClick={() => debugSetShipStat('acc', parseFloat(accInput) || 1)}>
                Set
              </button>
            </div>
            <div className="debug-row">
              <span className="debug-label">Max Speed:</span>
              <input
                type="number"
                className="debug-input"
                value={vmaxInput}
                step={0.5}
                onChange={e => setVmaxInput(e.target.value)}
              />
              <button className="debug-btn" onClick={() => debugSetShipStat('vmax', parseFloat(vmaxInput) || 1)}>
                Set
              </button>
            </div>
            <div className="debug-row">
              <span className="debug-label">Drag:</span>
              <input
                type="number"
                className="debug-input"
                value={dragInput}
                step={0.05}
                onChange={e => setDragInput(e.target.value)}
              />
              <button className="debug-btn" onClick={() => debugSetShipStat('drag', parseFloat(dragInput) || 0.1)}>
                Set
              </button>
            </div>
            <div className="debug-row">
              <span className="debug-label">Max Cargo:</span>
              <input
                type="number"
                className="debug-input"
                value={maxCargoInput}
                onChange={e => setMaxCargoInput(e.target.value)}
              />
              <button className="debug-btn" onClick={() => debugSetMaxCargo(parseInt(maxCargoInput) || 10)}>
                Set
              </button>
            </div>
          </div>

          {/* HP & Energy Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Health & Energy</div>
            <div className="debug-row">
              <span className="debug-label">HP:</span>
              <span style={{ fontFamily: 'monospace', color: ship.hp < ship.maxHp * 0.3 ? '#ef4444' : '#10b981' }}>
                {ship.hp}/{ship.maxHp}
              </span>
              <input
                type="number"
                className="debug-input"
                value={hpInput}
                onChange={e => setHpInput(e.target.value)}
                style={{ width: 60 }}
              />
              <button className="debug-btn" onClick={() => debugSetHp(parseInt(hpInput) || 0)}>
                Set
              </button>
              <button className="debug-btn" onClick={() => { debugSetHp(ship.maxHp); setHpInput(ship.maxHp.toString()); }}>
                Max
              </button>
            </div>
            <div className="debug-row">
              <span className="debug-label">Energy:</span>
              <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>
                {ship.energy}/{ship.maxEnergy}
              </span>
              <input
                type="number"
                className="debug-input"
                value={energyInput}
                onChange={e => setEnergyInput(e.target.value)}
                style={{ width: 60 }}
              />
              <button className="debug-btn" onClick={() => debugSetEnergy(parseInt(energyInput) || 0)}>
                Set
              </button>
              <button className="debug-btn" onClick={() => { debugSetEnergy(ship.maxEnergy); setEnergyInput(ship.maxEnergy.toString()); }}>
                Max
              </button>
            </div>
          </div>

          {/* Upgrades Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Ship Upgrades</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <div
                className={`debug-toggle ${ship.canMine ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('canMine')}
              >
                <div className="debug-toggle-indicator">{ship.canMine ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Mining Rig</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasNavigationArray ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasNavigationArray')}
              >
                <div className="debug-toggle-indicator">{ship.hasNavigationArray ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Navigation Array</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasMarketIntel ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasMarketIntel')}
              >
                <div className="debug-toggle-indicator">{ship.hasMarketIntel ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Market Intel</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasUnionMembership ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasUnionMembership')}
              >
                <div className="debug-toggle-indicator">{ship.hasUnionMembership ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Union Membership</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasTradeLedger ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasTradeLedger')}
              >
                <div className="debug-toggle-indicator">{ship.hasTradeLedger ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Trade Ledger</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasTempCargo ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasTempCargo')}
              >
                <div className="debug-toggle-indicator">{ship.hasTempCargo ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Temp Cargo</span>
              </div>
              <div
                className={`debug-toggle ${ship.hasShieldedCargo ? 'debug-toggle-active' : ''}`}
                onClick={() => debugToggleUpgrade('hasShieldedCargo')}
              >
                <div className="debug-toggle-indicator">{ship.hasShieldedCargo ? '✓' : ''}</div>
                <span style={{ fontSize: 12 }}>Shielded Cargo</span>
              </div>
            </div>
          </div>

          {/* Active Missions Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Active Missions</div>
            {activeMissions.length === 0 ? (
              <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>
                No active missions
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeMissions.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      padding: 12,
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${primaryColor}40`,
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: secondaryColor }}>
                      {mission.title}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 8, fontFamily: 'monospace' }}>
                      ID: {mission.id} | Arc: {mission.arcId} | Stage: {mission.stage}
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                      Objectives: {mission.objectives.filter(o => o.completed).length}/{mission.objectives.length} complete
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="debug-btn"
                        onClick={() => debugCompleteMission(mission.id)}
                        style={{ flex: 1 }}
                      >
                        ✓ Complete Mission
                      </button>
                      <button
                        className="debug-btn debug-btn-danger"
                        onClick={() => debugFailMission(mission.id)}
                        style={{ flex: 1 }}
                      >
                        ✗ Fail Mission
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mission Arc Section */}
          <div className="debug-panel">
            <div className="debug-section-header">Mission Arcs</div>
            <div className="debug-row">
              <select
                className="debug-select"
                value={selectedArcId}
                onChange={e => setSelectedArcId(e.target.value)}
              >
                {arcOptions.map(arc => {
                  const currentArc = missionArcs.find(a => a.id === arc.id);
                  return (
                    <option key={arc.id} value={arc.id}>
                      {arc.name} (Stage {currentArc?.currentStage || 1}, {currentArc?.status || 'locked'})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="debug-row">
              <span className="debug-label">Stage:</span>
              <input
                type="number"
                className="debug-input"
                value={arcStageInput}
                min={1}
                max={4}
                onChange={e => setArcStageInput(e.target.value)}
                style={{ width: 60 }}
              />
              <select
                className="debug-select"
                value={selectedArcStatus}
                onChange={e => setSelectedArcStatus(e.target.value as 'locked' | 'available' | 'in_progress' | 'completed')}
                style={{ width: 120 }}
              >
                <option value="locked">Locked</option>
                <option value="available">Available</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                className="debug-btn"
                onClick={() => debugSetMissionArcStage(selectedArcId, parseInt(arcStageInput) || 1, selectedArcStatus)}
              >
                Set
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
              {[1, 2, 3, 4].map(stage => (
                <button
                  key={stage}
                  className="debug-btn"
                  onClick={() => {
                    setArcStageInput(stage.toString());
                    debugSetMissionArcStage(selectedArcId, stage, 'in_progress');
                  }}
                  style={{ padding: '4px 10px' }}
                >
                  Stage {stage}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7 }}>
              {(() => {
                const currentArc = missionArcs.find(a => a.id === selectedArcId);
                const arcDef = arcOptions.find(a => a.id === selectedArcId);
                if (!currentArc || !arcDef) return null;
                return (
                  <>
                    <div style={{ marginBottom: 4, color: secondaryColor }}>{arcDef.name}</div>
                    <div>Status: <span style={{ color: currentArc.status === 'completed' ? '#10b981' : currentArc.status === 'in_progress' ? '#3b82f6' : '#888' }}>{currentArc.status}</span></div>
                    <div>Current Stage: {currentArc.currentStage}/4</div>
                    <div>Completed Missions: {currentArc.completedMissions.length}</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="debug-panel">
            <div className="debug-section-header">Quick Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                className="debug-btn"
                onClick={() => {
                  debugSetCredits(999999);
                  setCreditsInput('999999');
                }}
              >
                💰 Max Credits
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  debugSetAllReputation(100);
                  setAllRepInput('100');
                }}
              >
                ⭐ Max All Rep
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  debugSetHp(ship.maxHp);
                  debugSetEnergy(ship.maxEnergy);
                  setHpInput(ship.maxHp.toString());
                  setEnergyInput(ship.maxEnergy.toString());
                }}
              >
                ❤️ Full Heal
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  debugToggleUpgrade('canMine');
                  debugToggleUpgrade('hasNavigationArray');
                  debugToggleUpgrade('hasMarketIntel');
                  debugToggleUpgrade('hasUnionMembership');
                  debugToggleUpgrade('hasTradeLedger');
                  debugToggleUpgrade('hasTempCargo');
                  debugToggleUpgrade('hasShieldedCargo');
                }}
              >
                🔧 Toggle All Upgrades
              </button>
              <button
                className="debug-btn debug-btn-danger"
                onClick={() => {
                  debugSetHp(1);
                  setHpInput('1');
                }}
              >
                💀 Near Death
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

