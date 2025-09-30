import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, XCircle, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

/**
 * BUG FIX #2: Admin Application Detail Component
 *
 * This component displays detailed information about a specific application
 * and allows admins to manage the application lifecycle including:
 * - View business and operational details
 * - Review uploaded documents
 * - Assign inspectors
 * - Approve or reject applications
 */
const ApplicationDetail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const applicationId = parseInt(params.id as string);

  const [selectedInspector, setSelectedInspector] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [currentTab, setCurrentTab] = useState<string>("details");

  // Get tab from URL query params - use useMemo to ensure proper re-rendering
  const activeTab = useMemo(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    return urlParams.get('tab') || 'details';
  }, [location]);

  // Sync currentTab state with URL changes
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  // Fetch application details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/applications/${applicationId}`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    }
  });

  // Fetch available inspectors
  const { data: inspectorsData } = useQuery({
    queryKey: ['/api/admin/inspectors'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inspectors', {
        credentials: 'include'
      });
      if (!response.ok) return { inspectors: [] };
      return response.json();
    }
  });

  const inspectors = inspectorsData?.inspectors || [];

  // Assign inspector mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/applications/${applicationId}/assign`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ inspectorId: parseInt(selectedInspector) })
      });
      if (!response.ok) throw new Error("Failed to assign inspector");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inspector Assigned",
        description: "The inspector has been assigned to this application.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ status: decision, notes })
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: `Application has been ${decision}.`,
        variant: decision === "approved" ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}`] });
      setDecision("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
              <p className="text-gray-500 mb-4">The application you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, store, inspections } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{store.name}</h1>
            <p className="text-gray-600">{store.address}, {store.city}, {store.state} {store.postcode}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={(tab) => {
        setCurrentTab(tab);
        setLocation(`/admin/application/${applicationId}?tab=${tab}`);
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="inspection">Inspection</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>ABN:</strong> {store.abn}</div>
                <div><strong>Type:</strong> {store.businessType}</div>
                <div><strong>Established:</strong> {store.established}</div>
                <div><strong>Owner:</strong> {store.ownerName}</div>
                <div><strong>Email:</strong> {store.ownerEmail}</div>
                <div><strong>Phone:</strong> {store.ownerPhone}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Employees:</strong> {application.employeeCount}</div>
                <div><strong>Hours:</strong> {application.operatingHours}</div>
                <div><strong>Products:</strong> {application.products?.join(", ")}</div>
                <div>
                  <strong>Suppliers:</strong>
                  <ul className="mt-1 ml-4">
                    {application.suppliers?.map((s: any, i: number) => (
                      <li key={i} className="text-sm">
                        {s.name} - {s.material} {s.certified && <Badge variant="outline" className="ml-1">Certified</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Review all submitted documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.businessLicenseUrl && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="flex items-center"><FileText className="h-4 w-4 mr-2" /> Business License</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/documents/${application.id}/business-license`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                )}
                {application.floorPlanUrl && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="flex items-center"><FileText className="h-4 w-4 mr-2" /> Floor Plan</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/documents/${application.id}/floor-plan`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                )}
                {application.supplierCertificatesUrl && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="flex items-center"><FileText className="h-4 w-4 mr-2" /> Supplier Certificates</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/documents/${application.id}/supplier-certificates`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspection" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
              <CardDescription>Assign inspector and track inspection progress</CardDescription>
            </CardHeader>
            <CardContent>
              {inspections && inspections.length > 0 ? (
                <div className="space-y-4">
                  {inspections.map((inspection: any) => (
                    <div key={inspection.id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p><strong>Inspector ID:</strong> {inspection.inspectorId}</p>
                          <p><strong>Status:</strong> <StatusBadge status={inspection.status} /></p>
                          {inspection.visitDate && (
                            <p><strong>Visit Date:</strong> {format(new Date(inspection.visitDate), 'PPP')}</p>
                          )}
                        </div>
                        {inspection.decision && (
                          <Badge variant={inspection.decision === 'approved' ? 'default' : 'destructive'}>
                            {inspection.decision}
                          </Badge>
                        )}
                      </div>
                      {inspection.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{inspection.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No inspector assigned yet</p>
                  <div className="mt-4 max-w-xs mx-auto">
                    <Select value={selectedInspector} onValueChange={setSelectedInspector}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an inspector" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectors?.map((inspector: any) => (
                          <SelectItem key={inspector.id} value={inspector.id.toString()}>
                            {inspector.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full mt-2"
                      onClick={() => assignMutation.mutate()}
                      disabled={!selectedInspector || assignMutation.isPending}
                    >
                      {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Assign Inspector
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Application</CardTitle>
              <CardDescription>Approve or reject this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Decision</label>
                <Select value={decision} onValueChange={(v) => setDecision(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  placeholder="Add any notes or reasons for your decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={() => updateStatusMutation.mutate()}
                disabled={!decision || updateStatusMutation.isPending}
                variant={decision === "approved" ? "default" : "destructive"}
                className="w-full"
              >
                {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {decision === "approved" ? "Approve Application" : decision === "rejected" ? "Reject Application" : "Select Decision"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationDetail;