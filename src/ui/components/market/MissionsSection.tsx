import { useState, useCallback } from 'react';
import type { Station } from '../../../domain/types/world_types';
import type { Mission, MissionArc } from '../../../domain/types/mission_types';
import { stationTypeColors } from '../../utils/station_theme';
import { SciFiPanel } from '../shared/SciFiPanel';
import { SectionHeader } from '../shared/SectionHeader';
import { SciFiButton } from '../shared/SciFiButton';
import { getFactionForStation, FACTIONS } from '../../../domain/constants/faction_constants';
import { getFactionReputation, getFactionStanding, getFactionStandingDisplay } from '../../../systems/reputation/faction_system';
import { ReputationBadge } from '../reputation_badge';
import type { Station as StationType } from '../../../domain/types/world_types';
import * as missionAudio from '../../../shared/audio/mission_audio';
import { gameConfig } from '../../../config/game_config';

interface MissionsSectionProps {
  station: Station;
  stations: StationType[];
  stationMissions: Mission[];
  activeMissions: Mission[];
  failedMissions: Mission[];
  repLockedNextMissions: Array<{
    arcId: string;
    arcName: string;
    stage: number;
    missionId: string;
    title: string;
    description: string;
    deficits: Array<{ stationId: string; required: number; current: number; missing: number }>;
  }>;
  missionArcs: MissionArc[];
  onAcceptMission: (id: string) => void;
  onAbandonMission: (id: string) => void;
  onSetChoiceDialog: (mission: Mission) => void;
}

export function MissionsSection({
  station,
  stations,
  stationMissions,
  activeMissions,
  failedMissions,
  repLockedNextMissions,
  missionArcs,
  onAcceptMission,
  onAbandonMission,
  onSetChoiceDialog,
}: MissionsSectionProps) {
  const colors = stationTypeColors[station.type];
  const [playingIntro, setPlayingIntro] = useState<string | null>(null);
  const [playedIntros, setPlayedIntros] = useState<Set<string>>(new Set());
  
  const playIntro = useCallback(async (missionId: string) => {
    if (playingIntro) {
      missionAudio.stopMissionAudio();
      setPlayingIntro(null);
      return;
    }
    
    setPlayingIntro(missionId);
    try {
      const introPaths = await missionAudio.getMissionIntroAudio(missionId);
      if (introPaths.length > 0) {
        const volume = gameConfig.audio?.dialogueVolume ?? 0.8;
        await missionAudio.playAudioSequence(introPaths, volume, () => {
          setPlayingIntro(null);
          setPlayedIntros(prev => new Set(prev).add(missionId));
        });
      } else {
        setPlayingIntro(null);
      }
    } catch (error) {
      console.warn('Failed to play mission intro:', error);
      setPlayingIntro(null);
    }
  }, [playingIntro]);
  
  return (
    <div className="scrollable-content">
      {stationMissions.length > 0 && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type}>Story Missions</SectionHeader>
          <div style={{
            padding: 12,
            background: `${colors.primary}10`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
            opacity: 0.9,
          }}>
            ℹ Story missions with choices that shape the system. Permanent consequences and unique rewards.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stationMissions.map(mission => {
              const arc = missionArcs.find(a => a.id === mission.arcId);
              const reqRepOk = !mission.requiredRep || Object.entries(mission.requiredRep).every(
                ([stId, minRep]) => (stations.find(s => s.id === stId)?.reputation || 0) >= minRep
              );
              
              return (
                <div key={mission.id} style={{
                  padding: 16,
                  background: `${colors.primary}15`,
                  border: `2px solid ${colors.secondary}40`,
                  borderLeft: `5px solid ${colors.secondary}`,
                  borderRadius: 8,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: colors.secondary }}>
                      {arc?.name || 'Story Mission'} — Stage {mission.stage}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                      {mission.title}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12, lineHeight: 1.5 }}>
                      {mission.description}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 6 }}>
                      OBJECTIVES:
                    </div>
                    {mission.objectives.map(obj => (
                      <div key={obj.id} style={{ 
                        fontSize: 12, 
                        marginBottom: 4, 
                        paddingLeft: 12,
                        opacity: obj.optional ? 0.7 : 1,
                      }}>
                        • {obj.description}{obj.optional && ' (Optional)'}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4 }}>
                        REWARDS:
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                        ${mission.rewards.credits.toLocaleString()}
                      </div>
                      {Object.entries(mission.rewards.reputationChanges).length > 0 && (
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                          {Object.entries(mission.rewards.reputationChanges).map(([stId, change]) => (
                            <span key={stId} style={{ 
                              marginRight: 8,
                              color: change > 0 ? '#10b981' : '#ef4444'
                            }}>
                              {change > 0 ? '+' : ''}{change} rep
                            </span>
                          ))}
                        </div>
                      )}
                      {mission.requiredRep && !reqRepOk && (
                        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontFamily: 'monospace' }}>
                          ✗ Insufficient reputation
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <SciFiButton
                        stationType={station.type}
                        onClick={() => playIntro(mission.id)}
                        style={{ 
                          padding: '10px 16px', 
                          fontSize: 12, 
                          fontWeight: 600,
                          opacity: playedIntros.has(mission.id) ? 0.7 : 1,
                        }}
                      >
                        {playingIntro === mission.id ? '⏹ STOP' : playedIntros.has(mission.id) ? '🔊 REPLAY' : '🔊 LISTEN'}
                      </SciFiButton>
                      <SciFiButton
                        stationType={station.type}
                        onClick={() => {
                          if (playingIntro) missionAudio.stopMissionAudio();
                          if (mission.type === 'choice') {
                            onSetChoiceDialog(mission);
                          } else {
                            onAcceptMission(mission.id);
                          }
                        }}
                        disabled={!reqRepOk}
                        style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
                      >
                        {mission.type === 'choice' ? 'CHOOSE PATH' : 'ACCEPT MISSION'}
                      </SciFiButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SciFiPanel>
      )}

      {repLockedNextMissions.length > 0 && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type} style={{ color: '#f87171' }}>Next Story Missions (Locked)</SectionHeader>
          <div style={{
            padding: 12,
            background: `${colors.primary}10`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 12,
            opacity: 0.9,
          }}>
            ✗ You need more reputation to unlock these missions. Improve standing at the listed stations.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {repLockedNextMissions.map(item => (
              <div key={`${item.arcId}:${item.missionId}`} style={{
                padding: 16,
                background: `${colors.primary}10`,
                border: '2px solid rgba(248,113,113,0.4)',
                borderLeft: '5px solid #ef4444',
                borderRadius: 8,
              }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, fontFamily: 'monospace', marginBottom: 4, color: '#fca5a5' }}>
                    {item.arcName} — Stage {item.stage}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {item.description}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#fca5a5' }}>
                  Requires reputation:
                  <div style={{ marginTop: 6 }}>
                    {item.deficits.map(d => (
                      <div key={d.stationId}>
                        • {stations.find(s => s.id === d.stationId)?.name || d.stationId}: {d.current} / {d.required}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SciFiPanel>
      )}
      
      {activeMissions.length > 0 && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type}>Active Story Missions</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeMissions.map(mission => {
              const arc = missionArcs.find(a => a.id === mission.arcId);
              const completedObjectives = mission.objectives.filter(o => o.completed).length;
              const totalObjectives = mission.objectives.filter(o => !o.optional).length;
              const progress = (completedObjectives / totalObjectives) * 100;
              
              return (
                <div key={mission.id} style={{
                  padding: 16,
                  background: `${colors.primary}15`,
                  border: `2px solid ${colors.secondary}40`,
                  borderLeft: `5px solid ${progress >= 100 ? '#10b981' : colors.secondary}`,
                  borderRadius: 8,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: colors.secondary }}>
                      {arc?.name || 'Story Mission'} — Stage {mission.stage}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                      {mission.title}
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 4,
                    height: 8,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      width: `${Math.min(100, progress)}%`,
                      height: '100%',
                      background: progress >= 100 ? '#22c55e' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                      transition: 'width 0.3s ease',
                      boxShadow: `0 0 10px ${progress >= 100 ? '#22c55e' : colors.glow}`,
                    }} />
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    {mission.objectives.map(obj => (
                      <div key={obj.id} style={{ 
                        fontSize: 12, 
                        marginBottom: 4,
                        paddingLeft: 12,
                        opacity: obj.completed ? 0.6 : 1,
                        textDecoration: obj.completed ? 'line-through' : 'none',
                      }}>
                        {obj.completed ? '✓' : '○'} {obj.description}
                        {obj.quantity && obj.quantity > 1 && ` (${obj.current}/${obj.quantity})`}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <SciFiButton 
                      stationType={station.type}
                      variant="danger"
                      onClick={() => onAbandonMission(mission.id)}
                    >
                      ABANDON
                    </SciFiButton>
                  </div>
                </div>
              );
            })}
          </div>
        </SciFiPanel>
      )}
      
      {failedMissions.length > 0 && (
        <SciFiPanel stationType={station.type}>
          <SectionHeader stationType={station.type} style={{ color: '#ef4444' }}>Failed Missions</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {failedMissions.map(mission => {
              const arc = missionArcs.find(a => a.id === mission.arcId);
              
              return (
                <div key={mission.id} style={{
                  padding: 16,
                  background: 'rgba(239,68,68,0.1)',
                  border: '2px solid rgba(239,68,68,0.4)',
                  borderLeft: '5px solid #ef4444',
                  borderRadius: 8,
                }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', marginBottom: 4, color: '#ef4444' }}>
                      {arc?.name || 'Story Mission'} — Stage {mission.stage} — FAILED
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, textDecoration: 'line-through', opacity: 0.7 }}>
                      {mission.title}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, color: '#f87171' }}>
                      Mission failed. You can re-accept this mission to try again.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SciFiPanel>
      )}
    </div>
  );
}

