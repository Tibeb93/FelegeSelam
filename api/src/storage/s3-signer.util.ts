import * as crypto from 'crypto';

export interface S3SignerConfig {
  endpoint?: string; // e.g. https://<accountid>.r2.cloudflarestorage.com or custom
  region?: string;   // default 'auto' or 'us-east-1'
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string; // e.g. https://cdn.example.com
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

/**
 * Generates an AWS SigV4 Presigned URL for PUT (upload) or GET (download).
 * Compatible with AWS S3, Cloudflare R2, Supabase Storage, and MinIO.
 */
export function generateS3PresignedUrl(
  config: S3SignerConfig,
  method: 'GET' | 'PUT',
  key: string,
  expiresInSeconds: number = 3600,
  contentType?: string,
): string {
  const cleanKey = key.replace(/^\/+/, '');
  const region = config.region || 'auto';
  const service = 's3';

  // Parse endpoint
  let host = '';
  let basePath = '';
  if (config.endpoint) {
    const epUrl = new URL(config.endpoint);
    host = epUrl.host;
    basePath = epUrl.pathname.replace(/\/+$/, '');
  } else {
    host = `${config.bucket}.s3.${region === 'auto' ? 'us-east-1' : region}.amazonaws.com`;
  }

  const isPathStyle = !!config.endpoint; // R2, Supabase, MinIO use path style
  const path = isPathStyle ? `${basePath}/${config.bucket}/${cleanKey}` : `/${cleanKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  };

  if (contentType && method === 'PUT') {
    // Some clients require content-type signed or query param
  }

  const sortedKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    method,
    encodeURI(path),
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    `${dateStamp}/${region}/${service}/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const scheme = config.endpoint?.startsWith('http://') ? 'http://' : 'https://';
  return `${scheme}${host}${path}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

/**
 * Builds the permanent public CDN/Bucket URL for public assets.
 */
export function getS3PublicUrl(config: S3SignerConfig, key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
  if (config.endpoint) {
    return `${config.endpoint.replace(/\/+$/, '')}/${config.bucket}/${cleanKey}`;
  }
  const region = config.region || 'auto';
  return `https://${config.bucket}.s3.${region === 'auto' ? 'us-east-1' : region}.amazonaws.com/${cleanKey}`;
}

