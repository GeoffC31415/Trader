import type { Station } from '../../../domain/types/world_types';
import type { Ship } from '../../../domain/types/world_types';
import type { AllyAssistToken } from '../../../domain/types/world_types';
import { stationTypeColors } from '../../utils/station_theme';
import { UIIcon } from '../ui_icon';
import { SciFiButton } from '../shared/SciFiButton';

interface MarketHeaderProps {
  station: Station;
  ship: Ship;
  stationAssist?: AllyAssistToken;
  onUndock: () => void;
  onConsumeAssist: (type: AllyAssistToken['type'], stationId: string) => void;
  setPending: (updates: any) => void;
}

export function MarketHeader({
  station,
  ship,
  stationAssist,
  onUndock,
  onConsumeAssist,
  setPending,
}: MarketHeaderProps) {
  const colors = stationTypeColors[station.type];
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px',
      background: `linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(15,20,30,0.98) 100%)`,
      border: `2px solid ${colors.primary}`,
      borderRadius: 8,
      marginBottom: 12,
      boxShadow: `0 8px 32px ${colors.glow}`,
    }}>
      <div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.secondary, letterSpacing: '0.1em', marginBottom: 4 }}>
          DOCKED AT
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, textShadow: `0 0 10px ${colors.glow}` }}>
          {station.name.toUpperCase()}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          padding: '8px 16px',
          background: `${colors.primary}15`,
          border: `1px solid ${colors.primary}`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <UIIcon name="icon_credits" size={20} style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
          <div>
            <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>CREDITS</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
              ${ship.credits.toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{
          padding: '8px 16px',
          background: `${colors.primary}15`,
          border: `1px solid ${colors.primary}`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <UIIcon name="system_cargo" size={20} style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
          <div>
            <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>CARGO</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
              {Object.values(ship.cargo).reduce((a,b)=>a+b,0)}/{ship.maxCargo}
            </div>
          </div>
        </div>
        <div style={{
          padding: '8px 16px',
          background: `${colors.primary}15`,
          border: `1px solid ${colors.primary}`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <UIIcon name="icon_reputation" size={20} style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
          <div>
            <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace', marginBottom: 2 }}>REPUTATION</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: colors.secondary }}>
              {(station.reputation || 0).toFixed(0)}
            </div>
          </div>
        </div>
        {stationAssist && (
          <div style={{
            padding: '8px 12px',
            background: `${colors.secondary}20`,
            border: `1px solid ${colors.secondary}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <UIIcon name="icon_star" size={18} style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
            <div style={{ fontFamily: 'monospace' }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>ALLY ASSIST</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.secondary }}>
                {stationAssist.type.replace('_', ' ')} • {stationAssist.description}
              </div>
            </div>
            <SciFiButton
              stationType={station.type}
              onClick={() => {
                const multiplier = stationAssist.type === 'discount' || stationAssist.type === 'refuel' ? 0.9 : 1.0;
                setPending({ pendingAssist: { by: station.id, type: stationAssist.type, multiplier } });
                onConsumeAssist(stationAssist.type, station.id);
              }}
              style={{ padding: '6px 10px', fontSize: 11 }}
            >
              USE
            </SciFiButton>
          </div>
        )}
        <SciFiButton
          stationType={station.type}
          variant="active"
          onClick={onUndock}
          style={{ padding: '10px 24px', fontSize: 13 }}
        >
          ⏏ UNDOCK (Q)
        </SciFiButton>
      </div>
    </div>
  );
}

