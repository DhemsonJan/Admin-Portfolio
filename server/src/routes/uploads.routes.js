import { randomBytes } from 'node:crypto';
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { EXTENSIONS, manyImages, singleImage, sniffImageType } from '../middleware/upload.js';
import { ValidationError } from '../lib/validate.js';
import { putFile } from '../storage/index.js';
import config from '../config/env.js';

const router = express.Router();

router.use('/admin', requireAuth);

const buildKey = () => {
  const now = new Date();
  const bucket = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `projects/${bucket}/${randomBytes(12).toString('hex')}`;
};

/**
 * Rejects anything whose bytes do not match a supported image format. The
 * declared MIME type is treated as a hint only.
 */
const storeVerified = async (file) => {
  const detected = sniffImageType(file.buffer);

  if (!detected || !config.storage.allowedTypes.includes(detected)) {
    throw new ValidationError('That file is not a valid JPG, PNG or WEBP image.', {
      file: 'Unsupported image format.',
    });
  }

  const key = buildKey();
  // The extension comes from the sniffed bytes, never from the client-supplied
  // filename, so a renamed file cannot change how it is stored or served.
  return putFile({
    key: key + (EXTENSIONS[detected] ?? '.jpg'),
    buffer: file.buffer,
    contentType: detected,
  });
};

router.post(
  '/admin/uploads/image',
  singleImage('image'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new ValidationError('Choose an image to upload.', { image: 'Required.' });

    const asset = await storeVerified(req.file);
    res.status(201).json({
      url: asset.url,
      key: asset.key,
      contentType: asset.contentType,
      size: req.file.size,
      message: 'Image uploaded.',
    });
  }),
);

router.post(
  '/admin/uploads/gallery',
  manyImages('images'),
  asyncRoute(async (req, res) => {
    const files = req.files ?? [];
    if (files.length === 0) {
      throw new ValidationError('Choose at least one image.', { images: 'Required.' });
    }

    const stored = [];
    for (const file of files) {
      stored.push(await storeVerified(file));
    }

    res.status(201).json({
      urls: stored.map((asset) => asset.url),
      assets: stored,
      message: `${stored.length} image(s) uploaded.`,
    });
  }),
);

export default router;