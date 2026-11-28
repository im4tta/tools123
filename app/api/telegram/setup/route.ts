// One-time (and repeatable) bot setup: registers the webhook with its secret, the command list and the descriptions.
// Open /api/telegram/setup with the header "Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>", or in a browser as
// /api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>.
import { timingSafeEqual } from "node:crypto";
import { callTelegram } from "@/lib/telegram/api";
import { BASE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMMANDS = [
  { command: "menu", description: "Main menu · ម៉ឺនុយ" },
  { command: "find", description: "Find a tool · រកឧបករណ៍" },
  { command: "term", description: "Glossary term · ពាក្យបច្ចេកទេស" },
  { command: "num", description: "Number to Khmer words · លេខជាអក្សរ" },
  { command: "date", description: "Khmer date today · កាលបរិច្ឆេទខ្មែរ" },
  { command: "qr", description: "Make a QR code · បង្កើត QR" },
  { command: "new", description: "New tools this week · ឧបករណ៍ថ្មី" },
  { command: "today", description: "Word of the day · ពាក្យប្រចាំថ្ងៃ" },
  { command: "help", description: "How to use · របៀបប្រើ" },
];

function keyMatches(given: string): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  return !!expected && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";
  if (!keyMatches(given)) return new Response("Forbidden", { status: 403 });
  const results: Record<string, unknown> = {};
  results.webhook = await callTelegram("setWebhook", {
    url: `${BASE_URL}/api/telegram`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query", "inline_query"],
    drop_pending_updates: true,
  });
  results.commands = await callTelegram("setMyCommands", { commands: COMMANDS });
  results.description = await callTelegram("setMyDescription", {
    description:
      "Free tools and Khmer glossaries from 123tool.app. Find tools, look up ministry terms, write numbers in Khmer words, get today's Khmer date and make QR codes. Nothing you send is stored.\n\nឧបករណ៍ឥតគិតថ្លៃ និងវចនានុក្រមខ្មែរពី 123tool.app។",
  });
  results.shortDescription = await callTelegram("setMyShortDescription", { short_description: "Free tools and Khmer glossaries · ឧបករណ៍ និងវចនានុក្រមខ្មែរ" });
  return Response.json({ ok: true, results });
}
