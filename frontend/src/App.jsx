import { QueryClientProvider, useQuery } from "@tanstack/solid-query";
import { queryClient } from "./lib/queryClient";
import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import "./App.css";
import { ErrorBoundary } from "solid-js";
import AuthenticatedRoute from "./components/auth/AuthenticatedRoute";
import Layout from "./components/Layout";
import PlayersList from "./pages/PlayersList";
import PlayerDetail from "./pages/PlayerDetail";
import TournamentManager from "./pages/TournamentManager";
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/players" component={PlayersList} />
        <Route path="/players/:slug" component={PlayerDetail} />
        {/* Authenticated routes */}
        <AuthenticatedRoute path="/tournament-manager" component={TournamentManager} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
