import Link from "next/link";
import { LogIn } from "lucide-react";

export function SignInButton() {
  return (
    <Link
      href="/auth/signin"
      className="flex items-center gap-2 rounded-xl border border-[#232A35] bg-[#10141A] px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5] transition-all hover:-translate-y-0.5 hover:border-[#2a3140] hover:bg-[#1A2030] hover:shadow-lg"
    >
      <LogIn className="h-4 w-4" />
      Sign in
    </Link>
  );
}
