import { useMemo, useState } from 'react';
import { useGameStore } from '../state/game_state';
import { getPriceBiasForStation } from '../systems/economy';

export function MarketPanel() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const buy = useGameStore(s => s.buy);
  const sell = useGameStore(s => s.sell);
  const undock = useGameStore(s => s.undock);
  const process = useGameStore(s => s.process);
  const upgrade = useGameStore(s => s.upgrade);

  const [qty, setQty] = useState<number>(1);

  const station = useMemo(() => stations.find(s => s.id === ship.dockedStationId), [stations, ship.dockedStationId]);

  if (!station) {
    return (
      <div className="panel">
        <div><strong>Credits:</strong> {ship.credits.toLocaleString()}</div>
        <div><strong>Cargo:</strong> {Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}</div>
        <div>Fly near a station and press E to dock. Q to undock.</div>
      </div>
    );
  }

  const items = Object.entries(station.inventory);
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><strong>Docked:</strong> {station.name}</div>
        <button onClick={undock}>Undock (Q)</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Credits:</strong> {ship.credits.toLocaleString()} | <strong>Cargo:</strong> {Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}
      </div>
      {station.type === 'shipyard' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Shipyard Upgrades</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
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
          </div>
        </div>
      )}
      {/* Simple processing controls: try some common transforms if present in cargo */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Fabrication</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['iron_ore','copper_ore','silicon','hydrogen','steel','electronics','plastics','refined_fuel','data_drives']
            .filter(id => (ship.cargo[id]||0) > 0)
            .map(id => (
              <button key={id} onClick={() => process(id, 1)}>Process 1 {id.replace(/_/g,' ')}</button>
            ))}
        </div>
      </div>
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
      <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
        <div style={{ fontWeight: 700 }}>Commodity</div>
        <div style={{ fontWeight: 700 }}>Buy/Sell</div>
        <div style={{ fontWeight: 700 }}>Held</div>
        <div style={{ fontWeight: 700 }}>Actions</div>
        {items.map(([id, p]) => {
          const bias = getPriceBiasForStation(station.type, id);
          const color = bias === 'cheap' ? '#10b981' : bias === 'expensive' ? '#ef4444' : undefined;
          return (
            <>
              <div key={id+':n'} style={{textTransform:'capitalize'}}>{id.replace(/_/g,' ')}</div>
              <div key={id+':p'} style={{ color }}>
                <span>${p.buy}</span>
                <span style={{ opacity: 0.7 }}> / ${p.sell}</span>
              </div>
              <div key={id+':h'}>{ship.cargo[id] || 0}</div>
              <div key={id+':a'}>
                <button onClick={() => buy(id, qty)} style={{ marginRight: 6 }}>Buy {qty}</button>
                <button onClick={() => sell(id, qty)}>Sell {qty}</button>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}


