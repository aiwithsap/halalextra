import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { adminApi, queryKeys, handleApiError } from "@/services/api";
import ApplicationQueue from "@/components/dashboard/ApplicationQueue";
import CertificateList from "@/components/dashboard/CertificateList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  LineChart,
  Line,
} from "recharts";
import { Link } from "wouter";
import { 
  ClipboardList, 
  Users, 
  MessageSquare, 
  IdCard, 
  ShieldAlert, 
  Clock,
  ArrowUpRight,
  Loader2,
  RefreshCw 
} from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real data from APIs
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2
  });

  const { data: pendingFeedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: queryKeys.adminPendingFeedback,
    queryFn: adminApi.getPendingFeedback,
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
    { name: t("inspector.statuses.approved"), value: 0, color: "#2E7D32" },
    { name: t("inspector.statuses.rejected"), value: 0, color: "#C62828" },
  ];

  // For now, use static data for certificates - would be replaced with real API data
  const certificateStatusData = [
    { name: t("certificate.statuses.active"), value: dashboardData?.stats?.activeCertificates || 0, color: "#2E7D32" },
    { name: t("certificate.statuses.expired"), value: 45, color: "#FF8F00" },
    { name: t("certificate.statuses.revoked"), value: 12, color: "#C62828" },
  ];

  // Generate monthly data based on available applications
  const generateMonthlyData = (applications: any[]) => {
    if (!applications) return [];
    
    const monthCounts = applications.reduce((acc, app) => {
      const date = new Date(app.createdAt || app.submissionDate);
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

  // Static certificate renewal data for now (would be replaced with real API)
  const certificateRenewalData = [
    { name: t("common.months.jan"), count: 3 },
    { name: t("common.months.feb"), count: 5 },
    { name: t("common.months.mar"), count: 8 },
    { name: t("common.months.apr"), count: 4 },
    { name: t("common.months.may"), count: 6 },
    { name: t("common.months.jun"), count: 12 },
    { name: t("common.months.jul"), count: 9 },
    { name: t("common.months.aug"), count: 7 },
    { name: t("common.months.sep"), count: 10 },
    { name: t("common.months.oct"), count: 8 },
    { name: t("common.months.nov"), count: 5 },
    { name: t("common.months.dec"), count: 4 },
  ];

  // Stats for summary cards using real data
  const stats = [
    {
      title: t("dashboard.admin.stats.applications"),
      value: dashboardData?.stats?.totalApplications?.toString() || "0",
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      change: "+12%", // Would calculate from historical data
      changeUp: true,
    },
    {
      title: t("dashboard.admin.stats.activeCertificates"),
      value: dashboardData?.stats?.activeCertificates?.toString() || "0",
      icon: <IdCard className="h-6 w-6 text-success" />,
      change: "+5%", // Would calculate from historical data
      changeUp: true,
    },
    {
      title: t("dashboard.admin.stats.pendingFeedback"),
      value: pendingFeedback?.length?.toString() || "0",
      icon: <MessageSquare className="h-6 w-6 text-warning" />,
      change: "-23%", // Would calculate from historical data
      changeUp: false,
    },
    {
      title: t("dashboard.admin.stats.inspectors"),
      value: "8", // Would come from users API
      icon: <Users className="h-6 w-6 text-primary" />,
      change: "0%",
      changeUp: null,
    },
  ];

  // Create alerts based on real data
  const pendingCount = dashboardData?.stats?.pendingApplications || 0;
  const feedbackCount = pendingFeedback?.length || 0;
  
  const alerts = [
    {
      id: 1,
      title: t("dashboard.admin.alerts.expiringCertificates"),
      description: t("dashboard.admin.alerts.expiringCertificatesDesc", { count: 12 }),
      icon: <Clock className="h-5 w-5 text-warning" />,
      color: "bg-warning/10 text-warning",
    },
    {
      id: 2,
      title: t("dashboard.admin.alerts.pendingFeedback"),
      description: t("dashboard.admin.alerts.pendingFeedbackDesc", { count: feedbackCount }),
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      color: "bg-primary/10 text-primary",
      action: "/admin/feedback",
      actionText: t("dashboard.admin.alerts.moderateNow"),
    },
    {
      id: 3,
      title: t("dashboard.admin.alerts.securityAlert"),
      description: t("dashboard.admin.alerts.securityAlertDesc"),
      icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t("dashboard.admin.title")}</title>
        <meta name="description" content={t("dashboard.admin.description")} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className={`mb-8 ${isRtl ? "rtl text-right" : ""}`}>
          <h1 className="text-3xl font-bold text-gray-800">
            {t("dashboard.admin.welcomeMessage", { name: user?.username || "" })}
          </h1>
          <p className="text-gray-600 mt-1">{t("dashboard.admin.dashboardDescription")}</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-4 max-w-lg">
            <TabsTrigger value="overview">{t("dashboard.admin.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="applications">{t("dashboard.admin.tabs.applications")}</TabsTrigger>
            <TabsTrigger value="certificates">{t("dashboard.admin.tabs.certificates")}</TabsTrigger>
            <TabsTrigger value="users">{t("dashboard.admin.tabs.users")}</TabsTrigger>
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
                        {stat.change && (
                          <div className="flex items-center mt-2">
                            <span className={`text-xs ${stat.changeUp === true ? 'text-success' : stat.changeUp === false ? 'text-destructive' : 'text-gray-500'}`}>
                              {stat.change} {stat.changeUp !== null && (stat.changeUp ? '↑' : '↓')}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{t("dashboard.admin.stats.fromLastMonth")}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("dashboard.admin.charts.applicationVsCertification")}</CardTitle>
                  <CardDescription>{t("dashboard.admin.charts.applicationVsCertificationDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyApplicationsData.map((item, index) => ({
                          ...item,
                          certifications: certificateRenewalData[index].count
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="applications"
                          stroke="#00796B"
                          activeDot={{ r: 8 }}
                          name={t("dashboard.admin.charts.applications")}
                        />
                        <Line
                          type="monotone"
                          dataKey="certifications"
                          stroke="#D4AF37"
                          name={t("dashboard.admin.charts.certifications")}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.admin.alerts.title")}</CardTitle>
                  <CardDescription>{t("dashboard.admin.alerts.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg ${alert.color} flex items-start space-x-3`}>
                        <div className="mt-0.5">{alert.icon}</div>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm mt-1">{alert.description}</p>
                          {alert.action && (
                            <Link href={alert.action}>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto mt-2 font-medium"
                              >
                                {alert.actionText} <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.admin.charts.applicationStatus")}</CardTitle>
                  <CardDescription>{t("dashboard.admin.charts.applicationStatusDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
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

              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.admin.charts.certificateStatus")}</CardTitle>
                  <CardDescription>{t("dashboard.admin.charts.certificateStatusDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={certificateStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {certificateStatusData.map((entry, index) => (
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
            
                <Card>
                  <CardHeader>
                    <CardTitle>{t("dashboard.admin.feedback.title")}</CardTitle>
                    <CardDescription>{t("dashboard.admin.feedback.description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isFeedbackLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg">
                          <h3 className="font-medium flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                            {t("dashboard.admin.feedback.pendingModeration", { count: feedbackCount })}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{t("dashboard.admin.feedback.pendingModerationDesc")}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href="/admin/feedback">
                      <Button className="w-full">
                        {t("dashboard.admin.feedback.moderateButton")}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationQueue />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificateList />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.admin.users.title")}</CardTitle>
                <CardDescription>{t("dashboard.admin.users.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">{t("dashboard.admin.users.comingSoon")}</p>
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
