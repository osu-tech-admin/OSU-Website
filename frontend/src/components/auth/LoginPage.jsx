import { createSignal, Match, Switch } from "solid-js";
import PasswordLogin from "./PasswordLogin";
import OTPLogin from "./OTPLogin";
import EnterOTP from "./EnterOTP";

export default function LoginPage() {
  const [activeTab, setActiveTab] = createSignal("password"); // "password" or "otp"
  const [otpState, setOtpState] = createSignal({
    stage: "request", // "request" or "enter"
    email: "",
    otpTimestamp: null
  });

  const handleOTPRequested = (email, otpTimestamp) => {
    setOtpState({
      stage: "enter",
      email,
      otpTimestamp
    });
  };

  const handleOTPBack = () => {
    setOtpState({
      stage: "request",
      email: "",
      otpTimestamp: null
    });
  };

  return (
    <div class="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-md">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-foreground">Sign in</h2>
          <p class="mt-2 text-muted-foreground">
            Welcome to Off Season Ultimate
          </p>
        </div>

        <div class="mb-6">
          <div class="flex border-b border-border">
            <button
              class={`flex-1 py-2 text-center font-medium ${
                activeTab() === "password"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("password")}
            >
              Password
            </button>
            <button
              class={`flex-1 py-2 text-center font-medium ${
                activeTab() === "otp"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("otp")}
            >
              Email OTP
            </button>
          </div>
        </div>

        <Switch>
          <Match when={activeTab() === "password"}>
            <PasswordLogin />
          </Match>
          <Match when={activeTab() === "otp"}>
            <Switch>
              <Match when={otpState().stage === "request"}>
                <OTPLogin onOTPRequested={handleOTPRequested} />
              </Match>
              <Match when={otpState().stage === "enter"}>
                <EnterOTP
                  email={otpState().email}
                  otpTimestamp={otpState().otpTimestamp}
                  onBack={handleOTPBack}
                />
              </Match>
            </Switch>
          </Match>
        </Switch>

        <div class="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Don't have an account?{" "}
            <a href="/signup" class="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
