import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendRawEmail } from "@/lib/notifications/email";

const FEEDBACK_TO = "admin@ducktyped.xyz";

const FeedbackBody = z.object({
  message: z.string().trim().min(3).max(2000),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  page: z.string().max(500).optional(),
  // Honeypot — real users never fill this
  website: z.string().max(0).optional(),
});

// Simple per-IP rate limit: 5 submissions per hour
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const submissions = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submissions.get(ip);
  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FeedbackBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }
  // Honeypot tripped — pretend success, store nothing
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { message, email, page } = parsed.data;

  // Persist first — email delivery is best-effort on top
  const record = await prisma.feedback.create({
    data: {
      message,
      email: email || null,
      page: page ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  try {
    await sendRawEmail(
      FEEDBACK_TO,
      "[DTMonitor] New feedback",
      `<div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="margin: 0 0 12px;">New DTMonitor feedback</h2>
        <p style="white-space: pre-wrap; background: #f5f6f8; padding: 12px; border-radius: 8px;">${escapeHtml(message)}</p>
        <p style="color: #555; font-size: 13px;">
          From: ${email ? escapeHtml(email) : "(no email provided)"}<br/>
          Page: ${page ? escapeHtml(page) : "—"}<br/>
          ID: ${record.id}
        </p>
      </div>`,
    );
  } catch (err) {
    // Feedback is already stored; log and move on
    console.error("[feedback] email forward failed:", err);
  }

  return NextResponse.json({ ok: true });
}
