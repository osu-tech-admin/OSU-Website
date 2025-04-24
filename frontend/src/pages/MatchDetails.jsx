import { useQuery } from "@tanstack/solid-query";
import { fetchMatch, fetchMatchStats } from "~/queries";
import { useParams, A } from "@solidjs/router";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import clsx from "clsx";
import { Separator } from "~/components/ui/separator";
import { createEffect, createSignal, Match, Switch } from "solid-js";

import MatchTimeline from "~/components/match/MatchTimeline";
import MatchGallery from "~/components/match/MatchGallery";
import MatchMvpMsp from "~/components/match/MatchMvpMsp";

const MatchDetails = () => {
  const params = useParams();
  const [startTime, setStartTime] = createSignal();
  const [endTime, setEndTime] = createSignal();
  const [isMatchLive, setIsMatchLive] = createSignal(false);
  const [shouldRefetch, setShouldRefetch] = createSignal(false);

  const matchQuery = useQuery(() => ({
    queryKey: ["match", params.match_id],
    queryFn: () => fetchMatch(params.match_id)
  }));

  const matchStatsQuery = useQuery(() => ({
    queryKey: ["match-stats", params.match_id],
    queryFn: () => fetchMatchStats(params.match_id),
    refetchInterval: shouldRefetch ? 60000 : 2000000,
    staleTime: shouldRefetch ? 300000 : 5000000,
    refetchOnWindowFocus: true,
    enabled: !!params.match_id
  }));

  createEffect(() => {
    if (matchQuery.isSuccess) {
      const startTimeObject = new Date(Date.parse(matchQuery.data?.time));
      const endTimeObject = new Date(
        startTimeObject.getTime() + matchQuery.data?.duration_mins * 60000
      );

      setStartTime(
        startTimeObject.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          timeZone: "UTC"
        })
      );
      setEndTime(
        endTimeObject.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          timeZone: "UTC"
        })
      );

      const currTime = new Date(Date.now()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        timeZone: "UTC"
      });

      // console.log('start: ', startTimeObject)
      // console.log(startTimeObject.toLocaleTimeString("en-US", {
      //   year: "numeric",
      //   month: "short",
      //   day: "numeric",
      //   hour: "numeric",
      //   minute: "numeric",
      //   timeZone: "UTC"
      // }))
      
      // console.log('end: ', endTimeObject)
      // console.log(endTimeObject.toLocaleTimeString("en-US", {
      //   year: "numeric",
      //   month: "short",
      //   day: "numeric",
      //   hour: "numeric",
      //   minute: "numeric",
      //   timeZone: "UTC"
      // }))
      
      // console.log('curr: ', new Date(Date.now()))
      // console.log(currTime)

      setIsMatchLive(startTime() <= currTime && currTime <= endTime());
    }
  });

  createEffect(() => {
    if (matchStatsQuery.isSuccess && matchStatsQuery.data) {
      if (matchStatsQuery.data.status !== "completed") {
        setShouldRefetch(true);
      }
    }
  });

  return (
    <div class="max-w-2xl px-1 sm:mx-auto">
      <div class="mb-3 mt-4 flex w-full items-center justify-between ">
        <Breadcrumb class="">
          <BreadcrumbList>
            <BreadcrumbEllipsis class="h-fit w-fit rounded-xl border border-gray-400 px-2 py-0.5" />
            <BreadcrumbSeparator class="mx-1" />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/tournament/${params.tournament_slug}/schedule`}
              >
                <span class="rounded-xl border border-gray-400 px-2 py-0.5 text-sm">
                  Schedule
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator class="mx-1" />

            <BreadcrumbItem>
              <BreadcrumbLink current>
                <span class="rounded-xl border border-gray-400 px-2 py-0.5 text-sm">
                  {matchQuery.data?.name}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Match status badge */}
        <div>
          <Switch>
            <Match when={matchQuery.data?.status === "completed"}>
              <div class="rounded-xl bg-gray-200 px-3 py-0.5 text-sm text-gray-800 outline outline-1 outline-gray-400 sm:py-0 sm:text-base">
                Completed
              </div>
            </Match>
            <Match when={matchQuery.data?.status === "scheduled" && !isMatchLive()}>
              <div class="rounded-xl bg-blue-200 px-3 py-0.5 text-sm text-blue-800 outline outline-1 outline-blue-400 sm:py-0 sm:text-base">
                Upcoming
              </div>
            </Match>
            <Match when={matchQuery.data?.status === "scheduled" && isMatchLive()}>
              <div class="flex items-center justify-between gap-2 rounded-xl bg-red-100 px-3 py-0.5 text-sm text-red-600 outline outline-1 outline-red-400 sm:py-0 sm:text-base">
                <span class="relative flex size-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex size-2 rounded-full bg-red-500"></span>
                </span>
                <span>Live</span>
              </div>
            </Match>
          </Switch>
        </div>
      </div>

      <Separator class="mb-2 mt-4" />

      <div class="mt-4 flex flex-col gap-4 px-1">
        {/* Team 1 */}
        <div class="flex w-full items-center justify-between text-base sm:text-lg">
          <div>
            <Show
              when={matchQuery.data?.team_1}
              fallback={
                <span class="w-1/3 text-center font-bold">
                  {matchQuery.data?.placeholder_seed_1}
                </span>
              }
            >
              <img
                class={clsx(
                  "mr-2 inline-block h-8 w-8 rounded-full object-cover p-1 ring-1 ring-gray-400"
                )}
                src={matchQuery.data?.team_1?.logo}
                alt="Bordered avatar"
              />
              <span class="w-1/3 text-center font-bold text-gray-600 dark:text-gray-300">
                <A
                  href={`/tournament/${params.tournament_slug}/team/${
                    matchQuery.data?.team_1.slug
                  }`}
                >
                  {matchQuery.data?.team_1.name} [
                  {matchQuery.data?.placeholder_seed_1}]
                </A>
              </span>
            </Show>
          </div>
          <div class="text-xl font-bold">
            <Show when={matchQuery.data?.status === "completed"}>
              <Switch>
                <Match
                  when={
                    matchQuery.data?.score_team_1 >
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-green-500">
                    {matchQuery.data?.score_team_1}
                  </span>
                </Match>
                <Match
                  when={
                    matchQuery.data?.score_team_1 <
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-red-500">
                    {matchQuery.data?.score_team_1}
                  </span>
                </Match>
                <Match
                  when={
                    matchQuery.data?.score_team_1 ===
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-blue-500">
                    {matchQuery.data?.score_team_1}
                  </span>
                </Match>
              </Switch>
            </Show>
          </div>
        </div>

        {/* Team 2 */}
        <div class="flex w-full items-center justify-between text-base sm:text-lg">
          <div>
            <Show
              when={matchQuery.data?.team_2}
              fallback={
                <span class="w-1/3 text-center font-bold">
                  {matchQuery.data?.placeholder_seed_2}
                </span>
              }
            >
              <img
                class={clsx(
                  "mr-2 inline-block h-8 w-8 rounded-full object-cover p-1 ring-1 ring-gray-400"
                )}
                src={matchQuery.data?.team_2?.logo}
                alt="Bordered avatar"
              />
              <span class="w-1/3 text-center font-bold text-gray-600 dark:text-gray-300">
                <A
                  href={`/tournament/${params.tournament_slug}/team/${
                    matchQuery.data?.team_2.slug
                  }`}
                >
                  {matchQuery.data?.team_2.name} [
                  {matchQuery.data?.placeholder_seed_2}]
                </A>
              </span>
            </Show>
          </div>
          <div class="text-xl font-bold">
            <Show when={matchQuery.data?.status === "completed"}>
              <Switch>
                <Match
                  when={
                    matchQuery.data?.score_team_1 >
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-red-500">
                    {matchQuery.data?.score_team_2}
                  </span>
                </Match>
                <Match
                  when={
                    matchQuery.data?.score_team_1 <
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-green-500">
                    {matchQuery.data?.score_team_2}
                  </span>
                </Match>
                <Match
                  when={
                    matchQuery.data?.score_team_1 ===
                    matchQuery.data?.score_team_2
                  }
                >
                  <span class="text-blue-500">
                    {matchQuery.data?.score_team_2}
                  </span>
                </Match>
              </Switch>
            </Show>
          </div>
        </div>
      </div>

      <Separator class="mb-2 mt-4" />

      <Tabs>
        <TabsList defaultValue="timeline-tab" class="mt-2">
          <TabsTrigger value="timeline-tab">Timeline</TabsTrigger>
          <TabsTrigger value="mvp-msp-tab">MVP/MSP</TabsTrigger>
          <TabsTrigger value="gallery-tab">Gallery</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline-tab">
          <MatchTimeline match={matchQuery.data} stats={matchStatsQuery.data}/>
        </TabsContent>
        <TabsContent value="mvp-msp-tab">
          <MatchMvpMsp match={matchQuery.data} />
        </TabsContent>
        <TabsContent value="gallery-tab">
          <MatchGallery match={matchQuery.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchDetails;
