import { useParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import clsx from "clsx";
import { Icon } from "solid-heroicons";
import { star, trophy } from "solid-heroicons/solid";
import {
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
  Suspense
} from "solid-js";

import { matchCardColorToBorderColorMap } from "../colors";
import {
  fetchTeamBySlug,
  fetchTournamentBySlug,
  fetchTournamentTeamRoster,
  fetchTournamentTeamMatches
} from "~/queries";

// import RosterSkeleton from "../skeletons/Roster";
// import { TournamentTeamMatches as TournamentTeamMatchesSkeleton } from "../skeletons/TournamentMatch";
// import { getTournamentBreadcrumbName } from "../utils";
// import Info from "./alerts/Info";
// import Breadcrumbs from "./Breadcrumbs";
import MatchCard from "~/components/match/MatchCard";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";

import Registration from "~/components/roster/Registration";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

const TournamentTeam = () => {
  const params = useParams();
  const [tournamentDates, setTournamentDates] = createSignal([]);
  const [matchesGroupedByDate, setMatchesGroupedByDate] = createSignal({});
  const [doneFetching, setDoneFetching] = createSignal(false);

  const tournamentQuery = useQuery(() => ({
    queryKey: ["tournaments", params.tournament_slug],
    queryFn: () => fetchTournamentBySlug(params.tournament_slug)
  }));

  const teamQuery = useQuery(() => ({
    queryKey: ["teams", params.team_slug],
    queryFn: () => fetchTeamBySlug(params.team_slug)
  }));

  const rosterQuery = useQuery(() => ({
    queryKey: ["tournament-roster", params.tournament_slug, params.team_slug],
    queryFn: () =>
      fetchTournamentTeamRoster(params.tournament_slug, params.team_slug)
  }));

  const matchesQuery = useQuery(() => ({
    queryKey: ["team-matches", params.tournament_slug, params.team_slug],
    queryFn: () =>
      fetchTournamentTeamMatches(params.tournament_slug, params.team_slug)
  }));

  const currTeamNo = match => {
    if (match.team_1) {
      return params.team_slug === match.team_1.slug ? 1 : 2;
    }
    return params.team_slug === match.team_2.slug ? 2 : 1;
  };

  const oppTeamNo = match => (currTeamNo(match) === 1 ? 2 : 1);

  const matchOutcomeColor = match => {
    if (match.status === "SCH" || match.status === "YTF") {
      return "blue";
    }
    if (match.status === "COM") {
      const currTeamScore = match[`score_team_${currTeamNo(match)}`];
      const oppTeamScore = match[`score_team_${oppTeamNo(match)}`];

      if (currTeamScore > oppTeamScore) {
        return "green";
      } else if (currTeamScore == oppTeamScore) {
        return "gray";
      } else {
        return "red";
      }
    }
  };

  createEffect(() => {
    if (
      tournamentQuery.status === "success" &&
      !tournamentQuery.data?.message
    ) {
      let dates = [];
      const start = new Date(
        Date.parse(tournamentQuery.data?.event?.start_date)
      );
      const end = new Date(Date.parse(tournamentQuery.data?.event?.end_date));

      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).getUTCDate());
      }

      setTournamentDates(dates);
    }
  });

  createEffect(() => {
    setDoneFetching(false);
    if (matchesQuery.status === "success" && !matchesQuery.data?.message) {
      const teamMatches = matchesQuery.data;
      let groupedMatches = {};

      for (const match of teamMatches) {
        // Object.keys returns a list of strings, so converting date to a string
        const date = new Date(Date.parse(match?.time)).getUTCDate().toString();
        if (!Object.keys(groupedMatches).includes(date)) {
          groupedMatches[date] = [];
        }
        groupedMatches[date].push(match);
      }

      setMatchesGroupedByDate(groupedMatches);
      setDoneFetching(true);
    }
  });

  const players = () => {
    return rosterQuery.data?.filter(r => !["OWNER", "COACH"].includes(r?.role));
  };

  const nonPlayers = () => {
    return rosterQuery.data?.filter(r => ["OWNER", "COACH"].includes(r?.role));
  };

  return (
    <Show when={!teamQuery.data?.message}>
      <div class="max-w-xl">
        <Breadcrumb class="mb-6 mt-4 w-fit rounded-lg pl-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/tournaments">
                <span class="text-normal flex rounded-lg px-2 outline outline-1 outline-offset-2 outline-gray-400">
                  <Icon
                    path={trophy}
                    class="inline h-5 w-5 place-self-center"
                  />
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="mx-1" />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/tournament/${params.tournament_slug}`}>
                <span class="text-normal rounded-lg px-2 outline outline-1 outline-offset-2 outline-gray-400">
                  {params.tournament_slug}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="mx-1" />
            <BreadcrumbItem>
              <BreadcrumbLink current>
                <span class="outline-muted-foreround text-normal rounded-lg px-2 outline outline-1 outline-offset-2">
                  {params.team_slug}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Team image */}
        <div class="flex justify-center">
          <img
            class="mr-3 inline-block h-24 w-24 rounded-full p-1 ring-2 ring-blue-600 dark:ring-blue-500"
            src={teamQuery.data?.logo}
            alt="Bordered avatar"
          />
        </div>
        {/* Team name */}
        <h1 class="mt-2 text-center">
          <span class="w-fit bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-2xl font-extrabold text-transparent">
            <Suspense
              fallback={
                <span class="inline-block h-2 w-60 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              }
            >
              {teamQuery.data?.name}
            </Suspense>
          </span>
        </h1>

        <Tabs defaultValue="matches-tab">
          <TabsList class="mt-4">
            <TabsTrigger class="text-sm" value="matches-tab">
              Matches
            </TabsTrigger>
            <TabsTrigger class="text-sm" value="roster-tab">
              Roster
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches-tab">
            <div class="mt-4 p-4">
              <For each={Object.entries(matchesGroupedByDate())}>
                {([tournamentDate, matches]) => (
                  <div class="mb-10">
                    <Show when={tournamentDates().length > 1}>
                      <div class="mb-5 ml-1">
                        <h3 class="text-center text-lg font-bold">
                          Day -{" "}
                          {tournamentDates().indexOf(parseInt(tournamentDate)) +
                            1}
                        </h3>
                      </div>
                    </Show>
                    <For each={matches}>
                      {match => (
                        <div
                          class={clsx(
                            "mb-5 block w-full rounded-lg border bg-white px-1 py-2 shadow dark:bg-gray-800",
                            matchCardColorToBorderColorMap[
                              matchOutcomeColor(match)
                            ]
                          )}
                        >
                          <MatchCard
                            match={match}
                            currentTeamNo={currTeamNo(match)}
                            opponentTeamNo={oppTeamNo(match)}
                            tournamentSlug={params.tournament_slug}
                            useUCRegistrations={
                              tournamentQuery.data?.use_uc_registrations
                            }
                            imgRingColor={"gray"}
                            matchCardColorOverride={matchOutcomeColor(match)}
                            buttonColor={matchOutcomeColor(match)}
                          />
                        </div>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </TabsContent>

          <TabsContent value="roster-tab">
            {/* <Suspense
            // fallback={<RosterSkeleton />}
            fallback={"Loading roster"}
          > */}
            <div class="ml-2">
              <h2 class="my-4 text-xl font-bold underline underline-offset-2">
                Players {`(${players()?.length || "-"})`}
              </h2>
              <Show
                when={players()?.length !== 0}
                fallback={
                  <Alert>
                    <AlertDescription>
                      There are no players in the roster
                    </AlertDescription>
                  </Alert>
                }
              >
                <div class="w-full divide-y sm:divide-y-0">
                  <For each={players()}>
                    {registration => (
                      <Registration registration={registration} />
                    )}
                  </For>
                </div>
              </Show>
              <h2 class="mb-4 mt-8 text-xl font-bold underline underline-offset-2">
                Non-players {`(${nonPlayers()?.length || "-"})`}
              </h2>
              <Show
                when={nonPlayers()?.length !== 0}
                fallback={
                  <Alert>
                    <AlertDescription>
                      There are no non-players in the roster
                    </AlertDescription>
                  </Alert>
                }
              >
                <div class="w-full divide-y sm:divide-y-0">
                  <For each={nonPlayers()}>
                    {registration => (
                      <Registration registration={registration} />
                    )}
                  </For>
                </div>
              </Show>
            </div>
            {/* </Suspense> */}
          </TabsContent>
        </Tabs>
      </div>
    </Show>
  );
};

export default TournamentTeam;
