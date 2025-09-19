import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GeometricPattern from "@/components/shared/GeometricPattern";
import { downloadCertificatePDF, previewCertificatePDF } from "@/utils/pdfGenerator";

interface PrintableCertificateProps {
  certificate: {
    id: string;
    storeName: string;
    storeAddress: string;
    status: string;
    certificateNumber: string;
    issuedDate: string;
    expiryDate: string;
    qrCodeUrl: string;
  };
}

const PrintableCertificate: React.FC<PrintableCertificateProps> = ({ certificate }) => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printSection = printContent.innerHTML;
    
    document.body.innerHTML = printSection;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    try {
      await downloadCertificatePDF(certificate);
    } catch (error) {
      console.error('PDF download failed:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to download PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    try {
      await previewCertificatePDF(certificate);
    } catch (error) {
      console.error('PDF preview failed:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to preview PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="mb-8">
      {pdfError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{pdfError}</p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={handlePrint} 
          className="text-gray-700"
          disabled={isGeneratingPDF}
        >
          <Printer className="mr-2 h-4 w-4" />
          {t('certificate.printForDisplay')}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handlePreviewPDF} 
          className="text-gray-700"
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {t('certificate.previewPDF')}
        </Button>
        
        <Button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPDF}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {isGeneratingPDF ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('certificate.downloadPDF')}
        </Button>
      </div>

      <div ref={printRef}>
        <div className={`printable-certificate ${isRtl ? 'rtl' : ''}`}>
          <Card className="certificate-card border-2 border-primary overflow-hidden relative">
            <div className="absolute inset-0 opacity-5">
              <GeometricPattern />
            </div>
            
            <div className="relative p-8 text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-primary mb-1">{t('certificate.officialHalalCertificate')}</h2>
                <p className="text-gray-500">{t('certificate.certificationAuthority')}</p>
              </div>
              
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="text-2xl font-bold mb-1 text-gray-800">{certificate.storeName}</div>
                <div className="text-gray-600 mb-4">{certificate.storeAddress}</div>
                
                <p className="text-gray-700 mb-4 italic max-w-md mx-auto">
                  {t('certificate.halalDeclaration')}
                </p>
                
                <div className="certificate-number font-mono text-gray-700 border border-gray-300 px-4 py-2 rounded bg-gray-50">
                  {certificate.certificateNumber}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-gray-500 text-sm mb-1">{t('certificate.issuedDate')}</div>
                  <div className="font-semibold">{formatDate(certificate.issuedDate)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-sm mb-1">{t('certificate.expiryDate')}</div>
                  <div className="font-semibold">{formatDate(certificate.expiryDate)}</div>
                </div>
              </div>
              
              <div className="qr-section border-t border-gray-200 pt-6 flex flex-col items-center">
                <p className="text-gray-700 mb-4">{t('certificate.scanToVerify')}</p>
                <div className="qr-box p-3 bg-white border border-gray-200 rounded shadow-sm mb-2 w-48 h-48">
                  <img src={certificate.qrCodeUrl} alt={t('certificate.qrCodeAlt')} className="w-full h-full" />
                </div>
                <p className="text-sm text-gray-500">{t('certificate.verificationInstructions')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .printable-certificate {
              width: 100%;
              height: 100%;
              page-break-after: always;
            }
            .certificate-card {
              border: 5px solid #085a49 !important;
              height: 100vh;
              width: 100%;
              box-shadow: none !important;
            }
            .qr-box {
              width: 200px !important;
              height: 200px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrintableCertificate;