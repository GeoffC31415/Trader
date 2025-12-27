// Mission HUD - Display active objectives and progress

import { useGameStore } from '../state';
import { formatTimeRemaining, getMissionTimeRemaining } from '../state/helpers/mission_helpers';
import { useState, useEffect, useMemo } from 'react';
import { UIIcon } from './components/ui_icon';
import { DETECTION_RADIUS, DETECTION_THRESHOLD, calculateDistance } from '../systems/missions/stealth_system';

// Stealth indicator component for avoid_detection objectives
function StealthIndicator() {
  const ship = useGameStore(s => s.ship);
  const stations = useGameStore(s => s.stations);
  const missions = useGameStore(s => s.missions);
  const stealthStates = useGameStore(s => s.stealthStates);
  
  // Find stealth-relevant data
  const stealthData = useMemo(() => {
    const activeMissions = missions.filter(m => m.status === 'active');
    const stealthObjectives: { 
      missionId: string; 
      stationId: string; 
      stationName: string;
      suspicion: number;
      distance: number;
      inZone: boolean;
    }[] = [];
    
    for (const mission of activeMissions) {
      for (const obj of mission.objectives) {
        // avoid_detection objectives start as completed=true (meaning "not yet detected")
        // They stay completed=true until detection triggers, at which point mission fails
        // So we check for completed=true to show the stealth UI while still avoiding detection
        if (obj.type === 'avoid_detection' && obj.completed && obj.target) {
          const station = stations.find(s => s.id === obj.target);
          if (!station) continue;
          
          const stateKey = `${mission.id}:${obj.target}`;
          const state = stealthStates.get(stateKey);
          const suspicion = state?.suspicionLevel || 0;
          const distance = calculateDistance(ship.position, station.position);
          const inZone = distance < DETECTION_RADIUS;
          
          stealthObjectives.push({
            missionId: mission.id,
            stationId: obj.target,
            stationName: station.name,
            suspicion,
            distance,
            inZone,
          });
        }
      }
    }
    
    return stealthObjectives;
  }, [missions, stations, ship.position, stealthStates]);
  
  if (stealthData.length === 0) return null;
  
  // Get the closest/most relevant stealth zone
  const primaryStealth = stealthData.sort((a, b) => a.distance - b.distance)[0];
  const suspicionPercent = (primaryStealth.suspicion / DETECTION_THRESHOLD) * 100;
  const distanceFromZone = Math.max(0, primaryStealth.distance - DETECTION_RADIUS);
  
  // Color logic: green when safe, yellow when approaching, red when in zone
  const getBarColor = () => {
    if (primaryStealth.inZone) {
      if (suspicionPercent > 75) return '#ff4444';
      if (suspicionPercent > 40) return '#ffaa44';
      return '#ff6644';
    }
    if (distanceFromZone < DETECTION_RADIUS * 0.5) return '#ffcc44';
    return '#44cc88';
  };
  
  const getStatusText = () => {
    if (primaryStealth.inZone) {
      if (suspicionPercent >= 100) return 'DETECTED!';
      if (suspicionPercent > 75) return 'HIGH ALERT';
      if (suspicionPercent > 40) return 'SUSPICIOUS';
      return 'IN ZONE';
    }
    return 'CLEAR';
  };
  
  return (
    <div style={{
      marginTop: 12,
      borderTop: '1px solid rgba(255, 100, 100, 0.3)',
      paddingTop: 10,
    }}>
      {/* Stealth Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 11,
          color: '#ff9966',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>👁️</span>
          STEALTH ACTIVE
        </div>
        <span style={{
          fontSize: 10,
          color: getBarColor(),
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Suspicion Bar */}
      <div style={{
        marginBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#aaa',
          marginBottom: 3,
        }}>
          <span>Suspicion</span>
          <span style={{ color: getBarColor() }}>
            {Math.floor(suspicionPercent)}%
          </span>
        </div>
        <div style={{
          height: 6,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, suspicionPercent)}%`,
            background: getBarColor(),
            borderRadius: 3,
            transition: 'width 0.2s ease, background 0.2s ease',
          }} />
        </div>
      </div>
      
      {/* Distance Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
      }}>
        <span style={{ color: '#aaa' }}>
          {primaryStealth.stationName} zone
        </span>
        <span style={{ 
          color: primaryStealth.inZone ? '#ff6644' : '#6baaff',
          fontFamily: 'monospace',
        }}>
          {primaryStealth.inZone 
            ? `${Math.floor(primaryStealth.distance)}m inside` 
            : `${Math.floor(distanceFromZone)}m away`
          }
        </span>
      </div>
      
      {/* Detection Radius indicator */}
      <div style={{
        marginTop: 6,
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
      }}>
        Detection radius: {Math.floor(DETECTION_RADIUS)}m
      </div>
    </div>
  );
}

export function MissionHud() {
  const missions = useGameStore(s => s.missions);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);
  
  // Update current time for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Get active missions
  const activeMissions = missions.filter(m => m.status === 'active');
  
  // Only show HUD if there are active missions
  if (activeMissions.length === 0) return null;
  
  // Show only the first active mission (can be expanded to show all)
  const primaryMission = activeMissions[0];
  const incompleteObjectives = primaryMission.objectives.filter(obj => !obj.completed && !obj.optional);
  const nextObjective = incompleteObjectives[0];
  
  // Calculate time remaining
  const timeRemaining = getMissionTimeRemaining(primaryMission, currentTime);
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 200, 100, 0.5)',
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 280,
      maxWidth: 400,
      fontFamily: 'monospace',
      fontSize: 13,
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      zIndex: 100,
    }}>
      {/* Mission Title */}
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffc864',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <UIIcon name="tab_missions" size={18} />
        {primaryMission.title}
      </div>
      
      {/* Time Remaining */}
      {timeRemaining !== null && (
        <div style={{
          fontSize: 12,
          color: timeRemaining < 120 ? '#ff6b6b' : '#6baaff',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>⏱️</span>
          <span>Time: {formatTimeRemaining(timeRemaining)}</span>
        </div>
      )}
      
      {/* Current Objective */}
      {nextObjective && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 4,
          padding: '8px 10px',
          marginBottom: 8,
        }}>
          <div style={{
            fontSize: 11,
            color: '#aaa',
            textTransform: 'uppercase',
            marginBottom: 4,
            letterSpacing: '0.5px',
          }}>
            Current Objective
          </div>
          <div style={{
            fontSize: 13,
            color: '#fff',
            marginBottom: 4,
          }}>
            {nextObjective.description}
          </div>
          {nextObjective.quantity && nextObjective.quantity > 0 && (
            <div style={{
              fontSize: 12,
              color: '#6baaff',
            }}>
              Progress: {nextObjective.current} / {nextObjective.quantity}
              <span style={{
                marginLeft: 8,
                color: '#aaa',
              }}>
                ({Math.floor((nextObjective.current / nextObjective.quantity) * 100)}%)
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* All Objectives List */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: 8,
      }}>
        <div style={{
          fontSize: 11,
          color: '#aaa',
          textTransform: 'uppercase',
          marginBottom: 6,
          letterSpacing: '0.5px',
        }}>
          Objectives ({primaryMission.objectives.filter(o => o.completed).length} / {primaryMission.objectives.filter(o => !o.optional).length})
        </div>
        {primaryMission.objectives.filter(o => !o.optional).map((obj, idx) => (
          <div
            key={obj.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 4,
              fontSize: 12,
              opacity: obj.completed ? 0.6 : 1,
            }}
          >
            <span style={{
              color: obj.completed ? '#4ade80' : '#ffc864',
              flexShrink: 0,
            }}>
              {obj.completed ? '✓' : '○'}
            </span>
            <span style={{
              color: obj.completed ? '#aaa' : '#fff',
              textDecoration: obj.completed ? 'line-through' : 'none',
              flex: 1,
            }}>
              {obj.description}
              {obj.quantity && obj.quantity > 0 && !obj.completed && (
                <span style={{ color: '#6baaff', marginLeft: 6 }}>
                  ({obj.current}/{obj.quantity})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      
      {/* Optional Objectives */}
      {primaryMission.objectives.some(o => o.optional) && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 8,
          marginTop: 8,
        }}>
          <div style={{
            fontSize: 11,
            color: '#aaa',
            textTransform: 'uppercase',
            marginBottom: 6,
            letterSpacing: '0.5px',
          }}>
            Optional
          </div>
          {primaryMission.objectives.filter(o => o.optional).map((obj) => (
            <div
              key={obj.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              <span style={{
                color: obj.completed ? '#4ade80' : '#aaa',
              }}>
                {obj.completed ? '✓' : '○'}
              </span>
              <span style={{
                color: obj.completed ? '#aaa' : '#ccc',
                textDecoration: obj.completed ? 'line-through' : 'none',
              }}>
                {obj.description}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Stealth Indicator - shows when on stealth missions */}
      <StealthIndicator />
    </div>
  );
}

