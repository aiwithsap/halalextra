import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import ApplicationQueue from "@/components/dashboard/ApplicationQueue";
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
  ArrowUpRight 
} from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Sample data for charts (in a real app, this would come from the API)
  const applicationStatusData = [
    { name: t("inspector.statuses.pending"), value: 12, color: "#FF8F00" },
    { name: t("inspector.statuses.under_review"), value: 8, color: "#00796B" },
    { name: t("inspector.statuses.approved"), value: 24, color: "#2E7D32" },
    { name: t("inspector.statuses.rejected"), value: 4, color: "#C62828" },
  ];

  const certificateStatusData = [
    { name: t("certificate.statuses.active"), value: 128, color: "#2E7D32" },
    { name: t("certificate.statuses.expired"), value: 45, color: "#FF8F00" },
    { name: t("certificate.statuses.revoked"), value: 12, color: "#C62828" },
  ];

  const monthlyApplicationsData = [
    { name: t("common.months.jan"), applications: 5 },
    { name: t("common.months.feb"), applications: 8 },
    { name: t("common.months.mar"), applications: 12 },
    { name: t("common.months.apr"), applications: 10 },
    { name: t("common.months.may"), applications: 15 },
    { name: t("common.months.jun"), applications: 18 },
    { name: t("common.months.jul"), applications: 14 },
    { name: t("common.months.aug"), applications: 12 },
    { name: t("common.months.sep"), applications: 9 },
    { name: t("common.months.oct"), applications: 16 },
    { name: t("common.months.nov"), applications: 11 },
    { name: t("common.months.dec"), applications: 7 },
  ];

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

  // Stats for summary cards
  const stats = [
    {
      title: t("admin.stats.applications"),
      value: "48",
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      change: "+12%",
      changeUp: true,
    },
    {
      title: t("admin.stats.activeCertificates"),
      value: "128",
      icon: <IdCard className="h-6 w-6 text-success" />,
      change: "+5%",
      changeUp: true,
    },
    {
      title: t("admin.stats.pendingFeedback"),
      value: "15",
      icon: <MessageSquare className="h-6 w-6 text-warning" />,
      change: "-23%",
      changeUp: false,
    },
    {
      title: t("admin.stats.inspectors"),
      value: "8",
      icon: <Users className="h-6 w-6 text-primary" />,
      change: "0%",
      changeUp: null,
    },
  ];

  const alerts = [
    {
      id: 1,
      title: t("admin.alerts.expiringCertificates"),
      description: t("admin.alerts.expiringCertificatesDesc", { count: 12 }),
      icon: <Clock className="h-5 w-5 text-warning" />,
      color: "bg-warning/10 text-warning",
    },
    {
      id: 2,
      title: t("admin.alerts.pendingFeedback"),
      description: t("admin.alerts.pendingFeedbackDesc", { count: 15 }),
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      color: "bg-primary/10 text-primary",
      action: "/admin/feedback",
      actionText: t("admin.alerts.moderateNow"),
    },
    {
      id: 3,
      title: t("admin.alerts.securityAlert"),
      description: t("admin.alerts.securityAlertDesc"),
      icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t("admin.dashboard")}</title>
        <meta name="description" content={t("meta.admin.dashboard.description")} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className={`mb-8 ${isRtl ? "rtl text-right" : ""}`}>
          <h1 className="text-3xl font-bold text-gray-800">
            {t("admin.welcomeMessage", { name: user?.username || "" })}
          </h1>
          <p className="text-gray-600 mt-1">{t("admin.dashboardDescription")}</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-4 max-w-lg">
            <TabsTrigger value="overview">{t("admin.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="applications">{t("admin.tabs.applications")}</TabsTrigger>
            <TabsTrigger value="certificates">{t("admin.tabs.certificates")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.tabs.users")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                        <span className="text-xs text-gray-500 ml-1">{t("admin.stats.fromLastMonth")}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("admin.charts.applicationVsCertification")}</CardTitle>
                  <CardDescription>{t("admin.charts.applicationVsCertificationDesc")}</CardDescription>
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
                          name={t("admin.charts.applications")}
                        />
                        <Line
                          type="monotone"
                          dataKey="certifications"
                          stroke="#D4AF37"
                          name={t("admin.charts.certifications")}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.alerts.title")}</CardTitle>
                  <CardDescription>{t("admin.alerts.description")}</CardDescription>
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
                  <CardTitle>{t("admin.charts.applicationStatus")}</CardTitle>
                  <CardDescription>{t("admin.charts.applicationStatusDesc")}</CardDescription>
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
                  <CardTitle>{t("admin.charts.certificateStatus")}</CardTitle>
                  <CardDescription>{t("admin.charts.certificateStatusDesc")}</CardDescription>
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
                <CardTitle>{t("admin.feedback.title")}</CardTitle>
                <CardDescription>{t("admin.feedback.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-medium flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                      {t("admin.feedback.pendingModeration", { count: 15 })}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{t("admin.feedback.pendingModerationDesc")}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/feedback">
                  <Button className="w-full">
                    {t("admin.feedback.moderateButton")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationQueue />
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.certificates.title")}</CardTitle>
                <CardDescription>{t("admin.certificates.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">{t("admin.certificates.comingSoon")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.users.title")}</CardTitle>
                <CardDescription>{t("admin.users.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500">{t("admin.users.comingSoon")}</p>
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
