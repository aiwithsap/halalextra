import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ThumbsUp,
  MessageSquare,
  RefreshCw
} from "lucide-react";

type Feedback = {
  id: number;
  storeId: number;
  authorName: string | null;
  authorEmail: string | null;
  content: string;
  type: 'review' | 'complaint';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  store: {
    name: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
  };
};

const FeedbackModeration = () => {
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [moderationDialog, setModerationDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject';
  }>({ isOpen: false, action: 'approve' });
  const [feedbackType, setFeedbackType] = useState<'all' | 'review' | 'complaint'>('all');
  
  // Fetch pending feedback
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/feedback/pending'],
    queryFn: async () => {
      const response = await fetch('/api/feedback/pending', {
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
  
  // Moderate feedback mutation
  const moderateFeedback = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("POST", `/api/feedback/${id}/moderate`, { status });
    },
    onSuccess: () => {
      toast({
        title: moderationDialog.action === 'approve' 
          ? t("admin.feedback.approveSuccess") 
          : t("admin.feedback.rejectSuccess"),
        description: moderationDialog.action === 'approve'
          ? t("admin.feedback.approveSuccessDesc")
          : t("admin.feedback.rejectSuccessDesc"),
      });
      setModerationDialog({ isOpen: false, action: 'approve' });
      setSelectedFeedback(null);
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("admin.feedback.moderationError"),
        variant: "destructive",
      });
    }
  });
  
  const handleModerate = async (action: 'approve' | 'reject') => {
    if (!selectedFeedback) return;
    
    setModerationDialog({ isOpen: true, action });
  };
  
  const confirmModeration = async () => {
    if (!selectedFeedback) return;
    
    moderateFeedback.mutate({
      id: selectedFeedback.id,
      status: moderationDialog.action
    });
  };
  
  // Filter feedback based on type
  const filteredFeedback = data?.feedback 
    ? feedbackType === 'all' 
      ? data.feedback 
      : data.feedback.filter((f: Feedback) => f.type === feedbackType)
    : [];
  
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">{t("admin.feedback.error")}</h2>
          <p>{(error as Error).message || t("admin.feedback.errorDesc")}</p>
          <Button 
            onClick={() => refetch()}
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("admin.feedback.pageTitle")}</title>
        <meta name="description" content={t("meta.admin.feedback.description")} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className={`mb-6 ${isRtl ? "rtl" : ""}`}>
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t("admin.feedback.pageTitle")}</h1>
              <p className="text-gray-600">{t("admin.feedback.pageDescription")}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.feedback.filterTitle")}</CardTitle>
                <CardDescription>{t("admin.feedback.filterDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">{t("admin.feedback.feedbackType")}</h3>
                  <Tabs 
                    defaultValue="all" 
                    value={feedbackType} 
                    onValueChange={(value) => setFeedbackType(value as any)}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="all">{t("admin.feedback.all")}</TabsTrigger>
                      <TabsTrigger value="review">{t("admin.feedback.reviews")}</TabsTrigger>
                      <TabsTrigger value="complaint">{t("admin.feedback.complaints")}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-3">{t("admin.feedback.stats.title")}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t("admin.feedback.stats.pendingCount")}</span>
                      <Badge variant="outline" className="font-mono">
                        {data?.feedback?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t("admin.feedback.stats.reviewCount")}</span>
                      <Badge variant="outline" className="font-mono">
                        {data?.feedback?.filter((f: Feedback) => f.type === 'review').length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t("admin.feedback.stats.complaintCount")}</span>
                      <Badge variant="outline" className="font-mono">
                        {data?.feedback?.filter((f: Feedback) => f.type === 'complaint').length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{t("admin.feedback.pendingModeration")}</CardTitle>
                <CardDescription>{t("admin.feedback.pendingModerationDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : filteredFeedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <ThumbsUp className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">{t("admin.feedback.noFeedback")}</h3>
                    <p className="text-gray-500 max-w-md mt-2">{t("admin.feedback.noFeedbackDesc")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFeedback.map((feedback: Feedback) => (
                      <div 
                        key={feedback.id} 
                        className={`border rounded-lg overflow-hidden hover:border-primary transition-colors ${
                          selectedFeedback?.id === feedback.id ? 'border-primary ring-1 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedFeedback(feedback)}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{feedback.store.name}</h3>
                              <p className="text-sm text-gray-500">
                                {feedback.store.address}, {feedback.store.city}
                              </p>
                            </div>
                            <Badge variant={feedback.type === 'review' ? 'secondary' : 'outline'}>
                              {feedback.type === 'review' ? (
                                <ThumbsUp className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              )}
                              {feedback.type === 'review' ? t("admin.feedback.review") : t("admin.feedback.complaint")}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-md my-3">
                            <p className="text-gray-700">{feedback.content}</p>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="text-gray-500">
                              {feedback.authorName ? (
                                <span>{t("admin.feedback.by", { name: feedback.authorName })}</span>
                              ) : (
                                <span>{t("admin.feedback.anonymous")}</span>
                              )}
                              <span className="mx-1">•</span>
                              <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFeedback(feedback);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> {t("common.view")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Selected Feedback Detail Sidebar */}
        {selectedFeedback && (
          <div className="fixed inset-y-0 right-0 w-full md:w-1/3 max-w-md bg-white shadow-xl p-6 overflow-y-auto z-50 border-l">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t("admin.feedback.details")}</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedFeedback(null)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{t("admin.feedback.storeDetails")}</h3>
                <p className="font-medium text-lg">{selectedFeedback.store.name}</p>
                <p className="text-gray-600">
                  {selectedFeedback.store.address}, {selectedFeedback.store.city}, {selectedFeedback.store.state} {selectedFeedback.store.postcode}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500">{t("admin.feedback.feedbackContent")}</h3>
                  <Badge variant={selectedFeedback.type === 'review' ? 'secondary' : 'outline'}>
                    {selectedFeedback.type === 'review' ? t("admin.feedback.review") : t("admin.feedback.complaint")}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="whitespace-pre-line">{selectedFeedback.content}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{t("admin.feedback.submittedBy")}</h3>
                {selectedFeedback.authorName ? (
                  <div>
                    <p className="font-medium">{selectedFeedback.authorName}</p>
                    {selectedFeedback.authorEmail && (
                      <p className="text-gray-600">{selectedFeedback.authorEmail}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">{t("admin.feedback.anonymous")}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{t("admin.feedback.submissionDate")}</h3>
                <p>{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
              </div>
              
              <Separator />
              
              <div className="flex justify-between space-x-4 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleModerate('reject')}
                  disabled={moderateFeedback.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("admin.feedback.reject")}
                </Button>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => handleModerate('approve')}
                  disabled={moderateFeedback.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("admin.feedback.approve")}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Confirmation Dialog */}
        <Dialog 
          open={moderationDialog.isOpen} 
          onOpenChange={(open) => !moderateFeedback.isPending && setModerationDialog({ ...moderationDialog, isOpen: open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {moderationDialog.action === 'approve' 
                  ? t("admin.feedback.approveTitle") 
                  : t("admin.feedback.rejectTitle")}
              </DialogTitle>
              <DialogDescription>
                {moderationDialog.action === 'approve' 
                  ? t("admin.feedback.approveDesc") 
                  : t("admin.feedback.rejectDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-medium">
                  {selectedFeedback?.type === 'review' 
                    ? t("admin.feedback.reviewFrom", { name: selectedFeedback?.authorName || t("admin.feedback.anonymous") }) 
                    : t("admin.feedback.complaintFrom", { name: selectedFeedback?.authorName || t("admin.feedback.anonymous") })}
                </h3>
              </div>
              <p className="text-gray-700 pl-8">{selectedFeedback?.content}</p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setModerationDialog({ isOpen: false, action: 'approve' })}
                disabled={moderateFeedback.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                variant={moderationDialog.action === 'approve' ? 'default' : 'destructive'}
                onClick={confirmModeration}
                disabled={moderateFeedback.isPending}
              >
                {moderateFeedback.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("common.processing")}
                  </>
                ) : (
                  moderationDialog.action === 'approve' ? t("admin.feedback.confirmApprove") : t("admin.feedback.confirmReject")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default FeedbackModeration;
