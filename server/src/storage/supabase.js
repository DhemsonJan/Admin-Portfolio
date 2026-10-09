import config from '../config/env.js';

/**
 * Supabase Storage driver. Uses the plain REST API so this project needs no
 * extra npm dependency for it.
 */
const headers = () => ({
  apikey: config.storage.supabase.serviceRoleKey,
  Authorization: `Bearer ${config.storage.supabase.serviceRoleKey}`,
  'Content-Type': 'application/json',
});

export const supabaseDriver = {
  name: 'supabase',

  async init() {
    if (!config.storage.supabase.url || !config.storage.supabase.serviceRoleKey) {
      throw new Error('STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    return this;
  },

  async put({ key, buffer, contentType }) {
    const bucket = config.storage.supabase.bucket;
    const url = `${config.storage.supabase.url}/storage/v1/object/${bucket}/${key}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': contentType, 'x-upsert': 'true' },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`Supabase upload failed: ${response.status} ${await response.text()}`);
    }

    return {
      url: `${config.storage.supabase.url}/storage/v1/object/public/${bucket}/${key}`,
      key,
      contentType,
    };
  },

  async remove({ key }) {
    if (!key) return;
    const bucket = config.storage.supabase.bucket;
    // headers() sets `Content-Type: application/json`, and Supabase's Storage
    // API rejects a DELETE with that header and an empty body ("Body cannot be
    // empty when content-type is set"). Send an explicit empty JSON body.
    const response = await fetch(`${config.storage.supabase.url}/storage/v1/object/${bucket}/${key}`, {
      method: 'DELETE',
      headers: headers(),
      body: '{}',
    });

    // Throwing lets removeAssets() surface the failure. Without this check the
    // caller logged a delete that never happened and the object was orphaned.
    if (!response.ok) {
      throw new Error(`Supabase delete failed for ${key}: ${response.status} ${await response.text()}`);
    }
  },

  keyFromUrl(url) {
    const prefix = `${config.storage.supabase.url}/storage/v1/object/public/${config.storage.supabase.bucket}/`;
    if (typeof url !== 'string' || !url.startsWith(prefix)) return null;
    return url.slice(prefix.length) || null;
  },
};

export default supabaseDriver;