/**
 * Client-side image downscaling.
 *
 * Uploaded screenshots are routinely 3000px+ screenshots that weigh several
 * megabytes. Shrinking them here means faster uploads, far less object storage,
 * and no risk of hitting a request-body cap on the way to storage.
 *
 * The server still verifies magic bytes on what actually arrives, so this is a
 * bandwidth optimisation and never a trust boundary.
 */

/** Longest edge kept. Portfolio cards and detail pages never need more. */
const MAX_EDGE = 2000;

/** Ceiling for the re-encoded file. */
const TARGET_BYTES = 1.5 * 1024 * 1024;

/** Files already this small are sent untouched. */
const SKIP_BELOW = 320 * 1024;

const ACCEPTED = 'image/jpeg,image/png,image/webp';

/** WebP keeps alpha and is ~30% smaller; JPEG is the fallback everywhere else. */
const webpSupported = (() => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL?.('image/webp').startsWith('data:image/webp') ?? false;
})();

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Step quality down until the file fits the ceiling. Returns the last blob even
 * if it is still too big, so a very detailed screenshot degrades rather than
 * failing outright — the server enforces the real limit.
 */
async function encodeWithinBudget(canvas, mime) {
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, mime, quality);
  let best = blob;

  while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, mime, quality);
    if (blob && blob.size < best.size) best = blob;
  }

  return best;
}

/**
 * Returns a File ready to upload. Falls back to the original file whenever the
 * image cannot be decoded or re-encoded, so this never blocks an upload.
 */
export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) return file;
  if (!ACCEPTED.includes(file.type)) return file;
  if (file.size <= SKIP_BELOW) return file;

  let bitmap = null;
  try {
    bitmap = await loadBitmap(file);
    if (!bitmap) return file;

    const width = bitmap.width;
    const height = bitmap.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const mime = webpSupported ? 'image/webp' : 'image/jpeg';

    // JPEG has no alpha channel. Painting an opaque backdrop first stops a
    // transparent PNG from coming out with black boxes where it had cutouts.
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await encodeWithinBudget(canvas, mime);
    if (!blob || blob.size >= file.size) return file;

    const ext = mime === 'image/webp' ? 'webp' : 'jpg';
    const name = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${name}.${ext}`, { type: mime, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

export const IMAGE_ACCEPT = ACCEPTED;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
