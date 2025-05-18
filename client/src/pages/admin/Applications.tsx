import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { ClipboardList, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Application, Store } from "@shared/schema";

// Type for application with store data
interface ApplicationWithStore extends Application {
  store: Store;
}

export default function Applications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedApplications, setExpandedApplications] = useState<number[]>([]);
  const [rejectionNotes, setRejectionNotes] = useState<string>("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);

  // Fetch pending applications
  const { data, isLoading, error } = useQuery<ApplicationWithStore[]>({
    queryKey: ['/api/admin/applications/pending'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const applications = data || [];

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return apiRequest(`/api/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications/pending'] });
      toast({
        title: "Application approved",
        description: "The application has been approved and a certificate has been issued.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error approving application",
        description: error.message || "An error occurred while approving the application.",
        variant: "destructive",
      });
    }
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, notes }: { applicationId: number, notes: string }) => {
      return apiRequest(`/api/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected', notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications/pending'] });
      toast({
        title: "Application rejected",
        description: "The application has been rejected and the store has been notified.",
      });
      setRejectionNotes("");
      setSelectedApplicationId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error rejecting application",
        description: error.message || "An error occurred while rejecting the application.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (applicationId: number) => {
    approveMutation.mutate(applicationId);
  };

  const handleReject = () => {
    if (selectedApplicationId) {
      rejectMutation.mutate({ applicationId: selectedApplicationId, notes: rejectionNotes });
    }
  };

  const toggleExpand = (applicationId: number) => {
    setExpandedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  if (isLoading) {
    return <div className="container py-8">Loading applications...</div>;
  }

  if (error) {
    return <div className="container py-8">Error loading applications: {(error as Error).message}</div>;
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Pending Applications</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No pending applications to review.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Applications</h1>
      <div className="space-y-6">
        {applications.map((application: any) => (
          <Card key={application.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{application.store.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {application.store.address}, {application.store.city}, {application.store.state} {application.store.postcode}
                  </CardDescription>
                </div>
                <Badge 
                  variant={
                    application.status === "pending" ? "outline" :
                    application.status === "approved" ? "success" :
                    "destructive"
                  }
                  className="capitalize"
                >
                  {application.status}
                </Badge>
              </div>
              <div className="flex gap-2 text-sm text-gray-500 mt-1">
                <span>Business Type: {application.store.businessType}</span>
                <span>•</span>
                <span>Submitted: {format(new Date(application.createdAt), 'PPP')}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Owner:</span> {application.store.ownerName}
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> {application.store.ownerEmail} | {application.store.ownerPhone}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(application.id)}
                  className="flex items-center gap-1"
                >
                  {expandedApplications.includes(application.id) ? (
                    <>
                      Less Details <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      More Details <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              {expandedApplications.includes(application.id) && (
                <div className="mt-4 space-y-4">
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><span className="font-medium">Employees:</span> {application.employeeCount}</p>
                        <p><span className="font-medium">Hours:</span> {application.operatingHours}</p>
                        <p><span className="font-medium">Established:</span> {application.store.established || 'Not specified'}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Halal Training:</span> {application.halalTraining ? 'Yes' : 'No'}</p>
                        <p><span className="font-medium">Has Storage Separation:</span> {application.hasStorageSeparation ? 'Yes' : 'No'}</p>
                        <p><span className="font-medium">Has Contamination Prevention:</span> {application.hasContaminationPrevention ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Products</h3>
                    <ul className="list-disc list-inside pl-2">
                      {application.products.map((product: string, index: number) => (
                        <li key={index}>{product}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Suppliers</h3>
                    <div className="space-y-2">
                      {application.suppliers.map((supplier: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded">
                          <p><span className="font-medium">Name:</span> {supplier.name}</p>
                          <p><span className="font-medium">Material:</span> {supplier.material}</p>
                          <p><span className="font-medium">Certified:</span> {supplier.certified ? 'Yes' : 'No'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {application.additionalNotes && (
                    <div>
                      <h3 className="font-semibold mb-2">Additional Notes</h3>
                      <p className="bg-gray-50 p-3 rounded">{application.additionalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-end gap-3 pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setSelectedApplicationId(application.id)}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Application</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reject the certification application. The store owner will be notified.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="mb-4">
                    <label htmlFor="rejectionNotes" className="block text-sm font-medium mb-1">
                      Reason for rejection (optional)
                    </label>
                    <Textarea
                      id="rejectionNotes"
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      className="w-full"
                      placeholder="Enter details about why this application is being rejected"
                    />
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setRejectionNotes("");
                      setSelectedApplicationId(null);
                    }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleReject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirm Rejection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={() => handleApprove(application.id)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}