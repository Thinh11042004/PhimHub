import { useEffect, useRef, useState, useCallback } from 'react';

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

export function useRealtimeComments({
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
  const [isDisabled, setIsDisabled] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !contentId || isConnectingRef.current || isDisabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    isConnectingRef.current = true;

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      // Build SSE URL
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        provider,
        ...(movieId && { movieId })
      });
      
      const url = `${baseUrl}/api/sse/comments/${contentId}/stream?${params.toString()}`;
      
      // console.log('🔌 Connecting to SSE:', url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        // console.log('✅ SSE connection opened');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
      };

      eventSource.onmessage = (event) => {
        try {
          const message: RealtimeCommentMessage = JSON.parse(event.data);
          // console.log('📨 SSE message received:', message);

          switch (message.type) {
            case 'connected':
              // console.log('🎉 Connected to realtime comments');
              break;
              
            case 'ping':
              // Keep-alive ping, no action needed
              break;
              
            case 'new_comment':
              if (message.comments && onNewComment) {
                // console.log('💬 New comment received, updating UI');
                onNewComment(message.comments);
              }
              break;
              
            case 'comment_update':
              if (message.comments && onCommentUpdate) {
                // console.log('✏️ Comment update received, updating UI');
                onCommentUpdate(message.comments);
              }
              break;
              
            case 'comment_deletion':
              if (message.comments && onCommentDeletion) {
                // console.log('🗑️ Comment deletion received, updating UI');
                onCommentDeletion(message.comments);
              }
              break;
              
            default:
              // console.log('❓ Unknown message type:', message.type);
          }
        } catch (error) {
          // console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        // console.error('❌ SSE connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        isConnectingRef.current = false;
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          // console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          // console.error('❌ Max reconnection attempts reached');
          setConnectionError('Failed to reconnect after multiple attempts');
          setIsDisabled(true); // Disable SSE after too many failures
        }
      };

    } catch (error) {
      // console.error('❌ Error creating SSE connection:', error);
      setConnectionError('Failed to create connection');
      isConnectingRef.current = false;
    }
  }, [contentId, provider, movieId, enabled, isDisabled, onNewComment, onCommentUpdate, onCommentDeletion]);

  const disconnect = useCallback(() => {
    // console.log('🔌 Disconnecting from SSE');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    isConnectingRef.current = false;
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  }, []);

  // Reset disabled state when contentId changes
  useEffect(() => {
    setIsDisabled(false);
    reconnectAttempts.current = 0;
  }, [contentId, movieId]);

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
    isDisabled,
    connect,
    disconnect
  };
}
