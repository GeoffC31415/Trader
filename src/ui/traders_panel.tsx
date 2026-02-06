import { useMemo } from 'react';
import { usePoll } from '../shared/hooks/use_poll';
import { useGameStore } from '../state';
import { getActiveEvents } from '../systems/economy/market_events';
import { getActiveFeaturedOpportunities } from '../systems/economy/featured';
import { generateCommodities } from '../systems/economy/commodities';
import { formatNumber } from './utils/number_format';

type Vec3 = [number, number, number];

function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const primaryColor = '#06b6d4';
const secondaryColor = '#22d3ee';
const glowColor = '#06b6d480';

export function TradersPanel() {
  const npcTraders = useGameStore(s => s.npcTraders);
  const stations = useGameStore(s => s.stations);
  const ship = useGameStore(s => s.ship);
  const marketEvents = useGameStore(s => s.marketEvents);
  const hasIntel = useGameStore(s => !!s.ship.hasMarketIntel);
  
  const poll = usePoll(2000);
  const stationById = useMemo(() => Object.fromEntries(stations.map(s => [s.id, s])), [stations]);
  const commodities = useMemo(() => generateCommodities(), []);
  const commodityById = useMemo(() => Object.fromEntries(commodities.map(c => [c.id, c])), [commodities]);

  // ============== ACTIVE MARKET EVENTS ==============
  const activeEvents = useMemo(() => {
    if (!marketEvents) return [];
    const now = Date.now();
    return getActiveEvents(marketEvents, now).map(event => ({
      ...event,
      remainingMs: event.duration - (now - event.startedAt),
    }));
  }, [marketEvents, poll]);

  // ============== FEATURED ARBITRAGE OPPORTUNITIES ==============
  const featuredOpportunities = useMemo(() => {
    const opps = getActiveFeaturedOpportunities();
    return opps.map(opp => ({
      ...opp,
      stationName: stationById[opp.stationId]?.name || opp.stationId,
      commodityName: commodityById[opp.commodityId]?.name || opp.commodityId,
      premiumPercent: Math.round((opp.multiplier - 1) * 100),
    })).slice(0, 5);
  }, [stationById, commodityById, poll]);

  // ============== CARGO-BASED SELL RECOMMENDATIONS ==============
  const cargoRecommendations = useMemo(() => {
    const cargoItems = Object.entries(ship.cargo).filter(([_, qty]) => qty > 0);
    if (cargoItems.length === 0) return [];

    type CargoRecommendation = {
      commodityId: string;
      commodityName: string;
      quantity: number;
      sellOptions: Array<{
        stationId: string;
        stationName: string;
        sellPrice: number;
        distance: number;
        priceVsAvg: number;
      }>;
    };

    return cargoItems.map(([commodityId, quantity]): CargoRecommendation | null => {
      const commodity = commodityById[commodityId];
      if (!commodity) return null;

      // Find best sell prices across all stations
      const sellOptions = stations
        .filter(s => s.inventory[commodityId]?.canBuy !== false)
        .map(s => ({
          stationId: s.id,
          stationName: s.name,
          sellPrice: s.inventory[commodityId]?.sell || 0,
          distance: distance(ship.position, s.position),
        }))
        .filter(s => s.sellPrice > 0)
        .sort((a, b) => b.sellPrice - a.sellPrice)
        .slice(0, 3);

      const avgPrice = commodity.baseSell;
      
      return {
        commodityId,
        commodityName: commodity.name,
        quantity,
        sellOptions: sellOptions.map(opt => ({
          ...opt,
          priceVsAvg: Math.round(((opt.sellPrice / avgPrice) - 1) * 100),
        })),
      };
    }).filter((r): r is CargoRecommendation => r !== null).slice(0, 4);
  }, [ship.cargo, ship.position, stations, commodityById, poll]);

  // ============== ROUTE COMPETITION ANALYSIS ==============
  const routeCompetition = useMemo(() => {
    // Count how many NPCs are on each route
    const routeCounts: Record<string, { 
      fromId: string; 
      toId: string; 
      commodityId: string; 
      count: number;
      fromName: string;
      toName: string;
      commodityName: string;
    }> = {};

    for (const npc of npcTraders) {
      const commodityId = npc.commodityId || 'refined_fuel';
      const key = `${npc.fromId}:${npc.toId}:${commodityId}`;
      
      if (!routeCounts[key]) {
        const from = stationById[npc.fromId];
        const to = stationById[npc.toId];
        const commodity = commodityById[commodityId];
        routeCounts[key] = {
          fromId: npc.fromId,
          toId: npc.toId,
          commodityId,
          count: 0,
          fromName: from?.name || npc.fromId,
          toName: to?.name || npc.toId,
          commodityName: commodity?.name || commodityId,
        };
      }
      routeCounts[key].count++;
    }

    const routes = Object.values(routeCounts);
    
    // Sort by count descending
    const saturated = routes.filter(r => r.count >= 3).sort((a, b) => b.count - a.count).slice(0, 3);
    const moderate = routes.filter(r => r.count === 2).slice(0, 2);
    
    // Find underserved routes (commodities that could be traded but have 0-1 NPCs)
    // Look for station pairs where there's a price differential
    const activeRouteKeys = new Set(Object.keys(routeCounts));
    const underserved: typeof saturated = [];
    
    for (const from of stations) {
      for (const to of stations) {
        if (from.id === to.id) continue;
        
        // Check commodities
        for (const commodity of commodities) {
          const fromItem = from.inventory[commodity.id];
          const toItem = to.inventory[commodity.id];
          
          if (!fromItem || !toItem) continue;
          if (fromItem.canSell === false || toItem.canBuy === false) continue;
          
          const margin = toItem.sell - fromItem.buy;
          if (margin <= 0) continue;
          
          const key = `${from.id}:${to.id}:${commodity.id}`;
          const existingCount = routeCounts[key]?.count || 0;
          
          if (existingCount === 0 && margin > 20) {
            underserved.push({
              fromId: from.id,
              toId: to.id,
              commodityId: commodity.id,
              count: 0,
              fromName: from.name,
              toName: to.name,
              commodityName: commodity.name,
            });
          }
        }
      }
    }

    return {
      saturated,
      moderate,
      underserved: underserved.slice(0, 3),
    };
  }, [npcTraders, stations, stationById, commodityById, commodities, poll]);

  // ============== PRICE TREND INDICATORS ==============
  // Track which stations NPCs are delivering to (stock increasing) vs picking up from (stock decreasing)
  const priceTrends = useMemo(() => {
    const stationActivity: Record<string, { 
      inbound: number; 
      outbound: number;
      commodities: Record<string, { inbound: number; outbound: number }>;
    }> = {};

    for (const npc of npcTraders) {
      const commodityId = npc.commodityId || 'refined_fuel';
      
      // Track outbound from source (supply decreasing = price rising)
      if (!stationActivity[npc.fromId]) {
        stationActivity[npc.fromId] = { inbound: 0, outbound: 0, commodities: {} };
      }
      stationActivity[npc.fromId].outbound++;
      if (!stationActivity[npc.fromId].commodities[commodityId]) {
        stationActivity[npc.fromId].commodities[commodityId] = { inbound: 0, outbound: 0 };
      }
      stationActivity[npc.fromId].commodities[commodityId].outbound++;

      // Track inbound to destination (supply increasing = price falling)
      if (!stationActivity[npc.toId]) {
        stationActivity[npc.toId] = { inbound: 0, outbound: 0, commodities: {} };
      }
      stationActivity[npc.toId].inbound++;
      if (!stationActivity[npc.toId].commodities[commodityId]) {
        stationActivity[npc.toId].commodities[commodityId] = { inbound: 0, outbound: 0 };
      }
      stationActivity[npc.toId].commodities[commodityId].inbound++;
    }

    // Find significant trends
    const trends: Array<{
      stationId: string;
      stationName: string;
      commodityId: string;
      commodityName: string;
      trend: 'rising' | 'falling';
      strength: number; // 1-3
    }> = [];

    for (const [stationId, activity] of Object.entries(stationActivity)) {
      const station = stationById[stationId];
      if (!station) continue;

      for (const [commodityId, commodityActivity] of Object.entries(activity.commodities)) {
        const commodity = commodityById[commodityId];
        if (!commodity) continue;

        const netFlow = commodityActivity.inbound - commodityActivity.outbound;
        
        if (Math.abs(netFlow) >= 1) {
          trends.push({
            stationId,
            stationName: station.name,
            commodityId,
            commodityName: commodity.name,
            trend: netFlow > 0 ? 'falling' : 'rising',
            strength: Math.min(3, Math.abs(netFlow)),
          });
        }
      }
    }

    // Sort by strength descending
    return trends.sort((a, b) => b.strength - a.strength).slice(0, 6);
  }, [npcTraders, stationById, commodityById, poll]);

  // ============== NPC TRADER ROWS (existing) ==============
  const rows = useMemo(() => {
    const deliverUnits = 3;
    return npcTraders.map(npc => {
      const from = stationById[npc.fromId];
      const to = stationById[npc.toId];
      const commodityId = npc.commodityId || 'fuel';
      const fromInv = from?.inventory[commodityId];
      const toInv = to?.inventory[commodityId];
      const unitBuy = fromInv?.buy ?? 0;
      const unitSell = toInv?.sell ?? 0;
      const unitMargin = unitSell - unitBuy;
      const dist = (from && to) ? distance(from.position as any, to.position as any) : 0;
      const speed = npc.speed ?? 1;
      const travelTime = speed > 0 ? dist / speed : 0;
      const tripProfit = unitMargin * deliverUnits;
      const profitPerSec = travelTime > 0 ? tripProfit / travelTime : 0;
      return {
        id: npc.id,
        fromName: from?.name || npc.fromId,
        toName: to?.name || npc.toId,
        route: from && to ? `${from.name} → ${to.name}` : `${npc.fromId} → ${npc.toId}`,
        commodityId,
        unitMargin,
        tripProfit,
        profitPerSec,
        dist,
      };
    }).sort((a, b) => b.profitPerSec - a.profitPerSec);
  }, [npcTraders, stationById, poll]);

  if (!hasIntel) {
    return (
      <>
        <style>{`
          .traders-panel-locked {
            background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
            border: 2px solid ${primaryColor};
            border-radius: 12px;
            padding: 32px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
            text-align: center;
          }
        `}</style>
        <div className="panel">
          <div className="traders-panel-locked">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: secondaryColor }}>
              TRADER INTELLIGENCE SYSTEM LOCKED
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
              This advanced tracking system requires specialized hardware to monitor NPC trader activities in real-time.
            </div>
            <div style={{
              padding: 16,
              background: `rgba(239,68,68,0.1)`,
              border: `2px solid rgba(239,68,68,0.3)`,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                REQUIRED UPGRADE:
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                Mercantile Data Nexus
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'monospace' }}>
              Visit any Shipyard station to install this upgrade
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .traders-panel {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .traders-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);
          animation: scanline-traders 3s linear infinite;
        }
        .traders-panel::after {
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
        @keyframes scanline-traders {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .section-header-traders {
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.1em;
          color: ${secondaryColor};
          margin-bottom: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid ${primaryColor}40;
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header-traders::before {
          content: '◢';
          color: ${primaryColor};
        }
        .intel-card {
          padding: 12px;
          background: ${primaryColor}10;
          border: 1px solid ${primaryColor}40;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .trader-card {
          padding: 16px;
          background: ${primaryColor}10;
          border: 2px solid ${primaryColor}40;
          border-left: 4px solid ${primaryColor};
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }
        .trader-card:hover {
          background: ${primaryColor}15;
          border-left-color: ${secondaryColor};
          transform: translateX(4px);
        }
        .scrollable-content-traders {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content-traders::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content-traders::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content-traders::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content-traders::-webkit-scrollbar-thumb:hover {
          background: ${secondaryColor};
          box-shadow: 0 0 10px ${glowColor};
        }
        .event-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          font-family: monospace;
        }
        .trend-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-weight: 700;
        }
      `}</style>

      <div className="panel">
        <div className="scrollable-content-traders">
          
          {/* ============== ACTIVE MARKET EVENTS ============== */}
          {activeEvents.length > 0 && (
            <div className="traders-panel">
              <div className="section-header-traders">
                📢 Active Market Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeEvents.map(event => (
                  <div key={event.id} style={{
                    padding: 14,
                    background: 'linear-gradient(135deg, #f59e0b20, #f59e0b08)',
                    border: '2px solid #f59e0b60',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>
                        {event.title}
                      </div>
                      <div className="event-badge" style={{ background: '#f59e0b30', color: '#fbbf24' }}>
                        ⏱ {formatTime(event.remainingMs)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>
                      {event.description}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {event.effects.map((effect, idx) => {
                        const change = Math.round((effect.priceMultiplier - 1) * 100);
                        const isPositive = change > 0;
                        return (
                          <div key={idx} className="event-badge" style={{
                            background: isPositive ? '#10b98130' : '#3b82f630',
                            color: isPositive ? '#34d399' : '#60a5fa',
                          }}>
                            {effect.commodityId || effect.commodityCategory || 'All'}
                            {effect.stationId && ` @ ${stationById[effect.stationId]?.name || effect.stationId}`}
                            : {isPositive ? '+' : ''}{change}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== FEATURED ARBITRAGE OPPORTUNITIES ============== */}
          {featuredOpportunities.length > 0 && (
            <div className="traders-panel">
              <div className="section-header-traders">
                🌟 Limited-Time Opportunities
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {featuredOpportunities.map(opp => (
                  <div key={`${opp.stationId}:${opp.commodityId}`} className="intel-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: '#8b5cf660',
                    background: 'linear-gradient(135deg, #8b5cf615, #8b5cf605)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ color: '#a78bfa' }}>{opp.commodityName}</span>
                        <span style={{ opacity: 0.6 }}> at </span>
                        {opp.stationName}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
                        ⏱ {formatTime(opp.remainingMs)} remaining
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: '#10b98130',
                      border: '1px solid #10b981',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#34d399',
                      fontFamily: 'monospace',
                    }}>
                      +{opp.premiumPercent}% premium
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== CARGO-BASED SELL RECOMMENDATIONS ============== */}
          {cargoRecommendations.length > 0 && (
            <div className="traders-panel">
              <div className="section-header-traders">
                📦 Your Cargo - Best Sell Locations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cargoRecommendations.map(item => (
                  <div key={item.commodityId} className="intel-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {item.commodityName}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        fontFamily: 'monospace',
                        padding: '4px 8px',
                        background: `${primaryColor}30`,
                        borderRadius: 4,
                      }}>
                        {item.quantity} units
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {item.sellOptions.map((opt, idx) => (
                        <div key={opt.stationId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: idx === 0 ? '#10b98115' : 'transparent',
                          border: idx === 0 ? '1px solid #10b98140' : '1px solid transparent',
                          borderRadius: 4,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {idx === 0 && <span style={{ color: '#10b981' }}>★</span>}
                            <span style={{ fontSize: 12, opacity: idx === 0 ? 1 : 0.8 }}>{opt.stationName}</span>
                            <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'monospace' }}>
                              {formatNumber(opt.distance)}u
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                              fontSize: 13, 
                              fontWeight: 700, 
                              color: idx === 0 ? '#10b981' : '#9ca3af',
                              fontFamily: 'monospace',
                            }}>
                              ${opt.sellPrice}
                            </span>
                            {opt.priceVsAvg !== 0 && (
                              <span style={{
                                fontSize: 10,
                                color: opt.priceVsAvg > 0 ? '#10b981' : '#f59e0b',
                                fontFamily: 'monospace',
                              }}>
                                {opt.priceVsAvg > 0 ? '+' : ''}{opt.priceVsAvg}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== ROUTE COMPETITION ANALYSIS ============== */}
          <div className="traders-panel">
            <div className="section-header-traders">
              📊 Route Competition Analysis
            </div>
            
            {routeCompetition.saturated.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#ef4444', marginBottom: 8, fontWeight: 600 }}>
                  🔴 SATURATED ROUTES (3+ NPCs)
                </div>
                {routeCompetition.saturated.map(route => (
                  <div key={`${route.fromId}:${route.toId}:${route.commodityId}`} className="intel-card" style={{
                    background: '#ef444410',
                    borderColor: '#ef444440',
                    marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {route.fromName} → {route.toName}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'capitalize' }}>
                          {route.commodityName}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: '#ef444430',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#f87171',
                        fontFamily: 'monospace',
                      }}>
                        {route.count} NPCs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {routeCompetition.underserved.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#10b981', marginBottom: 8, fontWeight: 600 }}>
                  🟢 UNDERSERVED OPPORTUNITIES (0 NPCs)
                </div>
                {routeCompetition.underserved.map(route => (
                  <div key={`${route.fromId}:${route.toId}:${route.commodityId}`} className="intel-card" style={{
                    background: '#10b98110',
                    borderColor: '#10b98140',
                    marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {route.fromName} → {route.toName}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'capitalize' }}>
                          {route.commodityName}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: '#10b98130',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#34d399',
                        fontFamily: 'monospace',
                      }}>
                        OPPORTUNITY
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {routeCompetition.saturated.length === 0 && routeCompetition.underserved.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                opacity: 0.6,
                fontSize: 12,
                fontFamily: 'monospace',
              }}>
                Route analysis in progress...
              </div>
            )}
          </div>

          {/* ============== PRICE TREND INDICATORS ============== */}
          {priceTrends.length > 0 && (
            <div className="traders-panel">
              <div className="section-header-traders">
                📈 Price Trends (NPC Activity)
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 8,
              }}>
                {priceTrends.map((trend, idx) => (
                  <div key={`${trend.stationId}:${trend.commodityId}`} className="intel-card" style={{
                    background: trend.trend === 'rising' ? '#10b98110' : '#3b82f610',
                    borderColor: trend.trend === 'rising' ? '#10b98140' : '#3b82f640',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div className="trend-arrow" style={{
                        background: trend.trend === 'rising' ? '#10b98130' : '#3b82f630',
                        color: trend.trend === 'rising' ? '#10b981' : '#3b82f6',
                        fontSize: 12,
                      }}>
                        {trend.trend === 'rising' ? '↗' : '↘'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {trend.stationName}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginLeft: 28 }}>
                      <span style={{ textTransform: 'capitalize' }}>{trend.commodityName}</span>
                      <span style={{ 
                        color: trend.trend === 'rising' ? '#10b981' : '#3b82f6',
                        fontWeight: 600,
                        marginLeft: 6,
                      }}>
                        {trend.trend === 'rising' ? '↑ Rising' : '↓ Falling'}
                      </span>
                      <span style={{ opacity: 0.6, marginLeft: 4 }}>
                        ({'•'.repeat(trend.strength)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== ACTIVE TRADER NETWORK (existing) ============== */}
          <div className="traders-panel">
            <div className="section-header-traders">
              Active Trader Network ({npcTraders.length} Vessels)
            </div>
            
            <div style={{
              padding: 12,
              background: `${primaryColor}10`,
              border: `1px solid ${primaryColor}30`,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 12,
              opacity: 0.9,
              fontFamily: 'monospace',
            }}>
              ℹ Real-time tracking of NPC trader vessels and their profit margins. Data refreshes every 2 seconds.
            </div>

            {rows.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 32,
                opacity: 0.7,
                fontFamily: 'monospace',
                fontSize: 13,
              }}>
                ⚠ NO ACTIVE TRADERS DETECTED
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {rows.slice(0, 8).map((r, idx) => (
                <div key={r.id} className="trader-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: secondaryColor,
                        fontWeight: 700,
                        marginBottom: 6,
                      }}>
                        TRADER #{idx + 1}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                        {r.fromName} → {r.toName}
                      </div>
                      <div style={{ fontSize: 13, textTransform: 'capitalize', opacity: 0.9, marginBottom: 4 }}>
                        <span style={{ opacity: 0.6 }}>Commodity:</span> {(r.commodityId || 'fuel').replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>
                        Distance: {formatNumber(r.dist)} units
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: r.profitPerSec >= 1 ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                      border: `2px solid ${r.profitPerSec >= 1 ? '#10b981' : '#6b7280'}`,
                      borderRadius: 6,
                      textAlign: 'center',
                      minWidth: 120,
                    }}>
                      <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        PROFIT/SEC
                      </div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: r.profitPerSec >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${formatNumber(r.profitPerSec)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        UNIT MARGIN
                      </div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: r.unitMargin >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${formatNumber(r.unitMargin)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>
                        TRIP PROFIT
                      </div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: r.tripProfit >= 0 ? '#10b981' : '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        ${formatNumber(r.tripProfit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {rows.length > 8 && (
                <div style={{
                  textAlign: 'center',
                  padding: 12,
                  opacity: 0.6,
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}>
                  + {rows.length - 8} more traders...
                </div>
              )}
              </div>
            )}

            {rows.length > 0 && (
              <div style={{ marginTop: 16 }}>
              <div className="section-header-traders">Market Intelligence Summary</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
              }}>
                <div style={{
                  padding: 16,
                  background: `${primaryColor}10`,
                  border: `2px solid ${primaryColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                    ACTIVE TRADERS
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: secondaryColor, fontFamily: 'monospace' }}>
                    {rows.length}
                  </div>
                </div>
                <div style={{
                  padding: 16,
                  background: `${primaryColor}10`,
                  border: `2px solid ${primaryColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                    AVG MARGIN
                  </div>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#10b981',
                    fontFamily: 'monospace',
                  }}>
                    ${formatNumber(rows.reduce((sum, r) => sum + r.unitMargin, 0) / Math.max(1, rows.length))}
                  </div>
                </div>
                <div style={{
                  padding: 16,
                  background: `${primaryColor}10`,
                  border: `2px solid ${primaryColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6, fontFamily: 'monospace' }}>
                    TOP PROFIT/SEC
                  </div>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#10b981',
                    fontFamily: 'monospace',
                  }}>
                    ${rows.length > 0 ? formatNumber(rows[0].profitPerSec) : '0.0'}
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
