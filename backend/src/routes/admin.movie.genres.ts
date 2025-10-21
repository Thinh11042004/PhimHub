import { Router } from 'express';
import sql from 'mssql';
import Database from '../config/database';

export const adminMovieGenresRouter = Router();

// GET toàn bộ genres + selectedIds cho phim
adminMovieGenresRouter.get('/api/admin/movies/:movieId/genres', async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    if (!Number.isFinite(movieId)) {
      return res.status(400).json({ error: 'invalid_movie_id' });
    }

    const db = Database.getInstance();
    const pool = db.getPool();

    // Lấy tất cả genres
    const allResult = await pool.request().query(`
      SELECT id, name 
      FROM dbo.genres 
      ORDER BY name COLLATE Vietnamese_CI_AI ASC
    `);

    // Lấy selectedIds cho phim
    const selectedResult = await pool.request()
      .input('movieId', sql.Int, movieId)
      .query(`
        SELECT genre_id 
        FROM dbo.movie_genres 
        WHERE movie_id = @movieId
      `);

    const all = allResult.recordset.map((r: any) => ({
      id: Number(r.id),
      name: String(r.name)
    }));

    const selectedIds = selectedResult.recordset.map((r: any) => Number(r.genre_id));

    return res.json({ all, selectedIds });
  } catch (error) {
    console.error('Error fetching movie genres:', error);
    return res.status(500).json({ error: 'fetch_failed' });
  }
});

// POST lưu genreIds cho phim
adminMovieGenresRouter.post('/api/admin/movies/:movieId/genres', async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    const genreIds: number[] = Array.isArray(req.body?.genreIds) 
      ? req.body.genreIds.map(Number).filter(Number.isFinite)
      : [];

    if (!Number.isFinite(movieId)) {
      return res.status(400).json({ error: 'invalid_movie_id' });
    }

    const db = Database.getInstance();
    const pool = db.getPool();
    const tx = new sql.Transaction(pool);
    
    await tx.begin();
    
    try {
      // Xóa các bản ghi cũ
      const deleteReq = new sql.Request(tx).input('movieId', sql.Int, movieId);
      await deleteReq.query(`DELETE FROM dbo.movie_genres WHERE movie_id = @movieId;`);

      // Chèn mới nếu có genreIds
      if (genreIds.length > 0) {
        const insertReq = new sql.Request(tx).input('movieId', sql.Int, movieId);
        
        // Tạo parameters cho từng genreId
        genreIds.forEach((gid, i) => {
          insertReq.input(`g${i}`, sql.Int, gid);
        });
        
        // Tạo VALUES clause
        const values = genreIds.map((_, i) => `(@movieId, @g${i})`).join(',');
        await insertReq.query(`
          INSERT INTO dbo.movie_genres(movie_id, genre_id) 
          VALUES ${values};
        `);
      }

      await tx.commit();
      return res.json({ 
        success: true, 
        saved: genreIds.length,
        message: `Đã lưu ${genreIds.length} thể loại cho phim`
      });
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error saving movie genres:', error);
    return res.status(500).json({ error: 'save_failed' });
  }
});

// GET genres cho series
adminMovieGenresRouter.get('/api/admin/series/:seriesId/genres', async (req, res) => {
  try {
    const seriesId = Number(req.params.seriesId);
    if (!Number.isFinite(seriesId)) {
      return res.status(400).json({ error: 'invalid_series_id' });
    }

    const db = Database.getInstance();
    const pool = db.getPool();

    // Lấy tất cả genres
    const allResult = await pool.request().query(`
      SELECT id, name 
      FROM dbo.genres 
      ORDER BY name COLLATE Vietnamese_CI_AI ASC
    `);

    // Lấy selectedIds cho series
    const selectedResult = await pool.request()
      .input('seriesId', sql.Int, seriesId)
      .query(`
        SELECT genre_id 
        FROM dbo.series_genres 
        WHERE series_id = @seriesId
      `);

    const all = allResult.recordset.map((r: any) => ({
      id: Number(r.id),
      name: String(r.name)
    }));

    const selectedIds = selectedResult.recordset.map((r: any) => Number(r.genre_id));

    return res.json({ all, selectedIds });
  } catch (error) {
    console.error('Error fetching series genres:', error);
    return res.status(500).json({ error: 'fetch_failed' });
  }
});

// POST lưu genreIds cho series
adminMovieGenresRouter.post('/api/admin/series/:seriesId/genres', async (req, res) => {
  try {
    const seriesId = Number(req.params.seriesId);
    const genreIds: number[] = Array.isArray(req.body?.genreIds) 
      ? req.body.genreIds.map(Number).filter(Number.isFinite)
      : [];

    if (!Number.isFinite(seriesId)) {
      return res.status(400).json({ error: 'invalid_series_id' });
    }

    const db = Database.getInstance();
    const pool = db.getPool();
    const tx = new sql.Transaction(pool);
    
    await tx.begin();
    
    try {
      // Xóa các bản ghi cũ
      const deleteReq = new sql.Request(tx).input('seriesId', sql.Int, seriesId);
      await deleteReq.query(`DELETE FROM dbo.series_genres WHERE series_id = @seriesId;`);

      // Chèn mới nếu có genreIds
      if (genreIds.length > 0) {
        const insertReq = new sql.Request(tx).input('seriesId', sql.Int, seriesId);
        
        // Tạo parameters cho từng genreId
        genreIds.forEach((gid, i) => {
          insertReq.input(`g${i}`, sql.Int, gid);
        });
        
        // Tạo VALUES clause
        const values = genreIds.map((_, i) => `(@seriesId, @g${i})`).join(',');
        await insertReq.query(`
          INSERT INTO dbo.series_genres(series_id, genre_id) 
          VALUES ${values};
        `);
      }

      await tx.commit();
      return res.json({ 
        success: true, 
        saved: genreIds.length,
        message: `Đã lưu ${genreIds.length} thể loại cho phim bộ`
      });
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error saving series genres:', error);
    return res.status(500).json({ error: 'save_failed' });
  }
});
