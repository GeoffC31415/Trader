// Mission choice dialog UI - presents player with branching mission choices

import { useState } from 'react';
import type { Mission, MissionChoice } from '../../domain/types/mission_types';
import { formatChoiceConsequences } from '../../systems/missions/choice_system';

interface MissionChoiceDialogProps {
  mission: Mission;
  onChoose: (choiceId: string) => void;
  onCancel: () => void;
}

export function MissionChoiceDialog({ mission, onChoose, onCancel }: MissionChoiceDialogProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [confirmWarning, setConfirmWarning] = useState(false);
  
  if (!mission.choiceOptions || mission.choiceOptions.length === 0) {
    return null;
  }
  
  const handleChoose = (choiceId: string) => {
    if (!confirmWarning) {
      setSelectedChoice(choiceId);
      setConfirmWarning(true);
      return;
    }
    
    onChoose(choiceId);
  };
  
  const handleBack = () => {
    setSelectedChoice(null);
    setConfirmWarning(false);
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div 
        className="sci-fi-panel"
        style={{
          maxWidth: 800,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 32,
          background: 'rgba(10, 10, 20, 0.98)',
          border: '2px solid #3b82f6',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            fontSize: 12, 
            color: '#3b82f6', 
            textTransform: 'uppercase', 
            letterSpacing: 2,
            marginBottom: 8,
          }}>
            Choice Mission
          </div>
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0,
            color: '#fff',
          }}>
            {mission.title}
          </h2>
          <p style={{ 
            fontSize: 15, 
            color: '#94a3b8', 
            marginTop: 12,
            lineHeight: 1.6,
          }}>
            {mission.description}
          </p>
        </div>
        
        {/* Warning Banner */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 6,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fca5a5',
              marginBottom: 4,
            }}>
              This choice is permanent
            </div>
            <div style={{ fontSize: 13, color: '#fecaca' }}>
              Your decision will have lasting consequences on the system's economy, politics, and available missions.
            </div>
          </div>
        </div>
        
        {/* Choice Options */}
        {!confirmWarning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {mission.choiceOptions.map((choice) => {
              const consequences = formatChoiceConsequences(choice);
              
              return (
                <div
                  key={choice.id}
                  style={{
                    background: selectedChoice === choice.id 
                      ? 'rgba(59, 130, 246, 0.15)' 
                      : 'rgba(30, 30, 45, 0.6)',
                    border: selectedChoice === choice.id
                      ? '2px solid #3b82f6'
                      : '2px solid rgba(100, 100, 120, 0.3)',
                    borderRadius: 8,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedChoice(choice.id)}
                  onMouseEnter={(e) => {
                    if (selectedChoice !== choice.id) {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.background = 'rgba(30, 30, 45, 0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedChoice !== choice.id) {
                      e.currentTarget.style.borderColor = 'rgba(100, 100, 120, 0.3)';
                      e.currentTarget.style.background = 'rgba(30, 30, 45, 0.6)';
                    }
                  }}
                >
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 600, 
                    color: '#fff',
                    marginBottom: 8,
                  }}>
                    {choice.label}
                  </div>
                  
                  <div style={{ 
                    fontSize: 14, 
                    color: '#cbd5e1',
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}>
                    {choice.description}
                  </div>
                  
                  {/* Rewards */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 16, 
                    marginBottom: 12,
                    fontSize: 13,
                  }}>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>
                      +{choice.rewards.credits.toLocaleString()} cr
                    </div>
                    {Object.entries(choice.rewards.reputationChanges).map(([stId, change]) => (
                      <div 
                        key={stId}
                        style={{ 
                          color: change > 0 ? '#10b981' : '#ef4444',
                          fontWeight: 600,
                        }}
                      >
                        {change > 0 ? '+' : ''}{change} rep
                      </div>
                    ))}
                  </div>
                  
                  {/* Consequences */}
                  {consequences.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ 
                        fontSize: 11, 
                        color: '#94a3b8', 
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}>
                        Consequences:
                      </div>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: 20,
                        fontSize: 13,
                        color: '#fbbf24',
                      }}>
                        {consequences.slice(0, 5).map((consequence, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            {consequence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Confirmation Screen */}
        {confirmWarning && selectedChoice && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              background: 'rgba(251, 191, 36, 0.15)',
              border: '2px solid rgba(251, 191, 36, 0.4)',
              borderRadius: 8,
              padding: 24,
            }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fbbf24', marginBottom: 12 }}>
                Confirm Your Choice
              </div>
              <div style={{ fontSize: 15, color: '#fde68a', marginBottom: 16, lineHeight: 1.6 }}>
                Are you sure you want to choose: <strong>{mission.choiceOptions.find(c => c.id === selectedChoice)?.label}</strong>?
              </div>
              <div style={{ fontSize: 14, color: '#fef3c7', lineHeight: 1.5 }}>
                This decision cannot be undone and will permanently affect your relationships, 
                available missions, and the political landscape of the system.
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          justifyContent: confirmWarning ? 'space-between' : 'flex-end',
        }}>
          {confirmWarning && (
            <button
              onClick={handleBack}
              className="sci-fi-button"
              style={{ 
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 600,
                background: 'rgba(100, 100, 120, 0.2)',
              }}
            >
              ← Back
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="sci-fi-button"
            style={{ 
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              background: 'rgba(100, 100, 120, 0.2)',
            }}
          >
            Cancel
          </button>
          
          {!confirmWarning && (
            <button
              onClick={() => selectedChoice && handleChoose(selectedChoice)}
              disabled={!selectedChoice}
              className="sci-fi-button"
              style={{ 
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 700,
                background: selectedChoice ? '#3b82f6' : 'rgba(100, 100, 120, 0.2)',
                opacity: selectedChoice ? 1 : 0.5,
              }}
            >
              Choose Path →
            </button>
          )}
          
          {confirmWarning && selectedChoice && (
            <button
              onClick={() => handleChoose(selectedChoice)}
              className="sci-fi-button"
              style={{ 
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 700,
                background: '#10b981',
              }}
            >
              Confirm Decision
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

