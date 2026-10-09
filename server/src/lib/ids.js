import { randomUUID, randomBytes } from 'node:crypto';

export const newId = () => randomUUID();

export const newToken = () => randomBytes(32).toString('base64url');

export const nowIso = () => new Date().toISOString();