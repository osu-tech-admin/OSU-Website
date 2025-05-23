import { A } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
// import { queryClient } from "../../lib/queryClient";
import { clsx } from "clsx";
import { Icon } from "solid-heroicons";
// import { arrowRight, chevronRight, pencil, play } from "solid-heroicons/solid";
import { clock, mapPin } from "solid-heroicons/outline";

import { createEffect, createSignal, Match, Show, Switch } from "solid-js";

// import {
//   matchCardColorToButtonStyles,
//   matchCardColorToRingColorMap
// } from "../../colors";

import { fetchUserPermissionsForMatch } from "~/queries";
// import { getMatchCardColor } from "./utils";
// import MatchScoreForm from "./MatchScoreForm";
import MatchHeader from "./MatchHeader";
// import SubmitScore from "./SubmitScore";
import { Separator } from "../ui/separator";
// import { Button, buttonVariants } from "../ui/button";

// import MatchSpiritScoreForm from "./MatchSpiritScoreForm";
// import SpiritScoreTable from "./SpiritScoreTable";
// import FinalSpiritScores from "./FinalSpiritScores";
// import SubmitSpiritScore from "./SubmitSpiritScore";
// import CreateStatsButton from "./stats/CreateStatsButton";
// import ViewStatsButton from "./stats/ViewStatsButton";

/**
 * Returns a match block between 2 teams.
 * If a team should appear first, pass `currentTeamNo` = team id in match object (1 or 2).
 * If both team names should link to the team name, pass the `bothTeamsClickable` prop.
 *
 * @param {object} props
 * @param {object} props.match
 * @param {string} props.tournamentSlug
 * @param {number} [props.currentTeamNo]
 * @param {number} [props.opponentTeamNo]
 * @param {boolean} [props.bothTeamsClickable]
 */
const TournamentMatch = props => {
  const [currTeamNo, setCurrTeamNo] = createSignal(1);
  const [oppTeamNo, setOppTeamNo] = createSignal(2);
  const [startTime, setStartTime] = createSignal("");
  const [endTime, setEndTime] = createSignal("");

  const userAccessQuery = useQuery(() => ({
    queryKey: ["user-access", props.tournamentSlug],
    queryFn: () => fetchUserPermissionsForMatch(props.tournamentSlug)
  }));

  createEffect(() => {
    setCurrTeamNo(props.currentTeamNo || 1);
    setOppTeamNo(props.opponentTeamNo || 2);
  });

  createEffect(() => {
    const startTimeObject = new Date(Date.parse(props.match.time));
    const endTimeObject = new Date(
      startTimeObject.getTime() + props.match.duration_mins * 60000
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
  });

  const checkIfSuggestedScoresClash = (
    suggested_score_team_1,
    suggested_score_team_2
  ) => {
    if (!suggested_score_team_1 || !suggested_score_team_2) {
      return false;
    }

    return (
      suggested_score_team_1["score_team_1"] !==
        suggested_score_team_2["score_team_1"] ||
      suggested_score_team_1["score_team_2"] !==
        suggested_score_team_2["score_team_2"]
    );
  };

  const isMatchTeamAdmin = () =>
    userAccessQuery.data?.admin_team_ids?.length > 0 &&
    (userAccessQuery.data?.admin_team_ids.indexOf(props.match["team_1"].id) >
      -1 ||
      userAccessQuery.data?.admin_team_ids.indexOf(props.match["team_2"].id) >
        -1);

  const isTeamAdminOf = team_id => {
    return (
      userAccessQuery?.data?.admin_team_ids?.length > 0 &&
      userAccessQuery?.data?.admin_team_ids.indexOf(team_id) > -1
    );
  };

  const hasUserNotSubmittedScores = () => {
    return (
      (isTeamAdminOf(props.match["team_1"].id) &&
        !props.match["suggested_score_team_1"]) ||
      (isTeamAdminOf(props.match["team_2"].id) &&
        !props.match["suggested_score_team_2"])
    );
  };

  // const canUserSubmitSpiritScores = () => {
  //   return (
  //     (isTeamAdminOf(props.match["team_1"].id) &&
  //       !props.match["spirit_score_team_2"] &&
  //       (props.match["suggested_score_team_1"] ||
  //         props.match.status === "completed")) ||
  //     (isTeamAdminOf(props.match["team_2"].id) &&
  //       !props.match["spirit_score_team_1"] &&
  //       (props.match["suggested_score_team_2"] ||
  //         props.match.status === "completed"))
  //   );
  // };

  const isStaff = () => {
    return (
      userAccessQuery.data &&
      (userAccessQuery.data.is_staff ||
        userAccessQuery.data.is_tournament_admin ||
        userAccessQuery.data.is_tournament_volunteer)
    );
  };

  const getTeamImage = team => {
    return team?.logo;
  };

  return (
    <A href={`/tournament/${props.tournamentSlug}/schedule/match/${props.match?.id}`}>
      <div class="px-1">
        <div class="mb-4 inline-flex w-full justify-between gap-2">
          <span class="w-full">
            <MatchHeader
              match={props.match}
              dontMinimiseMatchName
              matchCardColorOverride={props.matchCardColorOverride}
            />
          </span>
        </div>

        <div class="flex flex-col gap-4 px-1">
          {/* Team 1 */}
          <div class="flex w-full items-center justify-between text-base">
            <div>
              <Show
                when={props.match[`team_${currTeamNo()}`]}
                fallback={
                  <span class="w-1/3 text-center font-bold">
                    {props.match[`placeholder_seed_${currTeamNo()}`]}
                  </span>
                }
              >
                <img
                  class={clsx(
                    "mr-2 inline-block h-6 w-6 rounded-full object-cover p-1 ring-1 ring-gray-400"
                    // props.imgRingColor
                    //   ? matchCardColorToRingColorMap[props.imgRingColor]
                    //   : matchCardColorToRingColorMap[
                    //       getMatchCardColor(props.match)
                    //     ]
                  )}
                  src={getTeamImage(props.match[`team_${currTeamNo()}`])}
                  alt="Bordered avatar"
                />
                <span class="w-1/3 text-center font-bold text-gray-600 dark:text-gray-300">
                  <Show
                    when={props.bothTeamsClickable}
                    fallback={`${props.match[`team_${currTeamNo()}`].name} (${
                      props.match[`placeholder_seed_${currTeamNo()}`]
                    })`}
                  >
                    <A
                      href={`/tournament/${props.tournamentSlug}/team/${
                        props.match[`team_${currTeamNo()}`].slug
                      }`}
                    >
                      {`${props.match[`team_${currTeamNo()}`].name} (${
                        props.match[`placeholder_seed_${currTeamNo()}`]
                      })`}
                    </A>
                  </Show>
                </span>
              </Show>
            </div>
            <div class="text-base font-bold">
              <Show when={props.match.status === "completed"}>
                <Switch>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] >
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-green-500">
                      {props.match[`score_team_${currTeamNo()}`]}
                    </span>
                  </Match>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] <
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-red-500">
                      {props.match[`score_team_${currTeamNo()}`]}
                    </span>
                  </Match>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] ===
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-blue-500">
                      {props.match[`score_team_${currTeamNo()}`]}
                    </span>
                  </Match>
                </Switch>
              </Show>
            </div>
          </div>
          {/* Team 2 */}
          <div class="flex w-full items-center justify-between text-base">
            <div>
              <Show
                when={props.match[`team_${oppTeamNo()}`]}
                fallback={
                  <span class="w-1/3 text-center font-bold">
                    {props.match[`placeholder_seed_${oppTeamNo()}`]}
                  </span>
                }
              >
                <img
                  class={clsx(
                    "mr-2 inline-block h-6 w-6 rounded-full object-cover p-1 ring-1 ring-gray-400"
                    // props.imgRingColor
                    //   ? matchCardColorToRingColorMap[props.imgRingColor]
                    //   : matchCardColorToRingColorMap[
                    //       getMatchCardColor(props.match)
                    //     ]
                  )}
                  src={getTeamImage(props.match[`team_${oppTeamNo()}`])}
                  alt="Bordered avatar"
                />
                <span class="w-1/3 text-center font-bold text-gray-600 dark:text-gray-300">
                  <Show
                    when={props.bothTeamsClickable}
                    fallback={`${props.match[`team_${oppTeamNo()}`].name} (${
                      props.match[`placeholder_seed_${oppTeamNo()}`]
                    })`}
                  >
                    <A
                      href={`/tournament/${props.tournamentSlug}/team/${
                        props.match[`team_${oppTeamNo()}`].slug
                      }`}
                    >
                      {`${props.match[`team_${oppTeamNo()}`].name} (${
                        props.match[`placeholder_seed_${oppTeamNo()}`]
                      })`}
                    </A>
                  </Show>
                </span>
              </Show>
            </div>
            <div class="text-base font-bold">
              <Show when={props.match.status === "completed"}>
                <Switch>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] >
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-red-500">
                      {props.match[`score_team_${oppTeamNo()}`]}
                    </span>
                  </Match>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] <
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-green-500">
                      {props.match[`score_team_${oppTeamNo()}`]}
                    </span>
                  </Match>
                  <Match
                    when={
                      props.match[`score_team_${currTeamNo()}`] ===
                      props.match[`score_team_${oppTeamNo()}`]
                    }
                  >
                    <span class="text-blue-500">
                      {props.match[`score_team_${oppTeamNo()}`]}
                    </span>
                  </Match>
                </Switch>
              </Show>
            </div>
          </div>
        </div>
        
        <Separator class="mb-2 mt-3" />
        
        {/* Field and duration */}
        <div class="flex flex-col gap-y-2 px-1 ">
          <div class="flex items-center gap-2">
            <span class="text-gray-800">
              <Icon path={mapPin} class="inline h-5 w-5" />
            </span>
            <span class="text-gray-500">{props.match.field?.name}</span>
          </div>
          <div class="flex items-center gap-2 ">
            <span class="text-gray-800">
              <Icon path={clock} class="inline h-5 w-5" />
            </span>
            <span class="text-gray-500">
              {startTime()} - {endTime} | {props.match.duration_mins} mins
            </span>
          </div>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-center gap-2">
          {/* Watch button */}
          {/* <Show when={props.match.video_url}>
            <a
              class="flex justify-center"
              href={props.match.video_url}
              target="_blank"
            >
              <button
                type="button"
                class={clsx(
                  "group relative inline-flex items-center justify-center overflow-hidden rounded-full p-0.5 text-xs font-medium",
                  "text-gray-900 focus:outline-none dark:text-white",
                  "transition-all duration-75 ease-in hover:scale-105"
                )}
              >
                <span
                  class={clsx(
                    "relative inline-flex items-center rounded-full px-2 py-1.5 transition-all duration-75 ease-in group-hover:shadow-lg dark:bg-gray-700",
                    `bg-${
                      props.buttonColor || getMatchCardColor(props.match)
                    }-100`
                  )}
                >
                  <span
                    class={clsx(
                      "me-2 rounded-full px-2.5 py-0.5 text-white",
                      props.buttonColor
                        ? matchCardColorToButtonStyles[props.buttonColor]
                        : matchCardColorToButtonStyles[
                            getMatchCardColor(props.match)
                          ]
                    )}
                  >
                    <Icon path={play} class="w-4" />
                  </span>
                  Watch
                  <Icon path={chevronRight} class="ml-1.5 w-4" />
                </span>
              </button>
            </a>
          </Show> */}

          {/* Live score buttons */}
          {/* <Show when={props.match.stats}>
            <A
              href={`/tournament/${props.tournamentSlug}/match/${props.match.id}/live`}
            >
              <ViewStatsButton
                bgColor={`bg-${
                  props.buttonColor || getMatchCardColor(props.match)
                }-100`}
                badgeColor={
                  props.buttonColor
                    ? matchCardColorToButtonStyles[props.buttonColor]
                    : matchCardColorToButtonStyles[getMatchCardColor(props.match)]
                }
                textColor={props.buttonColor || getMatchCardColor(props.match)}
                match={props.match}
              />
            </A>
          </Show> */}
          {/* Score buttons */}
          {/* <Show
            when={
              props.match[`spirit_score_team_${currTeamNo()}`] &&
              props.match[`spirit_score_team_${oppTeamNo()}`]
            }
          >
            <FinalSpiritScores
              bgColor={`bg-${
                props.buttonColor || getMatchCardColor(props.match)
              }-100`}
              badgeColor={
                props.buttonColor
                  ? matchCardColorToButtonStyles[props.buttonColor]
                  : matchCardColorToButtonStyles[getMatchCardColor(props.match)]
              }
              spiritScoreText={
                props.match[`spirit_score_team_${currTeamNo()}`].total +
                " - " +
                props.match[`spirit_score_team_${oppTeamNo()}`].total
              }
            >
              <div class="space-y-2 py-2 pr-2 sm:pl-2 sm:pr-4">
                <h2 class="text-center font-bold text-blue-600 dark:text-blue-500">
                  Spirit Scores
                </h2>
                <SpiritScoreTable
                  team_1={props.match[`team_${currTeamNo()}`]}
                  team_2={props.match[`team_${oppTeamNo()}`]}
                  spirit_score_team_1={
                    props.match[`spirit_score_team_${currTeamNo()}`]
                  }
                  spirit_score_team_2={
                    props.match[`spirit_score_team_${oppTeamNo()}`]
                  }
                />
                <h2 class="text-center font-bold text-blue-600 dark:text-blue-500">
                  Spirit Scores - Self
                </h2>
                <SpiritScoreTable
                  team_1={props.match[`team_${currTeamNo()}`]}
                  team_2={props.match[`team_${oppTeamNo()}`]}
                  spirit_score_team_1={
                    props.match[`self_spirit_score_team_${currTeamNo()}`]
                  }
                  spirit_score_team_2={
                    props.match[`self_spirit_score_team_${oppTeamNo()}`]
                  }
                />
                <h2 class="text-center font-bold text-blue-600 dark:text-blue-500">
                  MVPs
                </h2>
                <Switch>
                  <Match
                    when={
                      !props.useUCRegistrations &&
                      props.match[`spirit_score_team_${currTeamNo()}`].mvp_v2
                    }
                  >
                    <div class="mx-2 font-medium dark:text-white">
                      <div>
                        {
                          props.match[`spirit_score_team_${currTeamNo()}`].mvp_v2
                            ?.full_name
                        }
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {props.match[`team_${currTeamNo()}`].name}
                      </div>
                    </div>
                  </Match>
                  <Match
                    when={
                      props.useUCRegistrations &&
                      props.match[`spirit_score_team_${currTeamNo()}`].mvp
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <img
                        class="h-10 w-10 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                        src={
                          props.match[`spirit_score_team_${currTeamNo()}`].mvp
                            ?.image_url
                        }
                        alt="Image"
                      />
                      <div class="font-medium dark:text-white">
                        <div>
                          {props.match[`spirit_score_team_${currTeamNo()}`].mvp
                            ?.first_name +
                            " " +
                            props.match[`spirit_score_team_${currTeamNo()}`].mvp
                              ?.last_name}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${currTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                </Switch>
                <Switch>
                  <Match
                    when={
                      !props.useUCRegistrations &&
                      props.match[`spirit_score_team_${oppTeamNo()}`].mvp_v2
                    }
                  >
                    <div class="mx-2 font-medium dark:text-white">
                      <div>
                        {
                          props.match[`spirit_score_team_${oppTeamNo()}`].mvp_v2
                            ?.full_name
                        }
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {props.match[`team_${oppTeamNo()}`].name}
                      </div>
                    </div>
                  </Match>
                  <Match
                    when={
                      props.useUCRegistrations &&
                      props.match[`spirit_score_team_${oppTeamNo()}`].mvp
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <img
                        class="h-10 w-10 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                        src={
                          props.match[`spirit_score_team_${oppTeamNo()}`].mvp
                            ?.image_url
                        }
                        alt="Image"
                      />
                      <div class="font-medium dark:text-white">
                        <div>
                          {props.match[`spirit_score_team_${oppTeamNo()}`].mvp
                            ?.first_name +
                            " " +
                            props.match[`spirit_score_team_${oppTeamNo()}`].mvp
                              ?.last_name}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${oppTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                </Switch>
                <h2 class="text-center font-bold text-blue-600 dark:text-blue-500">
                  MSPs
                </h2>
                <Switch>
                  <Match
                    when={
                      !props.useUCRegistrations &&
                      props.match[`spirit_score_team_${currTeamNo()}`].msp_v2
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <div class="font-medium dark:text-white">
                        <div>
                          {
                            props.match[`spirit_score_team_${currTeamNo()}`]
                              .msp_v2?.full_name
                          }
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${currTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                  <Match
                    when={
                      props.useUCRegistrations &&
                      props.match[`spirit_score_team_${currTeamNo()}`].msp
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <img
                        class="h-10 w-10 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                        src={
                          props.match[`spirit_score_team_${currTeamNo()}`].msp
                            ?.image_url
                        }
                        alt="Image"
                      />
                      <div class="font-medium dark:text-white">
                        <div>
                          {props.match[`spirit_score_team_${currTeamNo()}`].msp
                            ?.first_name +
                            " " +
                            props.match[`spirit_score_team_${currTeamNo()}`].msp
                              ?.last_name}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${currTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                </Switch>
                <Switch>
                  <Match
                    when={
                      !props.useUCRegistrations &&
                      props.match[`spirit_score_team_${oppTeamNo()}`].msp_v2
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <div class="font-medium dark:text-white">
                        <div>
                          {
                            props.match[`spirit_score_team_${oppTeamNo()}`].msp_v2
                              ?.full_name
                          }
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${oppTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                  <Match
                    when={
                      props.useUCRegistrations &&
                      props.match[`spirit_score_team_${oppTeamNo()}`].msp
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <img
                        class="h-10 w-10 rounded-full p-1 ring-2 ring-gray-300 dark:ring-gray-500"
                        src={
                          props.match[`spirit_score_team_${oppTeamNo()}`].msp
                            ?.image_url
                        }
                        alt="Image"
                      />
                      <div class="font-medium dark:text-white">
                        <div>
                          {props.match[`spirit_score_team_${oppTeamNo()}`].msp
                            ?.first_name +
                            " " +
                            props.match[`spirit_score_team_${oppTeamNo()}`].msp
                              ?.last_name}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${oppTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Match>
                </Switch>
                <Show
                  when={
                    props.match[`self_spirit_score_team_${currTeamNo()}`]
                      ?.comments ||
                    props.match[`self_spirit_score_team_${oppTeamNo()}`]?.comments
                  }
                >
                  <h2 class="text-center font-bold text-blue-600 dark:text-blue-500">
                    Comments
                  </h2>
                  <Show
                    when={
                      props.match[`self_spirit_score_team_${currTeamNo()}`]
                        ?.comments
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <div class="font-medium dark:text-white">
                        <div>
                          {
                            props.match[`self_spirit_score_team_${currTeamNo()}`]
                              ?.comments
                          }
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${currTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Show>
                  <Show
                    when={
                      props.match[`self_spirit_score_team_${oppTeamNo()}`]
                        ?.comments
                    }
                  >
                    <div class="mx-2 flex items-center space-x-4">
                      <div class="font-medium dark:text-white">
                        <div>
                          {
                            props.match[`self_spirit_score_team_${oppTeamNo()}`]
                              ?.comments
                          }
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {props.match[`team_${oppTeamNo()}`].name}
                        </div>
                      </div>
                    </div>
                  </Show>
                </Show>
              </div>
            </FinalSpiritScores>
          </Show> */}
        </div>
        {/*Team Admin Actions*/}
        {/* <Show
          when={
            props.match.status === "scheduled" &&
            (isMatchTeamAdmin() || isStaff())
          }
        >
          <div class="inline-flex w-full items-center justify-center">
            <hr class="my-6 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
            <span class="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm dark:bg-gray-800">
              Match Scores
            </span>
          </div>
          <div class="flex flex-wrap justify-center">
            <Show
              when={checkIfSuggestedScoresClash(
                props.match["suggested_score_team_1"],
                props.match["suggested_score_team_2"]
              )}
            >
              <p class="mb-3 mr-2 rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                Scores Clashing
              </p>
            </Show>
            <Show when={props.match[`suggested_score_team_${currTeamNo()}`]}>
              <p class="mb-2 w-full text-center text-sm">
                {
                  props.match[`suggested_score_team_${currTeamNo()}`][
                    "entered_by"
                  ]["user_first_name"]
                }
                {" | "}
                {props.match[`team_${currTeamNo()}`].name}
                {": "}
                {
                  props.match[`suggested_score_team_${currTeamNo()}`][
                    `score_team_${currTeamNo()}`
                  ]
                }{" "}
                -{" "}
                {
                  props.match[`suggested_score_team_${currTeamNo()}`][
                    `score_team_${oppTeamNo()}`
                  ]
                }{" "}
              </p>
            </Show>
            <Show when={props.match[`suggested_score_team_${oppTeamNo()}`]}>
              <p class="mb-2 w-full text-center text-sm">
                {
                  props.match[`suggested_score_team_${oppTeamNo()}`][
                    "entered_by"
                  ]["user_first_name"]
                }
                {" | "}
                {props.match[`team_${oppTeamNo()}`].name}
                {": "}
                {
                  props.match[`suggested_score_team_${oppTeamNo()}`][
                    `score_team_${currTeamNo()}`
                  ]
                }{" "}
                -{" "}
                {
                  props.match[`suggested_score_team_${oppTeamNo()}`][
                    `score_team_${oppTeamNo()}`
                  ]
                }{" "}
              </p>
            </Show>
            <Show
              when={
                isStaff() &&
                !isMatchTeamAdmin() &&
                !props.match[`suggested_score_team_${currTeamNo()}`] &&
                !props.match[`suggested_score_team_${oppTeamNo()}`]
              }
            >
              <p class="text-center text-sm">No scores have been submitted yet</p>
            </Show>
            <Show when={isMatchTeamAdmin()}>
              <SubmitScore
                buttonColor={
                  props.buttonColor
                    ? matchCardColorToButtonStyles[props.buttonColor]
                    : matchCardColorToButtonStyles[getMatchCardColor(props.match)]
                }
                button={
                  hasUserNotSubmittedScores()
                    ? { text: "Submit Score", icon: arrowRight }
                    : { text: "Edit Score", icon: pencil }
                }
                onClose={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["matches", props.tournamentSlug]
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["team-matches", props.tournamentSlug]
                  });
                }}
              >
                <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
                  <MatchScoreForm
                    match={props.match}
                    currTeamNo={currTeamNo()}
                    oppTeamNo={oppTeamNo()}
                  />
                </div>
              </SubmitScore>
            </Show>
          </div>
        </Show> */}
        {/* Spirit score pending */}
        {/* <Show
          when={
            (props.match.status === "completed" || props.match.status === "scheduled") &&
            isStaff() &&
            (!props.match["spirit_score_team_2"] ||
              !props.match["spirit_score_team_1"])
          }
        >
          <div class="inline-flex w-full items-center justify-center">
            <hr class="my-6 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
            <span class="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm dark:bg-gray-800">
              Spirit Scores
            </span>
          </div>
          <Show when={!props.match[`spirit_score_team_${oppTeamNo()}`]}>
            <p class="text-center text-sm">
              {props.match[`team_${currTeamNo()}`].name} pending
            </p>
          </Show>
          <Show when={!props.match[`spirit_score_team_${currTeamNo()}`]}>
            <p class="text-center text-sm">
              {props.match[`team_${oppTeamNo()}`].name} pending
            </p>
          </Show>
        </Show> */}
        {/* Spirit Score submit */}
        {/* <Show
          when={
            (props.match.status === "completed" || props.match.status === "scheduled") &&
            isMatchTeamAdmin() &&
            canUserSubmitSpiritScores()
          }
        >
          <div class="inline-flex w-full items-center justify-center">
            <hr class="my-6 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
            <span class="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm dark:bg-gray-800">
              Spirit Scores
            </span>
          </div>
          <div class="mb-3 flex flex-wrap justify-center">
            <SubmitSpiritScore
              buttonColor={
                props.buttonColor
                  ? matchCardColorToButtonStyles[props.buttonColor]
                  : matchCardColorToButtonStyles[getMatchCardColor(props.match)]
              }
              onClose={() => {
                queryClient.invalidateQueries({
                  queryKey: ["matches", props.tournamentSlug]
                });
                queryClient.invalidateQueries({
                  queryKey: ["team-matches", props.tournamentSlug]
                });
              }}
            >
              <Show when={isTeamAdminOf(props.match["team_1"].id)}>
                <MatchSpiritScoreForm
                  match={props.match}
                  tournamentSlug={props.tournamentSlug}
                  oppTeamNo={2}
                  curTeamNo={1}
                />
              </Show>
              <Show when={isTeamAdminOf(props.match["team_2"].id)}>
                <MatchSpiritScoreForm
                  match={props.match}
                  tournamentSlug={props.tournamentSlug}
                  oppTeamNo={1}
                  curTeamNo={2}
                />
              </Show>
            </SubmitSpiritScore>
          </div>
        </Show> */}
        {/* <Show
          when={
            (props.match.status === "COM" || props.match.status === "SCH") &&
            isStaff()
          }
        >
          <div class="inline-flex w-full items-center justify-center">
            <hr class="my-6 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
            <span class="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm dark:bg-gray-800">
              Stats
            </span>
          </div>
          <div class="flex flex-wrap justify-center">
            <Show
              when={props.match?.stats}
              fallback={
                <CreateStatsButton
                  match={props.match}
                  tournamentSlug={props.tournamentSlug}
                />
              }
            >
              <A
                class="rounded-lg bg-blue-500 px-2 py-1 text-white"
                href={`/tournament/${props.tournamentSlug}/match/${props.match?.id}/edit-stats-min`}
              >
                Edit Stats
              </A>
            </Show>
          </div>
        </Show> */}
      </div>
    </A>
  );
};

export default TournamentMatch;
