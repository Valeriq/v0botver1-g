import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";

import Dashboard from "@/pages/Dashboard";
import Contacts from "@/pages/Contacts";
import Campaigns from "@/pages/Campaigns";
import AIProfiles from "@/pages/AIProfiles";
import Leads from "@/pages/Leads";
import GmailAccounts from "@/pages/GmailAccounts";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute><Contacts /></ProtectedRoute>
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute><Campaigns /></ProtectedRoute>
      </Route>
      <Route path="/ai-profiles">
        <ProtectedRoute><AIProfiles /></ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute><Leads /></ProtectedRoute>
      </Route>
      <Route path="/gmail-accounts">
        <ProtectedRoute><GmailAccounts /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
