import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Check, X, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface InspectionDetailProps {
  applicationId: number;
  inspections: Array<{
    id: number;
    inspectorId: number;
    visitDate: string | null;
    notes: string | null;
    decision: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  refetchApplication: () => void;
}

const InspectionDetail: React.FC<InspectionDetailProps> = ({ 
  applicationId, 
  inspections, 
  refetchApplication 
}) => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [decision, setDecision] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  
  const latestInspection = inspections.length > 0 
    ? inspections.reduce((latest, inspection) => 
        new Date(inspection.updatedAt) > new Date(latest.updatedAt) 
          ? inspection 
          : latest, 
        inspections[0]
      )
    : null;
  
  const scheduleInspection = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/inspections", {
        applicationId,
        visitDate: new Date(visitDate).toISOString(),
        notes: inspectionNotes
      });
    },
    onSuccess: () => {
      toast({
        title: t("inspector.scheduleSuccess"),
        description: t("inspector.scheduleSuccessDescription"),
      });
      setIsScheduleDialogOpen(false);
      refetchApplication();
      
      // Update application status to under_review
      updateApplicationStatus.mutate({ status: "under_review" });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("inspector.scheduleError"),
        variant: "destructive",
      });
    }
  });
  
  const updateInspection = useMutation({
    mutationFn: async () => {
      if (!latestInspection) return;
      
      return apiRequest("PUT", `/api/inspections/${latestInspection.id}`, {
        notes: decisionNotes,
        decision
      });
    },
    onSuccess: () => {
      toast({
        title: decision === "approved" 
          ? t("inspector.approvalSuccess") 
          : t("inspector.rejectionSuccess"),
        description: decision === "approved" 
          ? t("inspector.approvalSuccessDescription") 
          : t("inspector.rejectionSuccessDescription"),
      });
      setIsDecisionDialogOpen(false);
      refetchApplication();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("inspector.decisionError"),
        variant: "destructive",
      });
    }
  });
  
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      return apiRequest("POST", `/api/applications/${applicationId}/status`, {
        status,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      refetchApplication();
    }
  });
  
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleInspection.mutate();
  };
  
  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInspection.mutate();
  };
  
  const hasScheduledInspection = inspections.some(inspection => inspection.visitDate);
  const hasPendingDecision = hasScheduledInspection && !latestInspection?.decision;

  return (
    <Card className={isRtl ? "rtl" : ""}>
      <CardHeader>
        <CardTitle>{t("inspector.inspectionDetails")}</CardTitle>
        <CardDescription>
          {t("inspector.inspectionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold">{t("inspector.noInspections")}</h3>
            <p className="text-gray-500 mb-4">{t("inspector.scheduleFirstInspection")}</p>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("inspector.scheduleInspection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleScheduleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{t("inspector.scheduleInspection")}</DialogTitle>
                    <DialogDescription>
                      {t("inspector.scheduleInspectionDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="visit-date" className="text-sm font-medium">
                        {t("inspector.visitDate")} *
                      </label>
                      <input
                        id="visit-date"
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        min={format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="inspection-notes" className="text-sm font-medium">
                        {t("inspector.notes")}
                      </label>
                      <Textarea
                        id="inspection-notes"
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        placeholder={t("inspector.notesPlaceholder")}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsScheduleDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={!visitDate || scheduleInspection.isPending}
                    >
                      {scheduleInspection.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t("common.scheduling")}
                        </>
                      ) : (
                        t("common.schedule")
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-6">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="rounded-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-3 flex justify-between items-center">
                  <div className="font-medium">
                    {inspection.visitDate ? (
                      <span>
                        {t("inspector.scheduledFor")}: {" "}
                        {format(new Date(inspection.visitDate), "PPP")}
                      </span>
                    ) : (
                      <span>{t("inspector.inspectionCreated")}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(inspection.createdAt), "PPp")}
                  </div>
                </div>
                <div className="p-4">
                  {inspection.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        {t("inspector.notes")}
                      </h4>
                      <div className="bg-gray-50 p-3 rounded text-gray-700">
                        {inspection.notes}
                      </div>
                    </div>
                  )}
                  
                  {inspection.decision ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        {t("inspector.decision")}
                      </h4>
                      <div className={`rounded flex items-center p-2 ${
                        inspection.decision === "approved" 
                          ? "bg-green-50 text-success" 
                          : "bg-red-50 text-destructive"
                      }`}>
                        {inspection.decision === "approved" ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-medium">
                          {inspection.decision === "approved" 
                            ? t("inspector.approved") 
                            : t("inspector.rejected")}
                        </span>
                      </div>
                    </div>
                  ) : inspection.visitDate && (
                    <div className="flex justify-end mt-4">
                      <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <FileText className="h-4 w-4 mr-2" />
                            {t("inspector.recordDecision")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <form onSubmit={handleDecisionSubmit}>
                            <DialogHeader>
                              <DialogTitle>{t("inspector.recordDecision")}</DialogTitle>
                              <DialogDescription>
                                {t("inspector.recordDecisionDescription")}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <label htmlFor="decision" className="text-sm font-medium">
                                  {t("inspector.decision")} *
                                </label>
                                <Select 
                                  value={decision || ""} 
                                  onValueChange={setDecision}
                                  required
                                >
                                  <SelectTrigger id="decision">
                                    <SelectValue placeholder={t("inspector.selectDecision")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approved">{t("inspector.approved")}</SelectItem>
                                    <SelectItem value="rejected">{t("inspector.rejected")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="grid gap-2">
                                <label htmlFor="decision-notes" className="text-sm font-medium">
                                  {t("inspector.notes")} *
                                </label>
                                <Textarea
                                  id="decision-notes"
                                  value={decisionNotes}
                                  onChange={(e) => setDecisionNotes(e.target.value)}
                                  placeholder={decision === "approved" 
                                    ? t("inspector.approvalNotesPlaceholder") 
                                    : t("inspector.rejectionNotesPlaceholder")
                                  }
                                  className="resize-none"
                                  required
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsDecisionDialogOpen(false)}
                              >
                                {t("common.cancel")}
                              </Button>
                              <Button 
                                type="submit"
                                disabled={!decision || !decisionNotes.trim() || updateInspection.isPending}
                                variant={decision === "rejected" ? "destructive" : "default"}
                              >
                                {updateInspection.isPending ? (
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
                  )}
                </div>
              </div>
            ))}
            
            {!hasPendingDecision && !latestInspection?.decision && (
              <div className="flex justify-center mt-4">
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t("inspector.scheduleNewInspection")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleScheduleSubmit}>
                      <DialogHeader>
                        <DialogTitle>{t("inspector.scheduleInspection")}</DialogTitle>
                        <DialogDescription>
                          {t("inspector.scheduleInspectionDescription")}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="visit-date" className="text-sm font-medium">
                            {t("inspector.visitDate")} *
                          </label>
                          <input
                            id="visit-date"
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            min={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <label htmlFor="inspection-notes" className="text-sm font-medium">
                            {t("inspector.notes")}
                          </label>
                          <Textarea
                            id="inspection-notes"
                            value={inspectionNotes}
                            onChange={(e) => setInspectionNotes(e.target.value)}
                            placeholder={t("inspector.notesPlaceholder")}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsScheduleDialogOpen(false)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button 
                          type="submit"
                          disabled={!visitDate || scheduleInspection.isPending}
                        >
                          {scheduleInspection.isPending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("common.scheduling")}
                            </>
                          ) : (
                            t("common.schedule")
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {latestInspection && !latestInspection.decision && (
        <CardFooter className="flex justify-between border-t p-4">
          <Button
            variant="destructive"
            onClick={() => {
              setDecision("rejected");
              setIsDecisionDialogOpen(true);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            {t("inspector.reject")}
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setDecision("approved");
              setIsDecisionDialogOpen(true);
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            {t("inspector.approve")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default InspectionDetail;
