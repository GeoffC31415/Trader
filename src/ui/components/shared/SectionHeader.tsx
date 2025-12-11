import type { StationType } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';

interface SectionHeaderProps {
  stationType?: StationType;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SectionHeader({ 
  stationType = 'city', 
  children,
  className = '',
  style = {}
}: SectionHeaderProps) {
  const colors = stationTypeColors[stationType];
  
  return (
    <div 
      className={className}
      style={{
        fontSize: 11,
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        color: colors.secondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        borderBottom: `1px solid ${colors.primary}40`,
        paddingBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      <span style={{ color: colors.primary }}>◢</span>
      {children}
    </div>
  );
}

