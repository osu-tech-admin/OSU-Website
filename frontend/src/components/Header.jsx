import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuIcon
} from "./ui/navigation-menu";
import osuLogo from "../assets/osu_logo_white.png";
import { logout } from "../services/authService";
import { useQuery, useQueryClient } from "@tanstack/solid-query";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  const queryClient = useQueryClient();

  const userQuery = useQuery(() => ({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await fetch("/api/user/me");
      if (!result.ok) throw new Error("Failed to fetch data");
      return result.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }));

  const handleLogout = async () => {
    try {
      await logout();
      // Clear local auth data
      queryClient.invalidateQueries({ queryKey: ["me"] });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Shared navigation items to be used in both desktop and mobile views
  const NavigationItems = props => {
    const { onClick = () => {} } = props;

    return (
      <>
        <NavigationMenuItem>
          <A
            href="/"
            class="text-lg font-semibold transition-colors hover:text-yellow-400"
            onClick={onClick}
          >
            Home
          </A>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <A
            href="/tournament/mul-25"
            class="text-lg font-semibold transition-colors hover:text-yellow-400"
            onClick={onClick}
          >
            MUL '25
          </A>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <A
            href="/players"
            class="text-lg font-semibold transition-colors hover:text-yellow-400"
            onClick={onClick}
          >
            Players
          </A>
        </NavigationMenuItem>
        <Show when={props.mobile}>
          <NavigationMenuItem>
            <A
              href="/dashboard"
              class="text-lg font-semibold transition-colors hover:text-yellow-400"
              onClick={onClick}
            >
              My Account
            </A>
          </NavigationMenuItem>
        </Show>
      </>
    );
  };

  return (
    <header class="sticky top-0 z-50 w-full bg-blue-950 text-white backdrop-blur">
      <div class="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <A href="/" class="flex items-center space-x-2">
          <img src={osuLogo} alt="OSU Logo" class="h-16 w-auto" />
          <span class="hidden text-xl font-bold sm:inline-block">
            Off Season Ultimate
          </span>
        </A>

        {/* Desktop Navigation */}
        <div class="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
          <NavigationMenu class="flex items-center space-x-4">
            <NavigationItems  />
          </NavigationMenu>

          {/* Auth buttons for desktop */}
          <Show
            when={userQuery.isSuccess}
            fallback={
              <A href="/login">
                <Button variant="default" size="lg" class="text-md bg-white text-blue-950">
                  Sign In
                </Button>
              </A>
            }
          >
            <div class="flex items-center space-x-2">
              <A href="/dashboard">
                <Button variant="default" size="lg" class="text-md bg-white text-primary hover:bg-yellow-400"> 
                  My Account
                </Button>
              </A>
            </div>
          </Show>
        </div>

        {/* Mobile menu button */}
        <div class="flex items-center md:hidden">
          <Show
            when={userQuery.isSuccess}
            fallback={
              <A href="/login" class="mr-2">
                <Button variant="default" size="sm" class="bg-white text-blue-950">
                  Sign In
                </Button>
              </A>
            }
          >
            <A href="/dashboard" class="mr-2">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </A>
          </Show>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            class="text-white focus:bg-transparent focus:text-white hover:bg-transparent hover:text-white "
            onClick={() => setIsMenuOpen(!isMenuOpen())}
          >
            <Show
              when={isMenuOpen()}
              fallback={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-6 w-6"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-6"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Show>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <Show when={isMenuOpen()}>
        <div class="container border-t px-4 py-4 md:hidden">
          <NavigationMenu class="w-full flex-col data-[orientation=vertical]:flex space-y-2">
            <NavigationItems
              mobile={true}
              onClick={() => setIsMenuOpen(false)}
            />
          </NavigationMenu>
        </div>
      </Show>
    </header>
  );
}
