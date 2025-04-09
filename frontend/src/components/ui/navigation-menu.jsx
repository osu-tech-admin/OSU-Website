import { splitProps } from "solid-js"

import * as NavigationMenuPrimitive from "@kobalte/core/navigation-menu"

import { cn } from "~/lib/utils"

const NavigationMenuItem = NavigationMenuPrimitive.Menu

const NavigationMenu = props => {
  const [local, others] = splitProps(props, ["class", "children"])
  return (
    <NavigationMenuPrimitive.Root
      gutter={6}
      class={cn(
        "group/menu flex w-max flex-1 list-none items-center justify-center data-[orientation=vertical]:flex-col [&>li]:w-full",
        local.class
      )}
      {...others}>
      {local.children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
}

const NavigationMenuTrigger = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <NavigationMenuPrimitive.Trigger
      class={cn(
        "group/trigger inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[expanded]:bg-accent/50",
        local.class
      )}
      {...others} />
  );
}
const NavigationMenuIcon = () => {
  return (
    <NavigationMenuPrimitive.Icon aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="relative top-px ml-1 size-3 transition duration-200 group-data-[expanded]/trigger:rotate-180 group-data-[orientation=vertical]/menu:-rotate-90 group-data-[orientation=vertical]/menu:group-data-[expanded]/trigger:rotate-90">
        <path d="M6 9l6 6l6 -6" />
      </svg>
    </NavigationMenuPrimitive.Icon>
  );
}

const NavigationMenuViewport = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <NavigationMenuPrimitive.Viewport
      class={cn(// base settings
      "pointer-events-none z-[1000] flex h-[var(--kb-navigation-menu-viewport-height)] w-[var(--kb-navigation-menu-viewport-width)] origin-[var(--kb-menu-content-transform-origin)] items-center justify-center overflow-x-clip overflow-y-visible rounded-md border bg-popover opacity-0 shadow-lg data-[expanded]:pointer-events-auto data-[orientation=vertical]:overflow-y-clip data-[orientation=vertical]:overflow-x-visible data-[expanded]:rounded-md", // animate
      "animate-content-hide transition-[width,height] duration-200 ease-in data-[expanded]:animate-content-show data-[expanded]:opacity-100 data-[expanded]:ease-out", local.class)}
      {...others} />
  );
}

const NavigationMenuContent = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Content
        class={cn(// base settings
        "pointer-events-none absolute left-0 top-0 box-border p-4 focus:outline-none data-[expanded]:pointer-events-auto", // base animation settings
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out", // left to right
        "data-[orientation=horizontal]:data-[motion=from-start]:slide-in-from-left-52 data-[orientation=horizontal]:data-[motion=to-end]:slide-out-to-right-52", // right to left
        "data-[orientation=horizontal]:data-[motion=from-end]:slide-in-from-right-52 data-[orientation=horizontal]:data-[motion=to-start]:slide-out-to-left-52", // top to bottom
        "data-[orientation=vertical]:data-[motion=from-start]:slide-in-from-top-52 data-[orientation=vertical]:data-[motion=to-end]:slide-out-to-bottom-52", //bottom to top
        "data-[orientation=vertical]:data-[motion=from-end]:slide-in-from-bottom-52 data-[orientation=vertical]:data-[motion=to-start]:slide-out-to-bottom-52", local.class)}
        {...others} />
    </NavigationMenuPrimitive.Portal>
  );
}

const NavigationMenuLink = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <NavigationMenuPrimitive.Item
      class={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors  hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        local.class
      )}
      {...others} />
  );
}

const NavigationMenuLabel = props => {
  const [local, others] = splitProps(props, ["class"])
  return (<NavigationMenuPrimitive.ItemLabel class={cn("text-sm font-medium leading-none", local.class)} {...others} />);
}

const NavigationMenuDescription = props => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <NavigationMenuPrimitive.ItemDescription
      class={cn("text-sm leading-snug text-muted-foreground", local.class)}
      {...others} />
  );
}

export {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuIcon,
  NavigationMenuViewport,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuLabel,
  NavigationMenuDescription
}
