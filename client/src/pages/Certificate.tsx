import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CertificateCard from "@/components/certificate/CertificateCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import GeometricPattern from "@/components/shared/GeometricPattern";

interface Certificate {
  id: string;
  storeName: string;
  storeAddress: string;
  status: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
}

const Certificate = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"review" | "complaint">("review");
  const [feedback, setFeedback] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/certificates/${id}`);
        
        if (!response.ok) {
          throw new Error(response.statusText || "Failed to fetch certificate");
        }
        
        const data = await response.json();
        
        if (data.certificate) {
          setCertificate(data.certificate);
        } else {
          setError(t("certificate.notFound"));
        }
      } catch (error: any) {
        console.error("Error fetching certificate:", error);
        setError(error.message || t("certificate.fetchError"));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCertificate();
    }
  }, [id, t]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: t("feedback.error"),
        description: t("feedback.emptyFeedback"),
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get store ID from certificate
      const storeId = certificate?.id;
      
      await apiRequest("POST", "/api/feedback", {
        storeId,
        authorName: authorName || null,
        authorEmail: authorEmail || null,
        content: feedback,
        type: feedbackType
      });
      
      toast({
        title: t("feedback.success"),
        description: t("feedback.successMessage"),
      });
      
      // Reset form
      setFeedback("");
      setFeedbackType("review");
      setIsFeedbackOpen(false);
    } catch (error) {
      toast({
        title: t("feedback.error"),
        description: t("feedback.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{certificate ? `${certificate.storeName} - ${t("certificate.certificate")}` : t("certificate.title")}</title>
        <meta name="description" content={t("meta.certificate.description")} />
        <meta property="og:title" content={certificate ? `${certificate.storeName} - ${t("certificate.certificate")}` : t("certificate.title")} />
        <meta property="og:description" content={t("meta.certificate.description")} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative bg-primary overflow-hidden py-16 md:py-24">
        <GeometricPattern className="absolute inset-0 opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("certificate.title")}</h1>
            <p className="text-xl text-primary-100">{t("certificate.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className={`max-w-4xl mx-auto ${isRtl ? "rtl" : ""}`}>
          <Link href="/verify">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
              <h2 className="text-xl font-bold mb-2">{t("certificate.error")}</h2>
              <p>{error}</p>
              <Link href="/verify">
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  {t("certificate.tryAgain")}
                </Button>
              </Link>
            </div>
          ) : certificate ? (
            <div className="space-y-8">
              <CertificateCard certificate={certificate} />
              
              <div className="flex justify-center mt-8">
                <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("certificate.submitFeedback")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleSubmitFeedback}>
                      <DialogHeader>
                        <DialogTitle>{t("feedback.title")}</DialogTitle>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="feedback-type">{t("feedback.type")}</Label>
                          <div className="flex space-x-4">
                            <Label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                value="review"
                                checked={feedbackType === "review"}
                                onChange={() => setFeedbackType("review")}
                                className="w-4 h-4 text-primary"
                              />
                              <span>{t("feedback.review")}</span>
                            </Label>
                            <Label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                value="complaint"
                                checked={feedbackType === "complaint"}
                                onChange={() => setFeedbackType("complaint")}
                                className="w-4 h-4 text-primary"
                              />
                              <span>{t("feedback.complaint")}</span>
                            </Label>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="feedback">{t("feedback.content")}</Label>
                          <Textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={feedbackType === "review" ? t("feedback.reviewPlaceholder") : t("feedback.complaintPlaceholder")}
                            className="resize-none"
                            rows={5}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="author-name">{t("feedback.name")} ({t("common.optional")})</Label>
                          <input
                            id="author-name"
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="author-email">{t("feedback.email")} ({t("common.optional")})</Label>
                          <input
                            id="author-email"
                            type="email"
                            value={authorEmail}
                            onChange={(e) => setAuthorEmail(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          {t("feedback.moderation")}
                        </p>
                      </div>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsFeedbackOpen(false)}>
                          {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("common.submitting")}
                            </>
                          ) : (
                            t("common.submit")
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-8 rounded-lg text-center">
              <h2 className="text-xl font-bold mb-2">{t("certificate.notFound")}</h2>
              <p>{t("certificate.notFoundMessage")}</p>
              <Link href="/verify">
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  {t("certificate.searchAgain")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Certificate;
