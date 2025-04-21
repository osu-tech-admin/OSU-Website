import { A, useParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { trophy } from "solid-heroicons/solid";
import { createEffect, createSignal, For, Show } from "solid-js";

import {
  fetchBracketsBySlug,
//   fetchCrossPoolBySlug,
  fetchPoolsBySlug,
//   fetchPositionPoolsBySlug,
  fetchTournamentBySlug
} from "../queries";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { makeTitle } from "~/utils";

const TournamentStandings = () => {
  const params = useParams();
  const [teamsMap, setTeamsMap] = createSignal({});
  const [poolsMap, setPoolsMap] = createSignal({});
//   const [positionPoolsMap, setPositionPoolsMap] = createSignal({});

  const tournamentQuery = useQuery(() => ({
    queryKey: ["tournaments", params.slug],
    queryFn: () => fetchTournamentBySlug(params.slug)
  }));
  const poolsQuery = useQuery(() => ({
    queryKey: ["pools", params.slug],
    queryFn: () => fetchPoolsBySlug(params.slug)
  }));
//   const crossPoolQuery = createQuery(
//     () => ["cross-pool", params.slug],
//     () => fetchCrossPoolBySlug(params.slug)
//   );
  const bracketQuery = useQuery(() => ({
    queryKey: ["brackets", params.slug],
    queryFn: () => fetchBracketsBySlug(params.slug)
  }));
//   const postionPoolsQuery = createQuery(
//     () => ["position-pools", params.slug],
//     () => fetchPositionPoolsBySlug(params.slug)
//   );

  createEffect(() => {
    if (tournamentQuery.status === "success" && !tournamentQuery.data.message) {
      let newTeamsMap = {};
      tournamentQuery.data?.teams.map(team => {
        newTeamsMap[team.id] = team;
      });
      setTeamsMap(newTeamsMap);
    }
  });

  createEffect(() => {
    if (poolsQuery.status === "success") {
      let newPoolsMap = {};
      poolsQuery.data.map(pool => {
        let results = JSON.parse(JSON.stringify(pool.results));
        Object.keys(results).map(
          team_id => (results[team_id]["team_id"] = team_id)
        );
        results = Object.values(results);
        results.sort((a, b) => parseInt(a.rank) - parseInt(b.rank));

        const seeds_in_pool = Object.keys(pool.initial_seeding).sort(
          (a, b) => parseInt(a) - parseInt(b)
        );

        results.map((result, i) => (result["seed"] = seeds_in_pool[i]));
        

        newPoolsMap[pool.name] = results;
      });

      setPoolsMap(newPoolsMap);
    }
  });

//   createEffect(() => {
//     if (postionPoolsQuery.status === "success") {
//       let newPoolsMap = {};
//       postionPoolsQuery.data.map(pool => {
//         let results = pool.results;
//         Object.keys(results).map(
//           team_id => (results[team_id]["team_id"] = team_id)
//         );
//         results = Object.values(results);
//         results.sort((a, b) => parseInt(a.rank) - parseInt(b.rank));

//         const seeds_in_pool = Object.keys(pool.initial_seeding).sort(
//           (a, b) => parseInt(a) - parseInt(b)
//         );

//         results.map((result, i) => (result["seed"] = seeds_in_pool[i]));

//         newPoolsMap[pool.name] = results;
//       });

//       setPositionPoolsMap(newPoolsMap);
//     }
//   });

  const getTeamImage = team => {
    return team?.image ?? team?.image_url;
  };

  return (
    <Show
      when={!tournamentQuery.data?.message}
      fallback={
        <div>
          Tournament could not be fetched. Error -{" "}
          {tournamentQuery.data.message}
          <A href={"/tournaments"} class="text-blue-600 dark:text-blue-500">
            <br />
            Back to Tournaments Page
          </A>
        </div>
      }
    >
      <div class="min-h-screen bg-background px-4 py-4">
        <Breadcrumb class="w-fit rounded-lg">
          <BreadcrumbList>
            {/* <BreadcrumbItem>
              <BreadcrumbLink href="/tournaments">
                <span class="flex rounded-lg px-2 text-base outline outline-1 outline-offset-2 outline-gray-400">
                  <Icon
                    path={trophy}
                    class="inline h-5 w-5 place-self-center"
                  />
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="mx-1" /> */}
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/tournament/${tournamentQuery.data?.slug}`}
              >
                <span class="rounded-lg px-2 text-base outline outline-1 outline-offset-2 outline-gray-400">
                  {makeTitle(tournamentQuery.data?.slug || "")}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="mx-1" />
            <BreadcrumbItem>
              <BreadcrumbLink current>
                <span class="outline-foreround rounded-lg px-2 text-base outline outline-1 outline-offset-2">
                  Standings
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 class="mt-4 text-left sm:text-center">
          <span class="w-fit text-2xl font-extrabold">Standings</span>
        </h1>

        <Tabs defaultValue="pools-tab" class="mt-2 w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger class="text-sm md:text-base" value={"pools-tab"}>
              Pools
            </TabsTrigger>
            <TabsTrigger class="text-sm md:text-base" value={"brackets-tab"}>
              Brackets
            </TabsTrigger>
          </TabsList>

          <TabsContent value={"pools-tab"}>
            <For each={Object.keys(poolsMap())}>
              {poolName => (
                <div>
                  <h2 class="text-center text-lg">Pool {poolName}</h2>

                  <div class="relative my-5 overflow-x-auto rounded-lg shadow-lg">
                    <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" class="px-3 py-3">
                            Seed
                          </th>
                          <th scope="col" class="px-3 py-3">
                            Team
                          </th>
                          <th scope="col" class="px-3 py-3">
                            W
                          </th>
                          <th scope="col" class="px-3 py-3">
                            L
                          </th>
                          <th scope="col" class="px-3 py-3">
                            D
                          </th>
                          <th scope="col" class="px-3 py-3">
                            GD
                          </th>
                          <th scope="col" class="px-3 py-3">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={poolsMap()[poolName]}>
                          {result => (
                            <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                              <td class="px-3 py-4">{result.seed}</td>
                              <td class="px-3 py-4">
                                <A
                                  href={`/tournament/${params.slug}/team/${
                                    teamsMap()[result.team_id]?.slug
                                  }`}
                                >
                                  {teamsMap()[result.team_id]?.name}
                                </A>
                              </td>
                              <td class="px-3 py-4">{result.wins}</td>
                              <td class="px-3 py-4">{result.losses}</td>
                              <td class="px-3 py-4">{result.draws}</td>
                              <td class="px-3 py-4">
                                {parseInt(result["GF"]) -
                                  parseInt(result["GA"])}
                              </td>
                              <td class="px-3 py-4">{3*result.wins + result.draws}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </For>
          </TabsContent>
          <TabsContent value={"brackets-tab"}>
            <For each={bracketQuery.data}>
              {bracket => (
                <div>
                  <h2 class="mt-4 text-center text-lg font-bold text-blue-600 dark:text-blue-500">
                    Bracket {bracket.name}
                  </h2>
                  <Show
                    when={
                      Object.keys(bracket.initial_seeding || {}).length > 0 &&
                      bracket.initial_seeding[
                        Object.keys(bracket.initial_seeding)[0]
                      ] > 0
                    }
                    fallback={
                      <p class="my-5 text-center text-sm">
                        This Bracket is not generated yet!
                      </p>
                    }
                  >
                    <h2 class="mt-5 text-center text-lg">Initial Standings</h2>
                    <div class="relative mt-5 overflow-x-auto rounded-lg shadow-md">
                      <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <tbody>
                          <For
                            each={Object.entries(bracket.initial_seeding || {})}
                          >
                            {([rank, team_id]) => (
                              <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                                <th
                                  scope="row"
                                  class="whitespace-nowrap py-4 pl-10 pr-6 font-normal"
                                >
                                  {rank}
                                </th>
                                <Show when={team_id > 0}>
                                  <td class="px-6 py-4">
                                    <img
                                      class="mr-3 inline-block h-8 w-8 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                                      src={getTeamImage(teamsMap()[team_id])}
                                      alt="Bordered avatar"
                                    />
                                    <A
                                      href={`/tournament/${params.slug}/team/${
                                        teamsMap()[team_id]?.slug
                                      }`}
                                    >
                                      {teamsMap()[team_id]?.name}
                                    </A>
                                  </td>
                                </Show>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                    <h2 class="mt-5 text-center text-lg">Current Standings</h2>
                    <div class="relative mt-5 overflow-x-auto rounded-lg shadow-md">
                      <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <tbody>
                          <For
                            each={Object.entries(bracket.current_seeding || {})}
                          >
                            {([rank, team_id]) => (
                              <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                                <th
                                  scope="row"
                                  class="whitespace-nowrap py-4 pl-10 pr-6 font-normal"
                                >
                                  {rank}
                                </th>
                                <Show when={team_id > 0}>
                                  <td class="px-6 py-4">
                                    <img
                                      class="mr-3 inline-block h-8 w-8 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                                      src={getTeamImage(teamsMap()[team_id])}
                                      alt="Bordered avatar"
                                    />
                                    <A
                                      href={`/tournament/${params.slug}/team/${
                                        teamsMap()[team_id]?.slug
                                      }`}
                                    >
                                      {teamsMap()[team_id]?.name}
                                    </A>
                                  </td>
                                </Show>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </TabsContent>
        </Tabs>
        {/* <div id="myTabContent">
          <Show when={!crossPoolQuery.data?.message}>
            <div
              class="hidden rounded-lg p-4"
              id={"cross-pool"}
              role="tabpanel"
              aria-labelledby={"tab-cross-pool"}
            >
              <Show
                when={
                  Object.keys(crossPoolQuery.data?.initial_seeding || {})
                    .length > 0
                }
                fallback={
                  <p>Cross Pool stage in the tournament is not reached yet!</p>
                }
              >
                <h2 class="mt-5 text-center text-xl font-bold">
                  Initial Standings
                </h2>
                <div class="relative mt-5 overflow-x-auto rounded-lg shadow-md">
                  <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <tbody>
                      <For
                        each={Object.entries(
                          crossPoolQuery.data?.initial_seeding || {}
                        )}
                      >
                        {([rank, team_id]) => (
                          <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                            <th
                              scope="row"
                              class="whitespace-nowrap py-4 pl-10 pr-6 font-normal"
                            >
                              {rank}
                            </th>
                            <td class="px-6 py-4">
                              <img
                                class="mr-3 inline-block h-8 w-8 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                                src={getTeamImage(teamsMap()[team_id])}
                                alt="Bordered avatar"
                              />
                              <A
                                href={`/tournament/${params.slug}/team/${
                                  teamsMap()[team_id]?.slug
                                }`}
                              >
                                {teamsMap()[team_id]?.name}
                              </A>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
                <h2 class="mt-5 text-center text-xl font-bold">
                  Current Standings
                </h2>
                <div class="relative mt-5 overflow-x-auto rounded-lg shadow-md">
                  <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <tbody>
                      <For
                        each={Object.entries(
                          crossPoolQuery.data?.current_seeding || {}
                        )}
                      >
                        {([rank, team_id]) => (
                          <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                            <th
                              scope="row"
                              class="whitespace-nowrap py-4 pl-10 pr-6 font-normal"
                            >
                              {rank}
                            </th>
                            <td class="px-6 py-4">
                              <img
                                class="mr-3 inline-block h-8 w-8 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                                src={getTeamImage(teamsMap()[team_id])}
                                alt="Bordered avatar"
                              />
                              <A
                                href={`/tournament/${params.slug}/team/${
                                  teamsMap()[team_id]?.slug
                                }`}
                              >
                                {teamsMap()[team_id]?.name}
                              </A>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </Show>
          <div
            class="hidden rounded-lg p-4"
            id={"brackets"}
            role="tabpanel"
            aria-labelledby={"tab-brackets"}
          >
            <For each={Object.keys(positionPoolsMap())}>
              {poolName => (
                <div class="mt-5">
                  <h2 class="text-center text-lg">Position Pool {poolName}</h2>

                  <div class="relative my-5 overflow-x-auto rounded-lg shadow-lg">
                    <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" class="px-4 py-3">
                            Seed
                          </th>
                          <th scope="col" class="px-4 py-3">
                            Team
                          </th>
                          <th scope="col" class="px-4 py-3">
                            W
                          </th>
                          <th scope="col" class="px-4 py-3">
                            L
                          </th>
                          <th scope="col" class="px-4 py-3">
                            GD
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={positionPoolsMap()[poolName]}>
                          {result => (
                            <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                              <td class="px-4 py-4">{result.seed}</td>
                              <td class="px-4 py-4">
                                <A
                                  href={`/tournament/${params.slug}/team/${
                                    teamsMap()[result.team_id]?.slug
                                  }`}
                                >
                                  {teamsMap()[result.team_id]?.name}
                                </A>
                              </td>
                              <td class="px-4 py-4">{result.wins}</td>
                              <td class="px-4 py-4">{result.losses}</td>
                              <td class="px-4 py-4">
                                {parseInt(result["GF"]) -
                                  parseInt(result["GA"])}
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div> */}
      </div>
    </Show>
  );
};

export default TournamentStandings;
