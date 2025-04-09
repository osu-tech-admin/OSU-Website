import osuLogo from "../assets/osu_logo.png";
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
            class="mb-8 h-32 w-auto"
          />
          <h1 class="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Off Season Ultimate
          </h1>
          <p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Join the ultimate frisbee community and stay connected during the
            off-season. Play pickup games, track your stats, and connect with
            other players.
          </p>

          <div class="flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
            <Button
              variant="default"
              class="w-full"
              onClick={() => (window.location.href = "/login")}
            >
              Sign In
            </Button>
            <Button
              variant="secondary"
              class="w-full"
              onClick={() => (window.location.href = "/signup")}
            >
              Join Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="bg-muted/50 py-16">
        <div class="container mx-auto px-4">
          <h2 class="mb-12 text-center text-3xl font-bold">Why Join OSU?</h2>
          <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div class="rounded-lg bg-card p-6 shadow-sm">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
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
              <h3 class="mb-2 text-xl font-semibold">Community</h3>
              <p class="text-muted-foreground">
                Connect with other ultimate frisbee players in your area and
                build lasting friendships.
              </p>
            </div>

            <div class="rounded-lg bg-card p-6 shadow-sm">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 class="mb-2 text-xl font-semibold">Game Tracking</h3>
              <p class="text-muted-foreground">
                Organize and join pickup games, track your stats, and improve
                your skills.
              </p>
            </div>

            <div class="rounded-lg bg-card p-6 shadow-sm">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 class="mb-2 text-xl font-semibold">Stay Active</h3>
              <p class="text-muted-foreground">
                Keep playing even in the off-season with regular events and
                training opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section class="py-16">
        <div class="container mx-auto px-4">
          <h2 class="mb-12 text-center text-3xl font-bold">What Players Say</h2>
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
              <p class="mb-4 italic text-muted-foreground">
                "OSU has completely changed how I experience the off-season.
                Instead of waiting for tournaments, I'm playing and improving
                all year round!"
              </p>
              <div class="flex items-center">
                <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <span class="font-semibold text-primary">JD</span>
                </div>
                <div>
                  <h4 class="font-semibold">Jamie Doe</h4>
                  <p class="text-sm text-muted-foreground">Seattle, WA</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
              <p class="mb-4 italic text-muted-foreground">
                "I've met so many amazing players through OSU. The community is
                supportive, and the pickup games are always a blast!"
              </p>
              <div class="flex items-center">
                <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <span class="font-semibold text-primary">AS</span>
                </div>
                <div>
                  <h4 class="font-semibold">Alex Smith</h4>
                  <p class="text-sm text-muted-foreground">Portland, OR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
