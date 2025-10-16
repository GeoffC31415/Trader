import { useEffect, useMemo, useState, Fragment } from 'react';
import { useGameStore } from '../state';
import { shipCaps, shipBaseStats } from '../state';
import { getPriceBiasForStation, gatedCommodities } from '../systems/economy/pricing';
import { processRecipes } from '../systems/economy/recipes';
import { commodityById } from '../state/world';
import type { StationType } from '../domain/types/economy_types';
import { CONTRACT_REFRESH_INTERVAL } from '../domain/constants/contract_constants';
import { ReputationBadge } from './components/reputation_badge';
import { getReputationTier, getTierDisplay, getTierPerks, getPriceDiscount } from '../state/helpers/reputation_helpers';
import { MissionChoiceDialog } from './components/mission_choice_dialog';
import type { Mission } from '../domain/types/mission_types';
import { getFactionForStation, FACTIONS, type FactionId } from '../domain/constants/faction_constants';
import { getFactionReputation, getFactionStanding, getFactionStandingDisplay } from '../systems/reputation/faction_system';

function getHallLabel(type: StationType): string {
  if (type === 'city') return 'Civic Exchange';
  if (type === 'refinery') return 'Refinery Office';
  if (type === 'fabricator') return 'Assembly Exchange';
  if (type === 'farm') return 'Co-op Market';
  if (type === 'power_plant') return 'Grid Exchange';
  if (type === 'trading_post') return 'Bazaar';
  if (type === 'shipyard') return 'Shipyard Office';
  if (type === 'pirate') return 'Quarterdeck Market';
  if (type === 'mine') return 'Mining Exchange';
  if (type === 'research') return 'Research Market';
  if (type === 'orbital_hab') return 'Habitat Exchange';
  return 'Trading Hall';
}

const stationTypeColors: Record<StationType, { primary: string; secondary: string; glow: string }> = {
  city: { primary: '#3b82f6', secondary: '#60a5fa', glow: '#3b82f680' },
  refinery: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#f59e0b80' },
  fabricator: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#8b5cf680' },
  farm: { primary: '#10b981', secondary: '#34d399', glow: '#10b98180' },
  power_plant: { primary: '#eab308', secondary: '#fde047', glow: '#eab30880' },
  trading_post: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#06b6d480' },
  shipyard: { primary: '#ec4899', secondary: '#f472b6', glow: '#ec489980' },
  pirate: { primary: '#ef4444', secondary: '#f87171', glow: '#ef444480' },
  mine: { primary: '#78716c', secondary: '#a8a29e', glow: '#78716c80' },
  research: { primary: '#06b6d4', secondary: '#67e8f9', glow: '#06b6d480' },
  orbital_hab: { primary: '#a855f7', secondary: '#c084fc', glow: '#a855f780' },
};

export function MarketPanel() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const buy = useGameStore(s => s.buy);
  const sell = useGameStore(s => s.sell);
  const undock = useGameStore(s => s.undock);
  const process = useGameStore(s => s.process);
  const upgrade = useGameStore(s => s.upgrade);
  const replaceShip = useGameStore(s => s.replaceShip);
  const hasIntel = !!ship.hasMarketIntel;
  const contracts = useGameStore(s => s.contracts || []);
  const acceptContract = useGameStore(s => s.acceptContract);
  const abandonContract = useGameStore(s => s.abandonContract);
  const setTrackedStation = useGameStore(s => s.setTrackedStation);
  
  // Mission arc system
  const missions = useGameStore(s => s.missions);
  const missionArcs = useGameStore(s => s.missionArcs);
  const acceptMission = useGameStore(s => s.acceptMission);
  const abandonMission = useGameStore(s => s.abandonMission);
  const makeMissionChoice = useGameStore(s => s.makeMissionChoice);
  
  // Auto-refresh contracts on mount and at regular intervals
  useEffect(() => {
    const store = useGameStore.getState();
    store.generateContracts({ limit: 5 });
    
    const interval = setInterval(() => {
      const currentStore = useGameStore.getState();
      currentStore.generateContracts({ limit: 5 });
    }, CONTRACT_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []); // Empty deps - only run on mount/unmount

  const [qty, setQty] = useState<number>(1);
  const [choiceMissionDialog, setChoiceMissionDialog] = useState<Mission | null>(null);

  const station = useMemo(() => stations.find(s => s.id === ship.dockedStationId), [stations, ship.dockedStationId]);
  const persona = station?.persona;

  const items = station ? Object.entries(station.inventory) : [];
  const recipes = station ? (processRecipes[station.type] || []) : [];
  const outputSet = new Set(recipes.map(r => r.outputId));
  // Hide goods that are neither bought nor sold here
  const visibleItems = items.filter(([_, p]) => (p.canSell !== false) || (p.canBuy !== false));
  const producedItems = visibleItems.filter(([id, _]) => outputSet.has(id));
  const otherItems = visibleItems.filter(([id, _]) => !outputSet.has(id));
  const hasNav = !!ship.hasNavigationArray;
  const isGated = (id: string) => (gatedCommodities as readonly string[]).includes(id);
  const hasUnion = !!ship.hasUnionMembership;
  const isPirate = station?.type === 'pirate';
  const hallLabel = station ? getHallLabel(station.type) : 'Trading Hall';

  const hasFabrication = recipes.length > 0;
  const hasProduction = producedItems.length > 0;
  const stationContracts = useMemo(() => 
    contracts.filter(c => c.toId === station?.id && c.status === 'offered'),
    [contracts, station?.id]
  );

  const stationMissions = useMemo(() => 
    missions.filter(m => m.availableAt.includes(station?.id || '') && m.status === 'offered'),
    [missions, station?.id]
  );

  const activeMissions = useMemo(() => 
    missions.filter(m => m.status === 'active'),
    [missions]
  );

  const failedMissions = useMemo(() => 
    missions.filter(m => m.status === 'failed'),
    [missions]
  );

  const [section, setSection] = useState<'hall' | 'fabrication' | 'production' | 'missions'>('hall');
  useEffect(() => {
    setSection('hall');
  }, [station?.id]);
  useEffect(() => {
    if (section === 'fabrication' && !hasFabrication) setSection('hall');
    if (section === 'production' && !hasProduction) setSection('hall');
  }, [section, hasFabrication, hasProduction]);

  const colors = station ? stationTypeColors[station.type] : stationTypeColors.city;

  if (!station) {
    return (
      <div className="panel" style={{
        background: 'linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%)',
        border: '2px solid #3b82f6',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 8px 32px #3b82f680',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 14, marginBottom: 12 }}>
          <div style={{ color: '#10b981', marginBottom: 8 }}>
            ▸ CREDITS: <span style={{ fontWeight: 700 }}>${ship.credits.toLocaleString()}</span>
          </div>
          <div style={{ color: '#06b6d4', marginBottom: 8 }}>
            ▸ CARGO: <span style={{ fontWeight: 700 }}>{Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}</span>
          </div>
        </div>
        <div style={{ 
          padding: 16, 
          background: 'rgba(59,130,246,0.1)', 
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 8,
          fontSize: 13,
          textAlign: 'center',
        }}>
          ⚠ Fly near a station and press <strong>E</strong> to dock
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .sci-fi-panel {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${colors.primary};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .sci-fi-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
          animation: scanline-market 3s linear infinite;
        }
        .sci-fi-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          );
          pointer-events: none;
          opacity: 0.3;
        }
        @keyframes scanline-market {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .sci-fi-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20);
          border: 1px solid ${colors.primary};
          border-radius: 6px;
          color: #e5e7eb;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          font-family: monospace;
        }
        .sci-fi-button:hover:not(:disabled) {
          background: linear-gradient(135deg, ${colors.primary}50, ${colors.primary}30);
          box-shadow: 0 0 20px ${colors.glow};
          transform: translateY(-1px);
        }
        .sci-fi-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: linear-gradient(135deg, rgba(100,100,100,0.2), rgba(100,100,100,0.1));
          border-color: rgba(100,100,100,0.3);
        }
        .sci-fi-button.active {
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          color: #000;
          font-weight: 700;
          box-shadow: 0 0 20px ${colors.glow};
        }
        .data-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 16px;
          padding: 12px;
          background: ${colors.primary}10;
          border: 1px solid ${colors.primary}30;
          border-left: 3px solid ${colors.primary};
          border-radius: 6px;
          margin-bottom: 8px;
          align-items: center;
          transition: all 0.2s ease;
        }
        .data-row:hover {
          background: ${colors.primary}15;
          border-left-color: ${colors.secondary};
        }
        .section-header {
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.1em;
          color: ${colors.secondary};
          margin-bottom: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid ${colors.primary}40;
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header::before {
          content: '◢';
          color: ${colors.primary};
        }
        .commodity-grid {
          display: grid;
          grid-template-columns: auto 2fr 1fr 0.7fr 2fr;
          gap: 12px 16px;
          font-family: monospace;
          font-size: 13px;
        }
        .commodity-grid-header {
          font-weight: 700;
          color: ${colors.secondary};
          font-size: 11px;
          text-transform: uppercase;
          padding-bottom: 8px;
          border-bottom: 1px solid ${colors.primary}30;
        }
        .quantity-control {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: ${colors.primary}10;
          border: 1px solid ${colors.primary}30;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .quantity-control input {
          width: 80px;
          padding: 6px 10px;
          background: rgba(0,0,0,0.3);
          border: 1px solid ${colors.primary};
          border-radius: 4px;
          color: #e5e7eb;
          font-family: monospace;
          font-weight: 700;
          text-align: center;
        }
        .scrollable-content {
          max-height: calc(100vh - 280px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content::-webkit-scrollbar-thumb {
          background: ${colors.primary};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: ${colors.secondary};
          box-shadow: 0 0 10px ${colors.glow};
        }
      `}</style>

      <div className="panel">
        {/* Header Bar */}
        <div className="sci-fi-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.secondary, letterSpacing: '0.1em', marginBottom: 4 }}>
              DOCKED AT
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, textShadow: `0 0 10px ${colors.glow}` }}>
              {station.name.toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              padding: '8px 16px',
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}`,
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>CREDITS</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
                ${ship.credits.toLocaleString()}
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}`,
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>CARGO</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
                {Object.values(ship.cargo).reduce((a,b)=>a+b,0)}/{ship.maxCargo}
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}`,
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>REPUTATION</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
                {(station.reputation || 0).toFixed(0)}
              </div>
            </div>
            <button
              onClick={undock}
              className="sci-fi-button"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: '#000',
                padding: '10px 24px',
                fontSize: 13,
              }}
            >
              ⏏ UNDOCK (Q)
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setSection('hall')} className={`sci-fi-button ${section === 'hall' ? 'active' : ''}`}>
            {hallLabel}
          </button>
          {hasFabrication && (
            <button onClick={() => setSection('fabrication')} className={`sci-fi-button ${section === 'fabrication' ? 'active' : ''}`}>
              ⚙ Fabrication
            </button>
          )}
          {hasProduction && (
            <button onClick={() => setSection('production')} className={`sci-fi-button ${section === 'production' ? 'active' : ''}`}>
              📦 Production
            </button>
          )}
          <button onClick={() => setSection('missions')} className={`sci-fi-button ${section === 'missions' ? 'active' : ''}`}>
            📋 Missions {stationContracts.length > 0 && `(${stationContracts.length})`}
          </button>
        </div>

        {/* HALL SECTION */}
        {section === 'hall' && (
          <div className="scrollable-content">
            {/* Shipyard Section */}
            {station.type === 'shipyard' && (
              <div className="sci-fi-panel">
                <div className="section-header">Ship Upgrades & Services</div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 12, opacity: 0.9 }}>
                    CURRENT VESSEL: <span style={{ color: colors.secondary, fontWeight: 700 }}>{ship.kind.toUpperCase()}</span>
                  </div>
                  
                  {/* Upgrades */}
                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Acceleration Boost</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.stats.acc.toFixed(1)}</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,000</div>
                    <button onClick={() => upgrade('acc', 3, 1000)} className="sci-fi-button">+3 ACC</button>
                  </div>

                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Velocity Enhancer</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.stats.vmax.toFixed(1)}</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,000</div>
                    <button onClick={() => upgrade('vmax', 3, 1000)} className="sci-fi-button">+3 VMAX</button>
                  </div>

                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Cargo Bay Expansion</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>Current: {ship.maxCargo} units</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,200</div>
                    <button onClick={() => upgrade('cargo', 50, 1200)} className="sci-fi-button">+50 CARGO</button>
                  </div>

                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Mining Rig Installation</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                        Status: {ship.canMine ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$25,000</div>
                    <button onClick={() => upgrade('mining', 0, 25000)} disabled={ship.canMine} className="sci-fi-button">
                      {ship.canMine ? 'OWNED' : 'INSTALL'}
                    </button>
                  </div>

                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Navigation Array</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                        Status: {ship.hasNavigationArray ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$5,000</div>
                    <button onClick={() => upgrade('navigation', 0, 5000)} disabled={!!ship.hasNavigationArray} className="sci-fi-button">
                      {ship.hasNavigationArray ? 'OWNED' : 'INSTALL'}
                    </button>
                  </div>

                  <div className="data-row">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Mercantile Data Nexus</div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                        Status: {hasIntel ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$2,500</div>
                    <button onClick={() => upgrade('intel' as any, 0, 2500)} disabled={hasIntel} className="sci-fi-button">
                      {hasIntel ? 'OWNED' : 'INSTALL'}
                    </button>
                  </div>
                </div>

                {/* Ship Replacement */}
                <div className="section-header" style={{ marginTop: 20 }}>Ship Replacement Services</div>
                <div style={{
                  padding: 12,
                  background: `${colors.primary}10`,
                  border: `1px solid ${colors.primary}30`,
                  borderRadius: 6,
                  marginBottom: 12,
                  fontSize: 12,
                  opacity: 0.9,
                }}>
                  ⚠ WARNING: Cargo hold must be empty to replace ship
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { kind: 'freighter', cargo: 300, acc: 10, vmax: 11, price: 20000 },
                    { kind: 'clipper', cargo: 60, acc: 18, vmax: 20, price: 20000 },
                    { kind: 'miner', cargo: 80, acc: 9, vmax: 11, price: 10000, mining: true },
                    { kind: 'heavy_freighter', cargo: 600, acc: 9, vmax: 12, price: 60000 },
                    { kind: 'racer', cargo: 40, acc: 24, vmax: 28, price: 50000 },
                    { kind: 'industrial_miner', cargo: 160, acc: 10, vmax: 12, price: 40000, mining: true },
                  ].map(s => (
                    <div key={s.kind} style={{
                      padding: 14,
                      background: `${colors.primary}10`,
                      border: `1px solid ${colors.primary}40`,
                      borderRadius: 8,
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: colors.secondary }}>
                        {s.kind.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 8, lineHeight: 1.6 }}>
                        <div>CARGO: {s.cargo}</div>
                        <div>ACC: {s.acc} | VMAX: {s.vmax}</div>
                        {s.mining && <div style={{ color: '#10b981' }}>✓ MINING RIG</div>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                          ${s.price.toLocaleString()}
                        </div>
                        <button
                          onClick={() => replaceShip(s.kind as any, s.price)}
                          disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}
                          className="sci-fi-button"
                          style={{ fontSize: 11, padding: '6px 12px' }}
                        >
                          PURCHASE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* City Services */}
            {station.type === 'city' && (
              <div className="sci-fi-panel">
                <div className="section-header">City Services</div>
                <div className="data-row">
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Union Membership</div>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                      Status: {hasUnion ? '✓ MEMBER' : '✗ NOT A MEMBER'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,500</div>
                  <button onClick={() => upgrade('union' as any, 0, 1500)} disabled={hasUnion} className="sci-fi-button">
                    {hasUnion ? 'MEMBER' : 'JOIN'}
                  </button>
                </div>
              </div>
            )}

            {/* Trade Amount Control */}
            <div className="quantity-control">
              <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: colors.secondary }}>
                TRADE QUANTITY:
              </div>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              <button onClick={() => setQty(q => q + 1)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                +
              </button>
              <button onClick={() => setQty(10)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                10
              </button>
              <button onClick={() => setQty(50)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                50
              </button>
            </div>

            {/* Commodities */}
            {otherItems.length > 0 && (
              <div className="sci-fi-panel">
                <div className="section-header">Commodity Exchange</div>
                <div className="commodity-grid">
                  <div className="commodity-grid-header"></div>
                  <div className="commodity-grid-header">COMMODITY</div>
                  <div className="commodity-grid-header">PRICE (BUY / SELL)</div>
                  <div className="commodity-grid-header">HELD</div>
                  <div className="commodity-grid-header">ACTIONS</div>
                  
                  {otherItems.map(([id, p]) => {
                    const bias = getPriceBiasForStation(station.type, id);
                    const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
                    const rep = station.reputation || 0;
                    const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (rep / 100)));
                    const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (rep / 100)));
                    const adjBuy = Math.max(1, Math.round(p.buy * (1 - buyDiscount)));
                    const adjSell = Math.max(1, Math.round(p.sell * (1 + sellPremium)));
                    const commodity = commodityById[id];
                    return (
                      <Fragment key={id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {commodity?.icon && (
                            <img 
                              src={commodity.icon} 
                              alt={commodity.name}
                              style={{ 
                                width: 32, 
                                height: 32, 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                              }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                          {id.replace(/_/g, ' ')}
                        </div>
                        <div style={{ color }}>
                          <span style={{ color: '#10b981' }}>${adjBuy}</span>
                          <span style={{ opacity: 0.5 }}> / </span>
                          <span style={{ color: '#ef4444' }}>${adjSell}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: colors.secondary }}>{ship.cargo[id] || 0}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => buy(id, qty)}
                            disabled={p.canSell === false || (!hasNav && isGated(id))}
                            className="sci-fi-button"
                            style={{ padding: '4px 10px', fontSize: 10 }}
                          >
                            BUY {qty}
                          </button>
                          <button
                            onClick={() => sell(id, qty)}
                            disabled={p.canBuy === false || (!hasNav && isGated(id))}
                            className="sci-fi-button"
                            style={{ padding: '4px 10px', fontSize: 10 }}
                          >
                            SELL {qty}
                          </button>
                        </div>
                        {((p.canSell === false || p.canBuy === false) || (!hasNav && isGated(id))) && (
                          <div style={{ gridColumn: '1 / -1', fontSize: 10, opacity: 0.6, marginTop: -4, fontFamily: 'monospace' }}>
                            {p.canSell === false && p.canBuy === false && '⚠ NOT TRADED HERE'}
                            {p.canSell === false && p.canBuy !== false && '⚠ NOT SOLD HERE'}
                            {p.canBuy === false && p.canSell !== false && '⚠ NOT BOUGHT HERE'}
                            {!hasNav && isGated(id) && ' | REQUIRES NAVIGATION ARRAY'}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FABRICATION SECTION */}
        {section === 'fabrication' && (
          <div className="scrollable-content">
            <div className="sci-fi-panel">
              <div className="section-header">Fabrication Bay</div>
              {recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
                  ⚠ NO FABRICATION SERVICES AVAILABLE
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recipes.map(r => {
                    const have = ship.cargo[r.inputId] || 0;
                    const canMake = Math.floor(have / r.inputPerOutput);
                    const outIsGated = isGated(r.outputId);
                    const unionBlocked = !isPirate && !hasUnion;
                    const navBlocked = !hasNav && outIsGated;
                    const inputCommodity = commodityById[r.inputId];
                    const outputCommodity = commodityById[r.outputId];
                    return (
                      <div key={r.inputId} className="data-row" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
                        <div>
                          <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {inputCommodity?.icon && (
                                <img 
                                  src={inputCommodity.icon} 
                                  alt={inputCommodity.name}
                                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <span>{r.inputId.replace(/_/g,' ')}</span>
                            </div>
                            <span>→</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {outputCommodity?.icon && (
                                <img 
                                  src={outputCommodity.icon} 
                                  alt={outputCommodity.name}
                                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <span>{r.outputId.replace(/_/g,' ')}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                            RATIO: {r.inputPerOutput}:1 | AVAILABLE: {have} units
                          </div>
                          {(unionBlocked || navBlocked) && (
                            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, color: '#ef4444' }}>
                              {!isPirate && !hasUnion && '⚠ REQUIRES UNION MEMBERSHIP'}
                              {!hasNav && outIsGated && (unionBlocked ? ' | ' : '') + '⚠ REQUIRES NAVIGATION ARRAY'}
                            </div>
                          )}
                        </div>
                        <div style={{ fontFamily: 'monospace', color: colors.secondary, fontWeight: 700 }}>
                          CAN MAKE: {canMake}
                        </div>
                        <button
                          onClick={() => process(r.inputId, 1)}
                          disabled={canMake <= 0 || unionBlocked || navBlocked}
                          className="sci-fi-button"
                        >
                          FABRICATE 1
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTION SECTION */}
        {section === 'production' && producedItems.length > 0 && (
          <div className="scrollable-content">
            <div className="quantity-control">
              <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: colors.secondary }}>
                TRADE QUANTITY:
              </div>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              <button onClick={() => setQty(q => q + 1)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                +
              </button>
              <button onClick={() => setQty(10)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                10
              </button>
              <button onClick={() => setQty(50)} className="sci-fi-button" style={{ padding: '4px 12px' }}>
                50
              </button>
            </div>

            <div className="sci-fi-panel">
              <div className="section-header">Local Production</div>
              <div className="commodity-grid">
                <div className="commodity-grid-header"></div>
                <div className="commodity-grid-header">COMMODITY</div>
                <div className="commodity-grid-header">PRICE (BUY / SELL)</div>
                <div className="commodity-grid-header">HELD</div>
                <div className="commodity-grid-header">ACTIONS</div>
                
                {producedItems.map(([id, p]) => {
                  const bias = getPriceBiasForStation(station.type, id);
                  const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
                  const rep = station.reputation || 0;
                  const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (rep / 100)));
                  const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (rep / 100)));
                  const adjBuy = Math.max(1, Math.round(p.buy * (1 - buyDiscount)));
                  const adjSell = Math.max(1, Math.round(p.sell * (1 + sellPremium)));
                  const commodity = commodityById[id];
                  return (
                    <Fragment key={id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {commodity?.icon && (
                          <img 
                            src={commodity.icon} 
                            alt={commodity.name}
                            style={{ 
                              width: 32, 
                              height: 32, 
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                            }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {id.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color }}>
                        <span style={{ color: '#10b981' }}>${adjBuy}</span>
                        <span style={{ opacity: 0.5 }}> / </span>
                        <span style={{ color: '#ef4444' }}>${adjSell}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: colors.secondary }}>{ship.cargo[id] || 0}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => buy(id, qty)}
                          disabled={p.canSell === false || (!hasNav && isGated(id))}
                          className="sci-fi-button"
                          style={{ padding: '4px 10px', fontSize: 10 }}
                        >
                          BUY {qty}
                        </button>
                        <button
                          onClick={() => sell(id, qty)}
                          disabled={p.canBuy === false || (!hasNav && isGated(id))}
                          className="sci-fi-button"
                          style={{ padding: '4px 10px', fontSize: 10 }}
                        >
                          SELL {qty}
                        </button>
                      </div>
                      {((p.canSell === false || p.canBuy === false) || (!hasNav && isGated(id))) && (
                        <div style={{ gridColumn: '1 / -1', fontSize: 10, opacity: 0.6, marginTop: -4, fontFamily: 'monospace' }}>
                          {p.canSell === false && p.canBuy === false && '⚠ NOT TRADED HERE'}
                          {p.canSell === false && p.canBuy !== false && '⚠ NOT SOLD HERE'}
                          {p.canBuy === false && p.canSell !== false && '⚠ NOT BOUGHT HERE'}
                          {!hasNav && isGated(id) && ' | REQUIRES NAVIGATION ARRAY'}
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MISSIONS SECTION */}
        {section === 'missions' && (
          <div className="scrollable-content">
            {/* Mission Arcs */}
            {stationMissions.length > 0 && (
              <div className="sci-fi-panel">
                <div className="section-header">Story Missions</div>
                <div style={{
                  padding: 12,
                  background: `${colors.primary}10`,
                  border: `1px solid ${colors.primary}30`,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 12,
                  opacity: 0.9,
                }}>
                  ℹ Story missions with choices that shape the system. Permanent consequences and unique rewards.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stationMissions.map(mission => {
                    const arc = missionArcs.find(a => a.id === mission.arcId);
                    const reqRepOk = !mission.requiredRep || Object.entries(mission.requiredRep).every(
                      ([stId, minRep]) => (stations.find(s => s.id === stId)?.reputation || 0) >= minRep
                    );
                    
                    return (
                      <div key={mission.id} style={{
                        padding: 16,
                        background: `${colors.primary}15`,
                        border: `2px solid ${colors.secondary}40`,
                        borderLeft: `5px solid ${colors.secondary}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: colors.secondary }}>
                            {arc?.name || 'Story Mission'} — Stage {mission.stage}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                            {mission.title}
                          </div>
                          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12, lineHeight: 1.5 }}>
                            {mission.description}
                          </div>
                        </div>
                        
                        {/* Objectives */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 6 }}>
                            OBJECTIVES:
                          </div>
                          {mission.objectives.map(obj => (
                            <div key={obj.id} style={{ 
                              fontSize: 12, 
                              marginBottom: 4, 
                              paddingLeft: 12,
                              opacity: obj.optional ? 0.7 : 1,
                            }}>
                              • {obj.description}{obj.optional && ' (Optional)'}
                            </div>
                          ))}
                        </div>
                        
                        {/* Rewards */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                          <div>
                            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4 }}>
                              REWARDS:
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                              ${mission.rewards.credits.toLocaleString()}
                            </div>
                            {Object.entries(mission.rewards.reputationChanges).length > 0 && (
                              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                                {Object.entries(mission.rewards.reputationChanges).map(([stId, change]) => (
                                  <span key={stId} style={{ 
                                    marginRight: 8,
                                    color: change > 0 ? '#10b981' : '#ef4444'
                                  }}>
                                    {change > 0 ? '+' : ''}{change} rep
                                  </span>
                                ))}
                              </div>
                            )}
                            {mission.requiredRep && !reqRepOk && (
                              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontFamily: 'monospace' }}>
                                ✗ Insufficient reputation
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (mission.type === 'choice') {
                                setChoiceMissionDialog(mission);
                              } else {
                                acceptMission(mission.id);
                              }
                            }}
                            disabled={!reqRepOk}
                            className="sci-fi-button"
                            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
                          >
                            {mission.type === 'choice' ? 'CHOOSE PATH' : 'ACCEPT MISSION'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Active Story Missions */}
            {activeMissions.length > 0 && (
              <div className="sci-fi-panel">
                <div className="section-header">Active Story Missions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeMissions.map(mission => {
                    const arc = missionArcs.find(a => a.id === mission.arcId);
                    const completedObjectives = mission.objectives.filter(o => o.completed).length;
                    const totalObjectives = mission.objectives.filter(o => !o.optional).length;
                    const progress = (completedObjectives / totalObjectives) * 100;
                    
                    return (
                      <div key={mission.id} style={{
                        padding: 16,
                        background: `${colors.primary}15`,
                        border: `2px solid ${colors.secondary}40`,
                        borderLeft: `5px solid ${progress >= 100 ? '#10b981' : colors.secondary}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: colors.secondary }}>
                            {arc?.name || 'Story Mission'} — Stage {mission.stage}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                            {mission.title}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          height: 8,
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}>
                          <div style={{
                            width: `${Math.min(100, progress)}%`,
                            height: '100%',
                            background: progress >= 100 ? '#22c55e' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                            transition: 'width 0.3s ease',
                            boxShadow: `0 0 10px ${progress >= 100 ? '#22c55e' : colors.glow}`,
                          }} />
                        </div>
                        
                        {/* Objectives */}
                        <div style={{ marginBottom: 12 }}>
                          {mission.objectives.map(obj => (
                            <div key={obj.id} style={{ 
                              fontSize: 12, 
                              marginBottom: 4,
                              paddingLeft: 12,
                              opacity: obj.completed ? 0.6 : 1,
                              textDecoration: obj.completed ? 'line-through' : 'none',
                            }}>
                              {obj.completed ? '✓' : '○'} {obj.description}
                              {obj.quantity && obj.quantity > 1 && ` (${obj.current}/${obj.quantity})`}
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => abandonMission(mission.id)} 
                            className="sci-fi-button"
                            style={{
                              background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.2))',
                              borderColor: '#ef4444',
                            }}
                          >
                            ABANDON
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Failed Story Missions */}
            {failedMissions.length > 0 && (
              <div className="sci-fi-panel">
                <div className="section-header" style={{ color: '#ef4444' }}>Failed Missions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {failedMissions.map(mission => {
                    const arc = missionArcs.find(a => a.id === mission.arcId);
                    
                    return (
                      <div key={mission.id} style={{
                        padding: 16,
                        background: 'rgba(239,68,68,0.1)',
                        border: '2px solid rgba(239,68,68,0.4)',
                        borderLeft: '5px solid #ef4444',
                        borderRadius: 8,
                      }}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}>
                            {arc?.name || 'Story Mission'} — Stage {mission.stage} — FAILED
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, textDecoration: 'line-through', opacity: 0.7 }}>
                            {mission.title}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.8, color: '#f87171' }}>
                            Mission failed. You can re-accept this mission to try again.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="sci-fi-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div className="section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                  Available Contracts
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <ReputationBadge reputation={station?.reputation || 0} label="Station Reputation" size="small" />
                  {station && (() => {
                    const factionId = getFactionForStation(station.id);
                    if (!factionId) return null;
                    const factionRep = getFactionReputation(factionId, stations);
                    const factionStanding = getFactionStanding(factionRep);
                    const standingDisplay = getFactionStandingDisplay(factionStanding);
                    const faction = FACTIONS[factionId];
                    return (
                      <div style={{
                        padding: '6px 12px',
                        background: `${standingDisplay.color}15`,
                        border: `1px solid ${standingDisplay.color}`,
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      title={`${faction.name}: ${standingDisplay.description}`}
                      >
                        <span style={{ opacity: 0.7 }}>Faction:</span>
                        <span style={{ color: standingDisplay.color, fontWeight: 600 }}>
                          {faction.name}
                        </span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span style={{ color: standingDisplay.color }}>
                          {standingDisplay.name}
                        </span>
                        <span style={{ opacity: 0.7 }}>({factionRep})</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div style={{
                padding: 12,
                background: `${colors.primary}10`,
                border: `1px solid ${colors.primary}30`,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 12,
                opacity: 0.9,
              }}>
                ℹ Accept delivery contracts for goods needed at this station. Rewards are guaranteed profitable.
              </div>

              {stationContracts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
                  ⚠ NO CONTRACTS AVAILABLE — CHECK BACK LATER
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stationContracts.map(c => {
                    const fromStation = stations.find(s => s.id === c.fromId);
                    const reqRepOk = !c.requiredRep || ((station?.reputation || 0) >= c.requiredRep);
                    return (
                      <div key={c.id} style={{
                        padding: 16,
                        background: `${colors.primary}10`,
                        border: `2px solid ${colors.primary}40`,
                        borderLeft: `4px solid ${colors.primary}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>
                              {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.8, fontFamily: 'monospace', marginBottom: 4 }}>
                              COMMODITY: <span style={{ color: colors.secondary }}>{c.commodityId.replace(/_/g, ' ')}</span>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.8, fontFamily: 'monospace', marginBottom: 4 }}>
                              QUANTITY: <span style={{ color: colors.secondary }}>{c.units} units</span>
                            </div>
                            {fromStation && (
                              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                                SOURCE: {fromStation.name}
                              </div>
                            )}
                            {c.requiredRep && c.requiredRep > 0 && (
                              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', color: reqRepOk ? '#10b981' : '#ef4444', marginTop: 4 }}>
                                {reqRepOk ? '✓' : '✗'} REQUIRES {c.requiredRep} REPUTATION
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>REWARD</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                              ${(c.rewardBonus || 0).toLocaleString()}
                            </div>
                            <button
                              onClick={() => acceptContract(c.id)}
                              disabled={!reqRepOk}
                              className="sci-fi-button"
                              style={{ marginTop: 8, padding: '8px 20px' }}
                            >
                              ACCEPT
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Contracts */}
            <div className="sci-fi-panel">
              <div className="section-header">Active Contracts</div>
              {contracts.filter(c => c.status === 'accepted').length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, opacity: 0.7, fontFamily: 'monospace' }}>
                  NO ACTIVE CONTRACTS
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {contracts.filter(c => c.status === 'accepted').map(c => {
                    const destStation = stations.find(s => s.id === c.toId);
                    const delivered = c.deliveredUnits || 0;
                    const remaining = c.units - delivered;
                    const progress = (delivered / c.units) * 100;
                    return (
                      <div key={c.id} style={{
                        padding: 16,
                        background: `${colors.primary}10`,
                        border: `2px solid ${colors.primary}40`,
                        borderLeft: `4px solid ${progress >= 100 ? '#10b981' : colors.primary}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>
                              {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                            </div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>
                              PROGRESS: <span style={{ color: progress >= 100 ? '#10b981' : colors.secondary, fontWeight: 700 }}>
                                {delivered} / {c.units}
                              </span> units
                            </div>
                            <div style={{
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: 4,
                              height: 8,
                              overflow: 'hidden',
                              marginBottom: 8,
                            }}>
                              <div style={{
                                width: `${Math.min(100, progress)}%`,
                                height: '100%',
                                background: progress >= 100 ? '#22c55e' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                                transition: 'width 0.3s ease',
                                boxShadow: `0 0 10px ${progress >= 100 ? '#22c55e' : colors.glow}`,
                              }} />
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                              DESTINATION: {destStation?.name || c.toId}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                            <button onClick={() => setTrackedStation(c.toId)} className="sci-fi-button">
                              SET WAYPOINT
                            </button>
                            <button onClick={() => abandonContract(c.id)} className="sci-fi-button" style={{
                              background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.2))',
                              borderColor: '#ef4444',
                            }}>
                              ABANDON
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Mission Choice Dialog */}
      {choiceMissionDialog && (
        <MissionChoiceDialog
          mission={choiceMissionDialog}
          onChoose={(choiceId) => {
            makeMissionChoice(choiceMissionDialog.id, choiceId);
            setChoiceMissionDialog(null);
          }}
          onCancel={() => setChoiceMissionDialog(null)}
        />
      )}
    </>
  );
}
