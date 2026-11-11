import { useState } from 'react';
import { useGameStore } from '../../../state';
import { humanize } from '../../../systems/journal';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import type { Station } from '../../../domain/types/world_types';

const EMPTY: Record<string, number> = {};
export function WarehouseSection({ station }: { station: Station }) {
  const cargo = useGameStore(s => s.ship.cargo), stored = useGameStore(s => s.finance?.warehouses[station.id]?.goods ?? EMPTY);
  const transfer = useGameStore(s => s.transferWarehouse);
  const [quantity, setQuantity] = useState(1), [query, setQuery] = useState('');
  const goods = [...new Set([...Object.keys(cargo), ...Object.keys(stored)])].filter(id => ((cargo[id] ?? 0) > 0 || (stored[id] ?? 0) > 0) && humanize(id).toLowerCase().includes(query.toLowerCase())).sort();
  return <SciFiPanel stationType={station.type}><SectionHeader stationType={station.type}>Local warehouse · {station.name}</SectionHeader>
    <p>Free, secure, climate-controlled storage. Goods stay at this station; fly them yourself to move them elsewhere. Storage preserves existing freshness, not spoilage already incurred. Withdrawals require hold space and the usual cargo equipment.</p>
    <div className="j-toolbar"><label>Transfer units <input aria-label="Warehouse transfer quantity" type="number" min={1} step={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label><input type="search" aria-label="Search warehouse" placeholder="Find stored or onboard goods…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="j-table-wrap"><table><caption>Local cargo storage</caption><thead><tr><th>Goods</th><th>On ship</th><th>Here in storage</th><th>Transfer</th></tr></thead><tbody>{goods.map(id => <tr key={id}><th>{humanize(id)}</th><td>{cargo[id] ?? 0}</td><td>{stored[id] ?? 0}</td><td><button disabled={(cargo[id] ?? 0) < quantity || !Number.isSafeInteger(quantity) || quantity <= 0} onClick={() => transfer(id, quantity, 'store')}>Store {humanize(id)}</button> <button disabled={(stored[id] ?? 0) < quantity || !Number.isSafeInteger(quantity) || quantity <= 0} onClick={() => transfer(id, quantity, 'retrieve')}>Retrieve {humanize(id)}</button></td></tr>)}</tbody></table></div>
    {!goods.length && <p>No matching cargo here or in your hold. Buy or collect goods, then store them at this port.</p>}
  </SciFiPanel>;
}
