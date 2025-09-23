import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Application {
  id: number;
  status: string;
  createdAt: string;
  store: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
  };
}

const ApplicationQueue = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      
      return response.json();
    }
  });
  
  const applications = data?.applications || [];
  
  // Filter applications based on status
  const filteredApplications = statusFilter === "all" 
    ? applications 
    : applications.filter((app: Application) => app.status === statusFilter);

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <div className="text-destructive text-lg mb-2">
              <i className="ri-error-warning-line text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("inspector.errorTitle")}</h3>
            <p className="text-gray-500">{t("inspector.errorDescription")}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> {t("common.retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {user?.role === 'admin' ? t("dashboard.admin.tabs.applications") : t("inspector.applicationQueue")}
        </CardTitle>
        <div className="flex space-x-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("inspector.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("inspector.allStatus")}</SelectItem>
              <SelectItem value="pending">{t("certificate.statuses.pending")}</SelectItem>
              <SelectItem value="under_review">{t("certificate.statuses.under_review")}</SelectItem>
              {user?.role === 'admin' && (
                <>
                  <SelectItem value="approved">{t("certificate.statuses.approved")}</SelectItem>
                  <SelectItem value="rejected">{t("certificate.statuses.rejected")}</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <Skeleton className="h-4 w-36" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-400 mb-4">
              <i className="ri-file-list-3-line text-5xl"></i>
            </div>
            <h3 className="text-lg font-semibold">{t("inspector.noApplications")}</h3>
            <p className="text-gray-500">{t("inspector.checkBackLater")}</p>
          </div>
        ) : (
          <div className={`divide-y divide-gray-200 ${isRtl ? "rtl" : ""}`}>
            {filteredApplications.map((application: Application) => (
              <div 
                key={application.id} 
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{application.store.name}</h5>
                    <p className="text-sm text-gray-500">
                      {application.store.address}, {application.store.city}, {application.store.state} {application.store.postcode}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {t("inspector.applied")}: {format(new Date(application.createdAt), "dd MMM yyyy")}
                  </span>
                  <div className="flex space-x-2">
                    <Link href={user?.role === 'admin' ? `/admin/application/${application.id}` : `/inspector/application/${application.id}`}>
                      <Button variant="outline" size="sm" className="h-8">
                        <Eye className="h-4 w-4 mr-1" /> {t("common.view")}
                      </Button>
                    </Link>
                    {user?.role === 'admin' ? (
                      <Link href={`/admin/application/${application.id}?tab=manage`}>
                        <Button variant="outline" size="sm" className="h-8">
                          <Calendar className="h-4 w-4 mr-1" /> {t("common.edit")}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/inspector/application/${application.id}?tab=schedule`}>
                        <Button variant="outline" size="sm" className="h-8">
                          <Calendar className="h-4 w-4 mr-1" /> {t("inspector.schedule")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationQueue;
