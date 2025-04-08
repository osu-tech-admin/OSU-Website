import { ErrorBoundary } from "solid-js";
import { Navigate, Route } from "@solidjs/router";
import { Suspense } from "solid-js";
import { useQuery } from "@tanstack/solid-query";

export default function AuthenticatedRoute(props) {
  const userQuery = useQuery(() => ({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await fetch("/api/user/me");
      if (!result.ok) throw new Error("Failed to fetch data");
      return result.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    throwOnError: true // Throw an error if the query fails
  }));

  return (
    <ErrorBoundary
      fallback={
        <Route
          path="/redirect"
          component={() => <Navigate href="/login" />}
        />
      }
    >
      <Suspense fallback={<div>Loading...</div>}>
        <Route {...props} data={userQuery.data} />
      </Suspense>
    </ErrorBoundary>
  );
}
