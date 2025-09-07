import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type AuthUser = {
  id: number;
  username: string;
  role: string;
  email: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const { toast } = useToast();

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        
        if (storedToken) {
          const response = await fetch("/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // If token is invalid, remove it
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      
      const data = await response.json();
      
      // Save token to localStorage
      localStorage.setItem("token", data.token);
      setToken(data.token);
      
      // Set user state
      setUser(data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      if (!token) return;
      
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        setToken(data.token);
        // Update user data if provided
        if (data.user) {
          setUser(data.user);
        }
      } else {
        // If refresh fails, logout user
        logout();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
    }
  };

  // Set up token refresh interval (every 30 minutes)
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshToken();
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [token]);

  // Add axios-like interceptor for API calls
  useEffect(() => {
    if (token) {
      // Add token to all fetch requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [resource, config] = args;
        
        // Only add auth header to API calls
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
          const headers = config?.headers || {};
          headers['Authorization'] = `Bearer ${token}`;
          return originalFetch(resource, { ...config, headers });
        }
        
        return originalFetch(...args);
      };
      
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [token]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
