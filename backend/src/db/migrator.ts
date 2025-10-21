import fs from 'fs';
import path from 'path';
import readline from 'readline';
import Database from '../config/database';

interface MigrationStatus {
  onDisk: string[];
  applied: string[];
  pending: string[];
}

interface MigrationFile {
  filename: string;
  normalizedName: string;
  fullPath: string;
}

class Migrator {
  private db = Database.getInstance();
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
  }

  /**
   * Normalize migration name by trimming whitespace, lowercasing, and removing extensions
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\.(sql|ts|js)$/i, '');
  }

  /**
   * Get all migration files from disk
   */
  private getMigrationFiles(): MigrationFile[] {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => /\.(sql|ts|js)$/i.test(file))
      .sort()
      .map(filename => ({
        filename,
        normalizedName: this.normalizeName(filename),
        fullPath: path.join(this.migrationsDir, filename)
      }));

    return files;
  }

  /**
   * Get all applied migrations from database
   */
  private async getAppliedMigrations(): Promise<Set<string>> {
    try {
      const pool = this.db.getPool();
      // Try new schema first, fallback to old schema
      let result;
      try {
        result = await pool.request().query(`
          SELECT name FROM migrations ORDER BY applied_at
        `);
      } catch (error) {
        // Fallback to old schema
        result = await pool.request().query(`
          SELECT name FROM migrations ORDER BY executed_at
        `);
      }
      
      return new Set(result.recordset.map(row => this.normalizeName(row.name)));
    } catch (error) {
      // If migrations table doesn't exist, return empty set
      return new Set();
    }
  }

  /**
   * Create migrations table if it doesn't exist
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.migrations') AND type = 'U')
      BEGIN
        CREATE TABLE dbo.migrations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL UNIQUE,
          applied_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END
    `;
    
    const pool = this.db.getPool();
    await pool.request().query(sql);
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    await this.db.connect();
    await this.createMigrationsTable();

    const files = this.getMigrationFiles();
    const applied = await this.getAppliedMigrations();

    const onDisk = files.map(f => f.normalizedName);
    const appliedArray = Array.from(applied);
    const pending = onDisk.filter(name => !applied.has(name));

    return {
      onDisk,
      applied: appliedArray,
      pending
    };
  }

  /**
   * Execute a single migration transactionally
   */
  private async executeMigration(file: MigrationFile): Promise<void> {
    const pool = this.db.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Read migration content
      const content = fs.readFileSync(file.fullPath, 'utf8');
      
      // Execute migration SQL
      if (file.filename.endsWith('.sql')) {
        await this.executeSQL(transaction, content);
      } else {
        // For .ts/.js files, we would need to compile and execute
        throw new Error(`Unsupported migration file type: ${file.filename}`);
      }

      // Mark as applied using safe upsert
      await transaction.request()
        .input('name', file.normalizedName)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.migrations WHERE name = @name)
            INSERT INTO dbo.migrations (name) VALUES (@name)
        `);

      await transaction.commit();
      console.log(`✅ Completed migration: ${file.filename}`);

    } catch (error: any) {
      await transaction.rollback();
      console.error(`❌ Migration failed: ${file.filename}`);
      throw new Error(`Migration ${file.filename} failed: ${error.message}`);
    }
  }

  /**
   * Execute SQL statements with GO separator support
   */
  private async executeSQL(transaction: any, sql: string): Promise<void> {
    // Split by GO statements
    const statements = sql.split(/\r?\nGO\s*\r?\n/i).filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        try {
          await transaction.request().query(trimmedStatement);
        } catch (error) {
          console.error(`❌ Error executing statement: ${trimmedStatement.substring(0, 100)}...`);
          throw error;
        }
      }
    }
  }

  /**
   * Run pending migrations
   */
  async run(): Promise<void> {
    try {
      console.log('🔄 Starting database migrations...');
      
      await this.db.connect();
      await this.createMigrationsTable();

      const files = this.getMigrationFiles();
      const applied = await this.getAppliedMigrations();

      console.log(`📁 Found ${files.length} migration files`);

      let runCount = 0;
      for (const file of files) {
        if (applied.has(file.normalizedName)) {
          console.log(`⏭️  Skipping ${file.filename} (already applied)`);
          continue;
        }

        console.log(`🚀 Running migration: ${file.filename}`);
        await this.executeMigration(file);
        runCount++;
      }

      if (runCount === 0) {
        console.log('✅ No pending migrations');
      } else {
        console.log(`🎉 All migrations completed successfully! (${runCount} migrations run)`);
      }
      
    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Interactive repair command
   */
  async repair(options: { yes?: boolean } = {}): Promise<void> {
    try {
      console.log('🔧 Migration repair tool');
      
      const status = await this.getStatus();
      
      // Find discrepancies
      const missingInDb = status.onDisk.filter(name => !status.applied.includes(name));
      const missingOnDisk = status.applied.filter(name => !status.onDisk.includes(name));
      
      if (missingInDb.length === 0 && missingOnDisk.length === 0) {
        console.log('✅ No discrepancies found');
        return;
      }

      console.log('\n📊 Current status:');
      console.log(`  On disk: ${status.onDisk.length} migrations`);
      console.log(`  Applied: ${status.applied.length} migrations`);
      console.log(`  Pending: ${status.pending.length} migrations`);

      if (missingInDb.length > 0) {
        console.log(`\n⚠️  Found ${missingInDb.length} migrations on disk but not in database:`);
        missingInDb.forEach(name => console.log(`    - ${name}`));
      }

      if (missingOnDisk.length > 0) {
        console.log(`\n⚠️  Found ${missingOnDisk.length} migrations in database but not on disk:`);
        missingOnDisk.forEach(name => console.log(`    - ${name}`));
      }

      if (!options.yes) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('\nChoose repair option:\n  A) Mark as applied (insert missing rows)\n  B) Unmark (delete rows to re-run)\n  C) Cancel\n\nEnter choice (A/B/C): ', resolve);
        });

        rl.close();

        if (answer.toUpperCase() === 'C') {
          console.log('❌ Repair cancelled');
          return;
        }

        if (answer.toUpperCase() === 'A') {
          await this.markAsApplied(missingInDb);
        } else if (answer.toUpperCase() === 'B') {
          await this.unmark(missingOnDisk);
        } else {
          console.log('❌ Invalid choice');
          return;
        }
      } else {
        // Auto-repair: mark missing as applied
        if (missingInDb.length > 0) {
          await this.markAsApplied(missingInDb);
        }
      }

      console.log('✅ Repair completed');
      
    } catch (error: any) {
      console.error('❌ Repair failed:', error);
      throw error;
    }
  }

  /**
   * Mark migrations as applied without running them
   */
  private async markAsApplied(names: string[]): Promise<void> {
    if (names.length === 0) return;

    const pool = this.db.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      for (const name of names) {
        await transaction.request()
          .input('name', name)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.migrations WHERE name = @name)
              INSERT INTO dbo.migrations (name) VALUES (@name)
          `);
        console.log(`✅ Marked as applied: ${name}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Unmark migrations (delete from database)
   */
  private async unmark(names: string[]): Promise<void> {
    if (names.length === 0) return;

    const pool = this.db.getPool();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      for (const name of names) {
        await transaction.request()
          .input('name', name)
          .query('DELETE FROM dbo.migrations WHERE name = @name');
        console.log(`✅ Unmarked: ${name}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Print status to console
   */
  async printStatus(): Promise<void> {
    const status = await this.getStatus();
    
    console.log('\n📊 Migration Status:');
    console.log(`\n📁 On disk (${status.onDisk.length}):`);
    status.onDisk.forEach(name => {
      const isApplied = status.applied.includes(name);
      console.log(`  ${isApplied ? '✅' : '⏳'} ${name}`);
    });

    console.log(`\n🗄️  Applied (${status.applied.length}):`);
    status.applied.forEach(name => {
      const isOnDisk = status.onDisk.includes(name);
      console.log(`  ${isOnDisk ? '✅' : '⚠️ '} ${name}`);
    });

    if (status.pending.length > 0) {
      console.log(`\n⏳ Pending (${status.pending.length}):`);
      status.pending.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('\n✅ No pending migrations');
    }

    // Check for discrepancies
    const missingInDb = status.onDisk.filter(name => !status.applied.includes(name));
    const missingOnDisk = status.applied.filter(name => !status.onDisk.includes(name));
    
    if (missingInDb.length > 0 || missingOnDisk.length > 0) {
      console.log('\n⚠️  Discrepancies detected! Run "npm run migrate:repair" to fix.');
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrator = new Migrator();

  try {
    switch (command) {
      case 'run':
        await migrator.run();
        break;
      case 'status':
        await migrator.printStatus();
        break;
      case 'repair':
        const yes = process.argv.includes('--yes');
        await migrator.repair({ yes });
        break;
      default:
        console.log('Usage: ts-node migrator.ts <command>');
        console.log('Commands:');
        console.log('  run     - Run pending migrations');
        console.log('  status  - Show migration status');
        console.log('  repair  - Interactive repair tool');
        console.log('  repair --yes - Auto-repair (mark missing as applied)');
        process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default Migrator;
