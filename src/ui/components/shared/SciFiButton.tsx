import type { StationType } from '../../../domain/types/economy_types';
import { stationTypeColors } from '../../utils/station_theme';

interface SciFiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  stationType?: StationType;
  variant?: 'default' | 'active' | 'danger';
}

export function SciFiButton({ 
  stationType = 'city', 
  variant = 'default',
  className = '',
  children,
  ...props 
}: SciFiButtonProps) {
  const colors = stationTypeColors[stationType];
  
  const baseStyles = {
    padding: '8px 16px',
    border: `1px solid ${colors.primary}`,
    borderRadius: 6,
    color: '#e5e7eb',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-ui)',
  };

  let background: string;
  if (variant === 'active') {
    background = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
  } else if (variant === 'danger') {
    background = 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.2))';
  } else {
    background = `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}20)`;
  }

  if (props.disabled) {
    background = 'linear-gradient(135deg, rgba(100,100,100,0.2), rgba(100,100,100,0.1))';
  }

  return (
    <button
      {...props}
      className={className}
      style={{
        ...baseStyles,
        background,
        opacity: props.disabled ? 0.4 : 1,
        ...(variant === 'active' && { color: '#000', fontWeight: 700 }),
        ...(variant === 'danger' && { borderColor: '#ef4444' }),
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!props.disabled && variant === 'default') {
          e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}50, ${colors.primary}30)`;
          e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow}`;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'default') {
          e.currentTarget.style.background = background;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </button>
  );
}

