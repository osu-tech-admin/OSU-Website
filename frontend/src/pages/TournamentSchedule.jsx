import { A, useParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import clsx from "clsx";
import { Icon } from "solid-heroicons";
import { trophy } from "solid-heroicons/solid";
import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Suspense,
  Switch
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import { matchCardColorToBorderColorMap } from "../colors";
import {
  fetchFieldsByTournamentId,
  fetchMatches,
  fetchTournamentBySlug
} from "../queries";
// import DayScheduleSkeleton from "../skeletons/Schedule";
// import { TournamentMatches as TournamentMatchesSkeleton } from "../skeletons/TournamentMatch";
// import { getMatchCardColor } from "../utils";
import { getMatchCardColor } from "~/components/match/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "~/components/ui/breadcrumb";

import MatchCard from "~/components/match/MatchCard";
import ScheduleTable from "~/components/tournament/ScheduleTable";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { makeTitle } from "~/utils";
const TournamentSchedule = () => {
  const params = useParams();
  const [tournamentDays, setTournamentDays] = createSignal([]);
  const [weeks, setWeeks] = createSignal([]);
  const [flash, setFlash] = createSignal(-1);
  const [matchDayTimeFieldMap, setMatchDayTimeFieldMap] = createStore({});
  const [dayFieldMap, setDayFieldMap] = createStore({});
  const [doneBuildingScheduleMap, setDoneBuildingScheduleMap] =
    createSignal(false);

  const tournamentQuery = useQuery(() => ({
    queryKey: ["tournaments", params.slug],
    queryFn: () => fetchTournamentBySlug(params.slug)
  }));

  const matchesQuery = useQuery(() => ({
    queryKey: ["matches", tournamentQuery.data?.id],
    queryFn: () => fetchMatches(tournamentQuery.data?.id),
    enabled: !!tournamentQuery.data?.id
  }));

  const fieldsQuery = useQuery(() => ({
    queryKey: ["fields", tournamentQuery.data?.id],
    queryFn: () => fetchFieldsByTournamentId(tournamentQuery.data?.id),
    enabled: !!tournamentQuery.data?.id
  }));

  function sameDay(d1, d2) {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  const mapFieldIdToField = fields => {
    let newFieldsMap = {};
    fields?.map(field => {
      newFieldsMap[field.id] = field;
    });
    return newFieldsMap;
  };

  createEffect(() => {
    if (matchesQuery.status === "success" && !matchesQuery.data?.message) {
      setMatchDayTimeFieldMap(reconcile({}));
      setDayFieldMap(reconcile({}));
      let days = new Set();
      matchesQuery.data?.map(match => {
        if (match.time && match.field) {
          const day = new Date(Date.parse(match.time)).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC"
            }
          );
          const startTime = new Date(Date.parse(match.time));
          const endTime = new Date(
            startTime.getTime() + match.duration_mins * 60000
          );
          setMatchDayTimeFieldMap(day, {});
          setMatchDayTimeFieldMap(day, startTime, {});
          setMatchDayTimeFieldMap(day, startTime, endTime, {});
          setMatchDayTimeFieldMap(
            day,
            startTime,
            endTime,
            match.field?.id,
            match
          );

          setDayFieldMap(day, {});
          setDayFieldMap(day, match.field?.id, true);

          days.add(new Date(Date.parse(match.time)));
        }
      });
      setTournamentDays(Array.from(days));
      setDoneBuildingScheduleMap(true);
    }
  });

  createEffect(() => {
    // Get the weeks from the tournament days, Monday to Sunday
    // Group tournament days by week (Sunday as last day)
    const weekMap = tournamentDays().reduce((acc, day) => {
      // Clone the date to avoid modifying the original
      const currentDate = new Date(day);
      // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
      const dayOfWeek = currentDate.getUTCDay();
      // Calculate the date of Monday (start of week)
      // If it's Sunday (0), go back 6 days to get to Monday
      // Otherwise subtract (dayOfWeek - 1) days
      const mondayDate = new Date(currentDate);
      mondayDate.setDate(
        currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      );

      // Format the Monday date to use as a key
      const weekKey = `Week ${mondayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;

      // Add the day to the appropriate week
      if (!acc[weekKey]) {
        acc[weekKey] = [];
      }
      acc[weekKey].push(day);
      // Sort days within each week in ascending order
      acc[weekKey].sort((a, b) => new Date(a) - new Date(b));

      return acc;
    }, {});

    // sort the weeks by the week key which is date and month and store in weekMap
    const sortedWeekMap = Object.entries(weekMap)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA - dateB;
      })
      .reduce((acc, [key, days]) => {
        // Extract week number from the key and create a new key in the format "Week X"
        const weekNumber = Object.keys(acc).length + 1;
        acc[`Week ${weekNumber}`] = days;
        return acc;
      }, {});

    setWeeks(
      Object.entries(sortedWeekMap).map(([key, days]) => ({ key, days }))
    );
  });

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
                  Schedule
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Tabs defaultValue="week-tab-week-1" class="mt-2 w-full">
          <TabsList class="grid w-full grid-cols-4">
            <For each={weeks()}>
              {week => (
                <TabsTrigger
                  class="text-sm md:text-base"
                  value={
                    "week-tab-" + week.key.toLowerCase().replace(/ /g, "-")
                  }
                >
                  {week.key}
                </TabsTrigger>
              )}
            </For>
          </TabsList>

          <For each={weeks()}>
            {week => (
              <TabsContent
                value={"week-tab-" + week.key.toLowerCase().replace(/ /g, "-")}
              >
                <Tabs defaultValue="day-tab-1" class="mt-2 w-full">
                  <TabsList class="grid w-full grid-cols-2">
                    <For each={week.days}>
                      {(day, i) => (
                        <TabsTrigger
                          class="text-sm md:text-base"
                          value={"day-tab-" + (i() + 1)}
                        >
                          {day.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "UTC"
                          })}
                        </TabsTrigger>
                      )}
                    </For>
                  </TabsList>

                  <For each={week.days}>
                    {(day, i) => (
                      <TabsContent value={"day-tab-" + (i() + 1)}>
                        <div class="rounded-lg">
                          {/* <Show
                            when={doneBuildingScheduleMap()}
                            // fallback={<DayScheduleSkeleton />}
                            fallback={"Loading Schedule..."}
                          /> */}
                          <For each={Object.keys(matchDayTimeFieldMap).sort()}>
                            {day2 => (
                              <Show
                                when={sameDay(
                                  day,
                                  new Date(Date.parse(day2 + " GMT"))
                                )}
                              >
                                <div class="relative mb-8 overflow-x-auto">
                                  <Switch>
                                    <Match when={fieldsQuery.isError}>
                                      <p>{fieldsQuery.error.message}</p>
                                    </Match>
                                    <Match when={fieldsQuery.isSuccess}>
                                      <ScheduleTable
                                        dayFieldMap={dayFieldMap}
                                        day={day2}
                                        matchDayTimeFieldMap={
                                          matchDayTimeFieldMap
                                        }
                                        setFlash={setFlash}
                                        fieldsMap={mapFieldIdToField(
                                          fieldsQuery.data
                                        )}
                                      />
                                    </Match>
                                  </Switch>
                                  <p class="mt-2 text-sm">
                                    * CP - Cross Pool | B - Brackets
                                  </p>
                                </div>
                              </Show>
                            )}
                          </For>
                          <Show
                            when={
                              matchesQuery.data?.filter(match =>
                                sameDay(day, new Date(Date.parse(match.time)))
                              ).length === 0
                            }
                          >
                            <div
                              class="mb-4 flex items-center rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-gray-800 dark:text-blue-400"
                              role="alert"
                            >
                              <svg
                                class="me-3 inline h-4 w-4 flex-shrink-0"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                              </svg>
                              <span class="sr-only">Info</span>
                              <div>
                                <span class="font-medium capitalize">
                                  No Matches Present on this day!
                                </span>
                              </div>
                            </div>
                          </Show>
                          {/* <Suspense
                            // fallback={<TournamentMatchesSkeleton />}
                            fallback={"Loading matches..."}
                          > */}
                          <For each={matchesQuery.data}>
                            {match => (
                              <Show
                                when={sameDay(
                                  day,
                                  new Date(Date.parse(match.time))
                                )}
                              >
                                <div
                                  id={match.id}
                                  class={clsx(
                                    flash() == match.id
                                      ? "bg-blue-100 text-black"
                                      : "bg-white",
                                    "mb-5 block w-full rounded-lg border border-gray-400 px-1 py-2 shadow-sm transition"
                                  )}
                                >
                                  <MatchCard
                                    match={match}
                                    tournamentSlug={params.slug}
                                    bothTeamsClickable
                                  />
                                </div>
                              </Show>
                            )}
                          </For>
                          {/* </Suspense> */}
                        </div>
                      </TabsContent>
                    )}
                  </For>
                </Tabs>
              </TabsContent>
            )}
          </For>
        </Tabs>
      </div>
    </Show>
  );
};

export default TournamentSchedule;
