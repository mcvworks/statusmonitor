import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Auth Error — StatusMonitor",
};

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  OAuthSignin: "Could not start the OAuth sign-in flow. Please try again.",
  OAuthCallback: "Could not complete the OAuth sign-in. Please try again.",
  OAuthCreateAccount: "Could not create an account with this OAuth provider.",
  EmailCreateAccount: "Could not create an account with this email address.",
  Callback: "An error occurred during the sign-in callback.",
  OAuthAccountNotLinked:
    "This email is already associated with another provider. Sign in with the original provider.",
  Default: "An unexpected error occurred. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorType = params.error ?? "Default";
  const message = ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0F1114] to-[#0B0D10] px-4">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,194,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(242,194,0,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="relative rounded-2xl border border-[#232A35] bg-[rgba(21,26,34,0.70)] p-8 text-center shadow-xl backdrop-blur-[12px]">
          {/* Corner brackets */}
          <div className="pointer-events-none absolute left-3 top-3 h-[14px] w-[14px] border-l-[1.5px] border-t-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute right-3 top-3 h-[14px] w-[14px] border-r-[1.5px] border-t-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-[14px] w-[14px] border-b-[1.5px] border-l-[1.5px] border-[rgba(242,194,0,0.12)]" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-[14px] w-[14px] border-b-[1.5px] border-r-[1.5px] border-[rgba(242,194,0,0.12)]" />

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,107,107,0.1)]">
            <AlertTriangle className="h-6 w-6 text-[#ff6b6b]" />
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#E9EEF5]">
            Authentication Error
          </h1>

          <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[#B8C0CC]">
            {message}
          </p>

          <Link
            href="/auth/signin"
            className="mt-6 inline-block rounded-xl bg-[#F2C200] px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[#0F1114] transition-all hover:-translate-y-0.5 hover:bg-[#FFD020] hover:shadow-lg hover:shadow-[rgba(242,194,0,0.15)]"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
