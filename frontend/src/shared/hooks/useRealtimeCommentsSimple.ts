import { useEffect, useRef, useState, useCallback } from 'react';
import { normalizeEpochMs } from '../utils/dateFormatter';

interface RealtimeCommentMessage {
  type: 'connected' | 'ping' | 'new_comment' | 'comment_update' | 'comment_deletion';
  contentId?: string;
  provider?: string;
  movieId?: string;
  comments?: any[];
  timestamp: number;
}

interface UseRealtimeCommentsOptions {
  contentId?: string;
  provider?: string;
  movieId?: string;
  enabled?: boolean;
  onNewComment?: (comments: any[]) => void;
  onCommentUpdate?: (comments: any[]) => void;
  onCommentDeletion?: (comments: any[]) => void;
}

export function useRealtimeCommentsSimple({
  contentId,
  provider = 'local',
  movieId,
  enabled = false, // Disabled to prevent connection spam
  onNewComment,
  onCommentUpdate,
  onCommentDeletion
}: UseRealtimeCommentsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3; // Reduced attempts

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !contentId) {
      disconnect();
      return;
    }

    // Close existing connection first
    disconnect();

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        provider,
        ...(movieId && { movieId })
      });
      
      const url = `${baseUrl}/api/sse/comments/${contentId}/stream?${params.toString()}`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const message: RealtimeCommentMessage = JSON.parse(event.data);
          
          // Normalize timestamp if needed
          if (message.timestamp) {
            message.timestamp = normalizeEpochMs(message.timestamp);
          }

          switch (message.type) {
            case 'connected':
              break;
              
            case 'ping':
              break;
              
            case 'new_comment':
              if (message.comments && onNewComment) {
                onNewComment(message.comments);
              }
              break;
              
            case 'comment_update':
              if (message.comments && onCommentUpdate) {
                onCommentUpdate(message.comments);
              }
              break;
              
            case 'comment_deletion':
              if (message.comments && onCommentDeletion) {
                onCommentDeletion(message.comments);
              }
              break;
              
            default:
              break;
          }
        } catch (error) {
          // Silent error handling
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        setConnectionError('Connection lost');
        
        // Attempt to reconnect with reduced attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 10000);
          
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionError('Max reconnection attempts reached');
          disconnect(); // Stop trying after max attempts
        }
      };

    } catch (error) {
      setConnectionError('Failed to create connection');
      disconnect();
    }
  }, [contentId, provider, movieId, enabled, onNewComment, onCommentUpdate, onCommentDeletion, disconnect]);

  // Connect when dependencies change
  useEffect(() => {
    if (enabled && contentId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, contentId, provider, movieId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect
  };
}
