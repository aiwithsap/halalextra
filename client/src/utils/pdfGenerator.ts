import { pdf } from '@react-pdf/renderer';
import CertificatePDF from '@/components/certificate/CertificatePDF';

interface Certificate {
  id: string;
  storeName: string;
  storeAddress: string;
  status: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  qrCodeUrl: string;
}

/**
 * Generate PDF blob for certificate
 */
export const generateCertificatePDF = async (certificate: Certificate): Promise<Blob> => {
  try {
    const doc = CertificatePDF({ certificate });
    const blob = await pdf(doc).toBlob();
    return blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF certificate');
  }
};

/**
 * Download PDF certificate
 */
export const downloadCertificatePDF = async (certificate: Certificate): Promise<void> => {
  try {
    const blob = await generateCertificatePDF(certificate);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `halal-certificate-${certificate.certificateNumber}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF certificate');
  }
};

/**
 * Open PDF in new tab
 */
export const previewCertificatePDF = async (certificate: Certificate): Promise<void> => {
  try {
    const blob = await generateCertificatePDF(certificate);
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      throw new Error('Popup blocked - please allow popups for this site');
    }
    
    // Clean up URL after a delay to allow the tab to load
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw new Error('Failed to preview PDF certificate');
  }
};

/**
 * Generate PDF and return base64 string for server-side operations
 */
export const generateCertificatePDFBase64 = async (certificate: Certificate): Promise<string> => {
  try {
    const blob = await generateCertificatePDF(certificate);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert PDF to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error generating PDF base64:', error);
    throw new Error('Failed to generate PDF base64');
  }
};