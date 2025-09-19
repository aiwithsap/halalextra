import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { inspectorApi, queryKeys, handleApiError } from "@/services/api";
import ApplicationQueue from "@/components/dashboard/ApplicationQueue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Calendar, Clock, ClipboardList, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real data from APIs
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: queryKeys.inspectorStats,
    queryFn: inspectorApi.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2
  });

  const { data: assignedApplications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: queryKeys.inspectorAssigned,
    queryFn: inspectorApi.getAssignedApplications,
    refetchInterval: 60000 // Refresh every minute
  });

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Error component
  const ErrorMessage = ({ error, onRetry }: { error: any, onRetry?: () => void }) => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-red-600 mb-2">Error loading data: {handleApiError(error)}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );

  // Process real data or use fallback
  const applicationStatusData = dashboardData?.statusBreakdown || [
    { name: t("inspector.statuses.pending"), value: 0, color: "#FF8F00" },
    { name: t("inspector.statuses.under_review"), value: 0, color: "#00796B" },
    { name: t("inspector.statuses.completed"), value: 0, color: "#2E7D32" },
  ];

  // Generate monthly data based on available applications
  const generateMonthlyData = (applications: any[]) => {
    if (!applications) return [];
    
    const monthCounts = applications.reduce((acc, app) => {
      const date = new Date(app.createdAt || app.assignedAt);
      const month = date.getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: t("common.months.jan"), applications: monthCounts[0] || 0 },
      { name: t("common.months.feb"), applications: monthCounts[1] || 0 },
      { name: t("common.months.mar"), applications: monthCounts[2] || 0 },
      { name: t("common.months.apr"), applications: monthCounts[3] || 0 },
      { name: t("common.months.may"), applications: monthCounts[4] || 0 },
      { name: t("common.months.jun"), applications: monthCounts[5] || 0 },
      { name: t("common.months.jul"), applications: monthCounts[6] || 0 },
      { name: t("common.months.aug"), applications: monthCounts[7] || 0 },
      { name: t("common.months.sep"), applications: monthCounts[8] || 0 },
      { name: t("common.months.oct"), applications: monthCounts[9] || 0 },
      { name: t("common.months.nov"), applications: monthCounts[10] || 0 },
      { name: t("common.months.dec"), applications: monthCounts[11] || 0 },
    ];
  };

  const monthlyApplicationsData = generateMonthlyData(dashboardData?.applications);

  // Stats for summary cards using real data
  const stats = [
    {
      title: t("inspector.stats.pending"),
      value: dashboardData?.stats?.pendingInspections?.toString() || "0",
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      description: t("inspector.stats.pendingDesc"),
    },
    {
      title: t("inspector.stats.underReview"),
      value: dashboardData?.stats?.underReviewInspections?.toString() || "0",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      description: t("inspector.stats.underReviewDesc"),
    },
    {
      title: t("inspector.stats.completed"),
      value: dashboardData?.stats?.completedInspections?.toString() || "0",
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      description: t("inspector.stats.completedDesc"),
    },
    {
      title: t("inspector.stats.total"),
      value: dashboardData?.stats?.totalInspections?.toString() || "0",
      icon: <Clock className="h-6 w-6 text-primary" />,
      description: t("inspector.stats.totalDesc"),
    },
  ];

  // Process recent activity from assigned applications
  const generateRecentActivity = (applications: any[]) => {
    if (!applications) return [];
    
    return applications
      .slice(0, 6) // Get latest 6 activities
      .map((app: any, index: number) => ({
        id: app.id || index,
        action: `${t("inspector.activity.assigned")} inspection for`,
        store: app.businessName || app.storeName || `Application ${app.id}`,
        time: app.assignedAt ? new Date(app.assignedAt).toLocaleDateString() : "Recently",
        status: app.status || "pending",
      }));
  };

  const recentActivity = generateRecentActivity(assignedApplications);

  return (
    <>
      <Helmet>
        <title>{t("inspector.dashboard")}</title>
        <meta name="description" content={t("meta.inspector.dashboard.description")} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className={`mb-8 ${isRtl ? "rtl text-right" : ""}`}>
          <h1 className="text-3xl font-bold text-gray-800">
            {t("inspector.welcomeMessage", { name: user?.username || "" })}
          </h1>
          <p className="text-gray-600 mt-1">{t("inspector.dashboardDescription")}</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="overview">{t("inspector.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="applications">{t("inspector.tabs.applications")}</TabsTrigger>
            <TabsTrigger value="activity">{t("inspector.tabs.activity")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isDashboardLoading ? (
              <LoadingSpinner />
            ) : dashboardError ? (
              <ErrorMessage error={dashboardError} onRetry={refetchDashboard} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                          </div>
                          <div className="p-2 bg-primary/10 rounded-full">{stat.icon}</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("inspector.charts.monthlyApplications")}</CardTitle>
                  <CardDescription>{t("inspector.charts.monthlyApplicationsDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyApplicationsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="applications" fill="#00796B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("inspector.charts.applicationStatus")}</CardTitle>
                  <CardDescription>{t("inspector.charts.applicationStatusDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
                </div>

                <ApplicationQueue />
              </>
            )}
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationQueue />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>{t("inspector.recentActivity")}</CardTitle>
                <CardDescription>{t("inspector.recentActivityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className={`${
                        activity.status === "approved" ? "bg-green-100 text-success" :
                        activity.status === "rejected" ? "bg-red-100 text-destructive" :
                        activity.status === "under_review" ? "bg-primary-100 text-primary-700" :
                        "bg-yellow-100 text-warning"
                      } p-2 rounded-full`}>
                        {activity.status === "approved" ? <CheckCircle className="h-5 w-5" /> :
                         activity.status === "rejected" ? <XCircle className="h-5 w-5" /> :
                         activity.status === "under_review" ? <ClipboardList className="h-5 w-5" /> :
                         <Calendar className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.action} <span className="font-bold">{activity.store}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Dashboard;
