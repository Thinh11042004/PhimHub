import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { InteractionRepository } from '../models/InteractionRepository';

const router = Router();
const getRepo = () => new InteractionRepository();

// Favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const items = await getRepo().listFavorites(userId);
  res.json({ success: true, data: items });
});

router.post('/favorites/:contentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const contentId = Number(req.params.contentId);
  await getRepo().addFavorite(userId, contentId);
  res.status(201).json({ success: true });
});

router.delete('/favorites/:contentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const contentId = Number(req.params.contentId);
  await getRepo().removeFavorite(userId, contentId);
  res.json({ success: true });
});

// Ratings
router.get('/ratings/:contentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const contentId = Number(req.params.contentId);
  const summary = await getRepo().getRatingSummary(contentId, userId);
  res.json({ success: true, data: summary });
});

router.post('/ratings/:contentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const contentId = Number(req.params.contentId);
  const { rating } = req.body || {};
  const value = Math.max(1, Math.min(5, Number(rating)));
  await getRepo().setRating(userId, contentId, value);
  res.status(201).json({ success: true });
});

// Comments
router.get('/comments/:contentId', async (req, res) => {
  const contentId = Number(req.params.contentId);
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const items = await getRepo().listComments(contentId, page, limit);
  res.json({ success: true, data: items });
});

router.get('/comments/:contentId/:parentId/replies', async (req, res) => {
  const parentId = Number(req.params.parentId);
  const replies = await getRepo().listReplies(parentId);
  res.json({ success: true, data: replies });
});

router.post('/comments/:contentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const contentId = Number(req.params.contentId);
  const { content, parentId } = req.body || {};
  if (!content) {
    res.status(400).json({ success: false, message: 'content is required' });
    return;
  }
  const created = await getRepo().createComment(userId, contentId, String(content), parentId ? Number(parentId) : undefined);
  res.status(201).json({ success: true, data: created });
});

router.put('/comments/:commentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const commentId = Number(req.params.commentId);
  const { content } = req.body || {};
  if (!content) {
    res.status(400).json({ success: false, message: 'content is required' });
    return;
  }
  const updated = await getRepo().updateComment(userId, commentId, String(content));
  res.json({ success: true, data: updated });
});

router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const commentId = Number(req.params.commentId);
  const ok = await getRepo().deleteComment(userId, commentId);
  res.json({ success: ok });
});

// External comments (by provider+slug key)
router.get('/ext-comments/:provider/:slug', async (req, res) => {
  const { provider, slug } = req.params;
  const key = `${provider}:${slug}`;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const items = await getRepo().listExternalComments(key, page, limit);
  res.json({ success: true, data: items });
});

router.post('/ext-comments/:provider/:slug', authenticateToken, async (req, res) => {
  const { provider, slug } = req.params;
  const key = `${provider}:${slug}`;
  const userId = req.user!.id;
  const { content, parentId } = req.body || {};
  if (!content) {
    res.status(400).json({ success: false, message: 'content is required' });
    return;
  }
  const created = await getRepo().createExternalComment(userId, key, String(content), parentId ? Number(parentId) : undefined);
  res.status(201).json({ success: true, data: created });
});

// Edit external comment
router.put('/ext-comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.commentId);
    const { content } = req.body || {};
    
    console.log(`🔄 PUT /ext-comments/${commentId} - User: ${userId}, Content: ${content}`);
    
    if (!content) {
      res.status(400).json({ success: false, message: 'content is required' });
      return;
    }
    
    const updated = await getRepo().updateExternalComment(userId, commentId, String(content));
    console.log(`✅ Successfully updated external comment ${commentId}`);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(`❌ Error in PUT /ext-comments/${req.params.commentId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Delete external comment
router.delete('/ext-comments/:commentId', authenticateToken, async (req, res) => {
  const userId = req.user!.id;
  const commentId = Number(req.params.commentId);
  const ok = await getRepo().deleteExternalComment(userId, commentId);
  res.json({ success: ok });
});

export default router;


