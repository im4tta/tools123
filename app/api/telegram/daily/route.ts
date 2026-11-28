// Daily post to the bot's Telegram channel (TELEGRAM_CHANNEL_ID, e.g. "@my_channel"): word of the day, tool of the
// day and tools added since yesterday. Run by Vercel Cron (vercel.json), which sends "Authorization: Bearer <CRON_SECRET>".
import { timingSafeEqual } from "node:crypto";
import { sendMessage } from "@/lib/telegram/api";
import { dailyPost } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const given = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return new Response("Forbidden", { status: 403 });
  }
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!channel) return Response.json({ ok: false, reason: "TELEGRAM_CHANNEL_ID is not set" });
  await sendMessage(channel, dailyPost());
  return Response.json({ ok: true });
}
