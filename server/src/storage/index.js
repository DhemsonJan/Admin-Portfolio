import config from '../config/env.js';
import { localDriver } from './local.js';
import { supabaseDriver } from './supabase.js';
import { s3Driver } from './s3.js';

/**
 * Storage abstraction.
 *
 * Nothing outside this folder knows whether files land on a local disk, in
 * Supabase or in S3. Switching providers is a one-line change in .env:
 *
 *   STORAGE_DRIVER=supabase
 *
 * Contract every driver implements:
 *
 *   put({ key, buffer, contentType }) -> { url, key, contentType }
 *   remove({ key })                   -> void
 *   keyFromUrl(url)?                  -> string | null   (bare key, or null if
 *                                                            the URL is not ours)
 *   isLocalUrl(url)?                  -> boolean         (local driver only)
 */

const DRIVERS = {
  local: localDriver,
  supabase: supabaseDriver,
  s3: s3Driver,
};

let active = null;

export async function initStorage() {
  const name = config.storage.driver;
  const driver = DRIVERS[name];

  if (!driver) {
    throw new Error(`Unsupported STORAGE_DRIVER "${name}". Use local, supabase or s3.`);
  }

  active = await driver.init();
  console.log(`[storage] driver: ${active.name}`);
  return active;
}

export function storage() {
  if (!active) throw new Error('Storage has not been initialised yet');
  return active;
}

export const putFile = (...args) => storage().put(...args);
export const removeFile = (...args) => storage().remove(...args);

/**
 * Best-effort cleanup of assets owned by a project. Failures are logged, never
 * thrown, so a storage outage cannot block deleting the database record.
 *
 * Each driver resolves its own URL back to a storage key via `keyFromUrl`.
 * Passing the whole URL to `remove` used to work for the local driver only; the
 * cloud drivers received `https://.../projects/x.png` as an object key, the
 * DELETE 404'd, and the image was orphaned in the bucket forever.
 */
export async function removeAssets(urls = []) {
  for (const url of urls) {
    if (!url) continue;
    const key = storage().keyFromUrl?.(url) ?? null;
    if (!key) continue;
    try {
      await removeFile({ key });
    } catch (error) {
      console.warn(`[storage] could not remove ${url}:`, error.message);
    }
  }
}

export default { initStorage, storage, putFile, removeFile, removeAssets };