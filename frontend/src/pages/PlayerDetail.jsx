import { useParams, useNavigate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { Show, Suspense, createSignal, createEffect, For } from "solid-js";
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

  // Function to render role badge based on role code
  const getRoleBadge = role => {
    switch (role) {
      case "DFLT":
        return "Player";
      case "CAP":
        return "Captain";
      case "SCAP":
        return "Spirit Captain";
      case "COACH":
        return "Coach";
      case "OWNER":
        return "Owner";
      default:
        return "Player";
    }
  };

  return (
    <div class="mx-auto w-full px-8 py-8">
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

              <div class="space-y-6">
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

                {/* Registrations Section */}
                <Show
                  when={
                    playerQuery.data.registrations &&
                    playerQuery.data.registrations.length > 0
                  }
                >
                  <div>
                    <h2 class="text-xl font-semibold text-blue-950">
                      Participated Tournaments
                    </h2>
                    <div class="mt-2 space-y-4">
                      <For each={playerQuery.data.registrations}>
                        {registration => (
                          <div class="overflow-hidden rounded-lg border border-blue-950 bg-blue-950 text-white shadow-sm">
                            {/* Tournament Banner */}
                            <div class="relative h-28 w-full overflow-hidden bg-gray-100">
                              {registration.tournament.banner ? (
                                <img
                                  src={registration.tournament.banner}
                                  alt={registration.tournament.name}
                                  class="h-full w-full object-cover"
                                />
                              ) : (
                                <div class="flex h-full w-full items-center justify-center bg-blue-950/20 text-center">
                                  <span class="font-medium text-muted-foreground">
                                    {registration.tournament.name}
                                  </span>
                                </div>
                              )}
                              {/* Tournament Name Overlay */}
                              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <h3 class="text-lg font-bold text-white">
                                  {registration.tournament.name}
                                </h3>
                              </div>
                            </div>
                            <div class="p-4">
                              {/* Team Info */}
                              <div class="flex items-center gap-3">
                                <div class="flex-shrink-0">
                                  {registration.team.logo ? (
                                    <img
                                      src={registration.team.logo}
                                      alt={registration.team.name}
                                      class="h-10 w-10 rounded-full border border-gray-200 object-cover"
                                    />
                                  ) : (
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 text-sm font-bold text-white">
                                      {registration.team.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p class="font-semibold">
                                    {registration.team.name}
                                  </p>
                                  <p class="text-sm text-muted-foreground">
                                    <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                      {getRoleBadge(registration.role)}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Price Info */}
                              <div class="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                                <div>
                                  <p class="text-xs text-blue-100">
                                    Base Price
                                  </p>
                                  <p class="text-lg font-medium">
                                    {registration.base_price
                                      ? `₹${registration.base_price}`
                                      : "N/A"}
                                  </p>
                                </div>
                                <div class="text-right">
                                  <p class="text-xs text-blue-100">
                                    Sold Price
                                  </p>
                                  <p class="text-lg font-medium text-green-600">
                                    {registration.sold_price
                                      ? `₹${registration.sold_price}`
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Suspense>
    </div>
  );
}
