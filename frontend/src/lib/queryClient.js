import { QueryClient } from "@tanstack/solid-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors (like network issues)
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
    },
    mutations: {
      // Don't retry mutations by default
      retry: false
    }
  }
});
