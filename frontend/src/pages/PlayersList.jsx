import { createSignal, createEffect, Show, For, Suspense } from "solid-js";
import { useSearchParams, useNavigate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { getPlayers } from "../services/playerService";
import { Button } from "../components/ui/button";

const genderOptions = [
  { value: "", label: "All Genders" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" }
];

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "C", label: "Cutter" },
  { value: "H", label: "Handler" }
];

export default function PlayersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter values from URL or defaults for form inputs
  const [searchInput, setSearchInput] = createSignal(searchParams.search || "");
  const [genderInput, setGenderInput] = createSignal(searchParams.gender || "");
  const [roleInput, setRoleInput] = createSignal(searchParams.role || "");

  // Values that will be used for actual filtering (applied only when button is clicked)
  const [search, setSearch] = createSignal(searchParams.search || "");
  const [gender, setGender] = createSignal(searchParams.gender || "");
  const [role, setRole] = createSignal(searchParams.role || "");
  const [sort, setSort] = createSignal("name");
  const [order, setOrder] = createSignal("asc");
  const [page, setPage] = createSignal(parseInt(searchParams.page || "1", 10));

  const ITEMS_PER_PAGE = 20;

  // Update query parameters when applied filter values change
  createEffect(() => {
    setSearchParams({
      search: search(),
      gender: gender(),
      role: role(),
      sort: sort(),
      order: order(),
      page: page().toString()
    });
  });

  // Fetch players data with the applied filters
  const playersQuery = useQuery(() => ({
    queryKey: ["players", search(), gender(), role(), sort(), order(), page()],
    queryFn: () =>
      getPlayers({
        search: search(),
        gender: gender(),
        role: role(),
        sort: sort(),
        order: order(),
        limit: ITEMS_PER_PAGE,
        offset: (page() - 1) * ITEMS_PER_PAGE
      })
  }));

  // Handle form submission - apply filters
  const handleSubmit = event => {
    event.preventDefault();
    // Apply the input values to the actual filter values
    setSearch(searchInput());
    setGender(genderInput());
    setRole(roleInput());
    setPage(1); // Reset to first page when filters change
  };

  // Navigate to player details
  const viewPlayer = slug => {
    navigate(`/players/${slug}`);
  };

  // Function to get most recent registration
  const getLatestRegistration = registrations => {
    if (!registrations || registrations.length === 0) return null;
    // Could sort by tournament date if available, but for now just return the first one
    return registrations[0];
  };

  return (
    <div class="mx-auto w-auto px-8 py-8">
      <h1 class="mb-8 text-3xl font-bold text-blue-950">Players</h1>

      {/* Search and Filters */}
      <form onSubmit={handleSubmit} class="mb-8">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div class="md:col-span-1">
            <label
              for="search"
              class="block text-sm font-medium text-muted-foreground"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name..."
              value={searchInput()}
              onInput={e => setSearchInput(e.target.value)}
              class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Gender Filter */}
          <div>
            <label
              for="gender"
              class="block text-sm font-medium text-muted-foreground"
            >
              Gender
            </label>
            <select
              id="gender"
              value={genderInput()}
              onChange={e => setGenderInput(e.target.value)}
              class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <For each={genderOptions}>
                {option => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label
              for="role"
              class="block text-sm font-medium text-muted-foreground"
            >
              Role
            </label>
            <select
              id="role"
              value={roleInput()}
              onChange={e => setRoleInput(e.target.value)}
              class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <For each={roleOptions}>
                {option => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <Button
            type="submit"
            variant="default"
            class="bg-blue-950 text-white hover:bg-blue-950/90"
          >
            Apply Filters
          </Button>
        </div>
      </form>

      {/* Players List */}
      <Suspense
        fallback={<div class="py-12 text-center">Loading players...</div>}
      >
        <Show
          when={!playersQuery.isLoading}
          fallback={<div class="py-12 text-center">Loading players...</div>}
        >
          <Show
            when={playersQuery.data?.players?.length > 0}
            fallback={
              <div class="py-12 text-center">
                No players found matching your criteria.
              </div>
            }
          >
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <For each={playersQuery.data?.players}>
                {player => {
                  const latestReg = getLatestRegistration(player.registrations);
                  return (
                    <div
                      class="cursor-pointer overflow-hidden rounded-lg border border-blue-950 bg-blue-950 text-white shadow-sm transition-all hover:shadow-md"
                      onClick={() => viewPlayer(player.slug)}
                    >
                      <div class="aspect-square overflow-hidden bg-muted">
                        {player.profile_picture ? (
                          <img
                            src={player.profile_picture}
                            alt={player.name}
                            class="h-full w-full object-cover"
                          />
                        ) : (
                          <div class="flex h-full w-full items-center justify-center bg-primary/10">
                            <span class="text-4xl font-semibold text-primary">
                              {player.name
                                .split(" ")
                                .map(n => n[0])
                                .join("")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div class="flex flex-col space-y-3 p-4">
                        <div class="flex items-center justify-between">
                          <h3 class="text-lg font-semibold">{player.name}</h3>
                          <div class="flex flex-wrap gap-2">
                            <span
                            class={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${
                              player.gender === "M"
                                ? "bg-blue-100 text-blue-800"
                                : player.gender === "F"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {player.gender === "M"
                              ? "Male"
                              : player.gender === "F"
                                ? "Female"
                                : "Other"}
                          </span>
                          <span
                            class={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${
                              player.preffered_role === "C"
                                ? "bg-green-100 text-green-800"
                                : player.preffered_role === "H"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {player.preffered_role === "C"
                              ? "Cutter"
                              : player.preffered_role === "H"
                                ? "Handler"
                                : "No Role"}
                            </span>
                          </div>
                        </div>

                        {/* Registration Info */}
                        <Show when={latestReg}>
                          <div class="mt-2 border-t border-blue-900 pt-3">
                            <div class="flex items-center gap-2">
                              {latestReg.team.logo ? (
                                <img
                                  src={latestReg.team.logo}
                                  alt={latestReg.team.name}
                                  class="h-6 w-6 rounded-full object-cover"
                                />
                              ) : (
                                <div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-800 text-xs font-bold">
                                  {latestReg.team.name.charAt(0)}
                                </div>
                              )}
                              <span class="font-medium">
                                {latestReg.team.name}
                              </span>
                            </div>
                            <div class="mt-1 flex items-center justify-between text-sm text-blue-200">
                              <span>{latestReg.tournament.name}</span>
                              <Show when={latestReg.sold_price}>
                                <span class="font-semibold text-blue-100">
                                  ₹{latestReg.sold_price}
                                </span>
                              </Show>
                            </div>
                          </div>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>

            {/* Pagination */}
            <div class="mt-8 flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Showing {(page() - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(page() * ITEMS_PER_PAGE, playersQuery.data.total)} of{" "}
                {playersQuery.data.total} players
              </div>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page() === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page() * ITEMS_PER_PAGE >= playersQuery.data.total}
                >
                  Next
                </Button>
              </div>
            </div>
          </Show>
        </Show>
      </Suspense>
    </div>
  );
}
