import { useEffect, useState } from 'react';

interface CommentNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function CommentNotification({ title, message, onClose, duration = 3000 }: CommentNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto close after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]
        max-w-md w-full mx-4
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-4 opacity-0 scale-95'
        }
        ${isLeaving ? 'translate-y-4 opacity-0 scale-95' : ''}
      `}
    >
      <div className="relative overflow-hidden rounded-3xl shadow-2xl pointer-events-auto">
        {/* Background with gradient */}
        <div className="absolute inset-0 backdrop-blur-xl" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(5, 150, 105, 0.85), rgba(20, 184, 166, 0.85))'
        }}></div>
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Success Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
                {title}
              </h3>
              <p className="text-sm text-white leading-relaxed" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
                {message}
              </p>
            </div>

            {/* Close button */}
            <button
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all duration-200 group"
              onClick={handleClose}
            >
              <svg className="h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white/60 transition-all ease-linear"
              style={{
                animation: `progress-shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shine opacity-0"></div>
      </div>
    </div>
  );
}
