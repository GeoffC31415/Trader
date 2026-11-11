import { useId, useState } from 'react';
import type { PlayerPoliticalProfile } from '../../../systems/politics/political_compass';
import { calculateJourneyPath } from '../../../systems/politics/political_compass';

export const simTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export type ChartPoint = { x: number; y: number; label: string };
export type ChartSeries = { name: string; color: string; points: ChartPoint[] };

/** Lightweight local SVG. Every recorded node has a hover/focus readout and native title. */
export function HistoryChart({ label, series, range }: { label: string; series: ChartSeries[]; range?: [number, number] }) {
  const [active, setActive] = useState<string>(); const id = useId();
  const points = series.flatMap(s => s.points);
  if (!points.length) return <div className="j-empty">No recorded observations yet. This chart never invents earlier history.</div>;
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const low = range?.[0] ?? 0, high = range?.[1] ?? Math.max(1, ...points.map(p => p.y)) * 1.1;
  const x = (v: number) => 48 + (v - minX) / Math.max(1, maxX - minX) * 510;
  const y = (v: number) => 204 - (v - low) / Math.max(1, high - low) * 174;
  return <figure className="j-chart" aria-label={label}>
    <figcaption>{label}<span>{series.map(s => <i key={s.name} style={{ color: s.color }}>● {s.name} </i>)}</span></figcaption>
    <svg viewBox="0 0 600 240" role="group" aria-label={`${label} interactive chart`}>
      {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1="48" y1={30 + 174 * t} x2="558" y2={30 + 174 * t} stroke="#94a3b820" strokeDasharray="3 5" /><text x="41" y={34 + 174 * t} textAnchor="end">{Math.round(high - (high - low) * t).toLocaleString()}</text></g>)}
      <text x="48" y="228">{simTime(minX)}</text><text x="558" y="228" textAnchor="end">{simTime(maxX)} sim time</text>
      {series.map(s => <g key={s.name}>
        <polyline points={s.points.map(p => `${x(p.x)},${y(p.y)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
        {s.points.map((p, i) => <circle key={i} cx={x(p.x)} cy={y(p.y)} r="4" fill={s.color} tabIndex={0} role="img" aria-label={`${s.name}: ${p.label}`} aria-describedby={id} onMouseEnter={() => setActive(`${s.name} · ${p.label}`)} onMouseLeave={() => setActive(undefined)} onFocus={() => setActive(`${s.name} · ${p.label}`)} onBlur={() => setActive(undefined)}><title>{p.label}</title></circle>)}
      </g>)}
    </svg>
    <div id={id} className="j-chart-readout" role="status">{active ?? (points.length === 1 ? 'First observation recorded. A second observation will establish a trend.' : 'Hover or keyboard-focus a point to inspect its event and value.')}</div>
  </figure>;
}

export function CompassJourney({ profile }: { profile?: PlayerPoliticalProfile }) {
  const [active, setActive] = useState<string>(); const id = useId();
  const history = profile?.history ?? [], path = calculateJourneyPath(history);
  const score = profile?.score ?? { freedom: 0, labor: 0 };
  const x = (n: number) => 200 + n * 1.45, y = (n: number) => 195 - n * 1.45;
  return <figure className="j-chart j-compass" aria-label="Political journey">
    <figcaption>Political trajectory <span>{history.length} recorded decisions</span></figcaption>
    <svg viewBox="0 0 400 390" role="group" aria-label="Political compass progression">
      <rect x="55" y="50" width="145" height="145" fill="#3b82f612" /><rect x="200" y="50" width="145" height="145" fill="#10b98112" /><rect x="55" y="195" width="145" height="145" fill="#ef444412" /><rect x="200" y="195" width="145" height="145" fill="#fbbf2412" />
      {[-100, -50, 0, 50, 100].map(n => <g key={n}><line x1={x(n)} x2={x(n)} y1="50" y2="340" stroke="#94a3b825" /><line x1="55" x2="345" y1={y(n)} y2={y(n)} stroke="#94a3b825" /></g>)}
      <text x="200" y="30" textAnchor="middle">LABOR +100</text><text x="200" y="370" textAnchor="middle">CAPITAL −100</text><text x="48" y="190" textAnchor="end">ORDER</text><text x="352" y="190">FREEDOM</text>
      <polyline points={path.map(p => `${x(p.freedom)},${y(p.labor)}`).join(' ')} fill="none" stroke="#c084fc" strokeWidth="2.5" />
      {path.map((p, i) => {
        const event = history[i - 1];
        const label = event ? `${event.description} · Freedom ${p.freedom}, Labor ${p.labor} · ${event.simulationTime !== undefined ? `${simTime(event.simulationTime)} sim` : new Date(event.timestamp).toLocaleString()}` : 'Origin · Freedom 0, Labor 0';
        return <circle key={i} cx={x(p.freedom)} cy={y(p.labor)} r="5" fill="#c084fc" tabIndex={0} role="img" aria-label={label} aria-describedby={id} onFocus={() => setActive(label)} onBlur={() => setActive(undefined)} onMouseEnter={() => setActive(label)} onMouseLeave={() => setActive(undefined)}><title>{label}</title></circle>;
      })}
      <circle cx={x(score.freedom)} cy={y(score.labor)} r="11" fill="none" stroke="#e9d5ff" strokeWidth="2" pointerEvents="none" />
    </svg>
    <div id={id} role="status" className="j-chart-readout">{active ?? `Current alignment · Freedom ${score.freedom} / Labor ${score.labor}. Focus or hover a node to inspect the decision.`}</div>
  </figure>;
}
