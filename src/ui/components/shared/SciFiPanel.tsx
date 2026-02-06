import type { CSSProperties, ReactNode } from 'react';
import type { StationType } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';

interface SciFiPanelProps {
  stationType?: StationType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SciFiPanel({ 
  stationType = 'city', 
  children, 
  className = '',
  style = {}
}: SciFiPanelProps) {
  const colors = stationTypeColors[stationType];
  
  return (
    <div
      className={`sci-fi-panel ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%)',
        border: `2px solid ${colors.primary}`,
        borderRadius: 8,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        marginBottom: 12,
        ...style,
      }}
    >
      <div
        className="sci-fi-panel-scanline"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)` }}
      />
      <div className="sci-fi-panel-overlay" />
      <div className="sci-fi-panel-content">
        {children}
      </div>
    </div>
  );
}

