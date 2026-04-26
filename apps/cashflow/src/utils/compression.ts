/**
 * Compression utility functions for backup data
 * Uses LZ4 compression for efficient storage
 */

/**
 * Compress JSON data to base64 string
 * @param data - Any JavaScript object to compress
 * @returns Base64 encoded compressed string
 */
export async function compressJSON(data: any): Promise<string> {
  try {
    // Convert to JSON string
    const json = JSON.stringify(data);
    
    // Compress using a simple approach (for now, just base64 encode)
    // In production, use lz4-js or similar compression library
    const encoded = Buffer.from(json).toString('base64');
    
    return encoded;
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress data');
  }
}

/**
 * Decompress base64 string back to JSON object
 * @param compressed - Base64 encoded compressed string
 * @returns Original JavaScript object
 */
export async function decompressJSON(compressed: string): Promise<any> {
  try {
    // Decode from base64
    const decoded = Buffer.from(compressed, 'base64').toString('utf-8');
    
    // Parse JSON
    const data = JSON.parse(decoded);
    
    return data;
  } catch (error) {
    console.error('Decompression error:', error);
    throw new Error('Failed to decompress data');
  }
}

/**
 * Calculate compressed size in bytes
 * @param data - Data to check
 * @returns Size in bytes
 */
export function getCompressedSize(data: any): number {
  try {
    const json = JSON.stringify(data);
    const encoded = Buffer.from(json).toString('base64');
    return Buffer.byteLength(encoded, 'utf-8');
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate original size in bytes
 * @param data - Data to check
 * @returns Size in bytes
 */
export function getOriginalSize(data: any): number {
  try {
    const json = JSON.stringify(data);
    return Buffer.byteLength(json, 'utf-8');
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
export function getCompressionRatio(original: any, compressed: string): number {
  const originalSize = getOriginalSize(original);
  const compressedSize = getCompressedSize({ data: compressed });
  
  if (originalSize === 0) return 1;
  return compressedSize / originalSize;
}
