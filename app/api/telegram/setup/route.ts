// One-time (and repeatable) bot setup: registers the webhook with its secret, the command list and the descriptions.
// Open /api/telegram/setup with the header "Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>", or in a browser as
// /api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>.
import { timingSafeEqual } from "node:crypto";
import { callTelegram } from "@/lib/telegram/api";

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
  // Register the exact host that served this request: if the bare domain redirects to www (or the reverse), Telegram
  // would not follow the redirect, so the webhook must point at the host that answers directly.
  const origin = `https://${request.headers.get("x-forwarded-host") ?? url.host}`;
  results.webhook = await callTelegram("setWebhook", {
    url: `${origin}/api/telegram`,
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
  // The button beside the message box opens the whole site as a Mini App.
  results.menuButton = await callTelegram("setChatMenuButton", { menu_button: { type: "web_app", text: "Open app", web_app: { url: origin } } });
  // Telegram's own view of the webhook, to confirm it is reachable (no secrets in it).
  const info = await callTelegram<{ url: string; pending_update_count: number; last_error_message?: string; last_error_date?: number }>("getWebhookInfo", {});
  results.webhookInfo = { url: info.url, pending: info.pending_update_count, lastError: info.last_error_message ?? null };
  return Response.json({ ok: true, results });
}
