import { splitProps } from "solid-js"

import * as TabsPrimitive from "@kobalte/core/tabs"

import { cn } from "~/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <TabsPrimitive.List
      class={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        local.class
      )}
      {...others} />
  );
}

const TabsTrigger = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <TabsPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
        local.class
      )}
      {...others} />
  );
}

const TabsContent = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <TabsPrimitive.Content
      class={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        local.class
      )}
      {...others} />
  );
}

const TabsIndicator = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <TabsPrimitive.Indicator
      class={cn(
        "duration-250ms absolute transition-all data-[orientation=horizontal]:-bottom-px data-[orientation=vertical]:-right-px data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px]",
        local.class
      )}
      {...others} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator }
