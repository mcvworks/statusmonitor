"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const pathname = usePathname();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim().length < 3 || status === "sending") return;
    setStatus("sending");
    try {
      const honeypot =
        (new FormData(e.currentTarget).get("website") as string) ?? "";
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim(),
          page: pathname,
          website: honeypot,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      setMessage("");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  const close = () => {
    setOpen(false);
    setStatus("idle");
  };

  return (
    <div className="relative">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:text-primary"
        title="Send feedback"
      >
        <MessageSquare className="h-3 w-3" />
        Feedback
      </button>

      {open && (
        <div className="absolute bottom-7 right-0 z-40 w-72 rounded-xl border border-border bg-card-solid p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
              Feedback
            </span>
            <button
              onClick={close}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {status === "sent" ? (
            <p className="py-4 text-center text-sm text-secondary">
              Thanks — got it!
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's broken, missing, or confusing?"
                rows={3}
                maxLength={2000}
                required
                className="w-full resize-none rounded-lg border border-border bg-surface-input px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, for replies)"
                className="w-full rounded-lg border border-border bg-surface-input px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              {/* Honeypot — hidden from real users */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              {status === "error" && (
                <p className="text-[11px] text-critical">
                  Something went wrong — please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "sending" || message.trim().length < 3}
                className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#0F1114] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
