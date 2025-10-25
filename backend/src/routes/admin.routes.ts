import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { GenreRepository } from '../models/GenreRepository';

const router = Router();

// Simple admin guard using DB lookup
async function ensureAdmin(req: any, res: any, next: any) {
  try {
    const current = await UserService.findById(req.user?.id);
    const role = (current as any)?.role_code || 'user';
    if (role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin only' });
      return;
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Permission check failed' });
  }
}

// GET /api/admin/users
router.get('/users', authenticateToken, ensureAdmin, async (req, res) => {
  const users = await UserService.getAllUsers({});
  res.json({ success: true, data: users });
});

// POST /api/admin/users
router.post('/users', authenticateToken, ensureAdmin, async (req, res) => {
  const { username, email, password, fullname, phone, role_id } = req.body || {};
  if (!username || !email || !password) {
    res.status(400).json({ success: false, message: 'username, email, password là bắt buộc' });
    return;
  }
  try {
    const created = await UserService.create({ username, email, password, fullname, phone });
    res.status(201).json({ success: true, data: created });
  } catch (e: any) {
    res.status(409).json({ success: false, message: e.message || 'Không thể tạo người dùng' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const updated = await UserService.updateUser(id, req.body);
  res.json({ success: true, data: updated });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const ok = await UserService.deleteUser(id);
  res.json({ success: ok });
});

// ===== Genres admin CRUD =====
const genreRepo = new GenreRepository();

// GET /api/admin/genres
router.get('/genres', authenticateToken, ensureAdmin, async (req, res) => {
  const list = await genreRepo.getAll();
  res.json({ success: true, data: list });
});

// POST /api/admin/genres
router.post('/genres', authenticateToken, ensureAdmin, async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, message: 'name là bắt buộc' });
    return;
  }
  const created = await genreRepo.create({ name: String(name).trim() });
  res.status(201).json({ success: true, data: created });
});

// PUT /api/admin/genres/:id
router.put('/genres/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body || {};
  const updated = await genreRepo.update(id, { name });
  res.json({ success: true, data: updated });
});

// DELETE /api/admin/genres/:id
router.delete('/genres/:id', authenticateToken, ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const ok = await genreRepo.delete(id);
  res.json({ success: ok });
});

export default router;


