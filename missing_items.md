# HalalExtra - Critical & High Priority Implementation Plan

## Overview
This document outlines the detailed implementation plan for completing the critical and high-priority features of the HalalExtra certification system. These tasks are essential for achieving minimum viable product (MVP) functionality.

---

## 🚨 CRITICAL PRIORITY TASKS (Days 1-3)

### 1. Fix i18n Translation Rendering Issue
**Problem:** Translation keys (e.g., `verify.pageTitle`) are displayed instead of actual translated text across multiple pages.

#### Root Cause Analysis
- Translation files exist but aren't being loaded correctly
- Missing i18n initialization or configuration issues
- Possible missing await for i18n ready state

#### Implementation Steps

**Day 1 - Morning (2-3 hours)**

1. **Debug i18n Configuration** (`client/src/main.tsx` or `App.tsx`)
```typescript
// Check i18n initialization
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Ensure proper initialization
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true, // Enable for debugging
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}.json'
    }
  });

// Add ready check
await i18n.init();
```

2. **Fix Translation File Loading**
```typescript
// Verify translation files are accessible
// Check build process includes locale files
// Update vite.config.ts if needed:
export default defineConfig({
  // ...
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.json')) {
            return 'locales/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
```

3. **Update Components with Fallback Text**
```typescript
// Add fallback values for critical translations
const { t } = useTranslation();

// Instead of:
<h1>{t('verify.pageTitle')}</h1>

// Use:
<h1>{t('verify.pageTitle', 'Verify Certificate')}</h1>
```

4. **Test All Affected Pages**
- `/verify` - Certificate verification page
- `/inspector` - Inspector dashboard
- `/admin` - Admin dashboard
- `/apply` - Application form

**Success Criteria:**
- All pages display proper text instead of translation keys
- Language switching works correctly
- No console errors related to i18n

---

### 2. Complete Authentication Flow & Session Management
**Problem:** Login system exists but session management and protected routes are incomplete.

#### Implementation Steps

**Day 1 - Afternoon (3-4 hours)**

1. **Fix AuthContext Implementation** (`client/src/contexts/AuthContext.tsx`)
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'inspector' | 'store_owner';
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user, token } = await response.json();
    localStorage.setItem('auth_token', token);
    setToken(token);
    setUser(user);
    
    // Set default authorization header
    apiRequest.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    delete apiRequest.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isLoading,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

2. **Implement Protected Route Component** (`client/src/components/auth/ProtectedRoute.tsx`)
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

3. **Update App Router with Protected Routes** (`client/src/App.tsx`)
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Wrap protected pages
<Route path="/inspector/*">
  <ProtectedRoute allowedRoles={['inspector', 'admin']}>
    <InspectorDashboard />
  </ProtectedRoute>
</Route>

<Route path="/admin/*">
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
</Route>
```

4. **Add Session Refresh Logic**
```typescript
// Add token refresh before expiry
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const { token: newToken } = await response.json();
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
};

// Set up refresh interval (every 30 minutes)
useEffect(() => {
  if (token) {
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [token]);
```

**Success Criteria:**
- Login persists across page refreshes
- Protected routes redirect to login when unauthenticated
- Role-based access control works correctly
- Token stored securely in localStorage
- Session timeout handled gracefully

---

### 3. Connect Frontend Dashboards to Real APIs
**Problem:** Inspector and Admin dashboards use mock data instead of real API calls.

#### Implementation Steps

**Day 2 - Morning (3-4 hours)**

1. **Create API Service Functions** (`client/src/services/api.ts`)
```typescript
import { apiRequest } from '@/lib/queryClient';

// Inspector API calls
export const inspectorApi = {
  getAssignedApplications: async () => {
    const response = await apiRequest.get('/api/inspections/assigned');
    return response.data;
  },
  
  startInspection: async (id: string) => {
    const response = await apiRequest.post(`/api/inspections/${id}/start`);
    return response.data;
  },
  
  completeInspection: async (id: string, data: any) => {
    const response = await apiRequest.post(`/api/inspections/${id}/complete`, data);
    return response.data;
  },
  
  uploadPhoto: async (id: string, photo: File) => {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await apiRequest.post(
      `/api/inspections/${id}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }
};

// Admin API calls
export const adminApi = {
  getPendingApplications: async () => {
    const response = await apiRequest.get('/api/admin/applications/pending');
    return response.data;
  },
  
  updateApplicationStatus: async (id: string, status: string) => {
    const response = await apiRequest.post(`/api/applications/${id}/status`, { status });
    return response.data;
  },
  
  revokeCertificate: async (id: string, reason: string) => {
    const response = await apiRequest.post(`/api/certificates/${id}/revoke`, { reason });
    return response.data;
  },
  
  getDashboardStats: async () => {
    // Aggregate multiple API calls for dashboard stats
    const [applications, inspections, certificates] = await Promise.all([
      apiRequest.get('/api/applications'),
      apiRequest.get('/api/inspections'),
      apiRequest.get('/api/certificates')
    ]);
    
    return {
      applications: applications.data,
      inspections: inspections.data,
      certificates: certificates.data
    };
  }
};
```

2. **Update Inspector Dashboard** (`client/src/pages/inspector/Dashboard.tsx`)
```typescript
import { useQuery } from '@tanstack/react-query';
import { inspectorApi } from '@/services/api';

const Dashboard = () => {
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['inspector-applications'],
    queryFn: inspectorApi.getAssignedApplications,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Replace mock data with real data
  const applicationStatusData = applications?.reduce((acc, app) => {
    const status = app.status;
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: status, value: 1, color: getStatusColor(status) });
    }
    return acc;
  }, []) || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // Rest of component using real data...
};
```

3. **Update Admin Dashboard** (`client/src/pages/admin/Dashboard.tsx`)
```typescript
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: pendingApps } = useQuery({
    queryKey: ['pending-applications'],
    queryFn: adminApi.getPendingApplications
  });

  // Use real data for charts and metrics
  const monthlyData = processMonthlyData(stats?.applications);
  const statusBreakdown = processStatusData(stats?.certificates);

  // Rest of component...
};
```

4. **Add Real-time Updates with WebSockets (Optional Enhancement)**
```typescript
// Create WebSocket connection for real-time updates
const useRealtimeUpdates = () => {
  useEffect(() => {
    const ws = new WebSocket(`wss://${window.location.host}/ws`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      // Invalidate relevant queries
      if (update.type === 'application_status_changed') {
        queryClient.invalidateQueries(['inspector-applications']);
      }
    };

    return () => ws.close();
  }, []);
};
```

**Success Criteria:**
- Dashboards display real data from APIs
- Loading states shown during data fetching
- Error handling for API failures
- Auto-refresh of data at appropriate intervals
- No more mock/hardcoded data

---

## 🔥 HIGH PRIORITY TASKS (Days 3-5)

### 4. Implement Certificate PDF Generation
**Problem:** Digital certificates need to be generated as downloadable PDFs with QR codes.

#### Implementation Steps

**Day 3 - Full Day (6-8 hours)**

1. **Install PDF Generation Libraries**
```bash
npm install @react-pdf/renderer qrcode
# Backend alternative: npm install puppeteer
```

2. **Create Certificate Template Component** (`client/src/components/certificate/CertificateTemplate.tsx`)
```typescript
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  certificateNumber: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
  },
  body: {
    marginTop: 30,
    marginBottom: 30,
  },
  storeName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  details: {
    fontSize: 12,
    marginBottom: 8,
    color: '#444',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '40%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  islamicPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.1,
  },
  watermark: {
    position: 'absolute',
    fontSize: 60,
    color: '#f0f0f0',
    transform: 'rotate(-45deg)',
    opacity: 0.1,
  }
});

interface CertificateTemplateProps {
  certificate: {
    certificateNumber: string;
    storeName: string;
    storeAddress: string;
    ownerName: string;
    issuedDate: string;
    expiryDate: string;
    certificationBody: string;
  };
  qrCodeUrl: string;
}

export const CertificateTemplate = ({ certificate, qrCodeUrl }: CertificateTemplateProps) => {
  const [qrCodeData, setQrCodeData] = useState<string>('');

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    }).then(setQrCodeData);
  }, [qrCodeUrl]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Islamic Pattern Header */}
        <View style={styles.islamicPattern}>
          {/* Add decorative Islamic pattern SVG or image */}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HALAL CERTIFICATE</Text>
          <Text style={styles.subtitle}>This is to certify that</Text>
          <Text style={styles.certificateNumber}>
            Certificate No: {certificate.certificateNumber}
          </Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.storeName}>{certificate.storeName}</Text>
          
          <View>
            <Text style={styles.details}>
              <Text style={{ fontWeight: 'bold' }}>Address: </Text>
              {certificate.storeAddress}
            </Text>
            <Text style={styles.details}>
              <Text style={{ fontWeight: 'bold' }}>Owner: </Text>
              {certificate.ownerName}
            </Text>
            <Text style={styles.details}>
              <Text style={{ fontWeight: 'bold' }}>Issue Date: </Text>
              {new Date(certificate.issuedDate).toLocaleDateString()}
            </Text>
            <Text style={styles.details}>
              <Text style={{ fontWeight: 'bold' }}>Expiry Date: </Text>
              {new Date(certificate.expiryDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
              has been inspected and found to be in compliance with Islamic dietary laws
              and is authorized to display this certificate as evidence of
              Halal certification status.
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            {qrCodeData && <Image src={qrCodeData} style={styles.qrCode} />}
            <Text style={{ fontSize: 10, marginTop: 10, color: '#666' }}>
              Scan to verify authenticity
            </Text>
          </View>
        </View>

        {/* Footer with Signatures */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Certification Officer</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
          
          <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 20, color: '#666' }}>
            {certificate.certificationBody}
          </Text>
        </View>

        {/* Watermark */}
        <Text style={[styles.watermark, { top: 300, left: 150 }]}>
          HALAL
        </Text>
      </Page>
    </Document>
  );
};

// Function to generate PDF
export const generateCertificatePDF = async (certificate: any) => {
  const qrCodeUrl = `${window.location.origin}/verify/${certificate.certificateNumber}`;
  
  const doc = <CertificateTemplate certificate={certificate} qrCodeUrl={qrCodeUrl} />;
  const blob = await pdf(doc).toBlob();
  
  return blob;
};

// Function to download PDF
export const downloadCertificate = async (certificate: any) => {
  const blob = await generateCertificatePDF(certificate);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `halal-certificate-${certificate.certificateNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
```

3. **Add Backend PDF Generation Route** (`server/routes.ts`)
```typescript
app.get('/api/certificates/:id/download', authMiddleware, asyncHandler(async (req, res) => {
  const certificateId = req.params.id;
  
  // Get certificate data
  const certificate = await storage.getCertificateById(certificateId);
  
  if (!certificate) {
    return res.status(404).json({ message: 'Certificate not found' });
  }
  
  // Generate PDF (using Puppeteer for server-side generation)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Generate HTML template
  const html = generateCertificateHTML(certificate);
  await page.setContent(html);
  
  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' }
  });
  
  await browser.close();
  
  // Send PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);
  res.send(pdf);
}));
```

4. **Integrate with Certificate Display Page**
```typescript
// Add download button to certificate view
const CertificateView = ({ certificate }) => {
  const handleDownload = async () => {
    await downloadCertificate(certificate);
    toast({
      title: 'Certificate Downloaded',
      description: 'Your certificate has been downloaded successfully',
    });
  };

  return (
    <div>
      {/* Certificate display */}
      <Button onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF Certificate
      </Button>
    </div>
  );
};
```

**Success Criteria:**
- PDF certificates generated with proper formatting
- QR codes embedded and scannable
- Islamic/halal branding elements included
- Download functionality works across browsers
- Certificate validates against database

---

### 5. Complete Inspector Workflow Frontend
**Problem:** Inspector dashboard exists but workflow for conducting inspections is incomplete.

#### Implementation Steps

**Day 4 - Morning (4 hours)**

1. **Create Inspection Flow Component** (`client/src/components/inspector/InspectionFlow.tsx`)
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Upload, CheckCircle, XCircle } from 'lucide-react';
import { inspectorApi } from '@/services/api';

interface InspectionFlowProps {
  applicationId: string;
  onComplete: () => void;
}

export const InspectionFlow = ({ applicationId, onComplete }: InspectionFlowProps) => {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      // Hygiene checklist
      cleanlinessScore: 0,
      storageCompliance: false,
      separationCompliance: false,
      
      // Ingredients checklist
      noAlcohol: false,
      noPork: false,
      halalMeatOnly: false,
      
      // Documentation
      supplierCertificates: false,
      ingredientLists: false,
      
      // Overall assessment
      overallRating: 0,
      notes: '',
      recommendation: 'pending' // approved, rejected, needs_improvement
    }
  });

  // Step 1: Start Inspection
  const startInspection = async () => {
    try {
      const response = await inspectorApi.startInspection(applicationId);
      setInspectionId(response.id);
      setStep(2);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start inspection',
        variant: 'destructive'
      });
    }
  };

  // Step 2: Capture Photos
  const handlePhotoUpload = async (files: FileList) => {
    const newPhotos = Array.from(files);
    setPhotos(prev => [...prev, ...newPhotos]);
    
    // Upload photos immediately
    for (const photo of newPhotos) {
      try {
        await inspectorApi.uploadPhoto(inspectionId!, photo);
      } catch (error) {
        console.error('Photo upload failed:', error);
      }
    }
  };

  // Step 3: Fill Checklist
  const renderChecklist = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hygiene & Cleanliness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="cleanlinessScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cleanliness Score (1-10)</FormLabel>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
                <FormDescription>Rate overall cleanliness</FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="storageCompliance"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>Proper storage of halal products</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="separationCompliance"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>Proper separation from non-halal items</FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients & Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="noAlcohol"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>No alcohol in products</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="noPork"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>No pork or pork derivatives</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="halalMeatOnly"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>All meat from halal sources</FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="supplierCertificates"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>Valid supplier halal certificates</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="ingredientLists"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel>Complete ingredient lists available</FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Final Assessment
  const renderAssessment = () => (
    <Card>
      <CardHeader>
        <CardTitle>Final Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="overallRating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Compliance Rating (1-10)</FormLabel>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
              />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Notes</FormLabel>
              <Textarea
                {...field}
                placeholder="Enter detailed observations..."
                rows={6}
              />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="recommendation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recommendation</FormLabel>
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approved" id="approved" />
                  <Label htmlFor="approved" className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve Certification
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="needs_improvement" id="needs_improvement" />
                  <Label htmlFor="needs_improvement" className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                    Needs Improvement
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="flex items-center">
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Reject Application
                  </Label>
                </div>
              </RadioGroup>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  // Submit Inspection
  const onSubmit = async (data: any) => {
    try {
      await inspectorApi.completeInspection(inspectionId!, {
        ...data,
        photos: photos.map(p => p.name)
      });
      
      toast({
        title: 'Inspection Completed',
        description: 'The inspection report has been submitted successfully',
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit inspection',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex items-center ${i < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= i ? 'bg-primary text-white' : 'bg-gray-200'
                }`}
              >
                {i}
              </div>
              {i < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step > i ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm">Start</span>
          <span className="text-sm">Photos</span>
          <span className="text-sm">Checklist</span>
          <span className="text-sm">Assessment</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Start Inspection</CardTitle>
            <CardDescription>
              Begin the on-site inspection process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={startInspection} className="w-full">
              Start Inspection
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Capture Photos</CardTitle>
            <CardDescription>
              Take photos of the premises, storage areas, and products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Camera className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to capture or upload photos
                  </span>
                </label>
              </div>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                onClick={() => setStep(3)}
                disabled={photos.length === 0}
                className="w-full"
              >
                Continue to Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => setStep(4))}>
            {renderChecklist()}
            <div className="mt-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue to Assessment
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 4 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderAssessment()}
            <div className="mt-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Submit Inspection Report
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
```

2. **Update Inspector Dashboard to Include Workflow**
```typescript
// Add navigation to inspection flow
const handleStartInspection = (applicationId: string) => {
  navigate(`/inspector/inspection/${applicationId}`);
};

// Create inspection page route
<Route path="/inspector/inspection/:id">
  <InspectionPage />
</Route>
```

**Success Criteria:**
- Complete inspection workflow from start to finish
- Photo capture and upload functionality
- Comprehensive checklist covering all requirements
- Final assessment with recommendations
- Data properly saved to backend

---

### 6. Complete QR Code Certificate Linking
**Problem:** QR codes need to link to live certificate verification.

#### Implementation Steps

**Day 4 - Afternoon (2-3 hours)**

1. **Update QR Code Generation** (`server/utils.ts`)
```typescript
export const generateQRCode = async (certificateNumber: string): Promise<string> => {
  const verificationUrl = `${process.env.BASE_URL || 'https://halalextra-production.up.railway.app'}/verify/${certificateNumber}`;
  
  const qrCodeOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 256,
  };
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrCodeOptions);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
};
```

2. **Store QR Code in Database**
```typescript
// When certificate is created
app.post('/api/certificates/create', async (req, res) => {
  const certificateNumber = generateCertificateNumber();
  const qrCode = await generateQRCode(certificateNumber);
  
  const certificate = await db.insert(certificates).values({
    ...certData,
    certificateNumber,
    qrCode, // Store as base64 string
  });
  
  res.json(certificate);
});
```

3. **Update Verification Page to Handle QR Scans**
```typescript
// Already partially implemented, just needs fixes
const VerificationSection = () => {
  const handleQRScan = (data: string) => {
    // Extract certificate number from URL
    const match = data.match(/\/verify\/([A-Z0-9-]+)$/);
    if (match) {
      const certificateNumber = match[1];
      performSearch(certificateNumber);
    }
  };
  
  // Rest of implementation...
};
```

4. **Add Public Certificate Display Page**
```typescript
const CertificatePublicView = ({ certificateNumber }: { certificateNumber: string }) => {
  const { data: certificate, isLoading, error } = useQuery({
    queryKey: ['certificate', certificateNumber],
    queryFn: () => fetch(`/api/verify/${certificateNumber}`).then(r => r.json())
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !certificate) return <CertificateNotFound />;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {certificate.status === 'active' ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {certificate.status === 'active' ? 'Valid Certificate' : 'Invalid Certificate'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">Business Name:</span>
              <p className="text-lg">{certificate.storeName}</p>
            </div>
            <div>
              <span className="font-semibold">Certificate Number:</span>
              <p className="font-mono">{certificate.certificateNumber}</p>
            </div>
            <div>
              <span className="font-semibold">Issue Date:</span>
              <p>{new Date(certificate.issuedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-semibold">Expiry Date:</span>
              <p>{new Date(certificate.expiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-semibold">Status:</span>
              <StatusBadge status={certificate.status} />
            </div>
          </div>
          
          {certificate.status === 'active' && (
            <Alert className="mt-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This certificate is valid and current. The business is authorized
                to serve halal products.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

**Success Criteria:**
- QR codes generated for all certificates
- QR codes scannable and link to verification page
- Verification page displays certificate details
- Public can verify without authentication
- Mobile-friendly verification page

---

## 📅 Implementation Timeline

### Week 1 Schedule

**Day 1 (8 hours)**
- Morning: Fix i18n translation rendering (3 hours)
- Afternoon: Complete authentication flow (4 hours)
- Evening: Test and verify fixes (1 hour)

**Day 2 (8 hours)**
- Morning: Connect Inspector Dashboard to APIs (4 hours)
- Afternoon: Connect Admin Dashboard to APIs (4 hours)

**Day 3 (8 hours)**
- Full day: Implement Certificate PDF Generation

**Day 4 (8 hours)**
- Morning: Complete Inspector Workflow Frontend (4 hours)
- Afternoon: Complete QR Code Certificate Linking (3 hours)
- Evening: Integration testing (1 hour)

**Day 5 (8 hours)**
- Morning: Bug fixes and refinements (4 hours)
- Afternoon: End-to-end testing (4 hours)

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Frontend tests
npm run test:unit

# Backend tests
npm run test:backend
```

### Integration Tests
```bash
# API integration tests
npm run test:api

# Database tests
npm run test:db
```

### E2E Tests
```bash
# Playwright tests
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test --project=chromium --workers=1
```

### Manual Testing Checklist
- [ ] Login and session persistence
- [ ] Role-based access control
- [ ] Application submission flow
- [ ] Payment processing
- [ ] Inspector workflow
- [ ] Certificate generation
- [ ] QR code scanning
- [ ] Admin dashboard functionality
- [ ] Language switching
- [ ] Mobile responsiveness

---

## 🚀 Deployment Steps

### Pre-deployment Checklist
- [ ] All critical features implemented
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Stripe webhooks configured

### Deployment Process
```bash
# 1. Commit all changes
git add .
git commit -m "Complete critical and high priority features"

# 2. Push to main branch
git push origin main

# 3. Railway auto-deploys

# 4. Verify deployment
curl https://halalextra-production.up.railway.app/api/health

# 5. Run smoke tests
npm run test:smoke
```

### Post-deployment Verification
- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Dashboards display real data
- [ ] Payments process successfully
- [ ] Certificates generate properly
- [ ] QR codes scan correctly

---

## 📊 Success Metrics

### Functional Metrics
- All pages display proper text (no translation keys)
- Login sessions persist for 24 hours minimum
- Dashboards load real data within 3 seconds
- PDF certificates generate within 5 seconds
- QR codes scan successfully on mobile devices

### Performance Metrics
- Page load time < 3 seconds
- API response time < 500ms
- Dashboard refresh time < 2 seconds
- PDF generation time < 5 seconds

### Quality Metrics
- Zero critical bugs in production
- 90%+ test coverage
- All accessibility standards met
- Mobile-responsive on all pages

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

**Issue: Translation keys still showing**
- Clear browser cache
- Verify locale files are being served
- Check network tab for 404s on locale files
- Ensure i18n is initialized before render

**Issue: Authentication not persisting**
- Check localStorage for auth_token
- Verify token expiry time
- Ensure CORS headers are correct
- Check session refresh logic

**Issue: Dashboard not loading data**
- Verify API endpoints are accessible
- Check authentication headers
- Look for CORS issues
- Verify database connectivity

**Issue: PDF generation fails**
- Check memory limits
- Verify font files are available
- Test with simple template first
- Check for async/await issues

**Issue: QR codes not scanning**
- Verify QR code contrast ratio
- Test with different QR readers
- Check URL encoding
- Ensure HTTPS is used

---

## 📝 Notes and Considerations

### Security Considerations
- Implement rate limiting on all APIs
- Add CSRF protection
- Sanitize all user inputs
- Use HTTPS everywhere
- Implement proper logging

### Performance Optimizations
- Implement caching for dashboards
- Use lazy loading for components
- Optimize image sizes
- Implement pagination for lists
- Use database indexing

### Future Enhancements (After MVP)
- Push notifications
- Email reminders for expiring certificates
- Bulk certificate management
- Advanced analytics dashboard
- Mobile app development
- API for third-party integrations

---

## ✅ Definition of Done

A feature is considered complete when:
1. Code is implemented and reviewed
2. Unit tests are written and passing
3. Integration tests are passing
4. Feature is documented
5. Accessibility standards are met
6. Mobile responsive design is verified
7. Performance benchmarks are met
8. Security review is completed
9. Feature is deployed to production
10. Smoke tests pass in production

---

This implementation plan provides a clear roadmap to complete all critical and high-priority features within 5 working days. Each task has detailed implementation steps, code examples, and success criteria to ensure successful delivery of the HalalExtra MVP.