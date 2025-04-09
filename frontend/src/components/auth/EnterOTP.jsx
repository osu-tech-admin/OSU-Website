import { createSignal, Show } from "solid-js";
import { createMutation, useQueryClient } from "@tanstack/solid-query";
import { loginWithOTP } from "../../services/authService";
import { Button } from "../ui/button";
import {
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSlot,
  REGEXP_ONLY_DIGITS
} from "../ui/otp-field";

export default function EnterOTP({ email, otpTimestamp, onBack }) {
  const [otp, setOtp] = createSignal("");
  const [error, setError] = createSignal("");
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["me"] });
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
          <OTPField
            value={otp()}
            onValueChange={setOtp}
            pattern={REGEXP_ONLY_DIGITS}
            length={6}
            class="mt-2"
          >
            <OTPFieldInput id="otp-code" />
            <OTPFieldGroup class="w-full justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <OTPFieldSlot index={i} />
              ))}
            </OTPFieldGroup>
          </OTPField>
        </div>

        <Show when={error()}>
          <div class="text-sm font-medium text-destructive">{error()}</div>
        </Show>

        <Button
          type="submit"
          variant="default"
          class="w-full"
          disabled={otpLoginMutation.isLoading}
        >
          {otpLoginMutation.isLoading ? "Verifying..." : "Verify Code"}
        </Button>

        <Button type="button" variant="outline" class="w-full" onClick={onBack}>
          Back
        </Button>
      </form>
    </div>
  );
}
