import { useMemo, Fragment } from 'react';
import { usePoll } from '../shared/hooks/use_poll';
import { useGameStore } from '../state';

type Vec3 = [number, number, number];

function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

export function TradersPanel() {
  const npcTraders = useGameStore(s => s.npcTraders);
  const stations = useGameStore(s => s.stations);
  const hasIntel = useGameStore(s => !!s.ship.hasMarketIntel);
  if (!hasIntel) {
    return (
      <div className="panel">
        <div style={{ opacity: 0.8 }}>Requires ship upgrade: Mercantile Data Nexus (buy at Shipyard).</div>
      </div>
    );
  }
  const poll = usePoll(2000);

  const stationById = useMemo(() => Object.fromEntries(stations.map(s => [s.id, s])), [stations]);

  const rows = useMemo(() => {
    const deliverUnits = 3; // matches NPC delivery amount in tick()
    return npcTraders.map(npc => {
      const from = stationById[npc.fromId];
      const to = stationById[npc.toId];
      const fromInv = from?.inventory[npc.commodityId];
      const toInv = to?.inventory[npc.commodityId];
      const unitBuy = fromInv?.buy ?? 0;
      const unitSell = toInv?.sell ?? 0;
      const unitMargin = unitSell - unitBuy;
      const dist = (from && to) ? distance(from.position as any, to.position as any) : 0;
      const travelTime = npc.speed > 0 ? dist / npc.speed : 0;
      const tripProfit = unitMargin * deliverUnits;
      const profitPerSec = travelTime > 0 ? tripProfit / travelTime : 0;
      return {
        id: npc.id,
        route: from && to ? `${from.name} → ${to.name}` : `${npc.fromId} → ${npc.toId}`,
        commodityId: npc.commodityId,
        unitMargin,
        tripProfit,
        profitPerSec,
        dist,
      };
    }).sort((a, b) => b.profitPerSec - a.profitPerSec);
  }, [npcTraders, stationById, poll]);

  return (
    <div className="panel">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>NPC Traders</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
        <div style={{ fontWeight: 700 }}>Route</div>
        <div style={{ fontWeight: 700 }}>Commodity</div>
        <div style={{ fontWeight: 700 }}>Unit Margin</div>
        <div style={{ fontWeight: 700 }}>Est. Profit/sec</div>
        {rows.map(r => (
          <Fragment key={r.id}>
            <div>{r.route}</div>
            <div style={{ textTransform:'capitalize' }}>{r.commodityId.replace(/_/g,' ')}</div>
            <div style={{ color: r.unitMargin >= 0 ? '#10b981' : '#ef4444' }}>${r.unitMargin.toFixed(0)}</div>
            <div style={{ color: r.profitPerSec >= 0 ? '#10b981' : '#ef4444' }}>${r.profitPerSec.toFixed(1)}</div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}


