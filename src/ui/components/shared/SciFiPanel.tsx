import type { StationType } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';

interface SciFiPanelProps {
  stationType?: StationType;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SciFiPanel({ 
  stationType = 'city', 
  children, 
  className = '',
  style = {}
}: SciFiPanelProps) {
  const colors = stationTypeColors[stationType];
  
  return (
    <>
      <style>{`
        .sci-fi-panel-${stationType} {
          background: linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%);
          border: 2px solid ${colors.primary};
          border-radius: 8px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .sci-fi-panel-${stationType}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
          animation: scanline-market-${stationType} 3s linear infinite;
        }
        .sci-fi-panel-${stationType}::after {
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
        @keyframes scanline-market-${stationType} {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
      <div className={`sci-fi-panel-${stationType} ${className}`} style={style}>
        {children}
      </div>
    </>
  );
}

