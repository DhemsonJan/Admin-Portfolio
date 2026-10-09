import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config/env.js';

/** Fallback extension when a caller supplies a key without one. */
const EXTENSION_FOR = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Resolve a storage key to an absolute path, refusing anything that escapes the
 * upload directory. Keys are server-generated (`projects/<YYYYMM>/<hex>.png`),
 * but a traversal check here costs nothing and keeps that assumption from
 * becoming a vulnerability if a key is ever derived from user input.
 */
function resolveInsideUploadDir(key) {
  const root = path.resolve(config.storage.uploadDir);
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

/**
 * Development driver: writes to server/uploads and relies on the
 * /uploads static route in app.js.
 */
export const localDriver = {
  name: 'local',

  async init() {
    await fs.mkdir(config.storage.uploadDir, { recursive: true });
    return this;
  },

  async put({ key, buffer, contentType }) {
    // Upload routes already append the verified extension, so the key is used
    // as-is. Appending path.extname(key) here produced names like
    // "<hash>.png.png" and made local filenames differ from S3 ones.
    const filename = /\.[a-z0-9]+$/i.test(key) ? key : `${key}${EXTENSION_FOR[contentType] ?? '.jpg'}`;
    const target = resolveInsideUploadDir(filename);
    if (!target) throw new Error(`Refusing to write outside the upload directory: ${filename}`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    return {
      url: `${config.storage.publicUploadPath}/${filename}`,
      key: filename,
      contentType,
    };
  },

  async remove({ key }) {
    if (!key) return;
    // The full key is used, not path.basename(): uploads are nested under
    // projects/<YYYYMM>/, and taking the basename looked for uploads/<file>.png
    // while the file actually sat in uploads/projects/<YYYYMM>/<file>.png, so
    // deletes silently did nothing.
    const target = resolveInsideUploadDir(key);
    if (!target) {
      throw new Error(`Refusing to delete outside the upload directory: ${key}`);
    }
    await fs.rm(target, { force: true });
  },

  isLocalUrl(url) {
    return typeof url === 'string' && url.startsWith(config.storage.publicUploadPath);
  },

  keyFromUrl(url) {
    if (!this.isLocalUrl(url)) return null;
    const name = url.slice(config.storage.publicUploadPath.length).replace(/^\/+/, '');
    return name || null;
  },
};

export default localDriver;