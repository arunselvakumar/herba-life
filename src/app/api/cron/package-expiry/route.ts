import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendExpiryReminders } from "@/lib/whatsapp/expiry-reminders";

/**
 * `GET /api/cron/package-expiry` sends the "package ending soon" WhatsApp
 * reminders. Vercel Cron calls it once a day (see `vercel.json`) with
 * `Authorization: Bearer <CRON_SECRET>`. Nobody is signed in on that call, so
 * the secret is the only gate: without `CRON_SECRET` set, every call is refused.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameText(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json(await sendExpiryReminders());
}

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
