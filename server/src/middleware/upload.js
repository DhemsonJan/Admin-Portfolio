import multer from 'multer';
import config from '../config/env.js';
import { ValidationError } from '../lib/validate.js';

/**
 * Magic-byte signatures. MIME type from the browser is attacker-controlled, so
 * the actual bytes are checked before anything is written to storage.
 */
const SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

const isWebp = (buffer) =>
  buffer.length >= 12 &&
  buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
  buffer.subarray(8, 12).toString('ascii') === 'WEBP';

export const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export function sniffImageType(buffer) {
  for (const signature of SIGNATURES) {
    if (signature.bytes.every((byte, index) => buffer[index] === byte)) return signature.mime;
  }
  if (isWebp(buffer)) return 'image/webp';
  return null;
}

const DOCUMENT_SIGNATURES = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

const DOCX_ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const OPC_CONTENT_TYPES = Buffer.from('[Content_Types].xml');

/** .docx is a ZIP (PK) that must also follow the OOXML container layout. */
function isDocx(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const matchesZip = DOCX_ZIP_SIGNATURE.every((byte, index) => buffer[index] === byte);
  return matchesZip && buffer.includes(OPC_CONTENT_TYPES);
}

/**
 * Sniffs a document's real bytes for PDF or Word (.docx). The browser-supplied
 * MIME type is attacker-controlled, so the bytes win before anything is stored.
 */
export function sniffDocumentType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  for (const signature of DOCUMENT_SIGNATURES) {
    if (signature.bytes.every((byte, index) => buffer[index] === byte)) return signature.mime;
  }
  if (isDocx(buffer)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.maxUploadBytes,
    files: 8,
    fields: 30,
  },
  fileFilter(_req, file, callback) {
    if (!config.storage.allowedTypes.includes(file.mimetype)) {
      return callback(new ValidationError('Only JPG, PNG and WEBP images are accepted.'));
    }
    return callback(null, true);
  },
});

/** Wraps multer so its errors come back as clean JSON instead of HTML. */
export const singleImage = (field) =>
  (req, res, next) =>
    upload.single(field)(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `Image is larger than the ${Math.round(
                config.storage.maxUploadBytes / 1024 / 1024,
              )} MB limit.`,
            ),
          );
        }
        return next(new ValidationError(error.message));
      }
      return next(error);
    });

/** Resumes accept PDF and Word (.docx); everything else is rejected up front. */
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.maxUploadBytes,
    files: 1,
    fields: 30,
  },
  fileFilter(_req, file, callback) {
    if (!DOCUMENT_TYPES.includes(file.mimetype)) {
      return callback(new ValidationError('Only PDF and Word (.docx) files are accepted.'));
    }
    return callback(null, true);
  },
});

export const singleDocument = (field) =>
  (req, res, next) =>
    documentUpload.single(field)(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `File is larger than the ${Math.round(
                config.storage.maxUploadBytes / 1024 / 1024,
              )} MB limit.`,
            ),
          );
        }
        return next(new ValidationError(error.message));
      }
      return next(error);
    });

export const manyImages = (field) =>
  (req, res, next) =>
    upload.array(field, config.storage.maxGalleryImages)(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ValidationError(
              `Image is larger than the ${Math.round(
                config.storage.maxUploadBytes / 1024 / 1024,
              )} MB limit.`,
            ),
          );
        }
        return next(new ValidationError(error.message));
      }
      return next(error);
    });