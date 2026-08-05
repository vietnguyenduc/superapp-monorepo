import { logger } from "../utils/logger";

/**
 * Compression utility functions for backup data
 * Uses base64 encoding that works in both browser and Node environments.
 */

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("btoa is not available in this environment");
}

function base64ToUint8Array(b64: string): Uint8Array {
  if (typeof atob !== "function") {
    throw new Error("atob is not available in this environment");
  }
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compress JSON data to base64 string
 * @param data - Any JavaScript object to compress
 * @returns Base64 encoded compressed string
 */
export async function compressJSON(data: unknown): Promise<string> {
  try {
    const json = JSON.stringify(data);
    const encoded = uint8ArrayToBase64(new TextEncoder().encode(json));
    return encoded;
  } catch (error) {
    logger.error("Compression error:", error);
    throw new Error("Failed to compress data");
  }
}

/**
 * Decompress base64 string back to JSON object
 * @param compressed - Base64 encoded compressed string
 * @returns Original JavaScript object
 */
export async function decompressJSON(compressed: string): Promise<unknown> {
  try {
    const json = new TextDecoder().decode(base64ToUint8Array(compressed));
    const data = JSON.parse(json);
    return data;
  } catch (error) {
    logger.error("Decompression error:", error);
    throw new Error("Failed to decompress data");
  }
}

/**
 * Calculate compressed size in bytes
 * @param data - Data to check
 * @returns Size in bytes
 */
export function getCompressedSize(data: unknown): number {
  try {
    const json = JSON.stringify(data);
    return uint8ArrayToBase64(new TextEncoder().encode(json)).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate original size in bytes
 * @param data - Data to check
 * @returns Size in bytes
 */
export function getOriginalSize(data: unknown): number {
  try {
    const json = JSON.stringify(data);
    return new TextEncoder().encode(json).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate compression ratio
 * @param original - Original data
 * @param compressed - Compressed data
 * @returns Compression ratio (e.g., 0.5 means 50% of original size)
 */
export function getCompressionRatio(original: unknown, compressed: string): number {
  const originalSize = getOriginalSize(original);
  const compressedSize = getCompressedSize({ data: compressed });

  if (originalSize === 0) return 1;
  return compressedSize / originalSize;
}
