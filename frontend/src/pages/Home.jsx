import osuLogo from "../assets/osu_logo.png";
import mulLogo from "../assets/mul_logo.png";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div class="min-h-screen bg-background">
      {/* Hero Section */}
      <section class="px-4 py-12 md:py-20">
        <div class="container mx-auto flex flex-col items-center text-center">
          <img
            src={osuLogo}
            alt="Off Season Ultimate Logo"
            class="mb-8 h-32 w-auto scale-150"
          />
          {/* <h1 class="mb-6 text-4xl font-bold text-foreground md:text-5xl text-blue-950">
            Off Season Ultimate
          </h1> */}
          <p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            There’s no off-season when off-season ultimate is here 😎 Play
            tournaments, track your stats, connect with other players, and be
            part of the OSU family 👊🏽
          </p>

          <div class="flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
            <Button
              variant="default"
              class="w-full"
              onClick={() => (window.location.href = "/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="bg-blue-950 px-4 py-8">
        <div class="container mx-auto">
          {/* <h2 class="mb-4 text-center text-3xl font-bold">Featured Leagues</h2> */}
          <div class="flex flex-col items-center gap-6 md:flex-row md:items-stretch">
            <div class="max-w-xl rounded-lg bg-card p-8 shadow-sm">
              <div class="flex justify-end">
                <div class="flex w-fit items-center gap-2 rounded-full bg-orange-500 px-4 py-1 text-sm font-semibold text-white">
                  <span class="relative flex size-3">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                    <span class="relative inline-flex size-3 rounded-full bg-white"></span>
                  </span>
                  <span>Season 5</span>
                </div>
              </div>
              <div class="flex flex-col items-center gap-6 md:flex-row">
                <div class="flex-shrink-0">
                  {/* Replace the src with the actual path to mul_logo once it's imported */}
                  <img
                    src={mulLogo}
                    alt="Mumbai Ultimate League Logo"
                    class="h-36 w-auto scale-150"
                  />
                </div>
                <div class="text-left">
                  {/* <h3 class="mb-2 text-2xl font-bold text-blue-950">
                    Mumbai Ultimate League
                  </h3> */}

                  <p class="my-2 text-muted-foreground">
                    Join Mumbai's premier ultimate frisbee league featuring the
                    city's top players and teams.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/tournament/mul-s5")}
                  >
                    View League
                  </Button>
                </div>
              </div>
            </div>
            <div class="rounded-lg bg-card p-6 shadow-sm">
              <div class="mb-4 flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-950">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-blue-950">
                  Player Profiles
                </h3>
              </div>

              <p class="mb-4 text-muted-foreground">
                View all our amazing player profiles with their latest stats.
              </p>
              <Button
                variant="default"
                onClick={() => (window.location.href = "/players")}
              >
                Browse Players
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
