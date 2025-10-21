import { useEffect } from 'react';
import { Notification, useNotification } from '../hooks/useNotification';
import { ToastNotification } from './ToastNotification';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  useEffect(() => {
    // Auto remove notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  if (notifications.length === 0) return null;

  return (
    <>
      {/* Notifications - Positioned below navbar */}
      <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-sm w-full">
        {notifications.map((notification, index) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            index={index}
          />
        ))}
      </div>
    </>
  );
}
