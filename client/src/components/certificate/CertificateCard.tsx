import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Share2, FileText, MessageSquare } from "lucide-react";

interface CertificateProps {
  certificate: {
    id: string;
    storeName: string;
    storeAddress: string;
    status: string;
    certificateNumber: string;
    issuedDate: string;
    expiryDate: string;
  };
}

const CertificateCard: React.FC<CertificateProps> = ({ certificate }) => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="border border-gray-200 shadow-md">
      <CardContent className="p-6">
        <div className={`flex flex-col md:flex-row gap-6 ${isRtl ? 'rtl' : ''}`}>
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="bg-accent-light p-4 rounded-lg">
              {/* QR code */}
              <div className="bg-white p-1 border border-gray-200 rounded">
                <div className="w-32 h-32 bg-[url('https://pixabay.com/get/g5245146a8d136d99f1b5266c682a21bfcb29720cb3c41b9180b23859792401339491c038c7e7e00f89c7e6ab109ae991c7c6638aad588ca844e8b7d70efb32d2_1280.jpg')] bg-cover bg-center rounded">
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{certificate.storeName}</h3>
                <p className="text-gray-600">{certificate.storeAddress}</p>
              </div>
              <StatusBadge status={certificate.status} />
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("certificate.certificateNumber")}</p>
                <p className="font-medium">{certificate.certificateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("certificate.status")}</p>
                <p className={`font-medium ${certificate.status === 'active' ? 'text-success' : 'text-error'}`}>
                  {t(`certificate.statuses.${certificate.status}`)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("certificate.issuedDate")}</p>
                <p className="font-medium">{formatDate(certificate.issuedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("certificate.expiryDate")}</p>
                <p className="font-medium">{formatDate(certificate.expiryDate)}</p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/certificate/${certificate.id}`}>
                <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                  <FileText className="h-4 w-4 mr-1" /> {t("certificate.viewDetails")}
                </Button>
              </Link>
              <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                <MessageSquare className="h-4 w-4 mr-1" /> {t("certificate.submitFeedback")}
              </Button>
              <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                <Share2 className="h-4 w-4 mr-1" /> {t("certificate.share")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
