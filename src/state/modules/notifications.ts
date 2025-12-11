/**
 * Notification System Module
 * 
 * Handles user-facing notifications for actions, errors, and information.
 */

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // milliseconds, undefined = manual dismiss only
  createdAt: number;
};

/**
 * Create a new notification
 */
export function createNotification(
  type: NotificationType,
  message: string,
  duration?: number
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    duration,
    createdAt: Date.now(),
  };
}

/**
 * Check if a notification should be auto-dismissed
 */
export function shouldDismissNotification(notif: Notification, currentTime: number): boolean {
  if (!notif.duration) return false;
  return currentTime - notif.createdAt >= notif.duration;
}

