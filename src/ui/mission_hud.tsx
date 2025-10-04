// Mission HUD - Display active objectives and progress

import { useGameStore } from '../state';
import { formatTimeRemaining, getMissionTimeRemaining } from '../state/helpers/mission_helpers';
import { useState, useEffect } from 'react';

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
      }}>
        📋 {primaryMission.title}
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
    </div>
  );
}

