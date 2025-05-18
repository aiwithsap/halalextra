import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { useRoute } from "wouter";
import { Printer, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { apiRequest } from "@/lib/queryClient";

interface Certificate {
  id: string;
  storeName: string;
  storeAddress: string;
  status: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  qrCodeUrl?: string;
}

// Function to generate the QR code URL (actual value will be provided by server)
const getBaseUrl = () => {
  // In production, this would be the actual domain
  return window.location.origin;
};

const Certificate = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const [, params] = useRoute('/certificate/:id');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!params?.id) return;
      
      try {
        const response = await apiRequest("GET", `/api/certificates/${params.id}`, undefined);
        const data = await response.json();
        
        if (data && data.certificate) {
          setCertificate(data.certificate);
        } else {
          toast({
            title: t("certificate.notFound"),
            description: t("certificate.notFoundDescription"),
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("certificate.fetchError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [params?.id, toast, t]);

  // Function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to handle download certificate
  const handleDownload = () => {
    // In a real app, this would generate a PDF or image
    toast({
      title: t("certificate.downloadStarted"),
      description: t("certificate.downloadDescription"),
    });
  };

  // Function to handle share
  const handleShare = async () => {
    if (!certificate) return;
    
    const shareUrl = `${getBaseUrl()}/certificate/${certificate.id}`;
    const shareText = `${t("certificate.shareText")} ${certificate.storeName}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("certificate.shareTitle"),
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // Fall back to clipboard
        copyToClipboard(shareUrl);
      }
    } else {
      // Fall back to clipboard
      copyToClipboard(shareUrl);
    }
  };

  // Helper function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: t("certificate.copied"),
        description: t("certificate.copiedDescription"),
      });
    }).catch(() => {
      toast({
        title: t("common.error"),
        description: t("certificate.copyError"),
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>{t("certificate.loading")}</title>
        </Helmet>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (!certificate) {
    return (
      <>
        <Helmet>
          <title>{t("certificate.notFound")}</title>
          <meta name="description" content={t("meta.certificate.notFound")} />
        </Helmet>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("certificate.notFound")}</h1>
          <p className="text-gray-600 mb-8">{t("certificate.notFoundDescription")}</p>
          <Link href="/verify">
            <Button className="bg-primary hover:bg-primary/90">
              {t("common.goToVerification")}
            </Button>
          </Link>
        </div>
      </>
    );
  }

  // Generate URL for QR code scanning
  const certificateUrl = `${getBaseUrl()}/certificate/${certificate.id}`;
  const qrCodeUrl = certificate.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(certificateUrl)}&size=300x300`;

  return (
    <>
      <Helmet>
        <title>{t("certificate.pageTitle", { storeName: certificate.storeName })}</title>
        <meta name="description" content={t("meta.certificate.description", { storeName: certificate.storeName })} />
        <meta property="og:title" content={t("certificate.pageTitle", { storeName: certificate.storeName })} />
        <meta property="og:description" content={t("meta.certificate.description", { storeName: certificate.storeName })} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className={`container mx-auto px-4 py-12 ${isRtl ? 'rtl' : ''}`}>
        <div className="mb-8 flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t("certificate.pageTitle", { storeName: certificate.storeName })}</h1>
            <p className="text-gray-600">{t("certificate.subtitle")}</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t("certificate.print")}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t("certificate.download")}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {t("certificate.share")}
            </Button>
          </div>
        </div>

        <Card className="p-8 border border-gray-200 rounded-lg shadow-md">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* QR Code section */}
            <div className="w-full lg:w-1/3 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4 w-64 h-64 flex items-center justify-center overflow-hidden">
                <img src={qrCodeUrl} alt="Certificate QR Code" className="w-full h-full object-contain" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 mb-2">{t("certificate.scanToVerify")}</p>
                <p className="text-sm text-gray-500">{t("certificate.displayThis")}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 w-full">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                    <span className="text-primary text-xl font-semibold">{t("certificate.validLabel")}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{t("certificate.validityPeriod")}</h3>
                  <p className="text-gray-600">
                    {formatDate(certificate.issuedDate)} - {formatDate(certificate.expiryDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate details section */}
            <div className="w-full lg:w-2/3">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                  <div className="inline-block mb-2">
                    <StatusBadge status={certificate.status} />
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{certificate.storeName}</h2>
                  <p className="text-gray-600">{certificate.storeAddress}</p>
                </div>
                <div className="mt-4 md:mt-0 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">{t("certificate.certificateNumber")}</p>
                  <p className="text-lg font-semibold">{certificate.certificateNumber}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("certificate.details")}</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-gray-500">{t("certificate.issuedDate")}</dt>
                      <dd className="font-medium">{formatDate(certificate.issuedDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t("certificate.expiryDate")}</dt>
                      <dd className="font-medium">{formatDate(certificate.expiryDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t("certificate.status")}</dt>
                      <dd className={`font-medium ${certificate.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {t(`certificate.statuses.${certificate.status}`)}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("certificate.certification")}</h3>
                  <p className="text-gray-600 mb-4">{t("certificate.certificationDescription")}</p>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="font-medium text-primary">
                      {t("certificate.certifiedStatement")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{t("certificate.verification")}</h3>
                <p className="text-gray-600 mb-4">{t("certificate.verificationDescription")}</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>{t("certificate.verificationStep1")}</li>
                  <li>{t("certificate.verificationStep2")}</li>
                  <li>{t("certificate.verificationStep3")}</li>
                </ol>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Certificate;