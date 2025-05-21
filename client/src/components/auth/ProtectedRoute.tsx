import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, roles }) => {
  const { toast } = useToast();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        // For admin pages, we'll use a direct token check
        const token = localStorage.getItem("token");
        
        if (!token) {
          toast({
            title: "Access denied",
            description: "You must be logged in to access this page",
            variant: "destructive"
          });
          setRedirectTo("/login");
          return;
        }
        
        // This will use the token from localStorage
        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Verify role check
          if (roles && !roles.includes(data.user.role)) {
            toast({
              title: "Permission denied",
              description: "You don't have permission to access this page",
              variant: "destructive"
            });
            setRedirectTo("/");
            return;
          }
          
          // All checks passed
          setVerified(true);
        } else {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please login again.",
            variant: "destructive"
          });
          setRedirectTo("/login");
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        toast({
          title: "Authentication error",
          description: "There was an error verifying your credentials",
          variant: "destructive"
        });
        setRedirectTo("/login");
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuthentication();
  }, []);
  
  if (redirectTo) {
    return <Redirect to={redirectTo} />;
  }
  
  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
            <div className="h-6 w-6 bg-primary/40 rounded-full"></div>
          </div>
        </div>
        <p className="text-gray-500">Verifying your credentials...</p>
      </div>
    );
  }
  
  if (!verified) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
};

export default ProtectedRoute;