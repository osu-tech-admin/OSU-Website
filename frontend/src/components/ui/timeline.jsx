import { For, mergeProps, Show, splitProps } from "solid-js";

import { cn } from "~/lib/utils"

/*
  No bullet or line is active when activeItem is -1
  First bullet is active only if activeItem is 0 or more
  First line is active only if activeItem is 1 or more
*/

const Timeline = (rawProps) => {
  const props = mergeProps({ bulletSize: 16, lineSize: 2 }, rawProps)

  return (
    <ul
      style={{
        "padding-left": `${props.bulletSize / 2}px`
      }}>
      <For each={props.items}>
        {(item, index) => (
          <TimelineItem
            title={item.title}
            description={item.description}
            bullet={item.bullet}
            isLast={index() === props.items.length - 1}
            isActive={props.activeItem === -1 ? false : props.activeItem >= index() + 1}
            isActiveBullet={props.activeItem === -1 ? false : props.activeItem >= index()}
            bulletSize={props.bulletSize}
            lineSize={props.lineSize} />
        )}
      </For>
    </ul>
  );
}

const TimelineItem = (props) => {
  const [local, others] = splitProps(props, [
    "class",
    "bullet",
    "description",
    "title",
    "isLast",
    "isActive",
    "isActiveBullet",
    "bulletSize",
    "lineSize"
  ])
  return (
    <li
      class={cn(
        "relative border-l pb-8 pl-8",
        local.isLast && "border-l-transparent pb-0",
        local.isActive && !local.isLast && "border-l-gray-700",
        local.class
      )}
      style={{
        "border-left-width": `${local.lineSize}px`
      }}
      {...others}>
      <TimelineItemBullet
        lineSize={local.lineSize}
        bulletSize={local.bulletSize}
        isActive={local.isActiveBullet}>
        {local.bullet}
      </TimelineItemBullet>
      <TimelineItemTitle>{local.title}</TimelineItemTitle>
      <Show when={local.description}>
        <TimelineItemDescription>{local.description}</TimelineItemDescription>
      </Show>
    </li>
  );
}

const TimelineItemBullet = (props) => {
  return (
    <div
      class={cn(
        `absolute top-0 flex items-center justify-center rounded-full border bg-background`,
        props.isActive && "border-gray-700"
      )}
      style={{
        width: `${props.bulletSize}px`,
        height: `${props.bulletSize}px`,
        left: `${-props.bulletSize / 2 - props.lineSize / 2}px`,
        "border-width": `${props.lineSize}px`
      }}
      aria-hidden="true">
      {props.children}
    </div>
  );
}

const TimelineItemTitle = (props) => {
  return <div class="mb-1 text-base font-semibold leading-none">{props.children}</div>;
}

const TimelineItemDescription = (props) => {
  const [local, others] = splitProps(props, ["class", "children"])
  return (
    <p class={cn("text-sm text-muted-foreground", local.class)} {...others}>
      {local.children}
    </p>
  );
}

export { Timeline, TimelineItem, TimelineItemBullet, TimelineItemTitle, TimelineItemDescription }
