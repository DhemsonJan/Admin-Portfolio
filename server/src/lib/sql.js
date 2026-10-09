/**
 * Dialect helpers.
 *
 * Every query in this codebase is written once using `?` placeholders.
 * For Postgres we rewrite them into `$1, $2, ...` before executing.
 */

const PLACEHOLDER = /\?/g;

export function toPgSql(sql) {
  let index = 0;
  return sql.replace(PLACEHOLDER, () => `$${++index}`);
}

/**
 * node:sqlite rejects booleans, undefined and BigInt.
 * Normalising here keeps every call site clean.
 */
export function toSqliteValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isInteger(value) ? value : value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export function normalizeParams(params = []) {
  return params.map(toSqliteValue);
}