import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Apply from "./pages/Apply";
import Verify from "./pages/Verify";
import Certificate from "./pages/Certificate";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import InspectorDashboard from "./pages/inspector/Dashboard";
import ApplicationDetail from "./pages/inspector/ApplicationDetail";
import AdminDashboard from "./pages/admin/Dashboard";
import FeedbackModeration from "./pages/admin/FeedbackModeration";
import Applications from "./pages/admin/Applications";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Define this component outside of AppRouter to avoid context errors
const ProtectedRouteWrapper = ({ component: Component, roles, ...rest }: any) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!user) {
    toast({
      title: "Access denied",
      description: "You must be logged in to access this page",
      variant: "destructive"
    });
    return <Redirect to="/login" />;
  }
  
  if (roles && !roles.includes(user.role)) {
    toast({
      title: "Permission denied",
      description: "You don't have permission to access this page",
      variant: "destructive"
    });
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

function AppRouter() {
  // No auth hook usage here - we'll use it in the ProtectedRouteWrapper
  const { toast } = useToast();
  
  // Protected route component
  const ProtectedRoute = ({ component: Component, roles, ...rest }: any) => {
    if (!user) {
      toast({
        title: "Access denied",
        description: "You must be logged in to access this page",
        variant: "destructive"
      });
      return <Redirect to="/login" />;
    }
    
    if (roles && !roles.includes(user.role)) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
      return <Redirect to="/" />;
    }
    
    return <Component {...rest} />;
  };
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/apply" component={Apply} />
      <Route path="/verify" component={Verify} />
      <Route path="/certificate/:id" component={Certificate} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/login" component={Login} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} roles={['admin']} />
      </Route>
      <Route path="/admin/applications">
        <ProtectedRoute component={Applications} roles={['admin']} />
      </Route>
      <Route path="/admin/feedback">
        <ProtectedRoute component={FeedbackModeration} roles={['admin']} />
      </Route>
      
      {/* Inspector Routes */}
      <Route path="/inspector/dashboard">
        <ProtectedRoute component={InspectorDashboard} roles={['inspector']} />
      </Route>
      <Route path="/inspector/application/:id">
        <ProtectedRoute component={ApplicationDetail} roles={['inspector']} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col pattern-bg">
              <Header />
              <main className="flex-grow">
                <AppRouter />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
