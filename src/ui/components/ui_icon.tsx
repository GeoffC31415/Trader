import React from 'react';

type UIIconProps = {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
};

/**
 * UIIcon component for displaying UI enhancement assets
 * 
 * Usage:
 *   <UIIcon name="tab_market" size={24} />
 *   <UIIcon name="status_docked" size={16} />
 *   <UIIcon name="msg_success" />
 */
export function UIIcon({ name, size = 20, className, style, alt }: UIIconProps) {
  const iconPath = `/icons/ui/${name}.png`;
  
  return (
    <img
      src={iconPath}
      alt={alt || name.replace(/_/g, ' ')}
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      onError={(e) => {
        // Hide if icon doesn't exist yet
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

type CornerDecorationsProps = {
  color?: string;
  opacity?: number;
  size?: number;
};

/**
 * CornerDecorations component adds sci-fi corner embellishments to panels
 * 
 * Usage:
 *   <div style={{ position: 'relative' }}>
 *     <CornerDecorations color="#3b82f6" />
 *     ... panel content ...
 *   </div>
 */
export function CornerDecorations({ color = '#3b82f6', opacity = 0.5, size = 32 }: CornerDecorationsProps) {
  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
    opacity,
    filter: `drop-shadow(0 0 4px ${color})`,
  };

  return (
    <>
      {/* Top Left */}
      <img
        src="/icons/ui/corner_tl.png"
        alt=""
        style={{ ...cornerStyle, top: 0, left: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      
      {/* Top Right */}
      <img
        src="/icons/ui/corner_tr.png"
        alt=""
        style={{ ...cornerStyle, top: 0, right: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      
      {/* Bottom Left */}
      <img
        src="/icons/ui/corner_bl.png"
        alt=""
        style={{ ...cornerStyle, bottom: 0, left: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      
      {/* Bottom Right */}
      <img
        src="/icons/ui/corner_br.png"
        alt=""
        style={{ ...cornerStyle, bottom: 0, right: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </>
  );
}

type StatusIndicatorProps = {
  status: 'docked' | 'undocked' | 'mining' | 'trading' | 'traveling' | 'combat';
  label?: string;
  size?: number;
};

/**
 * StatusIndicator shows current ship/game status with icon
 * 
 * Usage:
 *   <StatusIndicator status="docked" label="Docked at Sol City" />
 */
export function StatusIndicator({ status, label, size = 20 }: StatusIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <UIIcon name={`status_${status}`} size={size} />
      {label && <span style={{ fontSize: 13, opacity: 0.9 }}>{label}</span>}
    </div>
  );
}

type MessageIconProps = {
  type: 'info' | 'success' | 'warning' | 'error' | 'quest';
  size?: number;
};

/**
 * MessageIcon for displaying message type indicators
 * 
 * Usage:
 *   <MessageIcon type="success" />
 *   <MessageIcon type="warning" size={24} />
 */
export function MessageIcon({ type, size = 20 }: MessageIconProps) {
  return <UIIcon name={`msg_${type}`} size={size} />;
}

