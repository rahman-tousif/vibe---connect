import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import ChatPage from "@/pages/chat";
import HomePage from "@/pages/home";
import GroupsPage from "@/pages/groups";
import WatchPartyPage from "@/pages/watch-party";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/join" component={LandingPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/watch/:id" component={WatchPartyPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
