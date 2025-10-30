import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'PhimHub',
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASS || process.env.DB_PASSWORD || undefined,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true' || process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    useUTC: true
  }
};

async function fixMissingPosters() {
  let pool: sql.ConnectionPool | null = null;
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected');

    // 1) Fill poster_url from thumbnail_url or banner_url when missing
    const update1 = await pool.request().query(`
      UPDATE movies
      SET poster_url = COALESCE(thumbnail_url, banner_url)
      WHERE (poster_url IS NULL OR LTRIM(RTRIM(CAST(poster_url AS NVARCHAR(4000)))) = '')
        AND (thumbnail_url IS NOT NULL OR banner_url IS NOT NULL)
    `);
    console.log(`🖼️  poster_url filled from thumbnail/banner: ${update1.rowsAffected?.[0] ?? 0}`);

    // 2) Optionally, fill thumbnail_url from poster_url when missing
    const update2 = await pool.request().query(`
      UPDATE movies
      SET thumbnail_url = poster_url
      WHERE (thumbnail_url IS NULL OR LTRIM(RTRIM(CAST(thumbnail_url AS NVARCHAR(4000)))) = '')
        AND poster_url IS NOT NULL
    `);
    console.log(`🖼️  thumbnail_url filled from poster_url: ${update2.rowsAffected?.[0] ?? 0}`);

    // 3) Report remaining missing posters
    const remain = await pool.request().query(`
      SELECT COUNT(*) AS missing
      FROM movies
      WHERE (poster_url IS NULL OR LTRIM(RTRIM(CAST(poster_url AS NVARCHAR(4000)))) = '')
    `);
    console.log(`📊 Remaining movies without poster_url: ${remain.recordset?.[0]?.missing ?? 0}`);

    console.log('🎉 Done');
  } catch (err) {
    console.error('❌ Error:', err);
    throw err;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

if (require.main === module) {
  fixMissingPosters()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default fixMissingPosters;


