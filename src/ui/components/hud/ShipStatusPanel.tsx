import type { Ship } from '../../../domain/types/world_types';
import type { Station } from '../../../domain/types/world_types';
import type { Contract } from '../../../domain/types/world_types';
import { UIIcon } from '../ui_icon';
import { SHIP_STATUS_PANEL_TOP_WITH_NAV, SHIP_STATUS_PANEL_TOP_WITHOUT_NAV, SHIP_STATUS_PANEL_RIGHT, SHIP_STATUS_PANEL_MIN_WIDTH } from '../../constants/layout_constants';
import { formatNumber } from '../../utils/number_format';

interface ShipStatusPanelProps {
  ship: Ship;
  stations: Station[];
  contracts: Contract[];
  hasNav: boolean;
}

export function ShipStatusPanel({ ship, stations, contracts, hasNav }: ShipStatusPanelProps) {
  const activeContractsCount = contracts.filter(c => c.status === 'accepted').length;
  const dockedStation = ship.dockedStationId ? stations.find(s => s.id === ship.dockedStationId) : null;
  const cargoUsed = Object.values(ship.cargo).reduce((a, b) => a + b, 0);
  
  return (
    <div style={{
      position: 'absolute',
      top: hasNav ? SHIP_STATUS_PANEL_TOP_WITH_NAV : SHIP_STATUS_PANEL_TOP_WITHOUT_NAV,
      right: SHIP_STATUS_PANEL_RIGHT,
      background: 'linear-gradient(135deg, rgba(11,18,32,0.95), rgba(15,23,42,0.95))',
      color: '#e5e7eb',
      padding: '14px 18px',
      borderRadius: 10,
      border: '2px solid rgba(59,130,246,0.3)',
      minWidth: SHIP_STATUS_PANEL_MIN_WIDTH,
      fontSize: 13,
      fontFamily: 'monospace',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      zIndex: 20,
    }}>
      {/* Status Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(59,130,246,0.2)',
      }}>
        <UIIcon 
          name={ship.dockedStationId ? 'status_docked' : 'status_traveling'} 
          size={24} 
          style={{ 
            filter: ship.dockedStationId 
              ? 'drop-shadow(0 0 8px #10b981)' 
              : 'drop-shadow(0 0 8px #60a5fa)' 
          }} 
        />
        <div>
          <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2, letterSpacing: '0.5px' }}>
            SHIP STATUS
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 15,
            color: ship.dockedStationId ? '#10b981' : '#60a5fa',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {ship.dockedStationId ? 'DOCKED' : 'IN FLIGHT'}
          </div>
        </div>
      </div>
      
      {/* Location Info */}
      {dockedStation && (
        <div style={{ 
          fontSize: 12, 
          opacity: 0.9,
          marginBottom: 10,
          padding: '6px 8px',
          background: 'rgba(16,185,129,0.1)',
          borderRadius: 6,
          borderLeft: '3px solid #10b981',
        }}>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 2 }}>LOCATION</div>
          <div style={{ fontWeight: 600, color: '#10b981' }}>{dockedStation.name}</div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="icon_credits" size={16} />
            <span style={{ fontSize: 11 }}>Credits</span>
          </div>
          <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>
            ${ship.credits.toLocaleString()}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_cargo" size={16} />
            <span style={{ fontSize: 11 }}>Cargo</span>
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14,
            color: cargoUsed >= ship.maxCargo ? '#ef4444' : '#60a5fa',
          }}>
            {cargoUsed} / {ship.maxCargo}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <UIIcon name="system_engine" size={16} />
            <span style={{ fontSize: 11 }}>Engine</span>
          </div>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14,
            color: ship.enginePower > 0 ? '#22c55e' : '#6b7280',
          }}>
            {formatNumber(ship.enginePower * 100)}%
          </div>
        </div>
      </div>
      
      {/* Active Contracts Indicator */}
      {activeContractsCount > 0 && (
        <div style={{
          marginTop: 10,
          padding: '6px 8px',
          background: 'rgba(59,130,246,0.15)',
          borderRadius: 6,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderLeft: '3px solid #3b82f6',
        }}>
          <UIIcon name="tab_missions" size={14} />
          <span style={{ opacity: 0.9 }}>
            {activeContractsCount} Active Contract{activeContractsCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

