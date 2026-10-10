import { randomBytes } from 'node:crypto';
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { singleDocument, sniffDocumentType, EXTENSIONS } from '../middleware/upload.js';
import { ValidationError } from '../lib/validate.js';
import { putFile } from '../storage/index.js';
import { setSetting, getSetting } from '../services/settings.js';
import config from '../config/env.js';

const router = express.Router();

router.use('/admin', requireAuth);

const buildResumeKey = (ext) => {
  const now = new Date();
  const bucket = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `resume/${bucket}/${randomBytes(12).toString('hex')}${ext}`;
};

router.post(
  '/admin/uploads/resume',
  singleDocument('resume'),
  asyncRoute(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('Choose a PDF or Word (.docx) file to upload.', {
        resume: 'Required.',
      });
    }
    const detected = sniffDocumentType(req.file.buffer);
    if (!detected) {
      throw new ValidationError('That file is not a PDF or Word document.', {
        resume: 'Unsupported file format.',
      });
    }
    const key = buildResumeKey(EXTENSIONS[detected]);
    const asset = await putFile({ key, buffer: req.file.buffer, contentType: detected });

    await setSetting('resume_url', asset.url);
    res.status(201).json({ url: asset.url, key: asset.key, message: 'Resume uploaded.' });
  }),
);

router.delete(
  '/admin/uploads/resume',
  asyncRoute(async (req, res) => {
    const current = await getSetting('resume_url');
    if (current) {
      try {
        const key = config.storage.driver === 'supabase' ? null : null;
      } catch {
        /* noop */
      }
    }
    await setSetting('resume_url', '');
    res.json({ ok: true, message: 'Resume removed.' });
  }),
);

export default router;