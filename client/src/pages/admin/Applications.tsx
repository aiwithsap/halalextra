import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ApplicationsAdmin = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [currentApplicationId, setCurrentApplicationId] = useState<number | null>(null);
  const [statusAction, setStatusAction] = useState<"approve" | "reject" | null>(null);

  // Fetch pending applications
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/applications/pending'],
    enabled: !!user && user.role === 'admin'
  });
  
  // Mutation for updating application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number, status: string, notes?: string }) => {
      return apiRequest(`/api/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications/pending'] });
      toast({
        title: t("admin.statusUpdateSuccess"),
        description: t("admin.applicationUpdated"),
      });
      setNotes("");
      setCurrentApplicationId(null);
      setStatusAction(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("admin.statusUpdateFailed"),
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (id: number, status: "approved" | "rejected") => {
    updateStatusMutation.mutate({ id, status, notes });
  };

  const openActionDialog = (id: number, action: "approve" | "reject") => {
    setCurrentApplicationId(id);
    setStatusAction(action);
  };

  const closeActionDialog = () => {
    setCurrentApplicationId(null);
    setStatusAction(null);
    setNotes("");
  };

  const confirmAction = () => {
    if (currentApplicationId && statusAction) {
      const status = statusAction === "approve" ? "approved" : "rejected";
      handleStatusChange(currentApplicationId, status);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{t("admin.pendingApplications")}</h1>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{t("admin.pendingApplications")}</h1>
        <p className="text-red-500">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("admin.pendingApplications")}</h1>
      
      {applications.length === 0 ? (
        <p>{t("admin.noApplications")}</p>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-center">
                  <CardTitle>{application.store.name}</CardTitle>
                  <Badge variant={application.status === "pending" ? "outline" : application.status === "approved" ? "success" : "destructive"}>
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-sm">{t("admin.businessInfo")}:</p>
                    <p>{t("apply.businessType")}: {application.store.businessType}</p>
                    <p>{t("apply.abn")}: {application.store.abn}</p>
                    <p>{t("apply.address")}: {application.store.address}, {application.store.city}, {application.store.state} {application.store.postcode}</p>
                    <p>{t("apply.since")}: {application.store.established || t("common.notSpecified")}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t("admin.contactDetails")}:</p>
                    <p>{t("apply.ownerName")}: {application.store.ownerName}</p>
                    <p>{t("apply.ownerEmail")}: {application.store.ownerEmail}</p>
                    <p>{t("apply.ownerPhone")}: {application.store.ownerPhone}</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-sm">{t("apply.operationalDetails")}:</p>
                    <p>{t("apply.employeeCount")}: {application.employeeCount || t("common.notSpecified")}</p>
                    <p>{t("apply.operatingHours")}: {application.operatingHours || t("common.notSpecified")}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="font-semibold text-sm">{t("apply.products")}:</p>
                  {application.products && application.products.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {application.products.map((product, index) => (
                        <li key={index}>{product}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t("common.notSpecified")}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <p className="font-semibold text-sm">{t("apply.suppliers")}:</p>
                  {application.suppliers && application.suppliers.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {application.suppliers.map((supplier, index) => (
                        <li key={index}>
                          {supplier.name} - {supplier.material} 
                          {supplier.certified && <Badge className="ml-2 bg-green-100 text-green-800">Certified</Badge>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t("common.notSpecified")}</p>
                  )}
                </div>
                
                {application.status === "pending" && (
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      onClick={() => openActionDialog(application.id, "approve")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {t("admin.approve")}
                    </Button>
                    <Button 
                      onClick={() => openActionDialog(application.id, "reject")}
                      variant="destructive"
                    >
                      {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Status Action Dialog */}
      <AlertDialog open={!!currentApplicationId && !!statusAction} onOpenChange={() => !updateStatusMutation.isPending && closeActionDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction === "approve" ? t("admin.approveApplication") : t("admin.rejectApplication")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction === "approve" 
                ? t("admin.approveConfirmation") 
                : t("admin.rejectConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-4">
            <Label htmlFor="notes">{t("admin.notes")}</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("admin.notesPlaceholder")}
              className="mt-2"
            />
          </div>
          
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending}
              className={statusAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {updateStatusMutation.isPending ? t("common.processing") : statusAction === "approve" ? t("admin.confirm") : t("admin.reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApplicationsAdmin;