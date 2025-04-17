import { Show } from "solid-js";

const CoachBadge = () => (
  <span class="me-2 h-fit rounded-full bg-pink-100 px-2.5 py-0.5 text-center text-xs text-pink-800 dark:bg-pink-900 dark:text-pink-300">
    Coach
  </span>
);

const CaptainBadge = () => (
  <span class="me-2 h-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-center text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-300">
    Captain
  </span>
);

const SpiritCaptainBadge = () => (
  <span class="me-2 h-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
    Spirit Captain
  </span>
);

const OwnerBadge = () => (
  <span class="me-2 h-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-300">
    Owner
  </span>
);

const isCaptain = registration => registration?.role === "CAP";

const isSpiritCaptain = registration => registration?.role === "SCAP";

const isCoach = registration =>
  registration?.role === "COACH"

const isOwner = registration => registration?.role === "OWNER";

const Registration = props => (
  <div class="mr-6 flex w-full items-center gap-x-4 py-3 pr-2 text-muted-foreground">
    <div class="font-medium">
      <div>
        {props.registration?.player?.user_first_name.trim()}{" "}
        {props.registration?.player?.user_last_name.trim()}
        <Show
          when={props.registration.player?.gender}
        >{` (${props.registration.player?.gender})`}</Show>
      </div>
    </div>
    <Show when={isCaptain(props.registration)}>
      <CaptainBadge />
    </Show>
    <Show when={isSpiritCaptain(props.registration)}>
      <SpiritCaptainBadge />
    </Show>
    <Show when={isOwner(props.registration)}>
      <OwnerBadge />
    </Show>
    <Show when={isCoach(props.registration)}>
      <CoachBadge />
    </Show>
  </div>
);

export default Registration;
