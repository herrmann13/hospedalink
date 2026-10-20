import { S3Client } from "bun";

// Bucket S3-compatível (Railway Bucket). Variáveis: S3_BUCKET, S3_ACCESS_KEY_ID,
// S3_SECRET_ACCESS_KEY, S3_ENDPOINT e S3_REGION.
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

const client =
  bucket && accessKeyId && secretAccessKey
    ? new S3Client({
        bucket,
        accessKeyId,
        secretAccessKey,
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
      })
    : null;

export const storageEnabled = client !== null;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SIGNED_URL_SECONDS = 600;

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export const IMAGE_EXTENSION: Record<ImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Identifica o tipo real da imagem pelos primeiros bytes (não confia no Content-Type). */
export function detectImageType(data: Uint8Array): ImageType | null {
  if (data.length < 12) return null;
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
  const ascii = (start: number, end: number) => String.fromCharCode(...data.subarray(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

function requireClient(): S3Client {
  if (!client) throw new Error("Armazenamento de imagens não configurado (variáveis S3_*).");
  return client;
}

export async function putObject(key: string, data: Uint8Array, type: ImageType) {
  await requireClient().write(key, data, { type });
}

export async function deleteObject(key: string) {
  await requireClient().delete(key);
}

export function signedUrl(key: string): string {
  return requireClient().presign(key, { expiresIn: SIGNED_URL_SECONDS });
}

export const signedUrlMaxAge = SIGNED_URL_SECONDS - 60;

/** Imagens antigas podem ser URLs externas; as novas são chaves do bucket. */
export const isExternalUrl = (value: string) => /^https?:\/\//.test(value);
