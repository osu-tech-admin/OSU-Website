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

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "gender", label: "Gender" },
  { value: "city", label: "City" },
  { value: "role", label: "Role" }
];

export default function PlayersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter values from URL or defaults
  const [search, setSearch] = createSignal(searchParams.search || "");
  const [gender, setGender] = createSignal(searchParams.gender || "");
  const [role, setRole] = createSignal(searchParams.role || "");
  const [sort, setSort] = createSignal(searchParams.sort || "name");
  const [order, setOrder] = createSignal(searchParams.order || "asc");
  const [page, setPage] = createSignal(parseInt(searchParams.page || "1", 10));

  const ITEMS_PER_PAGE = 20;

  // Update query parameters when filters change
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

  // Fetch players data
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

  // Handle form submission
  const handleSubmit = event => {
    event.preventDefault();
    setPage(1); // Reset to first page when filters change
  };

  // Navigate to player details
  const viewPlayer = slug => {
    navigate(`/players/${slug}`);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setOrder(order() === "asc" ? "desc" : "asc");
  };

  return (
    <div class="container mx-auto py-8">
      <h1 class="mb-8 text-3xl font-bold">Players Directory</h1>

      {/* Search and Filters */}
      <form onSubmit={handleSubmit} class="mb-8">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Search */}
          <div class="md:col-span-2">
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
              value={search()}
              onInput={e => setSearch(e.target.value)}
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
              value={gender()}
              onChange={e => setGender(e.target.value)}
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
              value={role()}
              onChange={e => setRole(e.target.value)}
              class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <For each={roleOptions}>
                {option => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label
              for="sort"
              class="block text-sm font-medium text-muted-foreground"
            >
              Sort By
            </label>
            <div class="mt-1 flex">
              <select
                id="sort"
                value={sort()}
                onChange={e => setSort(e.target.value)}
                class="w-full rounded-l-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <For each={sortOptions}>
                  {option => (
                    <option value={option.value}>{option.label}</option>
                  )}
                </For>
              </select>
              <button
                type="button"
                onClick={toggleSortOrder}
                class="flex items-center justify-center rounded-r-md border border-l-0 border-input bg-background px-3 focus:outline-none"
              >
                {order() === "asc" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <Button type="submit" variant="default">
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
                {player => (
                  <div
                    class="cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md"
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
                    <div class="p-4">
                      <h3 class="font-semibold">{player.name}</h3>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {player.gender === "M"
                            ? "Male"
                            : player.gender === "F"
                              ? "Female"
                              : "Other"}
                        </span>
                        {player.preffered_role && (
                          <span class="inline-flex items-center rounded-full bg-secondary/20 px-2 py-1 text-xs font-medium text-secondary-foreground">
                            {player.preffered_role === "C"
                              ? "Cutter"
                              : "Handler"}
                          </span>
                        )}
                      </div>
                      <p class="mt-2 text-sm text-muted-foreground">
                        {player.city}
                      </p>
                    </div>
                  </div>
                )}
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
