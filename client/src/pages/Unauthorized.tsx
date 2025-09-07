import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, Home, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="container py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {user ? (
                <>
                  You are logged in as <span className="font-medium">{user.username}</span> 
                  {user.role && <> with role <span className="font-medium">{user.role}</span></>}.
                  This page requires different permissions.
                </>
              ) : (
                "You need to be logged in with the appropriate permissions to access this page."
              )}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleGoHome}
              className="w-full"
              variant="default"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
            
            {user && (
              <Button 
                onClick={handleLogout}
                className="w-full"
                variant="outline"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout and Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}