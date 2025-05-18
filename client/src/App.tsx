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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function Router() {
  // Simple router without auth checks for now
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
                <Router />
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
