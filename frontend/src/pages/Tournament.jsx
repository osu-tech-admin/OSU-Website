import { A, useParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { Icon } from "solid-heroicons";
import {
  mapPin,
  calendarDays,
  trophy,
  arrowUpRight
} from "solid-heroicons/solid";
// import { map, mapPin, calendarDays } from "solid-heroicons/outline";
import {
  createEffect,
  createSignal,
  For,
  Match,
  Show,
  Suspense,
  Switch
} from "solid-js";

import { fetchTournamentBySlug } from "../queries";
// import { ifTodayInBetweenDates } from "../utils";
// import Breadcrumbs from "./Breadcrumbs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { BadgeDelta } from "~/components/ui/badge-delta";
import { Separator } from "~/components/ui/separator";

/**
 * @param {object} props
 * @param {number} props.currentSeed
 * @param {number} props.initialSeed
 */
const TeamSeedingChange = props => {
  return (
    <Switch>
      <Match when={props.currentSeed < props.initialSeed}>
        <BadgeDelta deltaType="increase" class="px-1">
          {props.initialSeed - props.currentSeed}
        </BadgeDelta>
      </Match>
      <Match when={props.currentSeed > props.initialSeed}>
        <BadgeDelta deltaType="decrease" class="px-1">
          {props.currentSeed - props.initialSeed}
        </BadgeDelta>
      </Match>
      <Match when={props.currentSeed == props.initialSeed}>
        <BadgeDelta deltaType="unchanged" />
      </Match>
    </Switch>
  );
};

const Tournament = () => {
  const params = useParams();
  const [teamsMap, setTeamsMap] = createSignal({});
  const [teamsInitialSeeding, setTeamsInitialSeeding] = createSignal(undefined);
  const [playingTeam, setPlayingTeam] = createSignal(null);

  const tournamentQuery = useQuery(() => ({
    queryKey: ["tournaments", params.slug],
    queryFn: () => fetchTournamentBySlug(params.slug)
  }));

  // const userAccessQuery = useQuery(
  //   () => ["user-access", params.slug],
  //   () => fetchUserAccessByTournamentSlug(params.slug)
  // );

  // createEffect(() => {
  //   if (userAccessQuery.status == "success") {
  //     const playingTeamID = userAccessQuery.data?.playing_team_id;
  //     if (playingTeamID !== 0) {
  //       setPlayingTeam(teamsMap()[playingTeamID]);
  //     }
  //   }
  // });

  createEffect(() => {
    if (tournamentQuery.status === "success" && !tournamentQuery.data.message) {
      const teamsInitialSeedingMap = {};

      Object.entries(tournamentQuery.data.initial_seeding).forEach(
        ([rank, teamId]) =>
          (teamsInitialSeedingMap[parseInt(teamId)] = parseInt(rank))
      );

      setTeamsInitialSeeding(teamsInitialSeedingMap);

      let newTeamsMap = {};
      tournamentQuery.data?.teams.map(team => {
        newTeamsMap[team.id] = team;
      });
      setTeamsMap(newTeamsMap);
    }
  });

  // const isPlayerRegInProgress = () => {
  //   return ifTodayInBetweenDates(
  //     Date.parse(tournamentQuery.data?.event?.player_registration_start_date),
  //     Date.parse(tournamentQuery.data?.event?.player_registration_end_date)
  //   );
  // };

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
      {/* <Breadcrumbs
        icon={trophy}
        pageList={[{ url: "/tournaments", name: "All Tournaments" }]}
      /> */}

      <div class="ml-1">
        <div class="mt-3 rounded-lg border border-gray-200 px-3 py-3 sm:ml-0">
          <div class="ml-0 inline-flex items-center justify-start gap-3">
            <span class="w-fit text-2xl font-extrabold">
              {tournamentQuery.data?.name}
            </span>
            <Switch>
              <Match when={tournamentQuery.data?.status === "completed"}>
                <span class="mr-2 h-fit rounded-lg bg-gray-200 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                  Completed
                </span>
              </Match>
              <Match when={tournamentQuery.data?.status === "live"}>
                <span class="mr-2 h-fit rounded-lg bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
                  Live
                </span>
              </Match>
            </Switch>
          </div>

          <div class="mt-4 text-gray-600">
            {/* Location */}
            <div class="">
              <span class="inline-flex items-center justify-start gap-2">
                <span>
                  <Icon path={mapPin} class="h-4 w-4" />
                </span>
                <span class="text-md text-left sm:text-center">
                  <p>{tournamentQuery.data?.location}</p>
                </span>
              </span>
            </div>
            {/* Dates */}
            <div class="mt-1">
              <span class="inline-flex items-center justify-start gap-2">
                <span>
                  <Icon path={calendarDays} class="h-4 w-4" />
                </span>
                <span>
                  <p class="text-md text-left sm:text-center">
                    {new Date(
                      Date.parse(tournamentQuery.data?.start_date)
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC"
                    })}
                    <Show
                      when={
                        tournamentQuery.data?.start_date !==
                        tournamentQuery.data?.end_date
                      }
                    >
                      {" "}
                      to{" "}
                      {new Date(
                        Date.parse(tournamentQuery.data?.end_date)
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC"
                      })}
                    </Show>
                  </p>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Tournament banner */}
        <div class="justify-left mt-3 flex rounded-lg border border-dashed border-gray-200 sm:justify-center">
          <img
            src={tournamentQuery.data?.banner}
            alt="Tournament logo"
            class="w-full max-w-lg sm:w-3/4"
          />
        </div>

        {/* <Show when={playingTeam()}>
        <A
          href={`/tournament/${params.slug}/team/${playingTeam().slug}`}
          //
          class="mt-5 block w-full rounded-lg bg-gradient-to-br from-pink-600 to-orange-400 p-0.5 shadow-md"
        >
          <div class="rounded-md bg-white p-4 dark:bg-gray-800">
            <h5 class="mb-2 text-center text-xl tracking-tight">
              <span class="font-normal">Your team - </span>
              <span class="bg-gradient-to-br from-orange-400 to-pink-500 bg-clip-text font-bold text-transparent">
                {playingTeam().name}
              </span>
            </h5>
            <p class="text-center text-sm capitalize">
              View the matches and roster of your team
            </p>
          </div>
        </A>
      </Show> */}

        {/* Tournament links */}
        <div>
          <A
            href={`/tournament/${params.slug}/schedule`}
            class="mt-3 block w-full rounded-lg  border border-gray-300 p-4 shadow-md shadow-gray-200"
          >
            <div class="inline-flex w-full items-center justify-between gap-2">
              <span>
                <p class="text-left text-lg font-bold capitalize tracking-tight text-gray-800 sm:text-center">
                  Schedule
                </p>
              </span>
              <span>
                <Icon path={arrowUpRight} class="inline h-4 w-4" />
              </span>
            </div>
            <p class="mt-1 text-left text-sm font-normal capitalize text-gray-600 sm:text-center">
              View the detailed schedule of matches
            </p>
          </A>
          <A
            href={`/tournament/${params.slug}/standings`}
            class="mt-3 block w-full rounded-lg border border-gray-300 p-4 shadow-md shadow-gray-200"
          >
            <div class="inline-flex w-full items-center justify-between gap-2">
              <span>
                <p class="text-left text-lg font-bold capitalize tracking-tight text-gray-800 sm:text-center">
                  Standings
                </p>
              </span>
              <span>
                <Icon path={arrowUpRight} class="inline h-4 w-4" />
              </span>
            </div>
            <p class="mt-1 text-left text-sm font-normal capitalize text-gray-600 sm:text-center">
              View the pools, brackets and detailed standings
            </p>
          </A>
          <A
            href={`/tournament/${params.slug}/leaderboard`}
            class="mt-3 block w-full rounded-lg border border-gray-300 p-4 shadow-md shadow-gray-200"
          >
            <div class="inline-flex w-full items-center justify-between gap-2">
              <span>
                <p class="text-left text-lg font-bold capitalize tracking-tight text-gray-800 sm:text-center">
                  Leaderboard
                </p>
              </span>
              <span>
                <Icon path={arrowUpRight} class="inline h-4 w-4" />
              </span>
            </div>
            <p class="mt-1 text-left text-sm font-normal capitalize text-gray-600 sm:text-center">
              View the players with the top scores, assists and blocks
            </p>
          </A>
          <Show when={tournamentQuery.data?.rules}>
            <A
              href={`/tournament/${params.slug}/rules`}
              class="mt-5 block w-full rounded-lg border border-gray-300 p-4 shadow-md shadow-gray-200"
            >
              <div class="inline-flex w-full items-center justify-between gap-2">
                <span>
                  <p class="text-left text-lg font-bold capitalize tracking-tight text-gray-800 sm:text-center">
                    Rules & Format
                  </p>
                </span>
                <span>
                  <Icon path={arrowUpRight} class="inline h-4 w-4" />
                </span>
              </div>
              <p class="mt-1 text-left text-sm font-normal capitalize text-gray-600 sm:text-center">
                View the detailed rules and format of the tournament
              </p>
            </A>
          </Show>
          {/* <Show when={isPlayerRegInProgress()}>
          <A
            href={`/tournament/${params.slug}/register`}
            class="mt-5 block w-full rounded-lg border border-gray-600 bg-white p-4 shadow-md"
          >
            <h5 class="mb-2 text-center text-xl font-bold capitalize tracking-tight text-blue-600 dark:text-blue-400">
              Player Registrations
            </h5>
            <p class="text-center text-sm capitalize">
              Open till{" "}
              <span class="inline-flex font-medium">
                {new Date(
                  Date.parse(
                    tournamentQuery.data?.event?.player_registration_end_date
                  )
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC"
                })}
              </span>fo
            </p>
          </A>
      </Show> */}
        </div>

        <Separator class="mb-4 mt-10" />

        <div class="">
          <h2 class="ml-2 text-left text-lg font-bold">Overall Standings</h2>

          <Tabs defaultValue="current-standings-tab" class="mt-2 max-w-lg">
            <TabsList class="flex h-fit justify-start text-left text-lg font-medium">
              <TabsTrigger class="px-4 py-2" value="current-standings-tab">
                Current
              </TabsTrigger>
              <TabsTrigger class="px-4 py-2" value="initial-standings-tab">
                Initial
              </TabsTrigger>
              <TabsTrigger class="px-4 py-2" value="sotg-standings-tab">
                SoTG
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current-standings-tab">
              <div class="rounded-md border px-2 py-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Place</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For
                      each={Object.entries(
                        tournamentQuery.data?.current_seeding || {}
                      )}
                    >
                      {([rank, team_id]) => (
                        <TableRow class="w-full">
                          <TableCell class="w-4/5 px-1 py-3">
                            <A
                              href={`/tournament/${params.slug}/team/${
                                teamsMap()[team_id]?.slug
                              }`}
                            >
                              <img
                                class="mr-3 inline-block h-10 w-10 rounded-full object-cover p-1 ring-1 ring-gray-200"
                                src={teamsMap()[team_id]?.logo}
                                alt="Bordered avatar"
                              />
                              <span class="text-sm">
                                {teamsMap()[team_id]?.name}
                              </span>
                            </A>
                          </TableCell>
                          <TableCell class="whitespace-nowrap font-normal">
                            <div class="inline-flex items-center justify-between gap-4">
                              <span class="text-gray-700">{rank}</span>
                              <span>
                                <Show when={teamsInitialSeeding()}>
                                  <TeamSeedingChange
                                    initialSeed={teamsInitialSeeding()[team_id]}
                                    currentSeed={parseInt(rank)}
                                  />
                                </Show>
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="initial-standings-tab">
              <div class="rounded-md border px-2 py-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Place</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For
                      each={Object.entries(
                        tournamentQuery.data?.current_seeding || {}
                      )}
                    >
                      {([rank, team_id]) => (
                        <TableRow class="w-full">
                          <TableCell class="w-4/5 px-1 py-3">
                            <A
                              href={`/tournament/${params.slug}/team/${
                                teamsMap()[team_id]?.slug
                              }`}
                            >
                              <img
                                class="mr-3 inline-block h-10 w-10 rounded-full object-cover p-1 ring-1 ring-gray-200"
                                src={teamsMap()[team_id]?.logo}
                                alt="Bordered avatar"
                              />
                              <span class="text-md">
                                {teamsMap()[team_id]?.name}
                              </span>
                            </A>
                          </TableCell>
                          <TableCell class="whitespace-nowrap font-normal">
                            <div class="inline-flex items-center justify-between gap-4">
                              <span class="text-gray-700">{rank}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="sotg-standings-tab">
              <div class="rounded-md border px-2 py-1">
                <Table class="">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Place</TableHead>
                      <TableHead>Points*</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={tournamentQuery.data?.spirit_ranking}>
                      {spirit => (
                        <TableRow class="w-full">
                          <TableCell class="w-4/5 px-1 py-3">
                            <A
                              href={`/tournament/${params.slug}/team/${
                                teamsMap()[spirit.team_id]?.slug
                              }`}
                            >
                              <img
                                class="mr-3 inline-block h-10 w-10 rounded-full object-cover p-1 ring-1 ring-gray-100"
                                src={teamsMap()[spirit.team_id]?.logo}
                                alt="Bordered avatar"
                              />
                              {teamsMap()[spirit.team_id]?.name}
                            </A>
                          </TableCell>

                          <TableCell class="whitespace-nowrap font-normal">
                            {spirit.rank}
                          </TableCell>

                          <TableCell class="">
                            {spirit.points}
                            <Show when={spirit.self_points}>
                              ({spirit.self_points})
                            </Show>
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
              <p class="mt-2 text-right text-sm italic text-gray-600">
                * Self scores are in brackets
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Show>
  );
};

export default Tournament;
