
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";
import RotateToLandscape from "./components/RotateToLandscape";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NavBar from "./components/NavBar";
import AuthCallback from "./components/AuthCallback";
import { GraphProvider } from "./context/GraphContext";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <GraphProvider>
            <Toaster />
            <Sonner />
            <RotateToLandscape />
            
            {showSplash ? (
              <SplashScreen onComplete={handleSplashComplete} />
            ) : (
              <div className="flex flex-col h-screen">
                <NavBar />
                <div className="flex-1">
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </div>
              </div>
            )}
          </GraphProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
