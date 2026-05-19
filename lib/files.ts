import * as ExpoFS from "expo-file-system/legacy";
import { getToken } from "./api";
import { getApiBaseUrl } from "./config";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

export function isImageFilename(filename: string): boolean {
  if (IMAGE_EXT.test(filename)) return true;
  // Camera roll picks often have no extension until upload
  if (!filename.includes(".")) return true;
  return false;
}

function cachePath(fileId: string, filename: string): string {
  const extMatch = filename.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
  const base = ExpoFS.cacheDirectory ?? "";
  return `${base}invoice-${fileId}${ext}`;
}

/**
 * Download receipt to app cache with Authorization header.
 * RN Image cannot send Bearer tokens; ?token= query is unreliable on device.
 */
export async function fetchInvoiceToCache(
  fileId: string,
  filename: string
): Promise<string> {
  const dest = cachePath(fileId, filename);
  if (!ExpoFS.cacheDirectory) {
    throw new Error("File cache unavailable on this device");
  }

  const existing = await ExpoFS.getInfoAsync(dest);
  if (existing.exists) {
    return dest;
  }

  const token = await getToken();
  const url = `${getApiBaseUrl()}/files/download/${fileId}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const result = await ExpoFS.downloadAsync(url, dest, { headers });
  if (result.status < 200 || result.status >= 300) {
    await ExpoFS.deleteAsync(dest, { idempotent: true }).catch(() => {});
    throw new Error(`Could not load receipt (${result.status})`);
  }
  return result.uri;
}

/** @deprecated Use fetchInvoiceToCache — kept for any legacy callers */
export async function invoiceFileUrl(fileId: string): Promise<string> {
  const token = await getToken();
  const base = getApiBaseUrl();
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/files/download/${fileId}${q}`;
}
