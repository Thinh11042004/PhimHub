import { BaseRepository } from './BaseRepository';
import { Comment, CommentWithUser } from '../types/database';
import { broadcastNewComment, broadcastCommentUpdate, broadcastCommentDeletion } from '../routes/comments-sse.routes';
import { mapCommentRow, mapExternalCommentRow, getCurrentTimestamp } from '../utils/timeUtils';

export class InteractionRepository extends BaseRepository<any> {
  async listFavorites(userId: number): Promise<any[]> {
    const query = `
      SELECT f.content_id, f.added_at
      FROM dbo.favorites f
      WHERE f.user_id = @param0
      ORDER BY f.added_at DESC
    `;
    const result = await this.executeQuery(query, [userId]);
    return result.recordset;
  }

  async addFavorite(userId: number, contentId: number): Promise<void> {
    const query = `
      MERGE dbo.favorites AS target
      USING (SELECT @param0 AS user_id, @param1 AS content_id) AS src
      ON target.user_id = src.user_id AND target.content_id = src.content_id
      WHEN NOT MATCHED THEN
        INSERT (user_id, content_id) VALUES (src.user_id, src.content_id);
    `;
    await this.executeQuery(query, [userId, contentId]);
  }

  async removeFavorite(userId: number, contentId: number): Promise<void> {
    const query = `DELETE FROM dbo.favorites WHERE user_id = @param0 AND content_id = @param1`;
    await this.executeQuery(query, [userId, contentId]);
  }

  async getRatingSummary(contentId: number, userId?: number): Promise<{ avg: number; count: number; user?: number | null }> {
    const query = `
      SELECT 
        AVG(CAST(rating_value AS FLOAT)) AS avgRating,
        COUNT(*) AS cnt
      FROM dbo.ratings WHERE content_id = @param0;
    `;
    const [summary, userRow] = await Promise.all([
      this.executeQuery(query, [contentId]),
      userId ? this.executeQuery(`SELECT rating_value FROM dbo.ratings WHERE user_id = @param0 AND content_id = @param1`, [userId, contentId]) : Promise.resolve({ recordset: [] } as any)
    ]);
    const avg = summary.recordset[0]?.avgRating || 0;
    const count = summary.recordset[0]?.cnt || 0;
    const user = userRow.recordset[0]?.rating_value ?? null;
    return { avg, count, user };
  }

  async setRating(userId: number, contentId: number, ratingValue: number): Promise<void> {
    const query = `
      MERGE dbo.ratings AS target
      USING (SELECT @param0 AS user_id, @param1 AS content_id, @param2 AS rating_value) AS src
      ON target.user_id = src.user_id AND target.content_id = src.content_id
      WHEN MATCHED THEN UPDATE SET rating_value = src.rating_value
      WHEN NOT MATCHED THEN INSERT (user_id, content_id, rating_value) VALUES (src.user_id, src.content_id, src.rating_value);
    `;
    await this.executeQuery(query, [userId, contentId, ratingValue]);
  }

  async listComments(contentId: number, page = 1, limit = 20): Promise<CommentWithUser[]> {
    const offset = (page - 1) * limit;
    const query = `
      SELECT c.*, u.username, u.fullname, u.avatar
      FROM dbo.comments c
      INNER JOIN dbo.users u ON u.id = c.user_id
      WHERE c.content_id = @param0 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
    `;
    const result = await this.executeQuery(query, [contentId]);
    return result.recordset.map(mapCommentRow);
  }

  async listReplies(parentId: number): Promise<CommentWithUser[]> {
    const query = `
      SELECT c.*, u.username, u.fullname, u.avatar
      FROM dbo.comments c
      INNER JOIN dbo.users u ON u.id = c.user_id
      WHERE c.parent_id = @param0
      ORDER BY c.created_at ASC
    `;
    const result = await this.executeQuery(query, [parentId]);
    return result.recordset.map(mapCommentRow);
  }

  async createComment(userId: number, contentId: number, content: string, parentId?: number | null): Promise<Comment> {
    const query = `
      INSERT INTO dbo.comments(user_id, content_id, parent_id, content)
      OUTPUT INSERTED.*
      VALUES(@param0, @param1, @param2, @param3);
    `;
    const result = await this.executeQuery(query, [userId, contentId, parentId ?? null, content]);
    const comment = result.recordset[0] as Comment;
    
    // Broadcast new comment to all connected clients
    await broadcastNewComment(contentId.toString(), 'local');
    
    return comment;
  }

  async createExternalComment(userId: number, extKey: string, content: string, parentId?: number | null): Promise<{ id: number; ext_key: string; content: string; created_at: string; parent_id?: number | null }> {
    const query = `
      INSERT INTO dbo.external_comments(user_id, ext_key, content, parent_id)
      OUTPUT INSERTED.id, INSERTED.ext_key, INSERTED.content, INSERTED.created_at, INSERTED.parent_id
      VALUES(@param0, @param1, @param2, @param3);
    `;
    const result = await this.executeQuery(query, [userId, extKey, content, parentId ?? null]);
    const comment = result.recordset[0];
    
    // Broadcast new external comment to all connected clients
    await broadcastNewComment('external', 'external', extKey);
    
    return comment;
  }

  async listExternalComments(extKey: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT c.*, u.username, u.fullname, u.avatar
      FROM dbo.external_comments c
      INNER JOIN dbo.users u ON u.id = c.user_id
      WHERE c.ext_key = @param0
      ORDER BY c.created_at DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
    `;
    const result = await this.executeQuery(query, [extKey]);
    return result.recordset.map(mapExternalCommentRow);
  }
  async deleteComment(userId: number, commentId: number): Promise<boolean> {
    // Get contentId before deleting for broadcast
    const getContentQuery = `SELECT content_id FROM dbo.comments WHERE id = @param0 AND user_id = @param1`;
    const contentResult = await this.executeQuery(getContentQuery, [commentId, userId]);
    
    if (contentResult.recordset.length === 0) {
      return false;
    }
    
    const contentId = contentResult.recordset[0].content_id;
    
    const query = `DELETE FROM dbo.comments WHERE id = @param0 AND user_id = @param1`;
    const result = await this.executeQuery(query, [commentId, userId]);
    const deleted = (result.rowsAffected?.[0] ?? 0) > 0;
    
    if (deleted) {
      // Broadcast comment deletion to all connected clients
      await broadcastCommentDeletion(contentId.toString(), 'local');
    }
    
    return deleted;
  }

  async updateComment(userId: number, commentId: number, content: string): Promise<Comment> {
    // Get contentId before updating for broadcast
    const getContentQuery = `SELECT content_id FROM dbo.comments WHERE id = @param0 AND user_id = @param1`;
    const contentResult = await this.executeQuery(getContentQuery, [commentId, userId]);
    
    if (contentResult.recordset.length === 0) {
      throw new Error('Comment not found or access denied');
    }
    
    const contentId = contentResult.recordset[0].content_id;
    
    const query = `
      UPDATE dbo.comments 
      SET content = @param0
      OUTPUT INSERTED.*
      WHERE id = @param1 AND user_id = @param2;
    `;
    const result = await this.executeQuery(query, [content, commentId, userId]);
    const comment = result.recordset[0] as Comment;
    
    // Broadcast comment update to all connected clients
    await broadcastCommentUpdate(contentId.toString(), 'local');
    
    return comment;
  }

  async updateExternalComment(userId: number, commentId: number, content: string): Promise<{ id: number; ext_key: string; content: string; updated_at: string }> {
    try {
      console.log(`🔄 Updating external comment ${commentId} for user ${userId}`);
      
      // First, check if comment exists and user has permission
      const checkQuery = `
        SELECT id, ext_key, content, updated_at 
        FROM dbo.external_comments 
        WHERE id = @param0 AND user_id = @param1;
      `;
      
      const checkResult = await this.executeQuery(checkQuery, [commentId, userId]);
      
      if (!checkResult.recordset || checkResult.recordset.length === 0) {
        throw new Error(`Comment ${commentId} not found or user ${userId} not authorized`);
      }
      
      // Update the comment
      const updateQuery = `
        UPDATE dbo.external_comments 
        SET content = @param0, updated_at = GETDATE()
        WHERE id = @param1 AND user_id = @param2;
      `;
      
      const updateResult = await this.executeQuery(updateQuery, [content, commentId, userId]);
      
      if (updateResult.rowsAffected[0] === 0) {
        throw new Error(`Failed to update comment ${commentId}`);
      }
      
      // Get the updated comment
      const getUpdatedQuery = `
        SELECT id, ext_key, content, updated_at 
        FROM dbo.external_comments 
        WHERE id = @param0;
      `;
      
      const finalResult = await this.executeQuery(getUpdatedQuery, [commentId]);
      
      console.log(`✅ Successfully updated external comment ${commentId}`);
      
      // Broadcast external comment update to all connected clients
      const existingComment = checkResult.recordset[0];
      await broadcastCommentUpdate('external', 'external', existingComment.ext_key);
      
      return finalResult.recordset[0];
    } catch (error) {
      console.error(`❌ Error updating external comment ${commentId}:`, error);
      throw error;
    }
  }

  async deleteExternalComment(userId: number, commentId: number): Promise<boolean> {
    // Get extKey before deleting for broadcast
    const getExtKeyQuery = `SELECT ext_key FROM dbo.external_comments WHERE id = @param0 AND user_id = @param1`;
    const extKeyResult = await this.executeQuery(getExtKeyQuery, [commentId, userId]);
    
    if (extKeyResult.recordset.length === 0) {
      return false;
    }
    
    const extKey = extKeyResult.recordset[0].ext_key;
    
    const query = `DELETE FROM dbo.external_comments WHERE id = @param0 AND user_id = @param1`;
    const result = await this.executeQuery(query, [commentId, userId]);
    const deleted = (result.rowsAffected?.[0] ?? 0) > 0;
    
    if (deleted) {
      // Broadcast external comment deletion to all connected clients
      await broadcastCommentDeletion('external', 'external', extKey);
    }
    
    return deleted;
  }
}


