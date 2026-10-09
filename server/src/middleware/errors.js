import config from '../config/env.js';
import { ValidationError } from '../lib/validate.js';

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code ?? 'ERROR';
  }
}

export const notFound = (req, res) =>
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, _next) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message, fields: error.fields, code: 'INVALID' });
  }

  if (error?.name === 'HttpError') {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }

  if (error?.code === 'LIMIT_UNEXPECTED_FILE' || error?.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files uploaded.', code: 'INVALID' });
  }

  if (config.isProd) {
    console.error('[error]', error);
  } else {
    console.error('[error]', error?.stack ?? error);
  }

  return res.status(500).json({ error: 'Something went wrong on the server.', code: 'SERVER_ERROR' });
}

export const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);