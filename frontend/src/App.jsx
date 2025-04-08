import { QueryClientProvider, useQuery } from "@tanstack/solid-query";
import { queryClient } from "./lib/queryClient";
import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import "./App.css";
import { ErrorBoundary } from "solid-js";
import AuthenticatedRoute from "./components/auth/AuthenticatedRoute";
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        {/* Authenticated routes */}
        <AuthenticatedRoute path="/dashboard" component={Home} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
