import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRScanner from "@/components/shared/QRScanner";
import CertificateCard from "@/components/certificate/CertificateCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface Certificate {
  id: string;
  storeName: string;
  storeAddress: string;
  status: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
}

interface VerificationSectionProps {
  initialCertificateNumber?: string;
}

const VerificationSection = ({ initialCertificateNumber }: VerificationSectionProps) => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialCertificateNumber || "");
  const [isScanning, setIsScanning] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      toast({
        title: t("verify.emptySearchError"),
        description: t("verify.enterSearchTerm"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the new public verification endpoint
      const response = await fetch(`/api/verify/${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        setCertificate({
          id: data.certificate.id,
          storeName: data.certificate.businessName,
          storeAddress: data.certificate.businessAddress,
          status: data.certificate.status,
          certificateNumber: data.certificate.certificateNumber,
          issuedDate: data.certificate.issuedAt,
          expiryDate: data.certificate.expiresAt
        });
      } else {
        setCertificate(null);
        toast({
          title: t("verify.notFound"),
          description: t("verify.noMatchingCertificate"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("verify.searchError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when there's an initial certificate number
  useEffect(() => {
    if (initialCertificateNumber) {
      performSearch(initialCertificateNumber);
    }
  }, [initialCertificateNumber, t, toast]);

  const handleSearch = async () => {
    await performSearch(searchQuery);
  };

  const handleScanResult = async (result: string) => {
    setIsScanning(false);
    if (result) {
      // Extract certificate number from the QR code URL
      const urlPattern = /\/verify\/([a-zA-Z0-9-]+)/;
      const match = result.match(urlPattern);
      
      if (match && match[1]) {
        const certificateNumber = match[1];
        setSearchQuery(certificateNumber); // Update search query to show what we're verifying
        await performSearch(certificateNumber);
      } else {
        toast({
          title: t("verify.invalidFormat"),
          description: t("verify.invalidQRFormat"),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <section id="verify" className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("verify.title")}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            {t("verify.description")}
          </p>
        </div>
        
        <div className={`grid md:grid-cols-2 gap-8 items-center ${isRtl ? "rtl" : ""}`}>
          <div className="bg-secondary-50 rounded-lg p-6 shadow-md">
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                <i className="ri-qr-scan-line text-4xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">{t("verify.scanQR")}</h3>
              <p className="text-gray-600 mb-6">
                {t("verify.scanQRDescription")}
              </p>
              
              <div className="relative mx-auto max-w-xs">
                {isScanning ? (
                  <QRScanner onScanSuccess={handleScanResult} onCancel={() => setIsScanning(false)} />
                ) : (
                  <>
                    <img 
                      src="https://pixabay.com/get/g57910b12695c83a7945c6b6334754ec45b96714a5ee4ef67f50ccd0c7f2fef35903cb2655e6b3175db9bb9744bc9c602cc165fc7ed590b89185d6885d49a1075_1280.jpg" 
                      alt={t("verify.qrScanImageAlt")} 
                      className="rounded-lg shadow-md mx-auto" 
                    />
                    <button 
                      className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 rounded-lg"
                      onClick={() => setIsScanning(true)}
                    >
                      <span className="bg-primary text-white py-2 px-4 rounded-md font-medium">
                        <i className="ri-camera-line mr-2"></i> {t("verify.openCamera")}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-secondary-50 rounded-lg p-6 shadow-md">
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                <i className="ri-search-line text-4xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">{t("verify.searchBusiness")}</h3>
              <p className="text-gray-600 mb-6">
                {t("verify.searchDescription")}
              </p>
              
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder={t("verify.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-gray-300 pr-10"
                />
                <button 
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-primary"
                  onClick={handleSearch}
                >
                  <i className="ri-search-line text-xl"></i>
                </button>
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/90 text-white w-full"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? t("common.searching") : t("common.search")}
              </Button>
            </div>
          </div>
        </div>

        {/* Certificate Result */}
        {certificate && (
          <div className="mt-12">
            <CertificateCard certificate={certificate} />
          </div>
        )}
      </div>
    </section>
  );
};

export default VerificationSection;
