import { createSignal, Show } from "solid-js";
import { createMutation } from "@tanstack/solid-query";
import { requestOTP } from "../../services/authService";

export default function OTPLogin({ onOTPRequested }) {
  const [email, setEmail] = createSignal("");
  const [error, setError] = createSignal("");

  // Create mutation for OTP request
  const otpRequestMutation = createMutation(() => ({
    mutationFn: async () => {
      setError("");
      return await requestOTP(email());
    },
    onError: error => {
      setError(error.message);
    },
    onSuccess: data => {
      // Call the callback with email and OTP timestamp
      onOTPRequested(email(), data.otp_ts);
    }
  }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!email()) {
      setError("Email is required");
      return;
    }
    otpRequestMutation.mutate();
  };

  return (
    <div class="mx-auto w-full max-w-md">
      <p class="mb-4 text-muted-foreground">
        We'll send a one-time password to your email
      </p>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label
            for="email-otp"
            class="mb-1 block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email-otp"
            type="email"
            value={email()}
            onInput={e => setEmail(e.target.value)}
            class="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
            required
          />
        </div>

        <Show when={error()}>
          <div class="text-sm font-medium text-destructive">{error()}</div>
        </Show>

        <button
          type="submit"
          class="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground 
                 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={otpRequestMutation.isLoading}
        >
          {otpRequestMutation.isLoading ? "Sending..." : "Send Code"}
        </button>
      </form>
    </div>
  );
}
