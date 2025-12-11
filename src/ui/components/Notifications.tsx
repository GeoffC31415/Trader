import { useEffect } from 'react';
import { useGameStore } from '../../state';
import { shouldDismissNotification } from '../../state/modules/notifications';

export function Notifications() {
  const notifications = useGameStore(s => s.notifications || []);
  const dismissNotification = useGameStore(s => s.dismissNotification);
  
  // Auto-dismiss notifications with duration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      notifications.forEach(notif => {
        if (shouldDismissNotification(notif, now)) {
          dismissNotification(notif.id);
        }
      });
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, [notifications, dismissNotification]);
  
  if (notifications.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {notifications.map(notif => {
        const colors = {
          info: { bg: 'rgba(59,130,246,0.95)', border: '#3b82f6' },
          success: { bg: 'rgba(16,185,129,0.95)', border: '#10b981' },
          warning: { bg: 'rgba(245,158,11,0.95)', border: '#f59e0b' },
          error: { bg: 'rgba(239,68,68,0.95)', border: '#ef4444' },
        };
        const color = colors[notif.type];
        
        return (
          <div
            key={notif.id}
            style={{
              background: color.bg,
              border: `2px solid ${color.border}`,
              borderRadius: 8,
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: 14,
              fontFamily: 'monospace',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents: 'auto',
              minWidth: 300,
              maxWidth: 500,
              animation: 'slideDown 0.3s ease-out',
            }}
            onClick={() => dismissNotification(notif.id)}
          >
            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            {notif.message}
          </div>
        );
      })}
    </div>
  );
}

