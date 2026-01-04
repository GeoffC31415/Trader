/**
 * Political Compass Component
 * 
 * A 2D scatter plot visualization showing the player's political alignment
 * based on their mission choices, displayed on two axes:
 * - X-axis: Order (-100) ↔ Freedom (+100)
 * - Y-axis: Capital (-100) ↔ Labor (+100)
 * 
 * Features:
 * 1. Current player as a solid dot with glow
 * 2. Other players as semi-transparent dots
 * 3. Quadrant backgrounds with subtle color tints
 * 4. Trail showing player's journey from (0,0) to current position
 */

import { useMemo } from 'react';
import { useGameStore } from '../../state';
import {
  QUADRANT_INFO,
  DUMMY_PLAYERS,
  scoreToPosition,
  calculateJourneyPath,
  getQuadrant,
  createInitialProfile,
  type PoliticalScore,
  type DummyPlayer,
} from '../../systems/politics/political_compass';

// ============================================================================
// Constants
// ============================================================================

const COMPASS_SIZE = 320; // Base size in pixels
const PADDING = 40; // Padding for labels
const DOT_SIZE_PLAYER = 12;
const DOT_SIZE_OTHER = 6;
const TRAIL_OPACITY = 0.6;

// ============================================================================
// Component
// ============================================================================

interface PoliticalCompassProps {
  className?: string;
  showOtherPlayers?: boolean;
  showTrail?: boolean;
  size?: number;
}

export function PoliticalCompass({
  className = '',
  showOtherPlayers = true,
  showTrail = true,
  size = COMPASS_SIZE,
}: PoliticalCompassProps) {
  const politicalProfile = useGameStore(s => s.politicalProfile) || createInitialProfile();
  
  const playerPosition = useMemo(
    () => scoreToPosition(politicalProfile.score),
    [politicalProfile.score]
  );
  
  const journeyPath = useMemo(
    () => showTrail ? calculateJourneyPath(politicalProfile.history) : [],
    [politicalProfile.history, showTrail]
  );
  
  const quadrant = getQuadrant(politicalProfile.score);
  const quadrantInfo = QUADRANT_INFO[quadrant];
  
  // Calculate actual content area
  const contentSize = size - PADDING * 2;
  
  // Convert normalized position (0-1) to pixel coordinates
  const toPixel = (pos: { x: number; y: number }) => ({
    x: PADDING + pos.x * contentSize,
    // Invert Y because SVG y increases downward but we want Labor at top
    y: PADDING + (1 - pos.y) * contentSize,
  });
  
  const playerPixel = toPixel(playerPosition);
  
  return (
    <div className={`political-compass ${className}`}>
      <style>{`
        .political-compass {
          background: linear-gradient(135deg, rgba(10, 15, 25, 0.95) 0%, rgba(15, 20, 30, 0.98) 100%);
          border: 1px solid rgba(100, 120, 150, 0.3);
          border-radius: 8px;
          padding: 16px;
        }
        
        .compass-title {
          font-family: 'Orbitron', 'Space Grotesk', sans-serif;
          font-size: 14px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 12px;
          text-align: center;
        }
        
        .compass-container {
          position: relative;
          width: ${size}px;
          height: ${size}px;
          margin: 0 auto;
        }
        
        .compass-svg {
          width: 100%;
          height: 100%;
        }
        
        .quadrant-fill {
          opacity: 0.15;
        }
        
        .axis-line {
          stroke: rgba(100, 120, 150, 0.4);
          stroke-width: 1;
        }
        
        .grid-line {
          stroke: rgba(100, 120, 150, 0.15);
          stroke-width: 1;
          stroke-dasharray: 4 4;
        }
        
        .axis-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 10px;
          fill: #64748b;
          text-anchor: middle;
        }
        
        .axis-label-freedom { fill: #22c55e; }
        .axis-label-order { fill: #ef4444; }
        .axis-label-labor { fill: #3b82f6; }
        .axis-label-capital { fill: #eab308; }
        
        .other-player-dot {
          fill: rgba(148, 163, 184, 0.4);
          transition: fill 0.2s;
        }
        
        .other-player-dot:hover {
          fill: rgba(148, 163, 184, 0.8);
        }
        
        .journey-path {
          fill: none;
          stroke: rgba(139, 92, 246, ${TRAIL_OPACITY});
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .journey-node {
          fill: rgba(139, 92, 246, 0.6);
        }
        
        .player-dot {
          fill: #8b5cf6;
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8));
        }
        
        .player-dot-glow {
          fill: rgba(139, 92, 246, 0.3);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
        
        .compass-info {
          margin-top: 16px;
          text-align: center;
        }
        
        .quadrant-label {
          font-family: 'Orbitron', 'Space Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .quadrant-description {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
          max-width: 280px;
          margin: 0 auto;
        }
        
        .score-display {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        
        .score-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .score-label {
          color: #64748b;
        }
        
        .score-value {
          font-weight: 600;
        }
        
        .score-value.positive { color: #22c55e; }
        .score-value.negative { color: #ef4444; }
        .score-value.neutral { color: #94a3b8; }
        
        .history-count {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          color: #64748b;
          margin-top: 8px;
        }
      `}</style>
      
      <div className="compass-title">Political Compass</div>
      
      <div className="compass-container">
        <svg className="compass-svg" viewBox={`0 0 ${size} ${size}`}>
          {/* Quadrant backgrounds */}
          <g className="quadrants">
            {/* Top-Right: Free Worker (+Freedom, +Labor) */}
            <rect
              x={PADDING + contentSize / 2}
              y={PADDING}
              width={contentSize / 2}
              height={contentSize / 2}
              fill={QUADRANT_INFO.free_worker.color}
              className="quadrant-fill"
            />
            {/* Top-Left: Union Builder (-Freedom, +Labor) */}
            <rect
              x={PADDING}
              y={PADDING}
              width={contentSize / 2}
              height={contentSize / 2}
              fill={QUADRANT_INFO.union_builder.color}
              className="quadrant-fill"
            />
            {/* Bottom-Right: Libertarian (+Freedom, -Labor) */}
            <rect
              x={PADDING + contentSize / 2}
              y={PADDING + contentSize / 2}
              width={contentSize / 2}
              height={contentSize / 2}
              fill={QUADRANT_INFO.libertarian.color}
              className="quadrant-fill"
            />
            {/* Bottom-Left: Corporate Loyalist (-Freedom, -Labor) */}
            <rect
              x={PADDING}
              y={PADDING + contentSize / 2}
              width={contentSize / 2}
              height={contentSize / 2}
              fill={QUADRANT_INFO.corporate_loyalist.color}
              className="quadrant-fill"
            />
          </g>
          
          {/* Grid lines */}
          <g className="grid">
            {/* Vertical grid lines at 25%, 75% */}
            <line
              x1={PADDING + contentSize * 0.25}
              y1={PADDING}
              x2={PADDING + contentSize * 0.25}
              y2={PADDING + contentSize}
              className="grid-line"
            />
            <line
              x1={PADDING + contentSize * 0.75}
              y1={PADDING}
              x2={PADDING + contentSize * 0.75}
              y2={PADDING + contentSize}
              className="grid-line"
            />
            {/* Horizontal grid lines at 25%, 75% */}
            <line
              x1={PADDING}
              y1={PADDING + contentSize * 0.25}
              x2={PADDING + contentSize}
              y2={PADDING + contentSize * 0.25}
              className="grid-line"
            />
            <line
              x1={PADDING}
              y1={PADDING + contentSize * 0.75}
              x2={PADDING + contentSize}
              y2={PADDING + contentSize * 0.75}
              className="grid-line"
            />
          </g>
          
          {/* Main axes */}
          <g className="axes">
            {/* X-axis (horizontal) */}
            <line
              x1={PADDING}
              y1={PADDING + contentSize / 2}
              x2={PADDING + contentSize}
              y2={PADDING + contentSize / 2}
              className="axis-line"
            />
            {/* Y-axis (vertical) */}
            <line
              x1={PADDING + contentSize / 2}
              y1={PADDING}
              x2={PADDING + contentSize / 2}
              y2={PADDING + contentSize}
              className="axis-line"
            />
          </g>
          
          {/* Axis labels */}
          <g className="axis-labels">
            <text
              x={PADDING + contentSize + 5}
              y={PADDING + contentSize / 2}
              className="axis-label axis-label-freedom"
              textAnchor="start"
              dominantBaseline="middle"
            >
              Freedom
            </text>
            <text
              x={PADDING - 5}
              y={PADDING + contentSize / 2}
              className="axis-label axis-label-order"
              textAnchor="end"
              dominantBaseline="middle"
            >
              Order
            </text>
            <text
              x={PADDING + contentSize / 2}
              y={PADDING - 8}
              className="axis-label axis-label-labor"
              dominantBaseline="auto"
            >
              Labor
            </text>
            <text
              x={PADDING + contentSize / 2}
              y={PADDING + contentSize + 14}
              className="axis-label axis-label-capital"
              dominantBaseline="hanging"
            >
              Capital
            </text>
          </g>
          
          {/* Other players (semi-transparent) */}
          {showOtherPlayers && (
            <g className="other-players">
              {DUMMY_PLAYERS.map((player: DummyPlayer) => {
                const pos = scoreToPosition(player.score);
                const pixel = toPixel(pos);
                return (
                  <circle
                    key={player.id}
                    cx={pixel.x}
                    cy={pixel.y}
                    r={DOT_SIZE_OTHER}
                    className="other-player-dot"
                  >
                    <title>{player.name}: ({player.score.freedom}, {player.score.labor})</title>
                  </circle>
                );
              })}
            </g>
          )}
          
          {/* Journey trail */}
          {showTrail && journeyPath.length > 1 && (
            <g className="journey">
              {/* Path line */}
              <path
                d={journeyPath.map((score: PoliticalScore, i: number) => {
                  const pos = scoreToPosition(score);
                  const pixel = toPixel(pos);
                  return `${i === 0 ? 'M' : 'L'} ${pixel.x} ${pixel.y}`;
                }).join(' ')}
                className="journey-path"
              />
              {/* Node dots along the path (excluding current position) */}
              {journeyPath.slice(0, -1).map((score: PoliticalScore, i: number) => {
                const pos = scoreToPosition(score);
                const pixel = toPixel(pos);
                return (
                  <circle
                    key={i}
                    cx={pixel.x}
                    cy={pixel.y}
                    r={3}
                    className="journey-node"
                  />
                );
              })}
            </g>
          )}
          
          {/* Player position (with glow) */}
          <g className="player">
            {/* Glow effect */}
            <circle
              cx={playerPixel.x}
              cy={playerPixel.y}
              r={DOT_SIZE_PLAYER * 2}
              className="player-dot-glow"
            />
            {/* Main dot */}
            <circle
              cx={playerPixel.x}
              cy={playerPixel.y}
              r={DOT_SIZE_PLAYER}
              className="player-dot"
            />
          </g>
        </svg>
      </div>
      
      {/* Info section */}
      <div className="compass-info">
        <div
          className="quadrant-label"
          style={{ color: quadrantInfo.color }}
        >
          {quadrantInfo.label}
        </div>
        <div className="quadrant-description">
          {quadrantInfo.description}
        </div>
        
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">Freedom:</span>
            <span className={`score-value ${
              politicalProfile.score.freedom > 0 ? 'positive' :
              politicalProfile.score.freedom < 0 ? 'negative' : 'neutral'
            }`}>
              {politicalProfile.score.freedom > 0 ? '+' : ''}
              {politicalProfile.score.freedom}
            </span>
          </div>
          <div className="score-item">
            <span className="score-label">Labor:</span>
            <span className={`score-value ${
              politicalProfile.score.labor > 0 ? 'positive' :
              politicalProfile.score.labor < 0 ? 'negative' : 'neutral'
            }`}>
              {politicalProfile.score.labor > 0 ? '+' : ''}
              {politicalProfile.score.labor}
            </span>
          </div>
        </div>
        
        {politicalProfile.history.length > 0 && (
          <div className="history-count">
            {politicalProfile.history.length} choice{politicalProfile.history.length !== 1 ? 's' : ''} recorded
          </div>
        )}
      </div>
    </div>
  );
}

export default PoliticalCompass;

