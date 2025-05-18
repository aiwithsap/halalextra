import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Calendar, Check, X, RefreshCw, Printer } from "lucide-react";

const InspectorDashboardPreview = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("inspector.dashboardTitle")}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto">
            {t("inspector.dashboardDescription")}
          </p>
        </div>
        
        <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
          {/* Dashboard Navigation */}
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <i className="ri-dashboard-line text-xl"></i>
              <h3 className="font-bold">{t("inspector.dashboardHeading")}</h3>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-white hover:text-primary-100">
                <i className="ri-notification-3-line text-xl"></i>
              </a>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-8 h-8 bg-primary-700 rounded-full overflow-hidden">
                  <i className="ri-user-line text-xl flex items-center justify-center h-full"></i>
                </span>
                <span className="font-medium">Ahmed K.</span>
              </div>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="p-6">
            {/* Restaurant inspection image */}
            <div className="relative rounded-lg overflow-hidden mb-6 h-56">
              <img 
                src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80" 
                alt={t("inspector.inspectionImageAlt")} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h4 className="font-bold text-xl">{t("inspector.applicationQueue")}</h4>
                  <p>{t("inspector.pendingApplications", { count: 8 })}</p>
                </div>
              </div>
            </div>
            
            {/* Application List */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="font-semibold">{t("inspector.recentApplications")}</h4>
                <div className="flex space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="text-sm border border-gray-300 rounded-md h-9 w-[120px]">
                      <SelectValue placeholder={t("inspector.allStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("inspector.allStatus")}</SelectItem>
                      <SelectItem value="pending">{t("certificate.statuses.pending")}</SelectItem>
                      <SelectItem value="under_review">{t("certificate.statuses.under_review")}</SelectItem>
                      <SelectItem value="approved">{t("certificate.statuses.approved")}</SelectItem>
                      <SelectItem value="rejected">{t("certificate.statuses.rejected")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-9 w-9 p-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {/* Application 1 */}
                <div className={`p-4 hover:bg-gray-50 transition-colors ${isRtl ? "rtl" : ""}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">Al Barakah Bakery</h5>
                      <p className="text-sm text-gray-500">45 Park Street, Melbourne VIC 3000</p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{t("inspector.applied")}: 24 May 2023</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80">
                        <Eye className="h-4 w-4 mr-1" /> {t("common.view")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80">
                        <Calendar className="h-4 w-4 mr-1" /> {t("inspector.schedule")}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Application 2 */}
                <div className={`p-4 hover:bg-gray-50 transition-colors ${isRtl ? "rtl" : ""}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">Saffron House Restaurant</h5>
                      <p className="text-sm text-gray-500">12 Queen Street, Sydney NSW 2000</p>
                    </div>
                    <StatusBadge status="under_review" />
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{t("inspector.inspectionDate")}: 27 May 2023</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80">
                        <Eye className="h-4 w-4 mr-1" /> {t("common.view")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-success hover:text-success/80">
                        <Check className="h-4 w-4 mr-1" /> {t("inspector.approve")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive/80">
                        <X className="h-4 w-4 mr-1" /> {t("inspector.reject")}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Application 3 */}
                <div className={`p-4 hover:bg-gray-50 transition-colors ${isRtl ? "rtl" : ""}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">Noor Halal Meats</h5>
                      <p className="text-sm text-gray-500">78 King Street, Perth WA 6000</p>
                    </div>
                    <StatusBadge status="approved" />
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{t("inspector.approved")}: 20 May 2023</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80">
                        <Eye className="h-4 w-4 mr-1" /> {t("inspector.details")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80">
                        <Printer className="h-4 w-4 mr-1" /> {t("inspector.certificate")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-center">
                <Button variant="link" className="text-primary hover:text-primary/80 font-medium">
                  {t("inspector.viewAllApplications")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InspectorDashboardPreview;
