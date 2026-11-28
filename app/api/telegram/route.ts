// Telegram webhook for the 123 Toolbox bot. Telegram POSTs each update here with the secret set in setWebhook
// (app/api/telegram/setup/route.ts); anything without it is refused before any work is done.
import { timingSafeEqual } from "node:crypto";
import { answerCallback, asUrlButtons, callTelegram, editMessage, sendMessage, sendPhoto, type Keyboard } from "@/lib/telegram/api";
import { inlineResults, qrPng, replyToButton, replyToText, type BotReply } from "@/lib/telegram/bot";
import { escapeHtml } from "@/lib/telegram/core";
import { toolUrl } from "@/lib/site";

export const runtime = "nodejs";

interface Update {
  message?: { message_id: number; text?: string; chat: { id: number; type: string }; reply_to_message?: { text?: string; from?: { is_bot?: boolean } } };
  callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number; type: string } } };
  inline_query?: { id: string; query: string };
}

function authorised(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const given = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function deliver(chatId: number, reply: BotReply, isPrivate: boolean, editId?: number) {
  // Mini App buttons are allowed only in private chats; elsewhere they become ordinary links.
  const keys = (k: Keyboard) => (isPrivate ? k : asUrlButtons(k));
  if (reply.kind === "qr") {
    const png = await qrPng(reply.text);
    const caption = [
      "🔳 <b><u>QR code</u></b>",
      `<blockquote><code>${escapeHtml(reply.text.slice(0, 200))}</code></blockquote>`,
      "<i>📱 Colours, logo, size, Wi-Fi, contact cards and KHQR payments are in the full QR tool.</i>",
    ].join("\n");
    await sendPhoto(chatId, png, caption, keys([
      [{ text: "📱 Full QR tool", web_app: { url: toolUrl("qr-generator") } }],
      [{ text: "🔳 Another QR", callback_data: "a:qr" }, { text: "🏠 Menu / ម៉ឺនុយ", callback_data: "m" }],
    ]));
    return;
  }
  const message = reply.message.keyboard ? { ...reply.message, keyboard: keys(reply.message.keyboard) } : reply.message;
  // A question (force reply) can't be edited into an existing message, so it is always sent new.
  if (editId && !message.forceReply) await editMessage(chatId, editId, message);
  else await sendMessage(chatId, message);
}

export async function POST(request: Request) {
  if (!authorised(request)) return new Response("Forbidden", { status: 403 });
  const update = (await request.json().catch(() => null)) as Update | null;
  try {
    if (update?.message?.text) {
      const m = update.message;
      const replyTo = m.reply_to_message?.from?.is_bot ? m.reply_to_message.text : undefined;
      const reply = replyToText(m.text as string, replyTo, m.chat.type === "private");
      if (reply) await deliver(m.chat.id, reply, m.chat.type === "private");
    } else if (update?.callback_query) {
      const q = update.callback_query;
      await answerCallback(q.id);
      const reply = q.data ? replyToButton(q.data) : null;
      if (reply && q.message) await deliver(q.message.chat.id, reply, q.message.chat.type === "private", q.message.message_id);
    } else if (update?.inline_query) {
      await callTelegram("answerInlineQuery", { inline_query_id: update.inline_query.id, results: inlineResults(update.inline_query.query), cache_time: 300 });
    }
  } catch (error) {
    // Always answer 200 so Telegram does not keep retrying one bad update; the error goes to the function logs.
    console.error("telegram bot:", error);
  }
  return new Response("ok");
}
