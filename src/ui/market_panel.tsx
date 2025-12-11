import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../state';
import { processRecipes } from '../systems/economy/recipes';
import { CONTRACT_REFRESH_INTERVAL } from '../domain/constants/contract_constants';
import { MissionChoiceDialog } from './components/mission_choice_dialog';
import type { Mission } from '../domain/types/mission_types';
import { getMissionTemplatesByStage } from '../domain/constants/mission_constants';
import { UIIcon } from './components/ui_icon';
import { stationTypeColors, getHallLabel } from './utils/station_theme';
import { MarketHeader } from './components/market/MarketHeader';
import { HallSection } from './components/market/HallSection';
import { FabricationSection } from './components/market/FabricationSection';
import { ProductionSection } from './components/market/ProductionSection';
import { MissionsSection } from './components/market/MissionsSection';
import { ContractsSection } from './components/market/ContractsSection';
import { SciFiButton } from './components/shared/SciFiButton';
import { PANEL_MAX_HEIGHT_OFFSET } from './constants/layout_constants';

export function MarketPanel() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const buy = useGameStore(s => s.buy);
  const sell = useGameStore(s => s.sell);
  const allyAssistTokens = useGameStore(s => s.allyAssistTokens || []);
  const consumeAssist = useGameStore(s => s.consumeAssist);
  const setPending = useGameStore.setState;
  const undock = useGameStore(s => s.undock);
  const process = useGameStore(s => s.process);
  const upgrade = useGameStore(s => s.upgrade);
  const replaceShip = useGameStore(s => s.replaceShip);
  const hasIntel = !!ship.hasMarketIntel;
  const contracts = useGameStore(s => s.contracts || []);
  const acceptContract = useGameStore(s => s.acceptContract);
  const abandonContract = useGameStore(s => s.abandonContract);
  const setTrackedStation = useGameStore(s => s.setTrackedStation);
  
  // Mission arc system
  const missions = useGameStore(s => s.missions);
  const missionArcs = useGameStore(s => s.missionArcs);
  const acceptMission = useGameStore(s => s.acceptMission);
  const abandonMission = useGameStore(s => s.abandonMission);
  const makeMissionChoice = useGameStore(s => s.makeMissionChoice);
  
  // Auto-refresh contracts on mount and at regular intervals
  useEffect(() => {
    const store = useGameStore.getState();
    store.generateContracts({ limit: 5 });
    
    const interval = setInterval(() => {
      const currentStore = useGameStore.getState();
      currentStore.generateContracts({ limit: 5 });
    }, CONTRACT_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  const [choiceMissionDialog, setChoiceMissionDialog] = useState<Mission | null>(null);

  const station = useMemo(() => stations.find(s => s.id === ship.dockedStationId), [stations, ship.dockedStationId]);
  const stationId = station?.id;
  const stationAssist = useMemo(() => {
    if (!stationId) return undefined;
    return allyAssistTokens.find(t => !t.consumed && t.by === stationId);
  }, [allyAssistTokens, stationId]);

  const items = station ? Object.entries(station.inventory) : [];
  const recipes = station ? (processRecipes[station.type] || []) : [];
  const outputSet = new Set(recipes.map(r => r.outputId));
  const visibleItems = items.filter(([_, p]) => (p.canSell !== false) || (p.canBuy !== false));
  const producedItems = visibleItems.filter(([id, _]) => outputSet.has(id));
  const otherItems = visibleItems.filter(([id, _]) => !outputSet.has(id));
  const hasNav = !!ship.hasNavigationArray;
  const hasUnion = !!ship.hasUnionMembership;
  const isPirate = station?.type === 'pirate';
  const hallLabel = station ? getHallLabel(station.type) : 'Trading Hall';

  const hasFabrication = recipes.length > 0;
  const hasProduction = producedItems.length > 0;
  const stationContracts = useMemo(() => 
    contracts.filter(c => c.toId === stationId && c.status === 'offered'),
    [contracts, stationId]
  );

  const stationMissions = useMemo(() => 
    missions.filter(m => m.availableAt.includes(stationId || '') && m.status === 'offered'),
    [missions, stationId]
  );

  // Per-arc: show the next mission at this station that is locked due to insufficient reputation
  const repLockedNextMissions = useMemo(() => {
    if (!station) return [] as Array<{
      arcId: string;
      arcName: string;
      stage: number;
      missionId: string;
      title: string;
      description: string;
      deficits: Array<{ stationId: string; required: number; current: number; missing: number }>;
    }>;

    const playerRep: Record<string, number> = {};
    stations.forEach(s => { playerRep[s.id] = s.reputation || 0; });

    const activeIds = new Set(missions.filter(m => m.status === 'active').map(m => m.id));

    const results: Array<{
      arcId: string;
      arcName: string;
      stage: number;
      missionId: string;
      title: string;
      description: string;
      deficits: Array<{ stationId: string; required: number; current: number; missing: number }>;
      deficitSum: number;
    }> = [];

    for (const arc of missionArcs) {
      if (arc.status === 'locked' || arc.status === 'completed') continue;
      const templates = getMissionTemplatesByStage(arc.id, arc.currentStage)
        .filter(t => t.availableAt.includes(station.id))
        .filter(t => !activeIds.has(t.id) && !arc.completedMissions.includes(t.id));

      const lockedCandidates = templates.map(t => {
        const req = t.requiredRep || {};
        const deficits = Object.entries(req).map(([stId, minRep]) => {
          const current = playerRep[stId] || 0;
          const missing = Math.max(0, minRep - current);
          return { stationId: stId, required: minRep, current, missing };
        });
        const meets = deficits.every(d => d.missing === 0);
        const deficitSum = deficits.reduce((sum, d) => sum + d.missing, 0);
        return { template: t, meets, deficits, deficitSum };
      }).filter(x => !x.meets);

      if (lockedCandidates.length === 0) continue;
      lockedCandidates.sort((a, b) => a.deficitSum - b.deficitSum);
      const pick = lockedCandidates[0];
      results.push({
        arcId: arc.id,
        arcName: arc.name,
        stage: arc.currentStage,
        missionId: pick.template.id,
        title: pick.template.title,
        description: pick.template.description,
        deficits: pick.deficits,
        deficitSum: pick.deficitSum,
      });
    }

    results.sort((a, b) => a.arcName.localeCompare(b.arcName));
    return results.map(({ deficitSum, ...rest }) => rest);
  }, [stationId, missionArcs, missions, stations]);

  const activeMissions = useMemo(() => 
    missions.filter(m => m.status === 'active'),
    [missions]
  );

  const failedMissions = useMemo(() => 
    missions.filter(m => m.status === 'failed'),
    [missions]
  );

  const activeContracts = useMemo(() =>
    contracts.filter(c => c.status === 'accepted'),
    [contracts]
  );

  const [section, setSection] = useState<'hall' | 'fabrication' | 'production' | 'missions'>('hall');
  useEffect(() => {
    setSection('hall');
  }, [stationId]);
  useEffect(() => {
    if (section === 'fabrication' && !hasFabrication) setSection('hall');
    if (section === 'production' && !hasProduction) setSection('hall');
  }, [section, hasFabrication, hasProduction]);

  const colors = station ? stationTypeColors[station.type] : stationTypeColors.city;

  if (!station) {
    return (
      <div className="panel" style={{
        background: 'linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%)',
        border: '2px solid #3b82f6',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 8px 32px #3b82f680',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 14, marginBottom: 12 }}>
          <div style={{ color: '#10b981', marginBottom: 8 }}>
            ▸ CREDITS: <span style={{ fontWeight: 700 }}>${ship.credits.toLocaleString()}</span>
          </div>
          <div style={{ color: '#06b6d4', marginBottom: 8 }}>
            ▸ CARGO: <span style={{ fontWeight: 700 }}>{Object.values(ship.cargo).reduce((a,b)=>a+b,0)} / {ship.maxCargo}</span>
          </div>
        </div>
        <div style={{ 
          padding: 16, 
          background: 'rgba(59,130,246,0.1)', 
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 8,
          fontSize: 13,
          textAlign: 'center',
        }}>
          ⚠ Fly near a station and press <strong>E</strong> to dock
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .scrollable-content {
          max-height: calc(100vh - ${PANEL_MAX_HEIGHT_OFFSET}px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .scrollable-content::-webkit-scrollbar {
          width: 10px;
        }
        .scrollable-content::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 5px;
        }
        .scrollable-content::-webkit-scrollbar-thumb {
          background: ${colors.primary};
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: ${colors.secondary};
          box-shadow: 0 0 10px ${colors.glow};
        }
      `}</style>

      <div className="panel">
        <MarketHeader
          station={station}
          ship={ship}
          stationAssist={stationAssist}
          onUndock={undock}
          onConsumeAssist={consumeAssist}
          setPending={setPending}
        />

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <SciFiButton 
            stationType={station.type}
            variant={section === 'hall' ? 'active' : 'default'}
            onClick={() => setSection('hall')}
          >
            <UIIcon name="tab_market" size={16} style={{ marginRight: 6 }} />
            {hallLabel}
          </SciFiButton>
          {hasFabrication && (
            <SciFiButton 
              stationType={station.type}
              variant={section === 'fabrication' ? 'active' : 'default'}
              onClick={() => setSection('fabrication')}
            >
              <UIIcon name="tab_fabrication" size={16} style={{ marginRight: 6 }} />
              Fabrication
            </SciFiButton>
          )}
          {hasProduction && (
            <SciFiButton 
              stationType={station.type}
              variant={section === 'production' ? 'active' : 'default'}
              onClick={() => setSection('production')}
            >
              <UIIcon name="tab_production" size={16} style={{ marginRight: 6 }} />
              Production
            </SciFiButton>
          )}
          <SciFiButton 
            stationType={station.type}
            variant={section === 'missions' ? 'active' : 'default'}
            onClick={() => setSection('missions')}
          >
            <UIIcon name="tab_missions" size={16} style={{ marginRight: 6 }} />
            Missions {stationContracts.length > 0 && `(${stationContracts.length})`}
          </SciFiButton>
        </div>

        {/* HALL SECTION */}
        {section === 'hall' && (
          <HallSection
            station={station}
            ship={ship}
            otherItems={otherItems}
            hasNav={hasNav}
            hasUnion={hasUnion}
            onBuy={buy}
            onSell={sell}
            onUpgrade={upgrade}
            onReplaceShip={replaceShip}
            hasIntel={hasIntel}
          />
        )}

        {/* FABRICATION SECTION */}
        {section === 'fabrication' && (
          <FabricationSection
            station={station}
            ship={ship}
            recipes={recipes}
            hasNav={hasNav}
            hasUnion={hasUnion}
            isPirate={isPirate}
            onProcess={process}
          />
        )}

        {/* PRODUCTION SECTION */}
        {section === 'production' && (
          <ProductionSection
            station={station}
            ship={ship}
            producedItems={producedItems}
            hasNav={hasNav}
            onBuy={buy}
            onSell={sell}
          />
        )}

        {/* MISSIONS SECTION */}
        {section === 'missions' && (
          <>
            <MissionsSection
              station={station}
              stations={stations}
              stationMissions={stationMissions}
              activeMissions={activeMissions}
              failedMissions={failedMissions}
              repLockedNextMissions={repLockedNextMissions}
              missionArcs={missionArcs}
              onAcceptMission={acceptMission}
              onAbandonMission={abandonMission}
              onSetChoiceDialog={setChoiceMissionDialog}
            />
            <ContractsSection
              station={station}
              stations={stations}
              stationContracts={stationContracts}
              activeContracts={activeContracts}
              onAcceptContract={acceptContract}
              onAbandonContract={abandonContract}
              onSetTrackedStation={setTrackedStation}
            />
          </>
        )}
      </div>
      
      {/* Mission Choice Dialog */}
      {choiceMissionDialog && (
        <MissionChoiceDialog
          mission={choiceMissionDialog}
          onChoose={(choiceId) => {
            makeMissionChoice(choiceMissionDialog.id, choiceId);
            setChoiceMissionDialog(null);
          }}
          onCancel={() => setChoiceMissionDialog(null)}
        />
      )}
    </>
  );
}
