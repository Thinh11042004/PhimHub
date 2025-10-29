import { useState, useCallback } from 'react';

interface CommentNotificationState {
  isVisible: boolean;
  title: string;
  message: string;
}

export function useCommentNotification() {
  const [notification, setNotification] = useState<CommentNotificationState>({
    isVisible: false,
    title: '',
    message: ''
  });

  const showSuccess = useCallback((title: string, message: string) => {
    setNotification({
      isVisible: true,
      title,
      message
    });
  }, []);

  const hide = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  return {
    notification,
    showSuccess,
    hide
  };
}
