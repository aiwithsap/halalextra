import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  children, 
  roles, 
  redirectTo = "/login" 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Verifying your credentials...</p>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }
  
  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <a href="/" className="text-primary hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }
  
  // User is authenticated and authorized
  if (Component) {
    return <Component />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;