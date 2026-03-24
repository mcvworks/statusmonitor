import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Mail, Github, Shield, BarChart3, Bell, Layers } from "lucide-react";

export const metadata = {
  title: "Sign In — DTMonitor",
  description: "Sign in to DTMonitor for custom dashboards, alerts, and dependency mapping.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session) redirect(params.callbackUrl ?? "/dashboard");

  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0F1114] to-[#0B0D10] px-4">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,194,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(242,194,0,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="relative rounded-2xl border border-[#232A35] bg-[rgba(21,26,34,0.70)] p-8 shadow-xl backdrop-blur-[12px]">
          {/* Corner brackets */}
          <div className="pointer-events-none absolute left-3 top-3 h-[14px] w-[14px] border-l-[1.5px] border-t-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute right-3 top-3 h-[14px] w-[14px] border-r-[1.5px] border-t-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-[14px] w-[14px] border-b-[1.5px] border-l-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-[14px] w-[14px] border-b-[1.5px] border-r-[1.5px] border-[rgba(242,194,0,0.12)]" />

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-wider text-[#E9EEF5]">
              DTMonitor
            </h1>
            <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-[#8892A0]">
              Sign in to your account
            </p>
          </div>

          {/* Error banner */}
          {params.error && (
            <div className="mb-6 rounded-lg border border-[rgba(255,107,107,0.2)] bg-[rgba(255,107,107,0.06)] px-4 py-3 text-sm text-[#ff6b6b]">
              {params.error === "OAuthAccountNotLinked"
                ? "This email is already linked to another provider. Sign in with the original provider."
                : "An error occurred during sign in. Please try again."}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#232A35] bg-[#10141A] px-4 py-3 font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5] transition-all hover:-translate-y-0.5 hover:border-[#2a3140] hover:bg-[#1A2030] hover:shadow-lg"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#232A35] bg-[#10141A] px-4 py-3 font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5] transition-all hover:-translate-y-0.5 hover:border-[#2a3140] hover:bg-[#1A2030] hover:shadow-lg"
              >
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("apple", { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#232A35] bg-[#10141A] px-4 py-3 font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5] transition-all hover:-translate-y-0.5 hover:border-[#2a3140] hover:bg-[#1A2030] hover:shadow-lg"
              >
                <AppleIcon />
                Continue with Apple
              </button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#232A35] bg-[#10141A] px-4 py-3 font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5] transition-all hover:-translate-y-0.5 hover:border-[#2a3140] hover:bg-[#1A2030] hover:shadow-lg"
              >
                <Github className="h-5 w-5" />
                Continue with GitHub
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#232A35]" />
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8892A0]">
              or
            </span>
            <div className="h-px flex-1 bg-[#232A35]" />
          </div>

          {/* Magic link form */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              await signIn("resend", { email, redirectTo: callbackUrl });
            }}
          >
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8892A0]" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-[1.5px] border-[#232A35] bg-[#10141A] py-3 pl-10 pr-4 font-[family-name:var(--font-body)] text-sm text-[#E9EEF5] placeholder-[#8892A0] transition-all focus:border-[#F2C200] focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#F2C200] px-4 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[#0F1114] transition-all hover:-translate-y-0.5 hover:bg-[#FFD020] hover:shadow-lg hover:shadow-[rgba(242,194,0,0.15)]"
              >
                Send magic link
              </button>
            </div>
          </form>
        </div>

        {/* Why sign up */}
        <div className="mt-6 rounded-2xl border border-[#232A35] bg-[rgba(21,26,34,0.50)] p-6 backdrop-blur-[12px]">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-widest text-[#F2C200]">
            Why sign up?
          </h2>
          <ul className="space-y-3">
            <BenefitItem icon={<BarChart3 className="h-4 w-4" />} text="Custom dashboard with pinned services" />
            <BenefitItem icon={<Bell className="h-4 w-4" />} text="Real-time alerts via email, Slack, or push" />
            <BenefitItem icon={<Layers className="h-4 w-4" />} text="My Stack — map your infrastructure dependencies" />
            <BenefitItem icon={<Shield className="h-4 w-4" />} text="Acknowledge, snooze, and filter alerts" />
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-[family-name:var(--font-body)] text-xs text-[#8892A0]">
          Built by{" "}
          <a
            href="https://ducktyped.com"
            className="text-[#F2C200] transition-colors hover:text-[#FFD020]"
          >
            Ducktyped
          </a>
        </p>
      </div>
    </div>
  );
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-[#B8C0CC]">
      <span className="text-[#48E0C7]">{icon}</span>
      {text}
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.02 8.93 8.75c1.27.07 2.16.72 2.91.77.97-.2 1.9-.75 2.93-.68 1.24.1 2.17.58 2.78 1.48-2.56 1.53-1.95 4.89.58 5.82-.46 1.2-.67 1.73-1.26 2.79-.84 1.49-2.02 2.98-3.82 3.35zM12.05 8.68c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
