import { toDataURL } from 'qrcode';

/**
 * Generates a QR code image as a base64 data URL from a verification URL
 *
 * @param verificationUrl - The certificate verification URL to encode in the QR code
 * @returns Promise that resolves to a base64 data URL of the QR code image
 *
 * @example
 * ```ts
 * const qrCodeDataUrl = await generateQRCode('https://genia.com/certificates/verify/abc123');
 * // Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 * ```
 */
export async function generateQRCode(verificationUrl: string): Promise<string> {
  try {
    // Generate QR code as data URL with optimized settings for certificate use
    const dataUrl = await toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H', // High error correction for reliability
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#000000ff', // QR code color (RGBA hex format)
        light: '#ffffffff', // Background color (RGBA hex format)
      },
      width: 200, // Size in pixels (suitable for certificate printing)
    });

    return dataUrl;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
