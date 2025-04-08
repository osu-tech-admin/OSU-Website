import { createSignal, Show } from "solid-js";
import { createMutation } from "@tanstack/solid-query";
import { loginWithOTP } from "../../services/authService";

export default function EnterOTP({ email, otpTimestamp, onBack }) {
  const [otp, setOtp] = createSignal("");
  const [error, setError] = createSignal("");

  // Create mutation for OTP login
  const otpLoginMutation = createMutation(() => ({
    mutationFn: async () => {
      setError("");
      return await loginWithOTP(email, otp(), otpTimestamp);
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
    if (!otp()) {
      setError("OTP is required");
      return;
    }
    if (otp().length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }
    otpLoginMutation.mutate();
  };

  return (
    <div class="mx-auto w-full max-w-md">
      <div class="mb-4">
        <p class="font-medium text-foreground">Enter the code sent to</p>
        <p class="text-muted-foreground">{email}</p>
      </div>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label
            for="otp-code"
            class="mb-1 block text-sm font-medium text-foreground"
          >
            Verification Code
          </label>
          <input
            id="otp-code"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            value={otp()}
            onInput={e => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
            class="w-full rounded-md border border-input px-3 py-2 text-center text-xl tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="000000"
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
          disabled={otpLoginMutation.isLoading}
        >
          {otpLoginMutation.isLoading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          type="button"
          class="w-full rounded-md bg-transparent py-2 font-medium text-foreground 
                 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary"
          onClick={onBack}
        >
          Back
        </button>
      </form>
    </div>
  );
}
