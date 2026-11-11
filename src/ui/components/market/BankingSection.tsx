import { useMemo, useState } from 'react';
import { useGameStore } from '../../../state';
import { usePoll } from '../../../shared/hooks/use_poll';
import { BANK_ID, createFinance, fundRisk, settleInterest, LOAN_LIMIT } from '../../../systems/finance';
import { simTime } from '../journal/JournalCharts';
import type { Station } from '../../../domain/types/world_types';
import '../journal/assets.css';
const credits = (v: number) => `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cr`;
export function BankingSection({ station }: { station: Station }) {
  const finance = useGameStore(s => s.finance), cash = useGameStore(s => s.ship.credits);
  const poll = usePoll(1000); const s = useMemo(() => useGameStore.getState(), [poll, finance, cash]);
  const f = settleInterest(s.finance ?? createFinance(s.stations, s.gameTime), s.gameTime);
  const [amount, setAmount] = useState(100), [fundId, setFundId] = useState(BANK_ID);
  const overdue = f.loan.interest > 0 && s.gameTime >= f.loan.dueAt;
  const valid = Number.isFinite(amount) && amount > 0 && Math.abs(amount * 100 - Math.round(amount * 100)) < .00001;
  const fund = f.funds[fundId], selectedStation = s.stations.find(st => st.id === fundId)!;
  const risk = fundRisk(selectedStation), value = fund ? fund.units * fund.price : 0;
  const act = s.bankAction;
  return <section className="meridian-banking" aria-label="Meridian banking services" onKeyDown={e => e.stopPropagation()}>
    <header><div className="reserve-seal">◈</div><div><small>MERIDIAN / RESERVE NETWORK</small><h2>{station.id === BANK_ID ? 'Capital deserves a safe harbour.' : `${station.name} · account terminal`}</h2><p>{station.id === BANK_ID ? 'Director Ada Voss · “Capital is cargo you no longer have to carry.”' : 'Protected savings, repayments and investments. Visit Meridian Reserve Bank for new loans.'}</p></div></header>
    <div className="asset-metrics"><div><small>ONBOARD CASH · AT RISK</small><strong>{credits(s.ship.credits)}</strong><span>50% lost on ship death</span></div><div><small>PROTECTED SAVINGS</small><strong>{credits(f.savings)}</strong><span>0.1% / simulation minute</span></div><div><small>INVESTMENT VALUE</small><strong>{credits(Object.values(f.funds).reduce((sum, item) => sum + item.units * item.price, 0))}</strong><span>Separate from liquid savings</span></div><div><small>LOAN LIABILITY</small><strong>{credits(f.loan.principal + f.loan.interest)}</strong><span>{credits(f.loan.interest)} accrued interest</span></div></div>
    <div className="j-toolbar"><label>Credit amount <input aria-label="Bank transaction amount" type="number" min={.01} step={.01} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label><button disabled={!valid || amount > s.ship.credits} onClick={() => act('deposit', amount)}>Deposit to savings</button><button disabled={!valid || amount > f.savings} onClick={() => act('withdraw', amount)}>Withdraw to ship</button></div>
    <div className="reserve-contract"><h3>Credit facility <span>{overdue ? 'INTEREST OVERDUE' : '10,000 CR LIMIT'}</span></h3><p>0.5% per simulation minute, compounded and prorated to the time actually borrowed. Interest is due every 10 simulation minutes. Pay from ship cash at any account terminal; interest is paid first. No automatic seizures. Overdue interest blocks further borrowing, but continues accruing.</p><p>Principal: {credits(f.loan.principal)} · Interest: {credits(f.loan.interest)} · {overdue ? 'Payment overdue' : `Next interest payment ${simTime(f.loan.dueAt)} sim time`}</p><div className="j-toolbar"><button disabled={station.id !== BANK_ID || !valid || overdue || f.loan.principal + amount > LOAN_LIMIT} onClick={() => act('borrow', amount)}>Borrow to ship</button><button disabled={!valid || f.loan.principal + f.loan.interest <= 0 || Math.min(amount, f.loan.principal + f.loan.interest) > s.ship.credits} onClick={() => act('repay', amount)}>Repay loan</button></div></div>
    <div className="reserve-contract"><h3>Investment desk <span>FUNDED FROM SAVINGS</span></h3><p>Station funds fluctuate each simulation minute. Riskier funds have higher expected returns, not guaranteed returns. Closures, hostility and fabrication shutdowns reduce expected performance. Bank reserve bonds guarantee +0.15% per simulation minute; ordinary savings earn +0.1%. Interest and markets freeze with simulation time; no offline returns.</p>
      <label>Investment <select aria-label="Investment fund" value={fundId} onChange={e => setFundId(e.target.value)}>{s.stations.map(st => <option key={st.id} value={st.id}>{st.name} · {fundRisk(st).name}</option>)}</select></label>
      <p>{risk.name} · Baseline expected {(risk.drift * 100).toFixed(2)}% / min · fluctuation ±{(risk.volatility * 100).toFixed(0)}% / min · quote {credits(fund?.price ?? 100)} / unit</p>
      <p>Holding: {(fund?.units ?? 0).toFixed(4)} units · Value {credits(value)} · Remaining cost {credits(fund?.invested ?? 0)}</p>
      <div className="j-toolbar"><button disabled={!valid || amount > f.savings} onClick={() => act('invest', amount, fundId)}>Invest savings</button><button disabled={!valid || amount > value} onClick={() => act('redeem', amount, fundId)}>Redeem to savings</button><button disabled={!value} onClick={() => act('redeemAll', 0, fundId)}>Redeem entire holding</button></div>
    </div>
    <div className="j-table-wrap"><table><caption>Investment portfolio</caption><thead><tr><th>Fund</th><th>Risk</th><th>Units</th><th>Value</th><th>Unrealized P&L</th></tr></thead><tbody>{s.stations.filter(st => (f.funds[st.id]?.units ?? 0) > 0).map(st => { const holding = f.funds[st.id], marked = holding.units * holding.price; return <tr key={st.id}><th>{st.name}</th><td>{fundRisk(st).name}</td><td>{holding.units.toFixed(4)}</td><td>{credits(marked)}</td><td className={marked < holding.invested ? 'j-loss' : 'j-gain'}>{credits(marked - holding.invested)}</td></tr>; })}</tbody></table></div>
    <h3>Account activity</h3><ol className="reserve-history">{[...f.entries].reverse().slice(0, 12).map(e => <li key={e.id}><time>{simTime(e.at)}</time>{e.message}</li>)}</ol>
  </section>;
}
