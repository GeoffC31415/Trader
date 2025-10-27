import { useEffect, useState } from 'react';
import { useGameStore } from '../state';
import { renderMissionCompletionNarrative } from '../domain/constants/mission_completion_narratives';

export function MissionCelebration() {
  const missionCelebrationData = useGameStore(s => s.missionCelebrationData);
  const clearCelebration = useGameStore.setState;
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!missionCelebrationData) {
      setVisible(false);
      return;
    }

    // Show celebration
    setVisible(true);

    // Generate firework particles (more subdued than contract celebration)
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#06b6d4', '#22d3ee'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 1000,
      });
    }
    setParticles(newParticles);
  }, [missionCelebrationData]);

  useEffect(() => {
    if (!visible) return;

    // Keyboard listener for spacebar to dismiss
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [visible]);

  const handleContinue = () => {
    setVisible(false);
    // Clear celebration data after a short delay
    setTimeout(() => {
      clearCelebration({ missionCelebrationData: undefined });
    }, 300);
  };

  if (!visible || !missionCelebrationData) return null;

  const narrative = renderMissionCompletionNarrative(
    missionCelebrationData.missionId,
    missionCelebrationData.narrativeContext || {}
  );
  
  if (!narrative) {
    // Fallback for missions without custom narratives
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
          zIndex: 100,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, color: '#3b82f6', marginBottom: 16 }}>
            Mission Complete!
          </div>
          <button
            onClick={handleContinue}
            style={{
              marginTop: 32,
              padding: '12px 32px',
              fontSize: 18,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const { credits, reputationChanges } = missionCelebrationData;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 100,
        overflow: 'hidden',
        background: 'rgba(0,0,15,0.92)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Subtle particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animation: `missionFirework 3s ease-out forwards`,
            animationDelay: `${p.delay}ms`,
            opacity: 0,
          }}
        />
      ))}

      {/* Main content container */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'fadeInScale 0.8s ease-out',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6, #8b5cf6)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            marginBottom: 12,
            animation: 'gradientShift 3s ease infinite',
          }}
        >
          {narrative.title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: 32,
            fontStyle: 'italic',
          }}
        >
          Mission Complete
        </div>

        {/* Context chips */}
        {(missionCelebrationData.narrativeContext || missionCelebrationData.allyAssistUnlocked) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
            {missionCelebrationData.narrativeContext?.routeStart && missionCelebrationData.narrativeContext?.routeEnd && (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)' }}>
                Route: {missionCelebrationData.narrativeContext.routeStart} → {missionCelebrationData.narrativeContext.routeEnd}
              </span>
            )}
            {missionCelebrationData.narrativeContext?.stealthUsed && (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' }}>
                Method: Stealth
              </span>
            )}
            {typeof missionCelebrationData.narrativeContext?.enemiesDestroyed === 'number' && missionCelebrationData.narrativeContext.enemiesDestroyed > 0 && (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' }}>
                Hostiles neutralized: {missionCelebrationData.narrativeContext.enemiesDestroyed}
              </span>
            )}
            {missionCelebrationData.allyAssistUnlocked && (
              <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(168,85,247,0.12)', color: '#a78bfa', border: '1px solid rgba(168,85,247,0.35)' }}>
                Ally assist unlocked: {missionCelebrationData.allyAssistUnlocked.by} • {missionCelebrationData.allyAssistUnlocked.type}
              </span>
            )}
          </div>
        )}

        {/* Epilogue text - main narrative */}
        <div
          style={{
            background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            animation: 'fadeInUp 0.6s ease-out 0.2s backwards',
          }}
        >
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: '#e2e8f0',
              textAlign: 'justify',
              fontFamily: 'Georgia, serif',
            }}
          >
            {narrative.epilogue}
          </div>

          {/* Quote section if present */}
          {narrative.quote && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontStyle: 'italic',
                  color: '#60a5fa',
                  marginBottom: 8,
                }}
              >
                &ldquo;{narrative.quote.text}&rdquo;
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#94a3b8',
                  textAlign: 'right',
                }}
              >
                — {narrative.quote.speaker}
              </div>
            </div>
          )}
        </div>

        {/* Outcomes section */}
        <div
          style={{
            background: 'rgba(30,41,59,0.6)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            animation: 'fadeInUp 0.6s ease-out 0.4s backwards',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#a78bfa',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            System Changes
          </div>
          {narrative.outcomes.map((outcome, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 15,
                color: '#cbd5e1',
                marginBottom: 10,
                paddingLeft: 24,
                position: 'relative',
                animation: `fadeInLeft 0.4s ease-out ${0.5 + idx * 0.1}s backwards`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: '#8b5cf6',
                }}
              >
                ▸
              </span>
              {outcome}
            </div>
          ))}
        </div>

        {/* Rewards section */}
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            animation: 'fadeInUp 0.6s ease-out 0.6s backwards',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#4ade80',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Rewards
          </div>

          {/* Credits */}
          <div
            style={{
              fontSize: 28,
              color: '#22c55e',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            +${credits.toLocaleString()} Credits
          </div>

          {/* Reputation changes */}
          {Object.entries(reputationChanges).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  color: '#94a3b8',
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Reputation Changes:
              </div>
              {Object.entries(reputationChanges).map(([stationId, change]) => (
                <div
                  key={stationId}
                  style={{
                    fontSize: 14,
                    color: change > 0 ? '#22c55e' : '#ef4444',
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>
                    {stationId.replace('-', ' ')}
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: '1px solid rgba(59,130,246,0.5)',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
            animation: 'fadeInUp 0.5s ease-out 0.8s backwards, pulse 2s ease-in-out 1s infinite',
            pointerEvents: 'auto',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa, #3b82f6)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Continue
        </button>

        {/* Scroll hint and keyboard shortcut */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 12,
            color: '#64748b',
            fontStyle: 'italic',
          }}
        >
          Press Space or click Continue • Scroll to read full narrative
        </div>
      </div>

      <style>{`
        @keyframes missionFirework {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          10% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: scale(1.2) translateY(${Math.random() * 150 - 75}px);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 4px 30px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>
    </div>
  );
}

