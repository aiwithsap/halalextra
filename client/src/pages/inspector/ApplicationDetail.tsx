import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Camera, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Navigation,
  Upload,
  Signature
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

interface Inspection {
  id: number;
  applicationId: number;
  inspectorId: number;
  visitDate: string;
  notes: string;
  decision: string;
  latitude: number;
  longitude: number;
  locationAccuracy: number;
  locationTimestamp: string;
  digitalSignature: string;
  signedAt: string;
  status: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  application: {
    id: number;
    storeId: number;
    status: string;
    products: string[];
    suppliers: any[];
    employeeCount: string;
    operatingHours: string;
    notes: string;
    store: {
      id: number;
      name: string;
      address: string;
      city: string;
      state: string;
      postcode: string;
      businessType: string;
      abn: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone: string;
    };
  };
}

interface InspectionPhoto {
  id: number;
  inspectionId: number;
  documentId: number;
  photoType: string;
  caption: string;
  latitude: number;
  longitude: number;
  locationAccuracy: number;
  takenAt: string;
  document: {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    documentType: string;
    description: string;
  };
}

const ApplicationDetail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/inspector/application/:id");
  const applicationId = params?.id;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchInspectionData();
    }
  }, [applicationId]);

  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      
      // Get assigned inspections for this inspector
      const response = await fetch('/api/inspections/assigned', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const inspections = await response.json();
        const currentInspection = inspections.find((insp: Inspection) => 
          insp.application.id === parseInt(applicationId!)
        );
        
        if (currentInspection) {
          setInspection(currentInspection);
          setNotes(currentInspection.notes || '');
          
          // Load photos if inspection exists
          const photosResponse = await fetch(`/api/inspections/${currentInspection.id}/photos`, {
            credentials: 'include'
          });
          
          if (photosResponse.ok) {
            const photoData = await photosResponse.json();
            setPhotos(photoData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load inspection data"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    // Return mock location data immediately to bypass geolocation API
    return Promise.resolve({
      latitude: 0,
      longitude: 0,
      accuracy: 100
    });
  };

  const handleStartInspection = async () => {
    console.log('🔥 handleStartInspection called');
    if (!inspection) {
      console.log('❌ No inspection found');
      return;
    }

    try {
      console.log('🔄 Setting isStarting to true');
      setIsStarting(true);

      // Get mock location data (bypasses geolocation API)
      console.log('⏩ Getting mock location data');
      const location = await getCurrentLocation().catch(() => null);

      console.log('🚀 Making fetch request to:', `/api/inspections/${inspection.id}/start`);
      const response = await fetch(`/api/inspections/${inspection.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          locationAccuracy: location?.accuracy || null
        })
      });

      if (response.ok) {
        const updatedInspection = await response.json();
        setInspection(prev => prev ? { ...prev, ...updatedInspection } : null);
        
        toast({
          title: "Success",
          description: "Inspection started successfully"
        });
      } else {
        throw new Error('Failed to start inspection');
      }
    } catch (error) {
      console.error('Error starting inspection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start inspection"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !inspection) return;

    try {
      setIsUploading(true);
      
      // Skip geolocation to prevent permission errors
      const location = null;
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('photoType', 'facility_general');
      formData.append('caption', `Inspection photo taken at ${new Date().toLocaleString()}`);
      
      if (location) {
        formData.append('latitude', location.latitude.toString());
        formData.append('longitude', location.longitude.toString());
        formData.append('locationAccuracy', location.accuracy.toString());
      }

      const response = await fetch(`/api/inspections/${inspection.id}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const newPhoto = await response.json();
        setPhotos(prev => [...prev, newPhoto]);
        
        toast({
          title: "Success",
          description: "Photo uploaded successfully"
        });
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photo"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCompleteInspection = async () => {
    if (!inspection) return;

    let digitalSignature = '';
    
    if (showSignaturePad) {
      const canvas = canvasRef.current;
      if (canvas) {
        digitalSignature = canvas.toDataURL();
      }
    }

    try {
      setIsCompleting(true);

      const response = await fetch(`/api/inspections/${inspection.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          notes,
          digitalSignature
        })
      });

      if (response.ok) {
        const updatedInspection = await response.json();
        setInspection(prev => prev ? { ...prev, ...updatedInspection } : null);
        
        toast({
          title: "Success",
          description: `Inspection completed and ${decision === 'approved' ? 'approved' : 'rejected'}. ${decision === 'approved' ? 'Certificate will be generated automatically.' : ''}`
        });
      } else {
        throw new Error('Failed to complete inspection');
      }
    } catch (error) {
      console.error('Error completing inspection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete inspection"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inspection details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Inspection Not Found</h1>
          <p className="text-gray-600">This application is not assigned to you for inspection.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("inspector.applicationDetail.title")} - {inspection.application.store.name}</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inspection Details</h1>
          <p className="text-gray-600">Application #{inspection.application.id} - {inspection.application.store.name}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Business Name</Label>
                <p>{inspection.application.store.name}</p>
              </div>
              <div>
                <Label className="font-semibold">Address</Label>
                <p>{inspection.application.store.address}, {inspection.application.store.city}, {inspection.application.store.state} {inspection.application.store.postcode}</p>
              </div>
              <div>
                <Label className="font-semibold">Business Type</Label>
                <p>{inspection.application.store.businessType}</p>
              </div>
              <div>
                <Label className="font-semibold">Owner</Label>
                <p>{inspection.application.store.ownerName}</p>
                <p className="text-sm text-gray-600">{inspection.application.store.ownerEmail}</p>
                <p className="text-sm text-gray-600">{inspection.application.store.ownerPhone}</p>
              </div>
              <div>
                <Label className="font-semibold">Products</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {inspection.application.products.map((product, index) => (
                    <Badge key={index} variant="secondary">{product}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Inspection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Current Status</Label>
                <div className="mt-1">
                  <StatusBadge status={inspection.status} />
                </div>
              </div>
              
              {inspection.startTime && (
                <div>
                  <Label className="font-semibold">Started At</Label>
                  <p>{new Date(inspection.startTime).toLocaleString()}</p>
                </div>
              )}
              
              {inspection.endTime && (
                <div>
                  <Label className="font-semibold">Completed At</Label>
                  <p>{new Date(inspection.endTime).toLocaleString()}</p>
                </div>
              )}
              
              {currentLocation && (
                <div>
                  <Label className="font-semibold">Location Captured</Label>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    <span className="text-sm text-gray-600">(±{currentLocation.accuracy}m)</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {inspection.status === 'scheduled' && (
                <Button 
                  onClick={handleStartInspection} 
                  disabled={isStarting}
                  className="w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {isStarting ? 'Starting...' : 'Start Inspection'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inspection Photos */}
        {inspection.status !== 'scheduled' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Inspection Photos
              </CardTitle>
              <CardDescription>
                Upload photos during your inspection as evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || inspection.status === 'completed'}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Take Photo'}
                  </Button>
                </div>

                {/* Photos Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="border rounded-lg p-2">
                        <img 
                          src={`/api/documents/${photo.document.id}/download`}
                          alt={photo.caption || 'Inspection photo'}
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="text-sm mt-2 truncate" title={photo.caption || photo.document.originalName}>
                          {photo.caption || photo.document.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(photo.takenAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Inspection */}
        {inspection.status === 'in_progress' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Complete Inspection
              </CardTitle>
              <CardDescription>
                Provide your decision and notes to complete this inspection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision */}
              <div>
                <Label className="font-semibold">Decision</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={decision === 'approved' ? 'default' : 'outline'}
                    onClick={() => setDecision('approved')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant={decision === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => setDecision('rejected')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="font-semibold">Inspection Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your observations, findings, and recommendations..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Digital Signature */}
              <div>
                <Label className="font-semibold">Digital Signature</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSignaturePad(!showSignaturePad)}
                    className="mb-4"
                  >
                    <Signature className="w-4 h-4 mr-2" />
                    {showSignaturePad ? 'Hide' : 'Add'} Signature
                  </Button>
                  
                  {showSignaturePad && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="border bg-white cursor-crosshair w-full"
                        style={{ touchAction: 'none' }}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Button */}
              <Button 
                onClick={handleCompleteInspection}
                disabled={isCompleting || !notes.trim()}
                className="w-full"
                variant={decision === 'approved' ? 'default' : 'destructive'}
              >
                {isCompleting ? 'Completing...' : `Complete Inspection (${decision})`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Inspection Summary */}
        {inspection.status === 'completed' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Inspection Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Decision</Label>
                <div className="mt-1">
                  <Badge variant={inspection.decision === 'approved' ? 'default' : 'destructive'}>
                    {inspection.decision === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Final Notes</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{inspection.notes || 'No notes provided'}</p>
              </div>
              
              <div>
                <Label className="font-semibold">Completed At</Label>
                <p>{inspection.endTime ? new Date(inspection.endTime).toLocaleString() : 'Not completed'}</p>
              </div>
              
              {inspection.decision === 'approved' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ Certificate has been automatically generated and sent to the store owner.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ApplicationDetail;