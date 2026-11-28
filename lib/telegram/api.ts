// Thin client for the Telegram Bot API (https://core.telegram.org/bots/api). Server only: the bot token is read from
// TELEGRAM_BOT_TOKEN and never leaves the server.

export type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; url: string }
  /** Opens the page inside Telegram as a Mini App. Private chats only; elsewhere use asUrlButtons(). */
  | { text: string; web_app: { url: string } }
  | { text: string; switch_inline_query: string }
  | { text: string; switch_inline_query_current_chat: string };

export type Keyboard = InlineButton[][];

/** Mini App buttons only work in private chats: turn them into ordinary links for groups, channels and inline mode. */
export function asUrlButtons(keyboard: Keyboard): Keyboard {
  return keyboard.map((row) => row.map((btn) => ("web_app" in btn ? { text: btn.text, url: btn.web_app.url } : btn)));
}

export interface OutMessage {
  text: string;
  keyboard?: Keyboard;
  /** Ask the reader to type an answer; the placeholder shows in their input box. */
  forceReply?: string;
}

function token(): string {
  const value = process.env.TELEGRAM_BOT_TOKEN;
  if (!value) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return value;
}

export async function callTelegram<T = unknown>(method: string, body: Record<string, unknown> | FormData): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`);
  return data.result as T;
}

function markup(msg: OutMessage) {
  if (msg.forceReply) return { force_reply: true, input_field_placeholder: msg.forceReply.slice(0, 64) };
  return msg.keyboard ? { inline_keyboard: msg.keyboard } : undefined;
}

export function sendMessage(chatId: number | string, msg: OutMessage, replyTo?: number) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text: msg.text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(msg),
    ...(replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {}),
  });
}

export function editMessage(chatId: number | string, messageId: number, msg: OutMessage) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: msg.text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: msg.keyboard ? { inline_keyboard: msg.keyboard } : undefined,
  }).catch((error: Error) => {
    // Pressing the same button twice edits to identical text; Telegram reports that as an error. Ignore it.
    if (!/message is not modified/i.test(error.message)) throw error;
  });
}

export function answerCallback(callbackId: string, text?: string) {
  return callTelegram("answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text } : {}) });
}

export function sendPhoto(chatId: number | string, png: Buffer, caption: string, keyboard?: Keyboard) {
  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("caption", caption);
  form.set("parse_mode", "HTML");
  if (keyboard) form.set("reply_markup", JSON.stringify({ inline_keyboard: keyboard }));
  form.set("photo", new Blob([new Uint8Array(png)], { type: "image/png" }), "qr.png");
  return callTelegram("sendPhoto", form);
}
