import { createSignal, Match, Switch } from "solid-js";
import PasswordLogin from "../components/auth/PasswordLogin";
import OTPLogin from "../components/auth/OTPLogin";
import EnterOTP from "../components/auth/EnterOTP";
import { Button } from "../components/ui/button";

export default function Login() {
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
    <div class="min-h-screen bg-background">
      <div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-md">
          <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold text-foreground">Sign in</h2>
            <p class="mt-2 text-muted-foreground">
              Welcome to Off Season Ultimate
            </p>
          </div>

          <div class="mb-6">
            <div class="flex border-b border-border">
              <Button
                variant={activeTab() === "password" ? "link" : "ghost"}
                class={`flex-1 ${
                  activeTab() === "password"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("password")}
              >
                Password
              </Button>
              <Button
                variant={activeTab() === "otp" ? "link" : "ghost"}
                class={`flex-1 ${
                  activeTab() === "otp"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("otp")}
              >
                Email OTP
              </Button>
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
    </div>
  );
}
