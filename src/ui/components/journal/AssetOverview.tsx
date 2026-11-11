import type { GameState } from '../../../domain/types/world_types';
import { netAssetValue } from '../../../systems/finance';
import { humanize } from '../../../systems/journal';
import { HistoryChart, simTime } from './JournalCharts';
import './assets.css';
const money = (value: number) => `${(value === 0 ? 0 : value).toLocaleString(undefined, { maximumFractionDigits: 2 })} cr`;
export function AssetOverview({ s }: { s: GameState }) {
  const value = netAssetValue(s), history = s.finance?.navHistory ?? [];
  const current = { at: s.gameTime, value: value.total };
  const points = [...(history[history.length - 1]?.at === s.gameTime ? history.slice(0, -1) : history), current];
  const min = Math.min(...points.map(p => p.value)), max = Math.max(...points.map(p => p.value));
  const margin = Math.max(100, (max - min) * .15, Math.abs(max) * .01);
  return <section className="asset-overview j-card" aria-label="Net asset value overview">
    <div className="asset-title"><div><small>CONSOLIDATED COMMAND EQUITY</small><h2>Net asset value</h2></div><strong className={value.total < 0 ? 'j-loss' : 'j-gain'}>{money(value.total)}</strong></div>
    <HistoryChart label="Net asset value over time" range={[min - margin, max + margin]} series={[{ name: 'Net assets', color: '#e9c67d', points: points.map(p => ({ x: p.at, y: p.value, label: `${simTime(p.at)} · ${money(p.value)}` })) }]} />
    <div className="asset-metrics">{([['Onboard cash', value.cash], ['Bank savings', value.savings], ['Investments', value.investments], ['Ship hull', value.hull], ['Installed upgrades', value.modules], ['Ship / escort goods', value.cargo], ['Station warehouses', value.stored], ['Loan liability', -value.debt]] as const).map(([label, amount]) => <div key={label}><small>{label}</small><strong className={amount < 0 ? 'j-loss' : ''}>{money(amount)}</strong></div>)}</div>
    <details><summary>Stored goods by station</summary><div className="j-table-wrap"><table><caption>Warehouse inventory across the system</caption><thead><tr><th>Station</th><th>Stored goods</th><th>Navigation</th></tr></thead><tbody>{Object.entries(s.finance?.warehouses ?? {}).filter(([, w]) => Object.values(w.goods).some(q => q > 0)).map(([id, w]) => <tr key={id}><th>{s.stations.find(st => st.id === id)?.name ?? id}</th><td>{Object.entries(w.goods).filter(([, q]) => q > 0).map(([good, q]) => `${humanize(good)} ×${q}`).join(' · ')}</td><td><button onClick={() => s.setTrackedStation(id)}>Track warehouse</button></td></tr>)}</tbody></table></div></details>
    <p className="j-muted">Estimated equity, not spendable cash or a guaranteed liquidation quote. Hull uses condition-adjusted catalog value; equipment uses replacement costs. Goods use the median live public sale quote across stations (base sale value if unavailable), adjusted for recorded freshness. Mission documents and temporary convoy ships are not owned assets. Loans and accrued interest are liabilities.</p>
    <p className="j-muted">History begins when this build starts recording: latest 240 observations, sampled every 30 simulation seconds and on asset transactions, plus the live endpoint. Transfers and loan principal do not create wealth. No earlier history or offline growth is invented.</p>
  </section>;
}
