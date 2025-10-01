import { useEffect, useMemo, useState, Fragment } from 'react';
import { useGameStore } from '../state';
import { shipCaps, shipBaseStats } from '../state';
import { getPriceBiasForStation, gatedCommodities } from '../systems/economy/pricing';
import { processRecipes } from '../systems/economy/recipes';
import type { StationType } from '../domain/types/economy_types';
import { CONTRACT_REFRESH_INTERVAL } from '../domain/constants/contract_constants';
import { ReputationBadge } from './components/reputation_badge';

function getHallLabel(type: StationType): string {
  if (type === 'city') return 'Civic Exchange';
  if (type === 'refinery') return 'Refinery Office';
  if (type === 'fabricator') return 'Assembly Exchange';
  if (type === 'farm') return 'Co-op Market';
  if (type === 'power_plant') return 'Grid Exchange';
  if (type === 'trading_post') return 'Bazaar';
  if (type === 'shipyard') return 'Shipyard Office';
  if (type === 'pirate') return 'Quarterdeck Market';
  return 'Trading Hall';
}

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

  const station = useMemo(() => stations.find(s => s.id === ship.dockedStationId), [stations, ship.dockedStationId]);
  const persona = station?.persona;
  const personaLine = useMemo(() => {
    if (!persona) return undefined;
    const rep = station?.reputation || 0;
    const tier = rep >= 70 ? 'high' : rep >= 30 ? 'mid' : 'low';
    const lines = tier === 'high' ? (persona.lines_high || []) : tier === 'mid' ? (persona.lines_mid || []) : (persona.lines_low || []);
    const tips = tier === 'high' ? (persona.tips_high || []) : tier === 'mid' ? (persona.tips_mid || []) : (persona.tips_low || []);
    const fallback = [...(persona.lines || []), ...(persona.tips || [])];
    const pool = [...lines, ...tips, ...fallback];
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [station?.id, station?.reputation]);

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

  const [section, setSection] = useState<'hall' | 'fabrication' | 'production' | 'missions'>('hall');
  useEffect(() => {
    setSection('hall');
  }, [station?.id]);
  useEffect(() => {
    if (section === 'fabrication' && !hasFabrication) setSection('hall');
    if (section === 'production' && !hasProduction) setSection('hall');
  }, [section, hasFabrication, hasProduction]);

  if (!station) {
    return (
      <div className="panel">
        <div><strong>Credits:</strong> {ship.credits.toLocaleString()}</div>
        <div><strong>Cargo:</strong> {Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}</div>
        <div>Fly near a station and press E to dock. Q to undock.</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><strong>Docked:</strong> {station.name}</div>
        <button onClick={undock}>Undock (Q)</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Credits:</strong> {ship.credits.toLocaleString()} | <strong>Cargo:</strong> {Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}
        {station && (
          <span style={{ marginLeft: 8, opacity: 0.85 }}>
            <strong>Reputation @ {station.name}:</strong> {(station.reputation || 0).toFixed(0)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setSection('hall')} disabled={section === 'hall'}>{hallLabel}</button>
        {hasFabrication && (
          <button onClick={() => setSection('fabrication')} disabled={section === 'fabrication'}>Fabrication</button>
        )}
        {hasProduction && (
          <button onClick={() => setSection('production')} disabled={section === 'production'}>Production</button>
        )}
        <button onClick={() => setSection('missions')} disabled={section === 'missions'}>
          Missions {stationContracts.length > 0 && `(${stationContracts.length})`}
        </button>
      </div>

      {section === 'hall' && (
        <>
          {persona && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(12,15,22,0.9)', border: '1px solid #1f2937', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{persona.name}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{persona.title}</div>
              <div style={{ opacity: 0.8, marginLeft: 'auto', fontStyle: 'italic', fontSize: 12 }}>{personaLine}</div>
            </div>
          )}
          {station.type === 'shipyard' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Shipyard</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ opacity: 0.8 }}>Current Ship: {ship.kind}</div>
                <div></div>
                <div></div>
                <div style={{ gridColumn: '1 / span 3', opacity: 0.8 }}>
                  <div style={{ margin: '6px 0 2px' }}>
                    <strong>Ranges</strong> (min → max)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ opacity: 0.7 }}>Freighter</div>
                      <div>Acc: {shipBaseStats.freighter.acc} → {shipCaps.freighter.acc}</div>
                      <div>Vmax: {shipBaseStats.freighter.vmax} → {shipCaps.freighter.vmax}</div>
                      <div>Cargo: {shipBaseStats.freighter.cargo} → {shipCaps.freighter.cargo}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7 }}>Clipper</div>
                      <div>Acc: {shipBaseStats.clipper.acc} → {shipCaps.clipper.acc}</div>
                      <div>Vmax: {shipBaseStats.clipper.vmax} → {shipCaps.clipper.vmax}</div>
                      <div>Cargo: {shipBaseStats.clipper.cargo} → {shipCaps.clipper.cargo}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7 }}>Miner</div>
                      <div>Acc: {shipBaseStats.miner.acc} → {shipCaps.miner.acc}</div>
                      <div>Vmax: {shipBaseStats.miner.vmax} → {shipCaps.miner.vmax}</div>
                      <div>Cargo: {shipBaseStats.miner.cargo} → {shipCaps.miner.cargo}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7 }}>Heavy Freighter</div>
                      <div>Acc: {shipBaseStats.heavy_freighter.acc} → {shipCaps.heavy_freighter.acc}</div>
                      <div>Vmax: {shipBaseStats.heavy_freighter.vmax} → {shipCaps.heavy_freighter.vmax}</div>
                      <div>Cargo: {shipBaseStats.heavy_freighter.cargo} → {shipCaps.heavy_freighter.cargo}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7 }}>Racer</div>
                      <div>Acc: {shipBaseStats.racer.acc} → {shipCaps.racer.acc}</div>
                      <div>Vmax: {shipBaseStats.racer.vmax} → {shipCaps.racer.vmax}</div>
                      <div>Cargo: {shipBaseStats.racer.cargo} → {shipCaps.racer.cargo}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7 }}>Industrial Miner</div>
                      <div>Acc: {shipBaseStats.industrial_miner.acc} → {shipCaps.industrial_miner.acc}</div>
                      <div>Vmax: {shipBaseStats.industrial_miner.vmax} → {shipCaps.industrial_miner.vmax}</div>
                      <div>Cargo: {shipBaseStats.industrial_miner.cargo} → {shipCaps.industrial_miner.cargo}</div>
                    </div>
                  </div>
                </div>
                <div>Acceleration: {ship.stats.acc.toFixed(1)}</div>
                <div>$1,000</div>
                <button onClick={() => upgrade('acc', 3, 1000)}>Buy +3</button>
                <div>Max Speed: {ship.stats.vmax.toFixed(1)}</div>
                <div>$1,000</div>
                <button onClick={() => upgrade('vmax', 3, 1000)}>Buy +3</button>
                <div>Cargo Capacity: {ship.maxCargo}</div>
                <div>$1,200</div>
                <button onClick={() => upgrade('cargo', 50, 1200)}>Buy +50</button>
                <div>Mining Rig: {ship.canMine ? 'Installed' : 'Not installed'}</div>
                <div>$25,000</div>
                <button onClick={() => upgrade('mining', 0, 25000)} disabled={ship.canMine}>{ship.canMine ? 'Owned' : 'Buy'}</button>
                <div>Navigation Array: {ship.hasNavigationArray ? 'Installed' : 'Not installed'}</div>
                <div>$5,000</div>
                <button onClick={() => upgrade('navigation', 0, 5000)} disabled={!!ship.hasNavigationArray}>{ship.hasNavigationArray ? 'Owned' : 'Buy'}</button>
                <div>Mercantile Data Nexus: {hasIntel ? 'Installed' : 'Not installed'}</div>
                <div>$2,500</div>
                <button onClick={() => upgrade('intel' as any, 0, 2500)} disabled={hasIntel}>{hasIntel ? 'Owned' : 'Buy'}</button>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Replace Ship</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                <div>Freighter (cargo 300, acc 10, vmax 11)</div>
                <div>$20,000</div>
                <button onClick={() => replaceShip('freighter', 20000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
                <div>Clipper (cargo 60, acc 18, vmax 20)</div>
                <div>$20,000</div>
                <button onClick={() => replaceShip('clipper', 20000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
                <div>Miner (cargo 80, acc 9, vmax 11, mining rig)</div>
                <div>$10,000</div>
                <button onClick={() => replaceShip('miner', 10000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
                <div>Heavy Freighter (cargo 600, acc 9, vmax 12)</div>
                <div>$60,000</div>
                <button onClick={() => replaceShip('heavy_freighter', 60000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
                <div>Racer (cargo 40, acc 24, vmax 28)</div>
                <div>$50,000</div>
                <button onClick={() => replaceShip('racer', 50000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
                <div>Industrial Miner (cargo 160, acc 10, vmax 12, mining rig)</div>
                <div>$40,000</div>
                <button onClick={() => replaceShip('industrial_miner', 40000)} disabled={Object.values(ship.cargo).reduce((a,b)=>a+b,0) > 0}>Buy</button>
              </div>
            </div>
          )}
          {station.type === 'city' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>City Services</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                <div>Union Membership: {hasUnion ? 'Member' : 'Not a member'}</div>
                <div>$1,500</div>
                <button onClick={() => upgrade('union' as any, 0, 1500)} disabled={hasUnion}>{hasUnion ? 'Owned' : 'Buy'}</button>
              </div>
            </div>
          )}
          {otherItems.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Other traded goods</div>
              <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                <div style={{ fontWeight: 700 }}>Commodity</div>
                <div style={{ fontWeight: 700 }}>Buy/Sell</div>
                <div style={{ fontWeight: 700 }}>Held</div>
                <div style={{ fontWeight: 700 }}>Actions</div>
                {otherItems.map(([id, p]) => {
                  const bias = getPriceBiasForStation(station.type, id);
                  const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
                  // Show rep-adjusted per-unit prices: buy gets discount; sell gets premium
                  const rep = station.reputation || 0;
                  const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (rep / 100)));
                  const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (rep / 100)));
                  const adjBuy = Math.max(1, Math.round(p.buy * (1 - buyDiscount)));
                  const adjSell = Math.max(1, Math.round(p.sell * (1 + sellPremium)));
                  return (
                    <Fragment key={id}>
                      <div key={id+':n'} style={{textTransform:'capitalize'}}>{id.replace(/_/g,' ')}</div>
                      <div key={id+':p'} style={{ color }}>
                        <span>${adjBuy}</span>
                        <span style={{ opacity: 0.7 }}> / ${adjSell}</span>
                      </div>
                      <div key={id+':h'}>{ship.cargo[id] || 0}</div>
                      <div key={id+':a'}>
                        <button
                          onClick={() => buy(id, qty)}
                          style={{ marginRight: 6 }}
                          disabled={p.canSell === false || (!hasNav && isGated(id))}
                        >Buy {qty}</button>
                        <button
                          onClick={() => sell(id, qty)}
                          disabled={p.canBuy === false || (!hasNav && isGated(id))}
                        >Sell {qty}</button>
                        {(p.canSell === false || p.canBuy === false) && (
                          <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>
                            {p.canSell === false && p.canBuy === false ? 'Not traded here' : p.canSell === false ? 'Not sold here' : 'Not bought here'}
                          </span>
                        )}
                        {!hasNav && isGated(id) && (
                          <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>
                            Requires Navigation Array
                          </span>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {section === 'fabrication' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Fabrication</div>
          {recipes.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No fabrication available at this station.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, alignItems: 'center' }}>
              {recipes.map(r => {
                const have = ship.cargo[r.inputId] || 0;
                const canMake = Math.floor(have / r.inputPerOutput);
                const outIsGated = isGated(r.outputId);
                const unionBlocked = !isPirate && !hasUnion;
                const navBlocked = !hasNav && outIsGated;
                return (
                  <Fragment key={r.inputId}>
                    <div key={r.inputId+':label'} style={{ textTransform: 'capitalize' }}>
                      {r.inputId.replace(/_/g,' ')} → {r.outputId.replace(/_/g,' ')}
                      <span style={{ opacity: 0.7 }}> ( {r.inputPerOutput}:1 )</span>
                    </div>
                    <div key={r.inputId+':have'} style={{ opacity: 0.8 }}>Have {have} {r.inputId.replace(/_/g,' ')}</div>
                    <div key={r.inputId+':btn'}>
                      <button onClick={() => process(r.inputId, 1)} disabled={canMake <= 0 || unionBlocked || navBlocked}>Make 1</button>
                      {(unionBlocked || navBlocked) && (
                        <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>
                          {!isPirate && !hasUnion ? 'Requires Union Membership' : ''}
                          {!hasNav && outIsGated ? ( !isPirate && !hasUnion ? ' / ' : '' ) + 'Requires Navigation Array' : ''}
                        </span>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === 'production' && producedItems.length > 0 && (
        <>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Trade amount</div>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              style={{ width: 72, padding: '2px 4px' }}
            />
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Produced here</div>
            <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div style={{ fontWeight: 700 }}>Commodity</div>
              <div style={{ fontWeight: 700 }}>Buy/Sell</div>
              <div style={{ fontWeight: 700 }}>Held</div>
              <div style={{ fontWeight: 700 }}>Actions</div>
              {producedItems.map(([id, p]) => {
                const bias = getPriceBiasForStation(station.type, id);
                const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
                // Rep-adjusted per-unit prices for produced items
                const rep = station.reputation || 0;
                const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (rep / 100)));
                const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (rep / 100)));
                const adjBuy = Math.max(1, Math.round(p.buy * (1 - buyDiscount)));
                const adjSell = Math.max(1, Math.round(p.sell * (1 + sellPremium)));
                return (
                  <Fragment key={id}>
                    <div key={id+':n'} style={{textTransform:'capitalize'}}>{id.replace(/_/g,' ')}</div>
                    <div key={id+':p'} style={{ color }}>
                      <span>${adjBuy}</span>
                      <span style={{ opacity: 0.7 }}> / ${adjSell}</span>
                    </div>
                    <div key={id+':h'}>{ship.cargo[id] || 0}</div>
                    <div key={id+':a'}>
                      <button
                        onClick={() => buy(id, qty)}
                        style={{ marginRight: 6 }}
                        disabled={p.canSell === false || (!hasNav && isGated(id))}
                      >Buy {qty}</button>
                      <button
                        onClick={() => sell(id, qty)}
                        disabled={p.canBuy === false || (!hasNav && isGated(id))}
                      >Sell {qty}</button>
                      {(p.canSell === false || p.canBuy === false) && (
                        <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>
                          {p.canSell === false && p.canBuy === false ? 'Not traded here' : p.canSell === false ? 'Not sold here' : 'Not bought here'}
                        </span>
                      )}
                      {!hasNav && isGated(id) && (
                        <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 12 }}>
                          Requires Navigation Array
                        </span>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        </>
      )}

      {section === 'missions' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700 }}>Available Missions</div>
            <ReputationBadge reputation={station?.reputation || 0} label="Station Reputation" size="small" />
          </div>
          <div style={{ marginBottom: 8, opacity: 0.85, fontSize: 13 }}>
            Accept delivery contracts for goods needed at this station. Rewards are guaranteed profitable.
          </div>
          {stationContracts.length === 0 ? (
            <div style={{ opacity: 0.7, padding: '12px 0' }}>No missions available at this station. Check back in a few minutes.</div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
              <div style={{ fontWeight: 700 }}>Mission</div>
              <div style={{ fontWeight: 700 }}>Commodity</div>
              <div style={{ fontWeight: 700 }}>Units</div>
              <div style={{ fontWeight: 700 }}>Reward</div>
              <div style={{ fontWeight: 700 }}>Actions</div>
              {stationContracts.map(c => {
                const fromStation = stations.find(s => s.id === c.fromId);
                const reqRepOk = !c.requiredRep || ((station?.reputation || 0) >= c.requiredRep);
                return (
                  <Fragment key={c.id}>
                    <div style={{ textTransform: 'capitalize' }}>
                      {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                      {c.requiredRep && c.requiredRep > 0 && (
                        <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 6 }}>
                          (Rep {c.requiredRep}+)
                        </span>
                      )}
                    </div>
                    <div style={{ textTransform: 'capitalize' }}>
                      {c.commodityId.replace(/_/g, ' ')}
                      {fromStation && (
                        <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>
                          from {fromStation.name}
                        </span>
                      )}
                    </div>
                    <div>{c.units}</div>
                    <div>${(c.rewardBonus || 0).toLocaleString()}</div>
                    <div>
                      <button
                        onClick={() => acceptContract(c.id)}
                        disabled={!reqRepOk}
                        title={!reqRepOk ? `Requires ${c.requiredRep} reputation at this station` : undefined}
                      >
                        Accept
                      </button>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 12, fontWeight: 700, marginBottom: 6 }}>Active Missions</div>
          {contracts.filter(c => c.status === 'accepted').length === 0 ? (
            <div style={{ opacity: 0.7 }}>No active missions.</div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div style={{ fontWeight: 700 }}>Mission</div>
              <div style={{ fontWeight: 700 }}>Progress</div>
              <div style={{ fontWeight: 700 }}>Destination</div>
              <div style={{ fontWeight: 700 }}>Actions</div>
              {contracts.filter(c => c.status === 'accepted').map(c => {
                const destStation = stations.find(s => s.id === c.toId);
                const delivered = c.deliveredUnits || 0;
                const remaining = c.units - delivered;
                const progress = (delivered / c.units) * 100;
                return (
                  <Fragment key={c.id}>
                    <div style={{ textTransform: 'capitalize' }}>
                      {c.title || `Deliver ${c.commodityId.replace(/_/g, ' ')}`}
                      <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 4, overflow: 'hidden', width: '100%' }}>
                        <div style={{ 
                          width: `${Math.min(100, progress)}%`, 
                          height: '100%', 
                          background: progress >= 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    <div>
                      <div>{delivered} / {c.units} delivered</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{remaining} remaining</div>
                    </div>
                    <div>{destStation?.name || c.toId}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setTrackedStation(c.toId)}>Waypoint</button>
                      <button onClick={() => abandonContract(c.id)}>Abandon</button>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === 'hall' && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Trade amount</div>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            style={{ width: 72, padding: '2px 4px' }}
          />
          <button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
          <button onClick={() => setQty(q => q + 1)}>+</button>
        </div>
      )}
    </div>
  );
}


