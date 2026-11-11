import { useId, useMemo, useState } from 'react';
import type { GameState } from '../../../domain/types/world_types';
import { manufacturingDirectory, stationProductionDirectory } from '../../../systems/journal_analysis';
import { productionChains, type ProductionEdge } from '../../../systems/production_graph';
import { humanize } from '../../../systems/journal';
import './assets.css';
function Chain({ chain, s }: { chain: ReturnType<typeof productionChains>[number]; s: GameState }) {
  const marker = useId().replace(/:/g, '');
  const [methodId, setMethod] = useState(chain.edges[0].id);
  const selected = chain.edges.find(edge => edge.id === methodId) ?? chain.edges[0];
  const x = (column: number) => column * 250 + 110, y = (row: number) => row * 95 + 65;
  const width = chain.columns * 250 - 30, height = chain.rows * 95 + 45;
  const stations = (edge: ProductionEdge) => edge.providers.map(r => `${r.station.name}: ${r.input} ${humanize(r.inputId)} → 1 ${humanize(r.outputId)}${r.requirements.length ? `; ${r.requirements.join(', ')}` : '; service accessible'}`).join('\n');
  const producers = stationProductionDirectory(s.stations);
  return <section className="production-chain" aria-label={`Production chain ${chain.nodes.map(n => humanize(n.id)).join(', ')}`}>
    <div className="chain-scroll"><svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 720) }} role="group" aria-label="Linked fabrication graph">
      <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#41d7d0" /></marker></defs>
      {chain.edges.map(edge => {
        const from = chain.nodes.find(n => n.id === edge.inputId)!, to = chain.nodes.find(n => n.id === edge.outputId)!;
        const ax = x(from.column) + 85, ay = y(from.row), bx = x(to.column) - 85, by = y(to.row);
        const midX = (ax + bx) / 2, midY = (ay + by) / 2;
        return <g key={edge.id}><path d={`M${ax} ${ay} C${midX} ${ay},${midX} ${by},${bx} ${by}`} fill="none" stroke={selected.id === edge.id ? '#8ffff3' : '#278c96'} strokeWidth={selected.id === edge.id ? 3 : 1.5} markerEnd={`url(#${marker})`} />
          <g role="button" tabIndex={0} aria-label={`${humanize(edge.inputId)} to ${humanize(edge.outputId)} method`} onFocus={() => setMethod(edge.id)} onMouseEnter={() => setMethod(edge.id)} onClick={() => setMethod(edge.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMethod(edge.id); } }}><title>{stations(edge)}</title><rect x={midX - 27} y={midY - 13} width={54} height={26} rx={7} fill="#102b38" stroke="#4bb8c4" /><text x={midX} y={midY + 4} textAnchor="middle" fill="#d6fff7" fontSize={11}>{edge.providers.every(r => r.input === edge.providers[0].input) ? `${edge.providers[0].input}:1` : 'VARIES'}</text></g>
        </g>;
      })}
      {chain.nodes.map(node => <g key={node.id} tabIndex={0} role="img" aria-label={humanize(node.id)}><title>{[humanize(node.id), ...producers.filter(p => p.commodityId === node.id).map(p => `Passive output: ${p.station.name} (${p.ratePerMinute.toFixed(1)}/sim min)`)].join('\n')}</title><rect x={x(node.column) - 85} y={y(node.row) - 28} width={170} height={56} rx={9} fill="#0c2030" stroke="#38748c" /><text x={x(node.column)} y={y(node.row) - 1} textAnchor="middle" fill="#d6ebf9" fontSize={13}>{humanize(node.id)}</text><text x={x(node.column)} y={y(node.row) + 17} textAnchor="middle" fill="#6aa7b8" fontSize={9}>{chain.edges.some(e => e.outputId === node.id) ? 'MANUFACTURED OUTPUT' : 'CHAIN INPUT'}</text></g>)}
    </svg></div>
    <div className="chain-method" role="region" aria-label={`${humanize(selected.inputId)} to ${humanize(selected.outputId)} supporting stations`}><h3>{humanize(selected.inputId)} <span>→</span> {humanize(selected.outputId)}</h3><p>Hover, focus or select a method badge to inspect its actual supporting stations. Each alternative is one station, not an additional production step.</p><div className="chain-providers">{selected.providers.map(r => <article key={r.station.id}><strong>{r.station.name}</strong><div>{r.input} × <span>{humanize(r.inputId)}</span> → 1 × {humanize(r.outputId)}</div><small>{r.requirements.join(' · ') || 'Service accessible · bring inputs'}</small><button onClick={() => s.setTrackedStation(r.station.id)}>Track station</button></article>)}</div></div>
  </section>;
}
export function ProductionChains({ s, query }: { s: GameState; query: string }) {
  const chains = useMemo(() => productionChains(manufacturingDirectory(s)), [s.stations, s.ship, s.missions]);
  const matches = chains.filter(chain => `${chain.nodes.map(n => humanize(n.id)).join(' ')} ${chain.edges.flatMap(e => e.providers.map(r => r.station.name)).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-label="Manufacturing chain network"><p className="j-notice">Linked, executable fabrication routes. Arrows are actual conversions; ratios are for one output with current station modifiers; bulk rounding can differ. Hover or keyboard-focus a method for station/access details. Separate passive production is listed below. No unsupported recipe is used to fill a missing link.</p>{matches.map(chain => <Chain key={chain.id} chain={chain} s={s} />)}{!matches.length && <p className="j-empty">No matching production chains.</p>}</section>;
}
