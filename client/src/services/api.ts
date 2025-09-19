import { queryClient } from '@/lib/queryClient';

// Base API request function with error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Admin API calls
export const adminApi = {
  getDashboardStats: async () => {
    // Get multiple data sources and aggregate
    try {
      const [applications, pendingApps] = await Promise.all([
        apiRequest('/api/applications'),
        apiRequest('/api/admin/applications/pending')
      ]);

      // Process data for dashboard stats
      const totalApplications = applications?.length || 0;
      const pendingApplications = pendingApps?.length || 0;
      
      // Calculate status breakdown
      const statusCounts = applications?.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        stats: {
          totalApplications,
          pendingApplications,
          activeCertificates: 128, // This would come from certificates API
          pendingFeedback: 15 // This would come from feedback API
        },
        applications: applications || [],
        statusBreakdown: [
          { name: 'Pending', value: statusCounts.pending || 0, color: '#FF8F00' },
          { name: 'Under Review', value: statusCounts.under_review || 0, color: '#00796B' },
          { name: 'Approved', value: statusCounts.approved || 0, color: '#2E7D32' },
          { name: 'Rejected', value: statusCounts.rejected || 0, color: '#C62828' }
        ]
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getPendingApplications: async () => {
    return apiRequest('/api/admin/applications/pending');
  },

  updateApplicationStatus: async (id: string, status: string) => {
    return apiRequest(`/api/applications/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  revokeCertificate: async (id: string, reason: string) => {
    return apiRequest(`/api/certificates/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  getPendingFeedback: async () => {
    return apiRequest('/api/feedback/pending');
  },

  moderateFeedback: async (id: string, action: string) => {
    return apiRequest(`/api/feedback/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }
};

// Inspector API calls
export const inspectorApi = {
  getAssignedApplications: async () => {
    return apiRequest('/api/inspections/assigned');
  },

  getDashboardStats: async () => {
    try {
      const assignedApplications = await apiRequest('/api/inspections/assigned');
      
      // Process applications for stats
      const total = assignedApplications?.length || 0;
      const completed = assignedApplications?.filter((app: any) => app.status === 'completed').length || 0;
      const pending = assignedApplications?.filter((app: any) => app.status === 'pending').length || 0;
      const underReview = assignedApplications?.filter((app: any) => app.status === 'under_review').length || 0;

      return {
        stats: {
          totalInspections: total,
          completedInspections: completed,
          pendingInspections: pending,
          underReviewInspections: underReview
        },
        applications: assignedApplications || [],
        statusBreakdown: [
          { name: 'Pending', value: pending, color: '#FF8F00' },
          { name: 'Under Review', value: underReview, color: '#00796B' },
          { name: 'Completed', value: completed, color: '#2E7D32' }
        ]
      };
    } catch (error) {
      console.error('Error fetching inspector stats:', error);
      throw error;
    }
  },

  startInspection: async (id: string) => {
    return apiRequest(`/api/inspections/${id}/start`, {
      method: 'POST'
    });
  },

  completeInspection: async (id: string, data: any) => {
    return apiRequest(`/api/inspections/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  uploadPhoto: async (id: string, photo: File) => {
    const formData = new FormData();
    formData.append('photo', photo);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/inspections/${id}/photos`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || 'Photo upload failed');
    }

    return response.json();
  },

  getInspectionPhotos: async (id: string) => {
    return apiRequest(`/api/inspections/${id}/photos`);
  }
};

// Application API calls
export const applicationApi = {
  getById: async (id: string) => {
    return apiRequest(`/api/applications/${id}`);
  },

  getAll: async () => {
    return apiRequest('/api/applications');
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    return apiRequest(`/api/applications/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
  }
};

// Certificate API calls
export const certificateApi = {
  getById: async (id: string) => {
    return apiRequest(`/api/certificates/${id}`);
  },

  search: async (query: string) => {
    return apiRequest(`/api/certificates/search?q=${encodeURIComponent(query)}`);
  },

  revoke: async (id: string, reason: string) => {
    return apiRequest(`/api/certificates/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  getPdfData: async (certificateNumber: string) => {
    return apiRequest(`/api/certificates/${encodeURIComponent(certificateNumber)}/pdf`);
  }
};

// Verification API (public, no auth required)
export const verificationApi = {
  verifyCertificate: async (certificateNumber: string) => {
    return apiRequest(`/api/verify/${encodeURIComponent(certificateNumber)}`);
  }
};

// Utility functions for React Query
export const queryKeys = {
  adminStats: ['admin', 'stats'],
  adminPendingApplications: ['admin', 'applications', 'pending'],
  adminPendingFeedback: ['admin', 'feedback', 'pending'],
  inspectorStats: ['inspector', 'stats'],
  inspectorAssigned: ['inspector', 'assigned'],
  application: (id: string) => ['application', id],
  applications: ['applications'],
  certificate: (id: string) => ['certificate', id],
  verification: (certNumber: string) => ['verification', certNumber],
  inspectionPhotos: (id: string) => ['inspection', id, 'photos']
};

// Utility function to invalidate related queries
export const invalidateQueries = (keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

// Error handling utility
export const handleApiError = (error: any) => {
  if (error.message?.includes('401')) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  
  console.error('API Error:', error);
  return error.message || 'An unexpected error occurred';
};