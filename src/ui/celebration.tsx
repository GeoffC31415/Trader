import { useEffect, useState } from 'react';
import { useGameStore } from '../state';
import { CELEBRATION_DURATION } from '../domain/constants/contract_constants';

export function Celebration() {
  const celebrationTimestamp = useGameStore(s => s.celebrationVisible);
  const celebrationBuyCost = useGameStore(s => s.celebrationBuyCost);
  const celebrationSellRevenue = useGameStore(s => s.celebrationSellRevenue);
  const celebrationBonusReward = useGameStore(s => s.celebrationBonusReward);
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!celebrationTimestamp) {
      setVisible(false);
      return;
    }

    // Show celebration
    setVisible(true);

    // Generate firework particles
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#3b82f6', '#60a5fa', '#a855f7', '#ef4444'][Math.floor(Math.random() * 8)],
        delay: Math.random() * 1000,
      });
    }
    setParticles(newParticles);

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
  }, [celebrationTimestamp]);

  const handleContinue = () => {
    setVisible(false);
  };

  if (!visible) return null;

  const tradeProfit = (celebrationSellRevenue || 0) - (celebrationBuyCost || 0);
  const totalEarnings = tradeProfit + (celebrationBonusReward || 0);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 100,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={handleContinue}
    >
      {/* Particles/Fireworks */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            animation: `firework 2s ease-out forwards`,
            animationDelay: `${p.delay}ms`,
            opacity: 0,
          }}
        />
      ))}

      {/* Main celebration message */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          animation: 'celebrationPulse 1s ease-out',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444, #ec4899, #a855f7, #3b82f6)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(251, 191, 36, 0.5)',
            animation: 'gradientShift 2s ease infinite, celebrationPulse 1s ease-out',
          }}
        >
          MISSION ACCOMPLISHED!
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#22c55e',
            marginTop: 16,
            fontWeight: 600,
            textShadow: '0 0 20px rgba(34, 197, 94, 0.8)',
            animation: 'fadeInUp 0.5s ease-out 0.3s backwards',
          }}
        >
          Contract Completed!
        </div>
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 32,
              color: '#60a5fa',
              fontWeight: 600,
              textShadow: '0 0 20px rgba(96, 165, 250, 0.6)',
              animation: 'fadeInUp 0.5s ease-out 0.5s backwards',
            }}
          >
            Buy-Sell Profit: +${tradeProfit.toLocaleString()}
          </div>
          {celebrationBonusReward !== undefined && celebrationBonusReward > 0 && (
            <div
              style={{
                fontSize: 32,
                color: '#fbbf24',
                marginTop: 8,
                fontWeight: 700,
                textShadow: '0 0 30px rgba(251, 191, 36, 0.8)',
                animation: 'fadeInUp 0.5s ease-out 0.7s backwards',
              }}
            >
              Mission Reward: +${celebrationBonusReward.toLocaleString()}
            </div>
          )}
          <div
            style={{
              fontSize: 48,
              color: '#22c55e',
              marginTop: 16,
              fontWeight: 700,
              textShadow: '0 0 30px rgba(34, 197, 94, 0.8)',
              animation: 'fadeInUp 0.5s ease-out 0.9s backwards, pulse 1.5s ease-in-out 0.9s infinite',
            }}
          >
            Total: +${totalEarnings.toLocaleString()}
          </div>
        </div>
        <button
          onClick={handleContinue}
          style={{
            marginTop: 32,
            padding: '12px 32px',
            fontSize: 18,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
            animation: 'fadeInUp 0.5s ease-out 1.1s backwards',
            pointerEvents: 'auto',
          }}
        >
          Continue [SPACE]
        </button>
      </div>

      {/* Confetti streaks */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`streak-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: -20,
            width: 4,
            height: 40,
            background: ['#fbbf24', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'][i % 5],
            opacity: 0.8,
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
            animationDelay: `${Math.random() * 1000}ms`,
          }}
        />
      ))}

      <style>{`
        @keyframes firework {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(1.5) translateY(${Math.random() * 200 - 100}px);
          }
        }

        @keyframes celebrationPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
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

        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(${Math.random() * 720}deg);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

