import bcrypt from 'bcryptjs';
import config from '../config/env.js';

/**
 * PIN verification.
 *
 * The plaintext PIN never leaves the server process and is never bundled into
 * the client. What we store is a bcrypt hash in ADMIN_PIN_HASH. If that is
 * missing but ADMIN_PIN is present (first-run convenience), we hash it once at
 * boot so the operator can paste it into the env file permanently.
 */
let hash = config.auth.pinHash;
let warned = false;

if (!hash && config.auth.pin) {
  hash = bcrypt.hashSync(config.auth.pin, 12);
  warned = true;
}

export function getPinHash() {
  return hash;
}

export function hasPinConfigured() {
  return Boolean(hash);
}

export function plaintextPinWarning() {
  if (!warned) return null;
  return [
    '',
    '  ┌──────────────────────────────────────────────────────────────┐',
    '  │  FIRST RUN: admin PIN hashed from ADMIN_PIN                   │',
    '  ├──────────────────────────────────────────────────────────────┤',
    `  │  ADMIN_PIN_HASH=${hash}`,
    '  │                                                              │',
    '  │  Paste the line above into server/.env, remove ADMIN_PIN,     │',
    '  │  then restart.                                               │',
    '  └──────────────────────────────────────────────────────────────┘',
  ].join('\n');
}

/**
 * Constant-ish-time comparison. bcrypt.compare is inherently constant time;
 * the dummy compare below keeps failed lookups from being distinguishable by
 * timing when no hash is configured at all.
 */
export async function verifyPin(pin) {
  if (!hash) {
    await bcrypt.compare(pin, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
    return false;
  }
  return bcrypt.compare(pin, hash);
}