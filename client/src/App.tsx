import { Switch, Route } from "wouter";
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
import InspectorDashboard from "./pages/inspector/Dashboard";
import ApplicationDetail from "./pages/inspector/ApplicationDetail";
import AdminDashboard from "./pages/admin/Dashboard";
import FeedbackModeration from "./pages/admin/FeedbackModeration";
import { useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const ProtectedRoute = ({ component: Component, role }: { component: React.ComponentType, role: string }) => {
    useEffect(() => {
      if (!user) {
        toast({
          title: "Unauthorized access",
          description: "Please log in to access this page",
          variant: "destructive"
        });
      } else if (user.role !== role && user.role !== 'admin') {
        toast({
          title: "Permission denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
      }
    }, [user]);
    
    return user && (user.role === role || user.role === 'admin') ? <Component /> : <NotFound />;
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
      <Route path="/inspector/dashboard">
        {() => <ProtectedRoute component={InspectorDashboard} role="inspector" />}
      </Route>
      <Route path="/inspector/application/:id">
        {() => <ProtectedRoute component={ApplicationDetail} role="inspector" />}
      </Route>
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} role="admin" />}
      </Route>
      <Route path="/admin/feedback">
        {() => <ProtectedRoute component={FeedbackModeration} role="admin" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col pattern-bg">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
