import { CSSProperties } from 'react';
import { formatNumber } from '../utils/number_format';

interface ReputationBadgeProps {
  reputation: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function ReputationBadge({ reputation, label = 'Reputation', size = 'medium' }: ReputationBadgeProps) {
  const fontSize = size === 'small' ? 11 : size === 'large' ? 14 : 12;
  const repFontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  
  const badgeStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(16,185,129,0.15)',
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(16,185,129,0.3)',
  };

  const labelStyle: CSSProperties = {
    opacity: 0.8,
    fontSize,
  };

  const valueStyle: CSSProperties = {
    fontWeight: 700,
    color: '#10b981',
    fontSize: repFontSize,
  };

  return (
    <div style={badgeStyle}>
      <span style={labelStyle}>{label}:</span>
      <span style={valueStyle}>{formatNumber(reputation)}</span>
    </div>
  );
}

