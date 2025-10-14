import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Features from "./components/Features";
import Blog from "./components/Blog";
import About from "./components/About";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import PublicProfile from "./components/PublicProfile";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = () => {
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await signOut();
    setShowAuth(false);
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleSignIn = () => {
    setShowAuth(true);
  };

  // Debug logging
  console.log('App render state:', { loading, isAuthenticated, showAuth });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold">Loading application...</div>
          <div className="text-sm text-muted-foreground mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : showAuth ? (
              <Auth onLogin={handleLogin} />
            ) : (
              <Home onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
            )
          }
        />
        <Route
          path="/features"
          element={<Features onGetStarted={handleGetStarted} />}
        />
        <Route
          path="/blog"
          element={<Blog />}
        />
        <Route
          path="/about"
          element={<About />}
        />
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/talent/:userId"
          element={<PublicProfile />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
