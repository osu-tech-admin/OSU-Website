import { useParams, useNavigate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { Show, Suspense, createSignal, createEffect } from "solid-js";
import { getPlayerBySlug } from "../services/playerService";
import { Button } from "../components/ui/button";

export default function PlayerDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { slug } = params;

  // Get player data
  const playerQuery = useQuery(() => ({
    queryKey: ["player", slug],
    queryFn: () => getPlayerBySlug(slug),
    retry: false,
    throwOnError: true
  }));

  // Handle navigation back to player list
  const goBackToList = () => {
    navigate("/players");
  };

  return (
    <div class="container mx-auto py-8">
      <Button variant="outline" onClick={goBackToList} class="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Players
      </Button>

      <Suspense
        fallback={<div class="py-12 text-center">Loading player data...</div>}
      >
        <Show
          when={!playerQuery.isLoading && playerQuery.data}
          fallback={<div class="py-12 text-center">Loading player data...</div>}
        >
          <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Player Image */}
            <div>
              <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div class="aspect-square overflow-hidden bg-muted">
                  {playerQuery.data.profile_picture ? (
                    <img
                      src={playerQuery.data.profile_picture}
                      alt={`${playerQuery.data.user.first_name} ${playerQuery.data.user.last_name}`}
                      class="h-full w-full object-cover"
                    />
                  ) : (
                    <div class="flex h-full w-full items-center justify-center bg-primary/10">
                      <span class="text-6xl font-semibold text-primary">
                        {`${playerQuery.data.user.first_name[0]}${playerQuery.data.user.last_name ? playerQuery.data.user.last_name[0] : ""}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player Info */}
            <div class="md:col-span-2">
              <h1 class="mb-2 text-3xl font-bold">
                {playerQuery.data.user.first_name}{" "}
                {playerQuery.data.user.last_name}
              </h1>

              <div class="mb-6 flex flex-wrap gap-2">
                <span
                  class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    playerQuery.data.gender === "M"
                      ? "bg-blue-100 text-blue-800"
                      : playerQuery.data.gender === "F"
                        ? "bg-pink-100 text-pink-800"
                        : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {playerQuery.data.gender === "M"
                    ? "Male"
                    : playerQuery.data.gender === "F"
                      ? "Female"
                      : "Other"}
                </span>

                {/* Role Badge */}
                <span
                  class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    playerQuery.data.preffered_role === "C"
                      ? "bg-green-100 text-green-800"
                      : playerQuery.data.preffered_role === "H"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {playerQuery.data.preffered_role === "C"
                    ? "Cutter"
                    : "Handler"}
                </span>

                {/* Throwing Hand Badge */}
                {playerQuery.data.throwing_hand && (
                  <span class="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    {playerQuery.data.throwing_hand === "L"
                      ? "Left-handed"
                      : "Right-handed"}
                  </span>
                )}
              </div>

              <div class="space-y-4">
                <div>
                  <h2 class="text-xl font-semibold">Player Details</h2>
                  <div class="mt-2 rounded-lg border border-border p-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p class="text-sm text-muted-foreground">
                          Preferred Role
                        </p>
                        <p>
                          {playerQuery.data.preffered_role === "C"
                            ? "Cutter"
                            : playerQuery.data.preffered_role === "H"
                              ? "Handler"
                              : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-muted-foreground">
                          Throwing Hand
                        </p>
                        <p>
                          {playerQuery.data.throwing_hand === "L"
                            ? "Left-handed"
                            : playerQuery.data.throwing_hand === "R"
                              ? "Right-handed"
                              : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-muted-foreground">Match Up</p>
                        <p>
                          {playerQuery.data.match_up === "M"
                            ? "Male matching"
                            : playerQuery.data.match_up === "F"
                              ? "Female matching"
                              : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </Suspense>
    </div>
  );
}
