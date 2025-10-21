import { useEffect, useState } from 'react';
import { Notification } from '../hooks/useNotification';

interface ToastNotificationProps {
  notification: Notification;
  onRemove: (id: string) => void;
  index: number;
}

export function ToastNotification({ notification, onRemove, index }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'from-emerald-500/95 to-green-600/95',
          border: 'border-emerald-400/40',
          icon: 'bg-emerald-500/20',
          iconColor: 'text-emerald-100',
          iconBg: 'bg-emerald-500/30',
        };
      case 'error':
        return {
          bg: 'from-red-500/95 to-rose-600/95',
          border: 'border-red-400/40',
          icon: 'bg-red-500/20',
          iconColor: 'text-red-100',
          iconBg: 'bg-red-500/30',
        };
      case 'warning':
        return {
          bg: 'from-amber-500/95 to-yellow-600/95',
          border: 'border-amber-400/40',
          icon: 'bg-amber-500/20',
          iconColor: 'text-amber-100',
          iconBg: 'bg-amber-500/30',
        };
      default:
        return {
          bg: 'from-blue-500/95 to-indigo-600/95',
          border: 'border-blue-400/40',
          icon: 'bg-blue-500/20',
          iconColor: 'text-blue-100',
          iconBg: 'bg-blue-500/30',
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div
        className={`
          relative overflow-hidden rounded-2xl shadow-2xl pointer-events-auto
          transform transition-all duration-500 ease-out
          backdrop-blur-xl border ${styles.border}
          ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${isLeaving ? 'translate-x-full opacity-0 scale-95' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${styles.bg.includes('emerald') ? 'rgba(16, 185, 129, 0.85)' : styles.bg.includes('red') ? 'rgba(239, 68, 68, 0.85)' : styles.bg.includes('amber') ? 'rgba(245, 158, 11, 0.85)' : 'rgba(59, 130, 246, 0.85)'}, ${styles.bg.includes('emerald') ? 'rgba(5, 150, 105, 0.85)' : styles.bg.includes('red') ? 'rgba(220, 38, 38, 0.85)' : styles.bg.includes('amber') ? 'rgba(217, 119, 6, 0.85)' : 'rgba(37, 99, 235, 0.85)'})`,
          transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
          zIndex: 1000 - index,
        }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon with animated background */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${styles.icon} backdrop-blur-sm
            animate-pulse
          `}>
            {notification.type === 'success' && (
              <svg className={`h-5 w-5 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className={`h-5 w-5 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.type === 'warning' && (
              <svg className={`h-5 w-5 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className={`h-5 w-5 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-white leading-relaxed" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
              {notification.message}
            </p>
          </div>

          {/* Close button */}
          <button
            className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all duration-200 group"
            onClick={handleRemove}
          >
            <svg className="h-3 w-3 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className={`h-full ${styles.iconBg} transition-all ease-linear`}
            style={{
              animation: `progress-shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      {/* Shine effect */}
      <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shine opacity-0"></div>
    </div>
  );
}
