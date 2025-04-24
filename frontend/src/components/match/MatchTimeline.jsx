import { For, Match, Switch } from "solid-js";
import { TimelineItem } from "~/components/ui/timeline";
import { Badge } from "~/components//ui/badge";

const EventTitle = props => {
  return (
    <div class="flex items-center justify-between gap-2 p-0.5">
      {/* current score */}
      <div class="flex items-center gap-2">
        {props.event?.current_score_team_1} -{" "}
        {props.event?.current_score_team_2}
      </div>
      {/* event type */}
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <Switch>
          <Match when={props.event?.type === "SC"}>
            <Badge variant="success">Score</Badge>
          </Match>
          <Match when={props.event?.type === "BL"}>
            <Badge variant="warning">Block</Badge>
          </Match>
          <Match when={props.event?.type === "TA"}>
            <Badge variant="outline">Throwaway</Badge>
          </Match>
          <Match when={props.event?.type === "DR"}>
            <Badge variant="outline">Drop</Badge>
          </Match>
        </Switch>
        {/* event time */}
        <div>
          {new Date(props.event?.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
};

const EventDescription = props => {
  return (
    <div class="mt-2 text-sm text-gray-600">
      <Switch>
        <Match when={props.event?.type === "SC"}>
          <span class="font-bold">
            {props.event?.assisted_by?.user_full_name}
          </span>
          {" to "}
          <span class="font-bold">
            {props.event?.scored_by?.user_full_name}
          </span>
        </Match>
        <Match when={props.event?.type === "BL"}>
          <div class="text-sm text-gray-600">
            <span>Block by</span>{" "}
            <span class="font-bold">
              {props.event?.block_by?.user_full_name}
            </span>
          </div>
        </Match>
        <Match when={props.event?.type === "TA"}>
          <div class="text-sm text-gray-600">
            <span>Throwaway by</span>{" "}
            <span class="font-bold">
              {props.event?.block_by?.user_full_name}
            </span>
          </div>
        </Match>
        <Match when={props.event?.type === "DR"}>
          <div class="text-sm text-gray-600">
            <span>Drop by</span>{" "}
            <span class="font-bold">
              {props.event?.block_by?.user_full_name}
            </span>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

const EventsDisplay = props => {
  return (
    <div class="flex flex-col gap-2 px-4 py-3">
      <ul>
        <For each={props.stats?.events}>
          {(event, index) => (
            <TimelineItem
              bullet={
                <img
                  class="inline-block h-6 w-6 rounded-full object-cover p-0.5"
                  src={event.team?.logo}
                  alt="Bordered avatar"
                />
              }
              bulletSize={30}
              lineSize={2}
              title={<EventTitle event={event} />}
              description={<EventDescription event={event} />}
              isLast={index() === props.stats?.events?.length - 1}
              isActive={index() === 0}
              isActiveBullet={index() === 0}
            />
          )}
        </For>
      </ul>
    </div>
  );
};

const MatchTimeline = props => {
  return (
    // <Show
    //   when={!props.match?.data?.message}
    //   fallback={
    //     <div>
    //       Match could not be fetched. Error - {props.match?.data?.message}
    //       <A href={"/tournaments"} class="text-blue-600 dark:text-blue-500">
    //         <br />
    //         Back to Tournaments Page
    //       </A>
    //     </div>
    //   }
    // >
    <div class="mt-3">
      <EventsDisplay match={props.match} stats={props.stats} />
    </div>
    // </Show>
  );
};

export default MatchTimeline;
