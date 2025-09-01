import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";
import InspectionDetail from "@/components/dashboard/InspectionDetail";
import { ArrowLeft, FileText, Calendar, ClipboardCheck, Building2, User } from "lucide-react";

const ApplicationDetail = () => {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  
  // Parse the active tab from the URL if present, otherwise default to "details"
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialTab = searchParams.get('tab') || "details";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newSearch = new URLSearchParams();
    newSearch.set('tab', value);
    setLocation(`/inspector/application/${id}?${newSearch.toString()}`);
  };
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [`/api/applications/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">{t("inspector.applicationError")}</h2>
          <p>{(error as Error).message || t("inspector.applicationErrorDesc")}</p>
          <div className="mt-4 flex justify-center space-x-4">
            <Link href="/inspector/dashboard">
              <Button variant="outline">{t("common.back")}</Button>
            </Link>
            <Button onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { application, store, inspections } = data;

  return (
    <>
      <Helmet>
        <title>{t("inspector.applicationDetails", { store: store.name })}</title>
        <meta name="description" content={t("meta.inspector.application.description")} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className={`mb-6 ${isRtl ? "rtl" : ""}`}>
          <Link href="/inspector/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{store.name}</h1>
              <p className="text-gray-600">{store.address}, {store.city}, {store.state} {store.postcode}</p>
            </div>
            <StatusBadge 
              status={application.status} 
              className="self-start md:self-center"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" /> {t("inspector.tabs.details")}
            </TabsTrigger>
            <TabsTrigger value="inspection">
              <ClipboardCheck className="h-4 w-4 mr-2" /> {t("inspector.tabs.inspection")}
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" /> {t("inspector.tabs.schedule")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className={`space-y-6 ${isRtl ? "rtl" : ""}`}>
            <Card>
              <CardHeader>
                <CardTitle>{t("inspector.businessInformation")}</CardTitle>
                <CardDescription>
                  {t("inspector.businessInformationDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-primary" />
                      {t("inspector.businessDetails")}
                    </h3>
                    <div className="space-y-3 mt-3">
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.businessName")}</p>
                        <p className="font-medium">{store.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.businessType")}</p>
                        <p className="font-medium">{t(`apply.businessTypes.${store.businessType}`)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.abn")}</p>
                        <p className="font-medium">{store.abn}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.established")}</p>
                        <p className="font-medium">{store.established || t("common.notProvided")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.address")}</p>
                        <p className="font-medium">{store.address}, {store.city}, {store.state} {store.postcode}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg flex items-center">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      {t("inspector.contactInformation")}
                    </h3>
                    <div className="space-y-3 mt-3">
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.ownerName")}</p>
                        <p className="font-medium">{store.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.ownerEmail")}</p>
                        <p className="font-medium">{store.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.ownerPhone")}</p>
                        <p className="font-medium">{store.ownerPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("apply.applicationDate")}</p>
                        <p className="font-medium">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-3">{t("apply.products")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {application.products.map((product: string, index: number) => (
                        <span 
                          key={index} 
                          className="bg-primary-50 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg mb-3">{t("apply.suppliers")}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {application.suppliers.map((supplier: any, index: number) => (
                        <div 
                          key={index}
                          className="bg-gray-50 p-3 rounded-md border border-gray-100"
                        >
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-gray-600">{supplier.material}</p>
                          <div className="mt-1">
                            {supplier.certified ? (
                              <span className="text-xs bg-green-50 text-success px-2 py-1 rounded-full">
                                {t("apply.certified")}
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {t("apply.notCertified")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-lg mb-3">{t("apply.employeeCount")}</h3>
                      <p>{application.employeeCount}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-3">{t("apply.operatingHours")}</h3>
                      <p>{application.operatingHours}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-medium text-lg mb-3">{t("inspector.documents")}</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {application.businessLicenseUrl && (
                      <AccordionItem value="license">
                        <AccordionTrigger>{t("apply.businessLicense")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-600 mb-2">{t("inspector.documentDesc")}</p>
                            <a 
                              href={application.businessLicenseUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {t("inspector.viewDocument")}
                            </a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {application.floorPlanUrl && (
                      <AccordionItem value="floorplan">
                        <AccordionTrigger>{t("apply.floorPlan")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-600 mb-2">{t("inspector.documentDesc")}</p>
                            <a 
                              href={application.floorPlanUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {t("inspector.viewDocument")}
                            </a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {application.supplierCertificatesUrl && (
                      <AccordionItem value="suppliers">
                        <AccordionTrigger>{t("apply.supplierCertificates")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-600 mb-2">{t("inspector.documentDesc")}</p>
                            <a 
                              href={application.supplierCertificatesUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {t("inspector.viewDocument")}
                            </a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {application.additionalDocumentsUrl && (
                      <AccordionItem value="additional">
                        <AccordionTrigger>{t("apply.additionalDocuments")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-600 mb-2">{t("inspector.documentDesc")}</p>
                            <a 
                              href={application.additionalDocumentsUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {t("inspector.viewDocument")}
                            </a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspection">
            <InspectionDetail 
              applicationId={application.id} 
              inspections={inspections || []}
              refetchApplication={refetch}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <InspectionDetail 
              applicationId={application.id} 
              inspections={inspections || []}
              refetchApplication={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ApplicationDetail;
