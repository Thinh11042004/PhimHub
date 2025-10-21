import { Router, Request, Response } from 'express';
import { InteractionRepository } from '../models/InteractionRepository';
import { getCurrentTimestamp } from '../utils/timeUtils';

const router = Router();

// Store active SSE connections
const connections = new Map<string, Response[]>();

// SSE endpoint for realtime comments
router.get('/comments/:contentId/stream', async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const { provider = 'local', movieId } = req.query;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', contentId, timestamp: getCurrentTimestamp() })}\n\n`);

  // Store connection
  const connectionKey = `${contentId}-${provider}-${movieId || 'internal'}`;
  if (!connections.has(connectionKey)) {
    connections.set(connectionKey, []);
  }
  connections.get(connectionKey)!.push(res);

  // Handle client disconnect
  req.on('close', () => {
    const conns = connections.get(connectionKey);
    if (conns) {
      const index = conns.indexOf(res);
      if (index > -1) {
        conns.splice(index, 1);
      }
      if (conns.length === 0) {
        connections.delete(connectionKey);
      }
    }
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: getCurrentTimestamp() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Function to broadcast new comment to all connected clients
export const broadcastNewComment = async (contentId: string, provider: string, movieId?: string) => {
  const connectionKey = `${contentId}-${provider}-${movieId || 'internal'}`;
  const conns = connections.get(connectionKey);
  
  if (conns && conns.length > 0) {
    try {
      // Fetch latest comments
      const repo = new InteractionRepository();
      let comments: any[] = [];
      
      if (movieId) {
        // External comments
        comments = await repo.listExternalComments(provider, 1, 20);
      } else {
        // Internal comments
        comments = await repo.listComments(parseInt(contentId), 1, 20);
      }

      const message = {
        type: 'new_comment',
        contentId,
        provider,
        movieId,
        comments,
        timestamp: getCurrentTimestamp()
      };

      // Send to all connected clients
      conns.forEach((res, index) => {
        try {
          res.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
          // Remove dead connections
          conns.splice(index, 1);
        }
      });

      // Clean up empty connections
      if (conns.length === 0) {
        connections.delete(connectionKey);
      }
    } catch (error) {
      console.error('Error broadcasting comment:', error);
    }
  }
};

// Function to broadcast comment update
export const broadcastCommentUpdate = async (contentId: string, provider: string, movieId?: string) => {
  await broadcastNewComment(contentId, provider, movieId);
};

// Function to broadcast comment deletion
export const broadcastCommentDeletion = async (contentId: string, provider: string, movieId?: string) => {
  await broadcastNewComment(contentId, provider, movieId);
};

export default router;
