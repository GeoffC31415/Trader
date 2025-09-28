import { useEffect, useMemo, useState } from 'react';
import { usePoll } from './use_poll';
import { useGameStore } from '../state/game_state';

export function JournalPanel() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const tradeLog = useGameStore(s => s.tradeLog);
  const profitByCommodity = useGameStore(s => s.profitByCommodity);
  const getSuggestedRoutes = useGameStore(s => s.getSuggestedRoutes);
  const routesPoll = usePoll(2000);

  const [tab, setTab] = useState<'ship' | 'trades' | 'routes'>('ship');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const cargoCount = useMemo(() => Object.values(ship.cargo).reduce((a,b)=>a+b,0), [ship.cargo]);
  const cargoEntries = useMemo(() => Object.entries(ship.cargo)
    .filter(([,q]) => (q||0) > 0)
    .sort((a,b) => a[0].localeCompare(b[0]))
  , [ship.cargo]);

  const reversed = useMemo(() => tradeLog.slice().reverse(), [tradeLog]);
  const pageCount = Math.max(1, Math.ceil(reversed.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const start = (page - 1) * pageSize;
  const pageRows = reversed.slice(start, start + pageSize);

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setTab('ship')} style={{ fontWeight: tab==='ship'?700:400 }}>Ship</button>
        <button onClick={() => setTab('trades')} style={{ fontWeight: tab==='trades'?700:400 }}>Trading Log</button>
        <button onClick={() => setTab('routes')} style={{ fontWeight: tab==='routes'?700:400 }}>Routes</button>
      </div>
      {tab === 'ship' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <div><strong>Credits:</strong> {ship.credits.toLocaleString()}</div>
            <div><strong>Cargo:</strong> {cargoCount} / {ship.maxCargo}</div>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Upgrades</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
            <div>Acceleration</div><div>{ship.stats.acc.toFixed(1)}</div>
            <div>Max Speed</div><div>{ship.stats.vmax.toFixed(1)}</div>
            <div>Drag</div><div>{ship.stats.drag.toFixed(2)}</div>
            <div>Cargo Capacity</div><div>{ship.maxCargo}</div>
          </div>
          <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 4 }}>Cargo Hold</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr auto' }}>
            <div style={{ fontWeight: 700 }}>Commodity</div>
            <div style={{ fontWeight: 700 }}>Quantity</div>
            {cargoEntries.length === 0 ? (
              <>
                <div key={'empty:c'} style={{ opacity: 0.7 }}>Empty</div>
                <div key={'empty:q'} />
              </>
            ) : cargoEntries.map(([id, q]) => (
              <>
                <div key={id+':n'} style={{ textTransform:'capitalize' }}>{id.replace(/_/g,' ')}</div>
                <div key={id+':q'}>{q}</div>
              </>
            ))}
          </div>
        </div>
      )}
      {tab === 'trades' && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Trade Log</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
            <div style={{ fontWeight: 700 }}>Time</div>
            <div style={{ fontWeight: 700 }}>Station</div>
            <div style={{ fontWeight: 700 }}>Item</div>
            <div style={{ fontWeight: 700 }}>Type</div>
            <div style={{ fontWeight: 700 }}>Qty @ Price</div>
            {pageRows.map(t => (
              <>
                <div key={t.id+':time'}>{new Date(t.time).toLocaleTimeString()}</div>
                <div key={t.id+':st'}>{t.stationName}</div>
                <div key={t.id+':it'} style={{textTransform:'capitalize'}}>{t.commodityId.replace(/_/g,' ')}</div>
                <div key={t.id+':ty'} style={{ color: t.type==='buy' ? '#3b82f6' : '#f59e0b' }}>{t.type.toUpperCase()}</div>
                <div key={t.id+':qt'}>{t.quantity} @ ${t.unitPrice} = ${t.totalPrice}</div>
              </>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page<=1}>Prev</button>
            <div>Page {page} / {pageCount}</div>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page>=pageCount}>Next</button>
          </div>
          <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>Profits by Commodity</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr auto' }}>
            <div style={{ fontWeight: 700 }}>Commodity</div>
            <div style={{ fontWeight: 700 }}>Credits</div>
            {Object.entries(profitByCommodity).sort((a,b)=> (b[1]||0)-(a[1]||0)).map(([id, p]) => (
              <>
                <div key={id+':n'} style={{textTransform:'capitalize'}}>{id.replace(/_/g,' ')}</div>
                <div key={id+':p'} style={{ color: (p||0) >= 0 ? '#10b981' : '#ef4444' }}>{(p||0).toFixed(0)}</div>
              </>
            ))}
          </div>
        </div>
      )}
      {tab === 'routes' && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Suggested Routes</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
            <div style={{ fontWeight: 700 }}>Plan</div>
            <div style={{ fontWeight: 700 }}>Units</div>
            <div style={{ fontWeight: 700 }}>Unit Margin</div>
            <div style={{ fontWeight: 700 }}>Est. Profit</div>
            {routesPoll && getSuggestedRoutes({ limit: 10, prioritizePerDistance: true }).map(r => (
              <>
                <div key={r.id+':plan'}>
                  {r.kind === 'direct'
                    ? `Buy ${r.maxUnits} ${r.inputId.replace(/_/g,' ')} at ${r.fromName} → Sell at ${r.toName}`
                    : (() => {
                        const inputUnits = Math.ceil(r.maxUnits * r.inputPerOutput);
                        return `Buy ${inputUnits} ${r.inputId.replace(/_/g,' ')} at ${r.fromName} → Process at ${r.viaName} → Sell ${r.maxUnits} ${r.outputId.replace(/_/g,' ')} at ${r.toName}`;
                      })()
                  }
                </div>
                <div key={r.id+':u'}>{r.maxUnits}</div>
                <div key={r.id+':m'}>${r.unitMargin.toFixed(0)}</div>
                <div key={r.id+':p'}>${r.estProfit.toFixed(0)}</div>
                <div key={r.id+':details'} style={{ gridColumn: '1 / -1', opacity: 0.8 }}>
                  {r.kind === 'direct' ? (
                    <>
                      <span style={{ textTransform:'capitalize' }}>{r.inputId.replace(/_/g,' ')}</span>
                      {` per unit: buy @ $${r.unitBuy.toFixed(0)} → sell @ $${r.unitSell.toFixed(0)}`}
                    </>
                  ) : (
                    (() => {
                      const inputUnits = Math.ceil(r.maxUnits * r.inputPerOutput);
                      const inputName = r.inputId.replace(/_/g,' ');
                      const outputName = r.outputId.replace(/_/g,' ');
                      return (
                        <>
                          <span style={{ textTransform:'capitalize' }}>{inputName}</span>
                          {` → ${outputName}: buy ${inputUnits} @ $${r.unitBuy.toFixed(0)} at ${r.fromName} → process ${r.inputPerOutput}:1 at ${r.viaName} → sell ${r.maxUnits} @ $${r.unitSell.toFixed(0)} at ${r.toName}`}
                        </>
                      );
                    })()
                  )}
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


