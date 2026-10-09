import { toPgSql, normalizeParams } from '../lib/sql.js';

/**
 * Minimal data-access layer with two interchangeable drivers:
 *
 *   sqlite   -> node:sqlite (built into Node 22.5+, no native compilation)
 *   postgres -> pg
 *
 * Both expose the same tiny async surface so nothing else in the app
 * needs to know which database is in play:
 *
 *   db.all(sql, params) -> rows[]
 *   db.get(sql, params) -> row | undefined
 *   db.run(sql, params) -> { changes }
 *   db.exec(sql)        -> void
 *   db.tx(fn)           -> runs fn inside a transaction
 */

class SqliteDriver {
  constructor(file) {
    this.file = file;
    this.kind = 'sqlite';
    this.db = null;
  }

  async init() {
    const { DatabaseSync } = await import('node:sqlite');
    const fs = await import('node:fs');
    const path = await import('node:path');

    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    this.db = new DatabaseSync(this.file);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    return this;
  }

  #prepare(sql) {
    return this.db.prepare(sql);
  }

  async all(sql, params = []) {
    return this.#prepare(sql).all(...normalizeParams(params));
  }

  async get(sql, params = []) {
    return this.#prepare(sql).get(...normalizeParams(params));
  }

  async run(sql, params = []) {
    const result = this.#prepare(sql).run(...normalizeParams(params));
    return { changes: Number(result.changes ?? 0) };
  }

  async exec(sql) {
    this.db.exec(sql);
  }

  async tx(fn) {
    this.db.exec('BEGIN');
    try {
      const out = await fn(this);
      this.db.exec('COMMIT');
      return out;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        /* rollback of an already-closed tx is not actionable */
      }
      throw error;
    }
  }

  async close() {
    this.db?.close();
  }
}

class PostgresDriver {
  constructor(connectionString, poolMax = 10) {
    this.connectionString = connectionString;
    this.poolMax = poolMax;
    this.kind = 'postgres';
    this.pool = null;
  }

  async init() {
    const { Pool } = await import('pg');
    // Supabase pooler strings never carry sslmode, but the pooler requires TLS.
    // pg-connection-string maps an explicit sslmode onto `ssl` and overrides
    // this option, so the pooler is detected by host here instead.
    const wantsSsl =
      /sslmode=require/i.test(this.connectionString) ||
      this.connectionString.includes('.pooler.supabase.com');
    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
      // Every serverless instance opens its own pool, so this multiplies by the
      // number of concurrent lambdas. Behind a transaction pooler (pgbouncer) a
      // higher number is fine; against a direct connection keep it at 1-2 or the
      // provider will start refusing connections.
      max: this.poolMax,
    });
    await this.pool.query('SELECT 1');
    return this;
  }

  async all(sql, params = []) {
    const { rows } = await this.pool.query(toPgSql(sql), params);
    return rows;
  }

  async get(sql, params = []) {
    const { rows } = await this.pool.query(toPgSql(sql), params);
    return rows[0];
  }

  async run(sql, params = []) {
    const result = await this.pool.query(toPgSql(sql), params);
    return { changes: result.rowCount ?? 0 };
  }

  async exec(sql) {
    await this.pool.query(sql);
  }

  async tx(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const scoped = {
        all: async (sql, params = []) => (await client.query(toPgSql(sql), params)).rows,
        get: async (sql, params = []) => (await client.query(toPgSql(sql), params)).rows[0],
        run: async (sql, params = []) => {
          const r = await client.query(toPgSql(sql), params);
          return { changes: r.rowCount ?? 0 };
        },
        exec: async (sql) => {
          await client.query(sql);
        },
      };
      const out = await fn(scoped);
      await client.query('COMMIT');
      return out;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool?.end();
  }
}

export async function createDatabase(config) {
  const { db } = config;

  if (db.client === 'postgres') {
    if (!db.databaseUrl) {
      throw new Error('DB_CLIENT=postgres requires DATABASE_URL to be set in .env');
    }
    return new PostgresDriver(db.databaseUrl, db.poolMax).init();
  }

  if (db.client !== 'sqlite') {
    throw new Error(`Unsupported DB_CLIENT "${db.client}". Use "sqlite" or "postgres".`);
  }

  return new SqliteDriver(db.sqliteFile).init();
}

let instance = null;

export async function getDb() {
  if (!instance) throw new Error('Database has not been initialised yet');
  return instance;
}

export async function initDb(config) {
  instance = await createDatabase(config);
  return instance;
}