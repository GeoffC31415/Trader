import type { StationType } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';

interface DataRowProps {
  stationType?: StationType;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DataRow({ 
  stationType = 'city', 
  children,
  className = '',
  style = {}
}: DataRowProps) {
  const colors = stationTypeColors[stationType];
  
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 16,
        padding: 12,
        background: `${colors.primary}10`,
        border: `1px solid ${colors.primary}30`,
        borderLeft: `3px solid ${colors.primary}`,
        borderRadius: 6,
        marginBottom: 8,
        alignItems: 'center',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${colors.primary}15`;
        e.currentTarget.style.borderLeftColor = colors.secondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${colors.primary}10`;
        e.currentTarget.style.borderLeftColor = colors.primary;
      }}
    >
      {children}
    </div>
  );
}

