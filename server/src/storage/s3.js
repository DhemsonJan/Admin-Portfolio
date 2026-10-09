import config from '../config/env.js';

/**
 * AWS S3 / Cloudflare R2 driver.
 *
 * The SDK is imported lazily so that installations which never select this
 * driver do not need to install it. To use this driver:
 *
 *   npm --prefix server install @aws-sdk/client-s3
 */
let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      let S3;
      try {
        S3 = await import('@aws-sdk/client-s3');
      } catch {
        throw new Error(
          'STORAGE_DRIVER=s3 requires the AWS SDK. Run: npm --prefix server install @aws-sdk/client-s3',
        );
      }
      return new S3.S3Client({
        region: config.storage.s3.region,
        ...(config.storage.s3.endpoint ? { endpoint: config.storage.s3.endpoint } : {}),
        forcePathStyle: Boolean(config.storage.s3.endpoint),
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        },
      });
    })();
  }
  return clientPromise;
}

export const s3Driver = {
  name: 's3',

  async init() {
    const { bucket, accessKeyId, secretAccessKey, publicBaseUrl } = config.storage.s3;
    if (!bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      throw new Error(
        'STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_PUBLIC_BASE_URL',
      );
    }
    await getClient();
    return this;
  },

  async put({ key, buffer, contentType }) {
    const S3 = await import('@aws-sdk/client-s3');
    const client = await getClient();

    await client.send(
      new S3.PutObjectCommand({
        Bucket: config.storage.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      url: `${config.storage.s3.publicBaseUrl}/${key}`,
      key,
      contentType,
    };
  },

  async remove({ key }) {
    if (!key) return;
    const S3 = await import('@aws-sdk/client-s3');
    const client = await getClient();
    await client.send(
      new S3.DeleteObjectCommand({ Bucket: config.storage.s3.bucket, Key: key }),
    );
  },

  keyFromUrl(url) {
    const { publicBaseUrl } = config.storage.s3;
    if (!publicBaseUrl || typeof url !== 'string') return null;
    if (!url.startsWith(`${publicBaseUrl}/`)) return null;
    return url.slice(publicBaseUrl.length + 1) || null;
  },
};

export default s3Driver;