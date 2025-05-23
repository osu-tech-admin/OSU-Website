import { useQuery, useMutation, useQueryClient } from "@tanstack/solid-query";
import clsx from "clsx";
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

import {
  addMatchScore,
  createBracket,
  createCrossPool,
  createField,
  createMatch,
  createPool,
  createPositionPool,
  deleteMatch,
  deleteTournament,
  // fetchBrackets,
  fetchCrossPool,
  fetchFieldsByTournamentId,
  fetchMatches,
  // fetchPools,
  fetchPositionPools,
  fetchTeams,
  fetchTournaments,
  generateTournamentFixtures,
  startTournament,
  updateField,
  updateMatch,
  updateSeeding
} from "../queries";
import { getCookie } from "../utils";
import MatchHeader from "../components/match/MatchHeader";
import ReorderTeams from "../components/tournament/ReorderTeams";
import ScheduleTable from "../components/tournament/ScheduleTable";
import CreatedFields from "../components/tournament-manager/CreatedFields";
import CreateFieldForm from "../components/tournament-manager/CreateFieldForm";
import { fetchTournament } from "~/queries";

const TournamentManager = props => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = createSignal();
  const [selectedTournamentID, setSelectedTournamentID] = createSignal(0);
  const [teams, setTeams] = createSignal([]);
  const [teamsMap, setTeamsMap] = createSignal({});
  const [enteredPoolName, setEnteredPoolName] = createSignal("");
  const [enteredSeedingList, setEnteredSeedingList] = createSignal("[]");
  const [enteredBracketName, setEnteredBracketName] = createSignal("1-8");
  const [enteredPositionPoolName, setEnteredPositionPoolName] =
    createSignal("");
  const [enteredPositionPoolSeedingList, setEnteredPositionPoolSeedingList] =
    createSignal("[]");
  const [flash, setFlash] = createSignal(-1);
  const [matchFields, setMatchFields] = createStore();
  const [matchScoreFields, setMatchStoreFields] = createStore();
  const [matchDayTimeFieldMap, setMatchDayTimeFieldMap] = createStore({});
  const [dayFieldMap, setDayFieldMap] = createStore({});
  const [datesList, setDatesList] = createSignal([]);
  const [timesList, setTimesList] = createSignal([]);
  const [updateMatchFields, setUpdateMatchFields] = createStore();
  const [isStandingsEdited, setIsStandingsEdited] = createSignal(false);
  const [addMatchStatus, setAddMatchStatus] = createSignal();
  const durationList = [45, 60, 75, 90, 100];
  const [scheduleFile, setScheduleFile] = createSignal(null);
  const [uploadError, setUploadError] = createSignal("");

  onMount(() => {
    const dt = new Date(1970, 0, 1, 6, 0);
    let newTimesList = [];
    while (dt.getHours() < 22) {
      newTimesList.push(
        dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })
      );
      dt.setMinutes(dt.getMinutes() + 5);
    }
    setTimesList(newTimesList);
  });

  createEffect(() => {
    if (tournamentsQuery.isSuccess && tournamentQuery.isSuccess) {
      setSelectedTournament(tournamentQuery.data);
      const seeding = tournamentQuery.data?.initial_seeding;

      if (seeding) {
        setTeams(Object.values(seeding));
        console.log(Object.values(seeding));
        
      }

      let newDatesList = [];
      for (
        let d = new Date(Date.parse(tournamentQuery.data?.start_date));
        d <= new Date(Date.parse(tournamentQuery.data?.end_date));
        d.setDate(d.getDate() + 1)
      ) {
        newDatesList.push(new Date(d));
      }
      setDatesList(newDatesList);
    }
  });

  createEffect(() => {
    if (teamsQuery.isSuccess) {
      let newTeamsMap = {};
      teamsQuery.data?.items?.map(team => {
        newTeamsMap[team.id] = team.name;
      });
      setTeamsMap(newTeamsMap);
      
    }
  });

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
        }
      });
    }
  });

  const teamsQuery = useQuery(() => ({
    queryKey: ["teams"],
    queryFn: fetchTeams
  }));
  const tournamentsQuery = useQuery(() => ({
    queryKey: ["tournaments"],
    queryFn: fetchTournaments
  }));
  const tournamentQuery = useQuery(() => ({
    queryKey: ["tournament", selectedTournamentID()],
    queryFn: () => fetchTournament(selectedTournamentID()),
    enabled: selectedTournamentID() !== 0
  }));

  const fieldsQuery = useQuery(() => ({
    queryKey: ["fields", selectedTournamentID()],
    queryFn: () => fetchFieldsByTournamentId(selectedTournamentID()),
    enabled: selectedTournamentID() !== 0
  }));

  // const poolsQuery = useQuery(() => ({
  //   queryKey: ["pools", selectedTournamentID()],
  //   queryFn: () => fetchPools(selectedTournamentID()),
  //   enabled: selectedTournamentID() !== 0
  // }));
  const crossPoolQuery = useQuery(() => ({
    queryKey: ["cross-pool", selectedTournamentID()],
    queryFn: () => fetchCrossPool(selectedTournamentID()),
    enabled: selectedTournamentID() !== 0
  }));
  // const bracketQuery = useQuery(() => ({
  //   queryKey: ["brackets", selectedTournamentID()],
  //   queryFn: () => fetchBrackets(selectedTournamentID()),
  //   enabled: selectedTournamentID() !== 0
  // }));
  const postionPoolsQuery = useQuery(() => ({
    queryKey: ["position-pools", selectedTournamentID()],
    queryFn: () => fetchPositionPools(selectedTournamentID()),
    enabled: selectedTournamentID() !== 0
  }));
  const matchesQuery = useQuery(() => ({
    queryKey: ["matches", selectedTournamentID()],
    queryFn: () => fetchMatches(selectedTournamentID()),
    enabled: selectedTournamentID() !== 0
  }));

  const updateSeedingMutation = useMutation(()=>({
    mutationFn: updateSeeding,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
  }));

  const deleteTournamentMutation = useMutation(()=>({
    mutationFn: deleteTournament,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
  }));

  const createFieldMutation = useMutation(()=>({
    mutationFn: createField,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fields", selectedTournamentID()]
      });
    }
  }));

  const updateFieldMutation = useMutation(()=>({
    mutationFn: updateField,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fields", selectedTournamentID()]
      });
    }
  }));

  const createPoolMutation = useMutation(()=>({
    mutationFn: createPool,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pools", selectedTournamentID()]
      });
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const createCrossPoolMutation = useMutation(()=>({
    mutationFn: createCrossPool,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["cross-pool", selectedTournamentID()]
      })
  }));

  const createBracketMutation = useMutation(()=>({
    mutationFn: createBracket,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["brackets", selectedTournamentID()]
      });
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const createPositionPoolMutation = useMutation(()=>({
    mutationFn: createPositionPool,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["position-pools", selectedTournamentID()]
      });
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const createMatchMutation = useMutation(()=>({
    mutationFn: createMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
      setAddMatchStatus("Successfully created the match!");
    },
    onError: e => {
      setAddMatchStatus(e.toString());
    }
  }));

  const updateMatchMutation = useMutation(()=>({
    mutationFn: updateMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const startTournamentMutation = useMutation(()=>({
    mutationFn: startTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tournaments"]
      });
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const generateTournamentFixturesMutation = useMutation(()=>({
    mutationFn: generateTournamentFixtures,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const addMatchScoreMutation = useMutation(()=>({
    mutationFn: addMatchScore,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      });
    }
  }));

  const deleteMatchMutation = useMutation(()=>({
    mutationFn: deleteMatch,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["matches", selectedTournamentID()]
      })
  }));

  const uploadScheduleMutation = useMutation(()=>({
    mutationFn: async ({ tournament_id, file }) => {
      const formData = new FormData();
      formData.append("schedule_file", file);

      const response = await fetch(
        `/api/tournament/${tournament_id}/update-schedule`,
        {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken")
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      setFlash({ message: "Schedule updated successfully", type: "success" });
      setScheduleFile(null);
      queryClient.invalidateQueries(["matches", selectedTournamentID()]);
    },
    onError: error => {
      setUploadError(error.message);
      setFlash({ message: error.message, type: "error" });
    }
  }));

  Date.prototype.yyyymmdd = function () {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [
      this.getFullYear(),
      (mm > 9 ? "" : "0") + mm,
      (dd > 9 ? "" : "0") + dd
    ].join("-");
  };

  const convertTime12to24 = time12h => {
    const [time, modifier] = time12h.split(" ");

    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
  };

  return (
    <Show when={props.user?.is_staff} fallback={<p>Not Authorised!</p>}>
      <div>
        <h1 class="mb-5 text-center text-2xl font-bold text-blue-500">
          Existing Tournaments
        </h1>
        <select
          id="tournaments"
          onChange={e => setSelectedTournamentID(parseInt(e.target.value))}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          <option value={0} selected>
            Choose a tournament
          </option>
          <For each={tournamentsQuery.data?.items}>
            {t => <option value={t.id}>{t.name}</option>}
          </For>
        </select>

        <Show when={selectedTournamentID() > 0 && selectedTournament()}>
          <div class="relative my-5 overflow-x-auto">
            <div class="mb-4 text-xl font-bold text-blue-500">Seeding</div>
            <Switch>
              <Match
                when={selectedTournament()?.status === "registration_open"}
              >
                <div class="w-full md:w-1/2">
                  <ReorderTeams
                    teams={teams()}
                    updateTeamSeeding={setTeams}
                    teamsMap={teamsMap()}
                    disabled={updateSeedingMutation.isLoading}
                    setIsStandingsEdited={setIsStandingsEdited}
                  />
                  <Show when={isStandingsEdited()}>
                    <div
                      class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
                      role="alert"
                    >
                      Changes are not saved. Please click on Update Seeding
                      button.
                    </div>
                  </Show>
                </div>
              </Match>
              <Match when={selectedTournament()?.status !== "DFT"}>
                <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" class="px-6 py-3">
                        Seeding
                      </th>
                      <th scope="col" class="px-6 py-3">
                        Team Name
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={teams()}>
                      {(id, seed) => (
                        <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                          <th
                            scope="row"
                            class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                          >
                            {seed() + 1}
                          </th>
                          <td class="px-6 py-4">{teamsMap()[id]}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Match>
            </Switch>

            <button
              type="button"
              onClick={() => {
                updateSeedingMutation.mutate({
                  id: selectedTournamentID(),
                  teamSeeding: teams()
                });
                setIsStandingsEdited(false);
              }}
              disabled={
                updateSeedingMutation.isLoading
              }
              class="my-2 mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
            >
              <Show
                when={!updateSeedingMutation.isLoading}
                fallback={"Updating..."}
              >
                Update Seeding
              </Show>
            </button>

            <button
              type="button"
              onClick={() =>
                deleteTournamentMutation.mutate({
                  id: selectedTournamentID()
                })
              }
              class="mb-2 mr-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete Tournament
            </button>
          </div>

          {/* <div>
            <h2 class="mb-5 text-xl font-bold text-blue-500">Pools</h2>
            <Show
              when={!poolsQuery.data?.message}
              fallback={<p>Select Tournament to see/add Pools</p>}
            >
              <div class="grid grid-cols-3 gap-4">
                <For each={poolsQuery.data}>
                  {pool => (
                    <div>
                      <h3>Pool - {pool.name}</h3>{" "}
                      <div class="relative overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                          <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" class="px-6 py-3">
                                Seeding
                              </th>
                              <th scope="col" class="px-6 py-3">
                                Team Name
                              </th>
                              <th scope="col" class="px-6 py-3">
                                Team ID
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={Object.keys(pool.initial_seeding)}>
                              {seed => (
                                <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                                  <th
                                    scope="row"
                                    class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                                  >
                                    {seed}
                                  </th>
                                  <td class="px-6 py-4">
                                    {teamsMap()[pool.initial_seeding[seed]]}
                                  </td>
                                  <td class="px-6 py-4">
                                    {pool.initial_seeding[seed]}
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
                <div class="rounded-lg border border-blue-600 p-5">
                  <h3>Add New Pool</h3>
                  <div>
                    <label
                      for="pool-name"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Pool Name
                    </label>
                    <input
                      type="text"
                      id="pool-name"
                      value={enteredPoolName()}
                      onChange={e => setEnteredPoolName(e.target.value)}
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                    />
                  </div>
                  <div>
                    <label
                      for="seedings-pool"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Seedings List
                    </label>
                    <input
                      type="text"
                      id="seedings-pool"
                      value={enteredSeedingList()}
                      onChange={e => setEnteredSeedingList(e.target.value)}
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      createPoolMutation.mutate({
                        tournament_id: selectedTournamentID(),
                        name: enteredPoolName(),
                        seq_num: poolsQuery.data.length + 1,
                        seeding_list: enteredSeedingList()
                      })
                    }
                    disabled={selectedTournament()?.status !== "SCH"}
                    class="mb-2 mr-2 mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                  >
                    Create Pool
                  </button>
                </div>
              </div>
            </Show>
          </div>
          <div>
            <h3 class="my-5 text-xl font-bold text-blue-500">Cross Pool</h3>
            <Show
              when={crossPoolQuery.data?.message}
              fallback={<p>Cross Pool is Enabled for this Tournament</p>}
            >
              <p>{crossPoolQuery.data?.message}</p>
              <button
                type="button"
                onClick={() =>
                  createCrossPoolMutation.mutate({
                    tournament_id: selectedTournamentID()
                  })
                }
                disabled={selectedTournament()?.status !== "SCH"}
                class="mb-2 mr-2 mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
              >
                Create Cross Pool
              </button>
            </Show>
          </div>
          <div>
            <h2 class="my-5 text-xl font-bold text-blue-500">Brackets</h2>
            <Show
              when={!bracketQuery.data?.message}
              fallback={<p>Select Tournament to see/add Bracket</p>}
            >
              <div class="grid grid-cols-3 gap-4">
                <For each={bracketQuery.data}>
                  {bracket => (
                    <div>
                      <h3>Bracket - {bracket.name}</h3>{" "}
                      <div class="relative overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                          <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" class="px-6 py-3">
                                Seeds in Bracket
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={Object.keys(bracket.initial_seeding)}>
                              {seed => (
                                <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                                  <th
                                    scope="row"
                                    class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                                  >
                                    {seed}
                                  </th>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </For>
                <div class="rounded-lg border border-blue-600 p-5">
                  <h3>Add New Bracket</h3>
                  <div>
                    <label
                      for="bracket-name"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Bracket Name
                    </label>
                    <input
                      type="text"
                      id="bracket-name"
                      value={enteredBracketName()}
                      onChange={e => setEnteredBracketName(e.target.value)}
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      createBracketMutation.mutate({
                        tournament_id: selectedTournamentID(),
                        name: enteredBracketName(),
                        seq_num: bracketQuery.data.length + 1
                      })
                    }
                    disabled={selectedTournament()?.status !== "SCH"}
                    class="mb-2 mr-2 mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                  >
                    Create Bracket
                  </button>
                </div>
              </div>
            </Show>
          </div>
          <div>
            <h2 class="my-5 text-xl font-bold text-blue-500">Position Pools</h2>
            <Show
              when={!postionPoolsQuery.data?.message}
              fallback={<p>Select Tournament to see/add Position Pools</p>}
            >
              <div class="grid grid-cols-3 gap-4">
                <For each={postionPoolsQuery.data}>
                  {pool => (
                    <div>
                      <h3>Position Pool - {pool.name}</h3>{" "}
                      <div class="relative overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                          <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" class="px-6 py-3">
                                Seeding
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={Object.keys(pool.initial_seeding)}>
                              {seed => (
                                <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
                                  <th
                                    scope="row"
                                    class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                                  >
                                    {seed}
                                  </th>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </For>
                <div class="rounded-lg border border-blue-600 p-5">
                  <h3>Add New Positon Pool</h3>
                  <div>
                    <label
                      for="position-pool-name"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Pool Name
                    </label>
                    <input
                      type="text"
                      id="position-pool-name"
                      value={enteredPositionPoolName()}
                      onChange={e => setEnteredPositionPoolName(e.target.value)}
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                    />
                  </div>
                  <div>
                    <label
                      for="seedings-position-pool"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Seedings List
                    </label>
                    <input
                      type="text"
                      id="seedings-position-pool"
                      value={enteredPositionPoolSeedingList()}
                      onChange={e =>
                        setEnteredPositionPoolSeedingList(e.target.value)
                      }
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      createPositionPoolMutation.mutate({
                        tournament_id: selectedTournamentID(),
                        name: enteredPositionPoolName(),
                        seq_num: postionPoolsQuery.data.length + 1,
                        seeding_list: enteredPositionPoolSeedingList()
                      })
                    }
                    disabled={selectedTournament()?.status !== "SCH"}
                    class="mb-2 mr-2 mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                  >
                    Create Position Pool
                  </button>
                </div>
              </div>
            </Show>
          </div>

          <div>
            <h3 class="my-5 text-xl font-bold text-blue-500">Fields</h3>
            <Suspense>
              <Switch>
                <Match when={fieldsQuery.isError}>
                  <p>{fieldsQuery.error.message}</p>
                </Match>
                <Match when={fieldsQuery.isSuccess}>
                  <CreatedFields
                    fields={fieldsQuery.data}
                    tournamentId={selectedTournamentID()}
                    updateFieldMutation={updateFieldMutation}
                    editingDisabled={
                      selectedTournament()?.status !== "SCH" ||
                      updateFieldMutation.isLoading
                    }
                  />
                </Match>
              </Switch>
            </Suspense>
            <div class="mb-2">Add a Field</div>
            <CreateFieldForm
              tournamentId={selectedTournamentID()}
              createFieldMutation={createFieldMutation}
              disabled={
                selectedTournament()?.status !== "SCH" ||
                createFieldMutation.isLoading
              }
              alreadyPresentFields={fieldsQuery.data}
            />
          </div>

          <div>
            <h3 class="my-5 text-xl font-bold text-blue-500">Matches</h3>
            <Show
              when={!matchesQuery.data?.message}
              fallback={<p>Select Tournament to see/add Matches</p>}
            >
              <div class="w-1/2">
                <div>
                  <label
                    for="match-stage"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Match Stage
                  </label>
                  <select
                    id="match-stage"
                    onChange={e => setMatchFields("stage", e.target.value)}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  >
                    <option selected>Choose a stage</option>
                    <option value="pool">Pool</option>
                    <option value="cross_pool">Cross Pool</option>
                    <option value="bracket">Bracket</option>
                    <option value="position_pool">Position Pool</option>
                  </select>
                </div>
                <Show when={matchFields["stage"]}>
                  <div>
                    <label
                      for="match-stage-id"
                      class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Pool/Bracket/Cross-Pool
                    </label>
                    <select
                      id="match-stage-id"
                      onChange={e => setMatchFields("stage_id", e.target.value)}
                      class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    >
                      <option selected>Choose a option</option>
                      <Switch>
                        <Match when={matchFields["stage"] === "pool"}>
                          <For each={poolsQuery.data}>
                            {p => <option value={p.id}>Pool - {p.name}</option>}
                          </For>
                        </Match>
                        <Match when={matchFields["stage"] === "bracket"}>
                          <For each={bracketQuery.data}>
                            {b => (
                              <option value={b.id}>Bracket - {b.name}</option>
                            )}
                          </For>
                        </Match>
                        <Match when={matchFields["stage"] === "cross_pool"}>
                          <option value={crossPoolQuery.data.id}>
                            Cross Pool
                          </option>
                        </Match>
                        <Match when={matchFields["stage"] === "position_pool"}>
                          <For each={postionPoolsQuery.data}>
                            {p => (
                              <option value={p.id}>
                                Position Pool - {p.name}
                              </option>
                            )}
                          </For>
                        </Match>
                      </Switch>
                    </select>
                  </div>
                </Show>
                <div>
                  <label
                    for="match-seq-num"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Sequence Number
                  </label>
                  <input
                    type="number"
                    id="match-seq-num"
                    onChange={e => setMatchFields("seq_num", e.target.value)}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label
                    for="match-time"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="match-time"
                    onChange={e => setMatchFields("time", e.target.value)}
                    min={selectedTournament()?.event?.start_date + "T00:00"}
                    max={selectedTournament()?.event?.end_date + "T23:59"}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-white dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label
                    for="match-field"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Field
                  </label>
                  <select
                    id="match-field"
                    onChange={e => setMatchFields("field_id", e.target.value)}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  >
                    <option selected>Choose a field</option>
                    <For each={fieldsQuery.data}>
                      {field => <option value={field.id}>{field.name}</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label
                    for="match-seed-1"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Team 1 - Seed Number
                  </label>
                  <input
                    type="number"
                    id="match-seed-1"
                    onChange={e => setMatchFields("seed_1", e.target.value)}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label
                    for="match-seed-2"
                    class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Team 2 - Seed Number
                  </label>
                  <input
                    type="number"
                    id="match-seed-2"
                    onChange={e => setMatchFields("seed_2", e.target.value)}
                    class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddMatchStatus("");
                    createMatchMutation.mutate({
                      tournament_id: selectedTournamentID(),
                      body: matchFields
                    });
                  }}
                  disabled={selectedTournament()?.status !== "SCH"}
                  class="mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                >
                  Add Match
                </button>
                <p class="mb-5 text-sm">{addMatchStatus()}</p>
              </div>
            </Show>
            <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-6 py-3">
                    Seeds
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Team 1
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Team 2
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Stage
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Date & Time
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Field
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Actions
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Video Link
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={matchesQuery.data}>
                  {match => (
                    <tr
                      id={match.id}
                      class={clsx(
                        flash() == match.id
                          ? "bg-gray-100 text-black dark:bg-slate-700 dark:text-white"
                          : "bg-white dark:bg-gray-800",
                        "border-b dark:border-gray-700"
                      )}
                    >
                      <th
                        scope="row"
                        class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                      >
                        {match.placeholder_seed_1 +
                          " vs " +
                          match.placeholder_seed_2}
                      </th>
                      <td class="px-6 py-4 text-center">
                        {match.team_1 ? match.team_1.name : "-"}
                        <Show when={match.status === "SCH"}>
                          <label
                            for="match-score-1"
                            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Score
                          </label>
                          <input
                            type="number"
                            id="match-score-1"
                            onChange={e =>
                              setMatchStoreFields(match.id, {
                                ...matchScoreFields[match.id],
                                team_1_score: parseInt(e.target.value)
                              })
                            }
                            class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                          />
                        </Show>
                      </td>
                      <td class="px-6 py-4 text-center">
                        {match.team_2 ? match.team_2.name : "-"}
                        <Show when={match.status === "SCH"}>
                          <label
                            for="match-score-2"
                            class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Score
                          </label>
                          <input
                            type="number"
                            id="match-score-2"
                            onChange={e =>
                              setMatchStoreFields(match.id, {
                                ...matchScoreFields[match.id],
                                team_2_score: parseInt(e.target.value)
                              })
                            }
                            class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                          />
                        </Show>
                      </td>
                      <td class="px-6 py-4">
                        <MatchHeader match={match} />
                        <Show when={match.cross_pool || match.bracket}>
                          <span class="whitespace-nowrap">
                            Seq Num - {match.sequence_number}
                          </span>
                        </Show>
                      </td>
                      <td class="w-fit px-6 py-4">
                        {new Date(Date.parse(match.time)).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            timeZone: "UTC"
                          }
                        )}
                        <hr class="my-1 h-px border-0 bg-gray-200 dark:bg-gray-700" />
                        {match.duration_mins + " mins"}
                        <Show when={match.status !== "COM"}>
                          <div class="mt-2">
                            <select
                              onChange={e => {
                                setUpdateMatchFields(match.id, {});
                                setUpdateMatchFields(
                                  match.id,
                                  "date",
                                  e.target.value
                                );
                              }}
                              class="mb-2 block rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            >
                              <option selected>Choose new date</option>
                              <For each={datesList()}>
                                {date => (
                                  <option value={date}>
                                    {date.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      timeZone: "UTC"
                                    })}
                                  </option>
                                )}
                              </For>
                            </select>
                            <select
                              onChange={e => {
                                setUpdateMatchFields(match.id, {});
                                setUpdateMatchFields(
                                  match.id,
                                  "time",
                                  e.target.value
                                );
                              }}
                              class="mb-2 block rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            >
                              <option selected>Choose new time</option>
                              <For each={timesList()}>
                                {time => <option value={time}>{time}</option>}
                              </For>
                            </select>
                            <select
                              onChange={e => {
                                setUpdateMatchFields(match.id, {});
                                setUpdateMatchFields(
                                  match.id,
                                  "duration",
                                  e.target.value
                                );
                              }}
                              class="block rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            >
                              <option selected>Choose new duration</option>
                              <For each={durationList}>
                                {duration => (
                                  <option value={duration}>
                                    {duration} mins
                                  </option>
                                )}
                              </For>
                            </select>
                          </div>
                        </Show>
                      </td>
                      <td class="px-6 py-4">
                        {match.field?.name}
                        <Show when={match.status !== "COM"}>
                          <select
                            onChange={e => {
                              setUpdateMatchFields(match.id, {});
                              setUpdateMatchFields(
                                match.id,
                                "field_id",
                                e.target.value
                              );
                            }}
                            class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                          >
                            <option selected>Update Field</option>
                            <For each={fieldsQuery.data}>
                              {field => (
                                <option value={field.id}>{field.name}</option>
                              )}
                            </For>
                          </select>
                        </Show>
                      </td>
                      <td class="px-6 py-4">
                        <Switch>
                          <Match when={match.status === "YTF"}>
                            <button
                              type="button"
                              onClick={() => {
                                let body = {};

                                if (
                                  updateMatchFields[match.id]["date"] &&
                                  updateMatchFields[match.id]["time"]
                                ) {
                                  const date = new Date(
                                    updateMatchFields[match.id]["date"]
                                  );

                                  body["time"] =
                                    date.yyyymmdd() +
                                    "T" +
                                    convertTime12to24(
                                      updateMatchFields[match.id]["time"]
                                    );
                                }

                                if (updateMatchFields[match.id]["field_id"]) {
                                  body["field_id"] =
                                    updateMatchFields[match.id]["field_id"];
                                }

                                if (updateMatchFields[match.id]["duration"]) {
                                  body["duration_mins"] =
                                    updateMatchFields[match.id]["duration"];
                                }

                                if (Object.keys(body).length > 0) {
                                  updateMatchMutation.mutate({
                                    match_id: match.id,
                                    body: body
                                  });
                                }
                              }}
                              class="mb-2 mb-5 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                            >
                              Update Details
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteMatchMutation.mutate({
                                  match_id: match.id
                                })
                              }
                              class="mb-2 mb-5 mr-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 disabled:dark:bg-gray-400"
                            >
                              Delete Match
                            </button>
                          </Match>
                          <Match when={match.status === "SCH"}>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  matchScoreFields[match.id]["team_1_score"] >=
                                    0 &&
                                  matchScoreFields[match.id]["team_2_score"] >=
                                    0
                                )
                                  addMatchScoreMutation.mutate({
                                    match_id: match.id,
                                    body: matchScoreFields[match.id]
                                  });
                              }}
                              class="mb-2 mb-5 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:dark:bg-gray-400"
                            >
                              Add Score
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                let body = {};

                                if (
                                  updateMatchFields[match.id]["date"] &&
                                  updateMatchFields[match.id]["time"]
                                ) {
                                  const date = new Date(
                                    updateMatchFields[match.id]["date"]
                                  );

                                  body["time"] =
                                    date.yyyymmdd() +
                                    "T" +
                                    convertTime12to24(
                                      updateMatchFields[match.id]["time"]
                                    );
                                }

                                if (updateMatchFields[match.id]["field_id"]) {
                                  body["field_id"] =
                                    updateMatchFields[match.id]["field_id"];
                                }

                                if (updateMatchFields[match.id]["duration"]) {
                                  body["duration_mins"] =
                                    updateMatchFields[match.id]["duration"];
                                }

                                if (Object.keys(body).length > 0) {
                                  updateMatchMutation.mutate({
                                    match_id: match.id,
                                    body: body
                                  });
                                }
                              }}
                              class="mb-2 mb-5 mr-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 disabled:dark:bg-gray-400"
                            >
                              Update Date & Field
                            </button>
                          </Match>
                          <Match when={match.status === "COM"}>
                            {match.score_team_1 + " - " + match.score_team_2}
                            <Show
                              when={
                                match.spirit_score_team_1 &&
                                match.spirit_score_team_2
                              }
                            >
                              <p class="text-blue-600 dark:text-blue-500">
                                Spirit scores added
                              </p>
                            </Show>

                            <button
                              data-modal-target={`spiritModal-${match.id}`}
                              data-modal-toggle={`spiritModal-${match.id}`}
                              class="block rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                              type="button"
                            >
                              Add Spirit Score
                            </button>
                            <div
                              id={`spiritModal-${match.id}`}
                              tabIndex="-1"
                              aria-hidden="true"
                              class="fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-full w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0"
                            >
                              <div class="relative max-h-full w-full max-w-2xl">
                                <div class="relative rounded-lg bg-white shadow dark:bg-gray-700">
                                  <div class="flex items-start justify-between rounded-t border-b p-4 dark:border-gray-600">
                                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                      Add Spirit Score
                                    </h3>
                                    <button
                                      type="button"
                                      class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                                      data-modal-hide={`spiritModal-${match.id}`}
                                    >
                                      <svg
                                        class="h-3 w-3"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 14 14"
                                      >
                                        <path
                                          stroke="currentColor"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="2"
                                          d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                        />
                                      </svg>
                                      <span class="sr-only">Close modal</span>
                                    </button>
                                  </div>
                                  <div class="space-y-6 p-6">
                                    <UpdateSpiritScoreForm
                                      match={match}
                                      tournament={selectedTournament()}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Match>
                        </Switch>
                      </td>
                      <td class="px-6 py-4">
                        <Show
                          when={match?.video_url}
                          fallback={
                            <div>
                              <input
                                class="mb-3 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-xs"
                                onChange={e => {
                                  setUpdateMatchFields(match.id, {});
                                  setUpdateMatchFields(
                                    match.id,
                                    "video_url",
                                    e.target.value
                                  );
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    updateMatchFields[match.id]["video_url"]
                                  ) {
                                    updateMatchMutation.mutate({
                                      match_id: match.id,
                                      body: {
                                        video_url:
                                          updateMatchFields[match.id][
                                            "video_url"
                                          ]
                                      }
                                    });
                                  }
                                }}
                                class="mb-2 mb-5 mr-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 disabled:dark:bg-gray-400"
                              >
                                Update
                              </button>
                            </div>
                          }
                        >
                          {match?.video_url}
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <div class="my-5">
            <h2 class="mb-4 text-xl font-bold text-blue-500">
              Update Schedule from CSV
            </h2>
            <div class="flex flex-col gap-4">
              <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  CSV Format Instructions
                </h3>

                <div class="mb-4">
                  <h4 class="mb-2 font-medium text-gray-900 dark:text-white">
                    Required Columns:
                  </h4>
                  <ul class="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Date (Format: DD/MM/YYYY)</li>
                    <li>Start Time (Format: HH:MM:SS, 24-hour)</li>
                    <li>End Time (Format: HH:MM:SS, 24-hour)</li>
                    <li>
                      Field 1, Field 2, etc. (Must match field names in
                      tournament settings)
                    </li>
                  </ul>
                </div>

                <div class="mb-4">
                  <h4 class="mb-2 font-medium text-gray-900 dark:text-white">
                    Match Name Formats:
                  </h4>
                  <ul class="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                    <li>
                      Pool Matches: "A1 vs A2" (same letter for same pool)
                    </li>
                    <li>
                      Cross Pool Matches: "CP 1 vs 2" (CP followed by seed
                      numbers)
                    </li>
                    <li>Bracket Matches: "1 vs 2" (just seed numbers)</li>
                  </ul>
                </div>

                <div class="mb-4">
                  <h4 class="mb-2 font-medium text-gray-900 dark:text-white">
                    Example CSV:
                  </h4>
                  <div class="rounded bg-gray-100 p-3 font-mono text-sm dark:bg-gray-700">
                    <pre>
                      Date,Start Time,End Time,Field 1,Field 2 {"\n"}
                      24/03/2025,06:30:00,07:45:00,A1 vs A2,B1 vs B2 {"\n"}
                      24/03/2025,08:00:00,09:15:00,CP 1 vs 2,1 vs 2
                    </pre>
                  </div>
                </div>

                <div class="mb-4">
                  <h4 class="mb-2 font-medium text-gray-900 dark:text-white">
                    Important Notes:
                  </h4>
                  <ul class="list-inside list-disc space-y-1 text-gray-600 dark:text-gray-400">
                    <li>
                      All fields mentioned in CSV must exist in tournament
                      settings
                    </li>
                    <li>Match names must exactly match the format specified</li>
                    <li>Times should be in 24-hour format</li>
                    <li>All matches must exist in the tournament already</li>
                  </ul>
                </div>
              </div>

              <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <label
                  class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  for="schedule-file"
                >
                  Upload Schedule CSV
                </label>
                <input
                  type="file"
                  id="schedule-file"
                  accept=".csv"
                  onChange={e => {
                    setScheduleFile(e.target.files[0]);
                    setUploadError("");
                  }}
                  class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                />
                <Show when={uploadError()}>
                  <p class="mt-2 text-sm text-red-600 dark:text-red-500">
                    {uploadError()}
                  </p>
                </Show>

                <button
                  type="button"
                  disabled={!scheduleFile() || uploadScheduleMutation.isLoading}
                  onClick={() => {
                    uploadScheduleMutation.mutate({
                      tournament_id: selectedTournamentID(),
                      file: scheduleFile()
                    });
                  }}
                  class="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {uploadScheduleMutation.isLoading ? (
                    <span>Uploading...</span>
                  ) : (
                    <span>Upload Schedule</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <For each={Object.keys(matchDayTimeFieldMap).sort()}>
              {day => (
                <div>
                  <h6 class="my-5 text-center">Schedule - {day}</h6>
                  <div class="relative overflow-x-auto">
                    <Suspense>
                      <Switch>
                        <Match when={fieldsQuery.isError}>
                          <p>{fieldsQuery.error.message}</p>
                        </Match>
                        <Match when={fieldsQuery.isSuccess}>
                          <ScheduleTable
                            dayFieldMap={dayFieldMap}
                            day={day}
                            matchDayTimeFieldMap={matchDayTimeFieldMap}
                            setFlash={setFlash}
                            fieldsMap={mapFieldIdToField(fieldsQuery.data)}
                          />
                        </Match>
                      </Switch>
                    </Suspense>
                  </div>
                </div>
              )}
            </For>
          </div>
          <Switch>
            <Match when={selectedTournament()?.status === "SCH"}>
              <button
                type="button"
                onClick={() =>
                  startTournamentMutation.mutate({
                    tournament_id: selectedTournamentID()
                  })
                }
                class="my-5 mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Start Tournament
              </button>
            </Match>
            <Match when={selectedTournament()?.status === "LIV"}>
              <button
                type="button"
                onClick={() =>
                  generateTournamentFixturesMutation.mutate({
                    tournament_id: selectedTournamentID()
                  })
                }
                class="my-5 mb-2 mr-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Populate Fixtures
              </button>
            </Match>
            <Match when={selectedTournament()?.status === "COM"}>
              Completed!!!
            </Match>
          </Switch> */}
        </Show>
      </div>
    </Show>
  );
};

export default TournamentManager;
