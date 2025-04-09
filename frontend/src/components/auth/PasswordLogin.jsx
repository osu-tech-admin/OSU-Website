import { createSignal, Show } from "solid-js";
import { createMutation } from "@tanstack/solid-query";
import { loginWithPassword } from "../../services/authService";
import { Button } from "../ui/button";

export default function PasswordLogin() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  // Create mutation for login
  const loginMutation = createMutation(() => ({
    mutationFn: async () => {
      setError("");
      return await loginWithPassword(email(), password());
    },
    onError: error => {
      setError(error.message);
    },
    onSuccess: () => {
      // Redirect or update UI based on successful login
      window.location.href = "/dashboard";
    }
  }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!email()) {
      setError("Email is required");
      return;
    }
    if (!password()) {
      setError("Password is required");
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div class="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email()}
            onInput={e => setEmail(e.target.value)}
            class="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password()}
            onInput={e => setPassword(e.target.value)}
            class="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            required
          />
        </div>

        <Show when={error()}>
          <div class="text-sm font-medium text-destructive">{error()}</div>
        </Show>

        <Button
          type="submit"
          variant="default"
          class="w-full"
          disabled={loginMutation.isLoading}
        >
          {loginMutation.isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
