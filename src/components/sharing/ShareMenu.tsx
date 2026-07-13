"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Mail, MessageSquare, Share2 } from "lucide-react";

interface ShareMenuProps {
  url: string;
  title: string;
  text: string;
  compact?: boolean;
}

export function ShareMenu({ url, title, text, compact = false }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const absoluteUrl = url.startsWith("http")
    ? url
    : `https://monitor.ducktyped.xyz${url}`;
  const message = `${text}\n${absoluteUrl}`;

  async function copy(value = absoluteUrl) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title, text, url: absoluteUrl }).catch(() => undefined);
      return;
    }
    setOpen(!open);
  }

  function openShare(target: string) {
    window.open(target, "_blank", "noopener,noreferrer,width=720,height=640");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onDoubleClick={nativeShare}
        className={`inline-flex items-center gap-1.5 rounded-lg text-text-muted transition-colors hover:bg-primary/10 hover:text-primary ${compact ? "p-1.5" : "border border-border px-3 py-1.5 text-xs"}`}
        aria-label="Share incident"
        aria-expanded={open}
        title="Share incident"
      >
        <Share2 className="h-3.5 w-3.5" />
        {!compact && "Share"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-border bg-card-solid p-2 shadow-xl">
          <ShareButton icon={copied ? <Check /> : <Copy />} label={copied ? "Link copied" : "Copy link"} onClick={() => copy()} />
          <ShareButton icon={<MessageSquare />} label="Copy for Slack" onClick={async () => { await copy(message); window.open("https://app.slack.com/client", "_blank", "noopener,noreferrer"); }} />
          <ShareButton icon={<Mail />} label="Email" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`; }} />
          <ShareButton icon={<Linkedin />} label="LinkedIn" onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl)}`)} />
          <ShareButton icon={<span className="font-bold">𝕏</span>} label="X" onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(absoluteUrl)}`)} />
          <ShareButton icon={<span className="font-bold">B</span>} label="Bluesky" onClick={() => openShare(`https://bsky.app/intent/compose?text=${encodeURIComponent(message)}`)} />
          {typeof navigator !== "undefined" && "share" in navigator && (
            <ShareButton icon={<Share2 />} label="More…" onClick={nativeShare} />
          )}
        </div>
      )}
    </div>
  );
}

function ShareButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-text-secondary transition hover:bg-surface-hover hover:text-text-primary">
      <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
    </button>
  );
}
