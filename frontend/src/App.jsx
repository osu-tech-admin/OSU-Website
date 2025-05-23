import { QueryClientProvider, QueryClient, useQuery } from "@tanstack/solid-query";
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
import Tournament from "./pages/Tournament";
import TournamentManager from "./pages/TournamentManager";
import TournamentSchedule from "./pages/TournamentSchedule";
import TournamentTeam from "./pages/TournamentTeam";
import TournamentStandings from "./pages/TournamentStandings";
import MatchDetails from "./pages/MatchDetails";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/players" component={PlayersList} />
        <Route path="/players/:slug" component={PlayerDetail} />
        {/* Tournament routes */}
        <Route path="/tournament/:slug" component={Tournament} />
        <Route path="/tournament/:slug/schedule" component={TournamentSchedule} />
        <Route path="/tournament/:slug/standings" component={TournamentStandings} />
        <Route path="/tournament/:tournament_slug/schedule/match/:match_id" component={MatchDetails}/>
        {/* <Route path="/tournament/:slug/rules" component={Tournament} /> */}
        <Route path="/tournament/:tournament_slug/team/:team_slug" component={TournamentTeam} />
        {/* Authenticated routes */}
        {/* <AuthenticatedRoute path="/tournament-manager" component={TournamentManager} /> */}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
