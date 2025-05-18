import QRCode from 'qrcode';

/**
 * Generates a QR code image URL from the given text
 * @param text The text to encode in the QR code
 * @returns A data URL containing the QR code image
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return 'https://example.com/placeholder-qr-code.png'; // Fallback URL
  }
}

/**
 * Generates a unique certificate number
 * @returns A unique certificate number string
 */
export function generateCertificateNumber(): string {
  const prefix = 'HAL';
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  
  return `${prefix}-${year}-${random}`;
}

/**
 * Formats a date into a localized string
 * @param date Date to format
 * @param locale Locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(content: string): string {
  // Basic sanitization - in a real app, use a proper library like DOMPurify
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}