// The 123 Toolbox Telegram bot: menus, button flows and handlers. Stateless (no database): a typed answer is matched to
// the question it replies to, and every button carries what it needs in its callback data (at most 64 bytes).
// Answers reuse the site's own code and data (tool registry, glossary index, Khmer number words and dates), so the bot
// and the site always agree. Nothing a user sends is stored.
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, type Category, type ToolDef } from "@/lib/tools";
import { HUB_DIFFERING, HUB_GROUPS, HUB_SLUGS } from "@/lib/data/glossary-hub-index";
import { HUB_SOURCE_BY_ID } from "@/lib/data/glossary-hub-data";
import { searchGroups, type HubGroup } from "@/lib/glossary-hub";
import { termUrl } from "@/lib/glossary-share";
import { convertModernBanking, convertTraditional, toKhmerNumerals } from "@/lib/khmer-number-words";
import { formatKhmerLunarDate, formatKhmerSolarDate } from "@/lib/khmer-date";
import { BASE_URL, toolUrl } from "@/lib/site";
import { toolHref } from "@/lib/toolRoutes";
import { RULE, cambodiaDay, escapeHtml as h, findTools, parseCommand, parseWholeNumber, quote, recentTools, table } from "@/lib/telegram/core";
import { gridToPng } from "@/lib/telegram/png";
import type { InlineButton, Keyboard, OutMessage } from "@/lib/telegram/api";

const PAGE = 8;
const GROUP_INDEX = new Map(HUB_GROUPS.map((g, i) => [g, i]));
const MENU_ROW: InlineButton[] = [{ text: "🏠 Menu / ម៉ឺនុយ", callback_data: "m" }];
const SITE_BUTTON: InlineButton = { text: "🌐 123tool.app", url: BASE_URL };
/** t.me link to the bot, from TELEGRAM_BOT_USERNAME (without @); falls back to the site. */
const BOT_LINK = process.env.TELEGRAM_BOT_USERNAME ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, "")}` : BASE_URL;
const glossaryUrl = (g: HubGroup) => termUrl(BASE_URL, toolHref("glossaries"), HUB_SLUGS.get(g.key) ?? "");
const toolName = (t: ToolDef) => (t.khmerTitle ? `${t.title} · ${t.khmerTitle}` : t.title);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ------------------------------------------------------------------ questions the bot asks (force reply) */

/** The first characters of each question; a typed reply to one of them is routed to that flow. */
export const PROMPTS = {
  find: "🔎 What do you need? · តើអ្នកត្រូវការអ្វី?",
  term: "📖 Which term? · ពាក្យអ្វី?",
  num: "🔢 Which number? · លេខប៉ុន្មាន?",
  qr: "🔳 Text or link for the QR code · អត្ថបទ ឬតំណសម្រាប់ QR",
} as const;
type PromptKind = keyof typeof PROMPTS;

const PLACEHOLDERS: Record<PromptKind, string> = {
  find: "e.g. merge pdf, ពន្ធ, resize photo",
  term: "e.g. watershed, ទឹកជំនន់",
  num: "e.g. 1250000",
  qr: "e.g. https://123tool.app",
};

export function promptMessage(kind: PromptKind): OutMessage {
  return { text: PROMPTS[kind], forceReply: PLACEHOLDERS[kind] };
}

export function promptKindOf(replyText: string | undefined): PromptKind | null {
  if (!replyText) return null;
  return (Object.keys(PROMPTS) as PromptKind[]).find((k) => replyText.startsWith(PROMPTS[k].slice(0, 12))) ?? null;
}

/* ------------------------------------------------------------------ views */

export function menuView(): OutMessage {
  return {
    text: [
      "🧰 <b><u>123 Toolbox</u></b>  ·  <b>ប្រអប់ឧបករណ៍ 123</b>",
      quote(`<b>${TOOLS.length}</b> free tools and Khmer glossaries.\nឧបករណ៍ឥតគិតថ្លៃ <b>${TOOLS.length}</b> និងវចនានុក្រមខ្មែរ។`),
      "<i>Tap a button, or just type what you need.</i>",
      "<i>ចុចប៊ូតុង ឬវាយអ្វីដែលអ្នកត្រូវការ។</i>",
    ].join("\n"),
    keyboard: [
      [{ text: "🔎 Find a tool", callback_data: "a:find" }, { text: "🗂 Browse", callback_data: "cats" }],
      [{ text: "📖 Glossary term", callback_data: "a:term" }, { text: "💡 Word of the day", callback_data: "wod" }],
      [{ text: "🔢 Number → words", callback_data: "a:num" }, { text: "📅 Khmer date", callback_data: "date:today" }],
      [{ text: "🔳 QR code", callback_data: "a:qr" }, { text: "🆕 New tools", callback_data: "new" }],
      [{ text: "⭐ Tool of the day", callback_data: "tod" }, SITE_BUTTON],
    ],
  };
}

export function helpView(): OutMessage {
  return {
    text: [
      "❓ <b><u>How to use</u></b>  ·  <b>របៀបប្រើ</b>",
      "<b>Just type</b> · <b>វាយអ្វីក៏បាន</b>",
      table([
        ["merge pdf", "→ tools"],
        ["watershed", "→ glossary term"],
        ["1250000", "→ Khmer words"],
      ]),
      "<b>Share anywhere</b> · <b>ចែករំលែក</b>",
      quote("In any chat, type <code>@</code>bot name + a word.\nវាយ <code>@</code>ឈ្មោះបូត ហើយពាក្យ ក្នុងការជជែកណាមួយ។"),
      "<b>Commands</b>: /menu /find /term /num /date /qr /new /today",
      "",
      "<i>Glossary answers come from ministry glossaries and are not official translations. Nothing you send is stored.</i>",
    ].join("\n"),
    keyboard: [MENU_ROW],
  };
}

function toolListView(title: string, tools: ToolDef[], shareQuery?: string, extraRows: Keyboard = []): OutMessage {
  if (tools.length === 0) {
    return {
      text: `${title}\n${quote("No tools found. Try another word.\nរកមិនឃើញ។ សូមសាកពាក្យផ្សេង។")}`,
      keyboard: [[{ text: "🔎 Search again", callback_data: "a:find" }, { text: "🗂 Browse", callback_data: "cats" }], MENU_ROW],
    };
  }
  return {
    text: [
      title,
      "",
      ...tools.map((t, i) => `<b>${i + 1}.</b> <b>${h(t.title)}</b>${t.khmerTitle ? `\n     <i>${h(t.khmerTitle)}</i>` : ""}  <code>#${t.category}</code>`),
      "",
      "<i>Tap a button below to open a tool. · ចុចប៊ូតុងខាងក្រោម។</i>",
    ].join("\n"),
    keyboard: [
      ...tools.map((t, i) => [{ text: clip(`${i + 1}. ${t.title}`, 60), url: toolUrl(t.id) }]),
      ...extraRows,
      [...(shareQuery ? [{ text: "↗ Share", switch_inline_query: shareQuery }] : []), ...MENU_ROW],
    ],
  };
}

export function findView(query: string): OutMessage {
  return toolListView(`🔎 <b><u>${h(clip(query, 60))}</u></b>`, findTools(TOOLS, query, PAGE), query);
}

export function categoriesView(): OutMessage {
  const rows: Keyboard = [];
  const cats = CATEGORY_ORDER.filter((c) => TOOLS.some((t) => t.category === c));
  for (let i = 0; i < cats.length; i += 2) {
    rows.push(
      cats.slice(i, i + 2).map((c) => ({
        text: `${CATEGORY_META[c].label} · ${TOOLS.filter((t) => t.category === c).length}`,
        callback_data: `cat:${c}:0`,
      })),
    );
  }
  const counts = cats.map((c) => [CATEGORY_META[c].label, String(TOOLS.filter((t) => t.category === c).length)] as [string, string]);
  return {
    text: ["🗂 <b><u>Browse by category</u></b>  ·  <b>រកតាមប្រភេទ</b>", table(counts), "<i>Pick a category below. · ជ្រើសប្រភេទខាងក្រោម។</i>"].join("\n"),
    keyboard: [...rows, MENU_ROW],
  };
}

export function categoryView(category: string, page: number): OutMessage {
  if (!(category in CATEGORY_META)) return categoriesView();
  const meta = CATEGORY_META[category as Category];
  const all = TOOLS.filter((t) => t.category === category).sort((a, b) => a.title.localeCompare(b.title));
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const p = Math.min(Math.max(0, page), pages - 1);
  const nav: InlineButton[] = [
    ...(p > 0 ? [{ text: "◀ Prev", callback_data: `cat:${category}:${p - 1}` }] : []),
    { text: "🗂 Categories", callback_data: "cats" },
    ...(p < pages - 1 ? [{ text: "Next ▶", callback_data: `cat:${category}:${p + 1}` }] : []),
  ];
  return toolListView(`🗂 <b><u>${h(meta.label)}</u></b>  ·  <b>${h(meta.khmer)}</b>\n<i>Page ${p + 1} of ${pages} · ${all.length} tools</i>`, all.slice(p * PAGE, p * PAGE + PAGE), undefined, [nav]);
}

export function newToolsView(now = new Date()): OutMessage {
  const fresh = recentTools(TOOLS, now, 7).slice(0, PAGE);
  if (fresh.length) return toolListView("🆕 <b><u>Added this week</u></b>  ·  <b>ថ្មីសប្តាហ៍នេះ</b>", fresh);
  // Quiet week: show the latest additions instead of an empty list.
  const latest = recentTools(TOOLS, now, 3650).slice(0, PAGE);
  return toolListView("🆕 <b><u>Latest additions</u></b>  ·  <b>ឧបករណ៍ថ្មីៗ</b>", latest);
}

/** Hand-built tools only (not the generated unit-pair converters), so the daily pick is worth a look. */
const FEATURABLE = TOOLS.filter((t) => !t.props);

export function toolOfTheDay(now = new Date()): ToolDef {
  return FEATURABLE[cambodiaDay(now) % FEATURABLE.length];
}

export function toolOfTheDayView(now = new Date()): OutMessage {
  const t = toolOfTheDay(now);
  return {
    text: [
      "⭐ <b><u>Tool of the day</u></b>  ·  <b>ឧបករណ៍ប្រចាំថ្ងៃ</b>",
      quote(`<b>${h(t.title)}</b>${t.khmerTitle ? `\n<i>${h(t.khmerTitle)}</i>` : ""}`),
      `<code>#${t.category}</code>  ${h(CATEGORY_META[t.category].label)} · ${h(CATEGORY_META[t.category].khmer)}`,
    ].join("\n"),
    keyboard: [[{ text: `Open ${clip(t.title, 40)}`, url: toolUrl(t.id) }], [{ text: "↗ Share", switch_inline_query: t.title }, ...MENU_ROW]],
  };
}

/** One glossary term as a message: each source's Khmer and the start of its definition, with credit. */
export function termText(g: HubGroup): string {
  const lines = [`📖 <b><u>${h(g.title)}</u></b>`];
  if (g.distinctKm > 1) lines.push(`⚠️ <b>${g.distinctKm} different Khmer terms</b> · <b>ពាក្យខ្មែរខុសគ្នា ${g.distinctKm}</b>`);
  for (const e of g.entries.slice(0, 5)) {
    const s = HUB_SOURCE_BY_ID.get(e.source);
    const def = e.defKm ?? e.defEn;
    // Each source in its own quote; long definitions collapse behind "tap to expand".
    const body = [`<b>${h(s?.publisher ?? e.source)}</b>`, `<b>${h(clip(e.km, 120))}</b>`, ...(def ? [`<i>${h(clip(def.split("\n")[0], 500))}</i>`] : [])].join("\n");
    lines.push(quote(body, (def?.length ?? 0) > 160));
  }
  if (g.distinctKm > 1) lines.push("<i>Use the term from the ministry your document is for.</i>");
  const sources = [...new Set(g.entries.map((e) => HUB_SOURCE_BY_ID.get(e.source)?.edition).filter(Boolean))];
  lines.push(RULE, `<i>Source: ${h(sources.join("; "))}. Not an official translation.</i>`);
  // Plain text is clipped before it is wrapped in tags, so the HTML is never cut mid-tag.
  return lines.join("\n");
}

export function termView(g: HubGroup): OutMessage {
  return {
    text: termText(g),
    keyboard: [[{ text: "📄 Full term page", url: glossaryUrl(g) }], [{ text: "↗ Share", switch_inline_query: `term ${g.title}` }, { text: "📖 Another term", callback_data: "a:term" }], MENU_ROW],
  };
}

export function termSearchView(query: string): OutMessage {
  const hits = searchGroups(HUB_GROUPS, query, undefined, 6);
  if (hits.length === 0) {
    return { text: `📖 <b><u>${h(clip(query, 60))}</u></b>\n${quote("No glossary term matches.\nរកមិនឃើញពាក្យក្នុងវចនានុក្រម។")}`, keyboard: [[{ text: "📖 Try another term", callback_data: "a:term" }, { text: "🔎 Find a tool", switch_inline_query_current_chat: query }], MENU_ROW] };
  }
  if (hits.length === 1 || hits[0].key === hits[0].title.toLowerCase()) return termView(hits[0]);
  return {
    text: `📖 <b><u>${h(clip(query, 60))}</u></b>\n${quote(`<b>${hits.length}</b> matching terms. Choose one below.\nជ្រើសពាក្យមួយខាងក្រោម។`)}`,
    keyboard: [...hits.map((g) => [{ text: clip(`${g.title} · ${g.entries[0]?.km ?? ""}`, 60), callback_data: `t:${GROUP_INDEX.get(g)}` }]), MENU_ROW],
  };
}

export function wordOfTheDay(now = new Date()): HubGroup | undefined {
  return HUB_DIFFERING.length ? HUB_DIFFERING[cambodiaDay(now) % HUB_DIFFERING.length] : undefined;
}

export function numberView(digits: string, style: "b" | "t" = "b"): OutMessage {
  const words = style === "t" ? convertTraditional(digits) : convertModernBanking(digits);
  const grouped = Number(digits).toLocaleString("en-US");
  return {
    text: [
      `🔢 <b><u>${h(grouped)}</u></b>`,
      table([
        ["Number", grouped],
        ["Khmer digits", toKhmerNumerals(grouped)],
        ["Digits", String(digits.length)],
      ]),
      quote(`<b>${h(words)}</b>`),
      `<i>${style === "t" ? "Traditional style (សែន, ម៉ឺន) · របៀបប្រពៃណី" : "Banking style (រយ, ពាន់) · របៀបធនាគារ"}</i>`,
    ].join("\n"),
    keyboard: [
      [{ text: style === "t" ? "Banking style" : "Traditional style", callback_data: `num:${style === "t" ? "b" : "t"}:${digits}` }],
      [{ text: "🔢 Another number", callback_data: "a:num" }, { text: "Open tool", url: toolUrl("number-to-words") }],
      MENU_ROW,
    ],
  };
}

/** Today's date in Cambodia (UTC+7) as YYYY-MM-DD. */
export function cambodiaIsoDate(now = new Date()): string {
  return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dateView(iso: string): OutMessage {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso)) ? iso : cambodiaIsoDate();
  const solar = formatKhmerSolarDate(valid);
  const lunar = formatKhmerLunarDate(valid);
  return {
    text: [
      `📅 <b><u>${valid}</u></b>${valid === cambodiaIsoDate() ? "  <i>Today in Cambodia · ថ្ងៃនេះ</i>" : ""}`,
      table([
        ["Date", valid],
        ["Weekday", new Date(`${valid}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })],
        ["Day of year", String(Math.round((Date.parse(`${valid}T00:00:00Z`) - Date.parse(`${valid.slice(0, 4)}-01-01T00:00:00Z`)) / 86_400_000) + 1)],
      ]),
      quote([`<b>${h(solar)}</b>`, ...(lunar ? [`<i>${h(lunar)}</i>`] : [])].join("\n")),
    ].join("\n"),
    keyboard: [
      [
        { text: "◀ Day before", callback_data: `date:${shiftIso(valid, -1)}` },
        { text: "Today", callback_data: "date:today" },
        { text: "Day after ▶", callback_data: `date:${shiftIso(valid, 1)}` },
      ],
      [{ text: "📆 Lunar calendar", url: toolUrl("khmer-lunar-calendar") }],
      MENU_ROW,
    ],
  };
}

/** QR code PNG for up to 500 characters of text, made with the same library the site uses. */
export async function qrPng(text: string): Promise<Buffer> {
  const { default: qrcode } = await import("qrcode-generator");
  // UTF-8, as the site's QR Code Generator does, so Khmer text scans correctly (the library defaults to Latin-1).
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  const qr = qrcode(0, "M");
  qr.addData(text.slice(0, 500));
  qr.make();
  return gridToPng(qr.getModuleCount(), (r, c) => qr.isDark(r, c), 12, 4);
}

/* ------------------------------------------------------------------ routing */

export type BotReply = { kind: "message"; message: OutMessage } | { kind: "qr"; text: string };

/** What to answer to a typed message (a command, a reply to a question, or free text). */
export function replyToText(text: string, replyToText: string | undefined, isPrivate: boolean): BotReply | null {
  const asked = promptKindOf(replyToText);
  if (asked) return routeKind(asked, text);
  const { command, args } = parseCommand(text);
  switch (command) {
    case "start":
    case "menu":
      return msg(menuView());
    case "help":
      return msg(helpView());
    case "find":
      return args ? msg(findView(args)) : msg(promptMessage("find"));
    case "term":
      return args ? msg(termSearchView(args)) : msg(promptMessage("term"));
    case "num":
      return args ? routeKind("num", args) : msg(promptMessage("num"));
    case "qr":
      return args ? { kind: "qr", text: args } : msg(promptMessage("qr"));
    case "date":
      return msg(dateView(args || cambodiaIsoDate()));
    case "new":
      return msg(newToolsView());
    case "today": {
      const g = wordOfTheDay();
      return msg(g ? termView(g) : toolOfTheDayView());
    }
    case null:
      break;
    default:
      return isPrivate ? msg(helpView()) : null;
  }
  // Free text: only in private chats, so the bot stays quiet in groups unless called with a command.
  if (!isPrivate) return null;
  const digits = parseWholeNumber(text);
  if (digits) return msg(numberView(digits));
  return msg(smartView(text));
}

function routeKind(kind: PromptKind, text: string): BotReply {
  if (kind === "find") return msg(findView(text));
  if (kind === "term") return msg(termSearchView(text));
  if (kind === "qr") return { kind: "qr", text };
  const digits = parseWholeNumber(text);
  return digits ? msg(numberView(digits)) : msg({ text: "Please type a whole number, e.g. 1250000. · សូមវាយលេខគត់។", forceReply: PLACEHOLDERS.num });
}

/** Free text: the best glossary term (if the text names one) plus matching tools, all as buttons. */
export function smartView(text: string): OutMessage {
  const term = searchGroups(HUB_GROUPS, text, undefined, 1)[0];
  const exactTerm = term && term.key === text.trim().toLowerCase() ? term : undefined;
  const tools = findTools(TOOLS, text, exactTerm ? 4 : 6);
  if (exactTerm && tools.length === 0) return termView(exactTerm);
  const extra: Keyboard = term ? [[{ text: clip(`📖 Glossary: ${term.title}`, 60), callback_data: `t:${GROUP_INDEX.get(term)}` }]] : [];
  return toolListView(`🔎 <b>${h(clip(text, 60))}</b>`, tools, text, extra);
}

const msg = (message: OutMessage): BotReply => ({ kind: "message", message });

/** What a button press shows (edited into the same message). */
export function replyToButton(data: string): BotReply | null {
  if (data === "m") return msg(menuView());
  if (data === "help") return msg(helpView());
  if (data === "cats") return msg(categoriesView());
  if (data === "new") return msg(newToolsView());
  if (data === "tod") return msg(toolOfTheDayView());
  if (data === "wod") {
    const g = wordOfTheDay();
    return msg(g ? termView(g) : menuView());
  }
  const [head, a, b] = data.split(":");
  if (head === "a" && a in PROMPTS) return msg(promptMessage(a as PromptKind));
  if (head === "cat") return msg(categoryView(a, Number(b) || 0));
  if (head === "t") {
    const g = HUB_GROUPS[Number(a)];
    return msg(g ? termView(g) : menuView());
  }
  if (head === "num" && /^\d{1,15}$/.test(b ?? "")) return msg(numberView(b, a === "t" ? "t" : "b"));
  if (head === "date") return msg(dateView(a === "today" ? cambodiaIsoDate() : a));
  return null;
}

/* ------------------------------------------------------------------ inline mode (@bot query in any chat) */

export interface InlineResult {
  type: "article";
  id: string;
  title: string;
  description?: string;
  input_message_content: { message_text: string; parse_mode: "HTML"; link_preview_options: { is_disabled: boolean } };
  reply_markup?: { inline_keyboard: Keyboard };
}

function article(id: string, title: string, description: string, message: OutMessage): InlineResult {
  return {
    type: "article",
    id: id.slice(0, 64),
    title,
    description,
    input_message_content: { message_text: message.text, parse_mode: "HTML", link_preview_options: { is_disabled: true } },
    // Only link buttons work in messages sent through inline mode by other people, so drop the rest.
    reply_markup: { inline_keyboard: (message.keyboard ?? []).map((row) => row.filter((btn) => "url" in btn)).filter((row) => row.length > 0) },
  };
}

export function inlineResults(query: string): InlineResult[] {
  const q = query.replace(/^term\s+/i, "").trim();
  const out: InlineResult[] = [];
  if (!q) {
    const g = wordOfTheDay();
    if (g) out.push(article(`g${GROUP_INDEX.get(g)}`, `💡 ${g.title}`, "Glossary word of the day · ពាក្យប្រចាំថ្ងៃ", termView(g)));
    const t = toolOfTheDay();
    out.push(article(`t${t.id}`, `⭐ ${t.title}`, "Tool of the day · ឧបករណ៍ប្រចាំថ្ងៃ", toolOfTheDayView()));
    return out;
  }
  for (const g of searchGroups(HUB_GROUPS, q, undefined, 5)) {
    out.push(article(`g${GROUP_INDEX.get(g)}`, `📖 ${g.title}`, g.entries.map((e) => e.km).join(" · "), termView(g)));
  }
  for (const t of findTools(TOOLS, q, 15)) {
    out.push(
      article(`t${t.id}`, `🛠 ${t.title}`, t.khmerTitle ?? CATEGORY_META[t.category].label, {
        text: `🛠 <b>${h(toolName(t))}</b>\nFree on 123 Toolbox · ឥតគិតថ្លៃ`,
        keyboard: [[{ text: `Open ${clip(t.title, 40)}`, url: toolUrl(t.id) }]],
      }),
    );
  }
  return out.slice(0, 20);
}

/* ------------------------------------------------------------------ daily channel post */

export function dailyPost(now = new Date()): OutMessage {
  const iso = cambodiaIsoDate(now);
  const lines = [
    "☀️ <b><u>Today on 123 Toolbox</u></b>",
    "<b>ថ្ងៃនេះនៅ 123 Toolbox</b>",
    quote([`<b>${h(formatKhmerSolarDate(iso))}</b>`, ...(formatKhmerLunarDate(iso) ? [`<i>${h(formatKhmerLunarDate(iso))}</i>`] : [])].join("\n")),
  ];
  const keyboard: Keyboard = [];
  const g = wordOfTheDay(now);
  if (g) {
    lines.push("💡 <b>Word of the day</b> · <b>ពាក្យប្រចាំថ្ងៃ</b>", termText(g));
    keyboard.push([{ text: `📄 ${clip(g.title, 40)}`, url: glossaryUrl(g) }]);
  }
  const t = toolOfTheDay(now);
  lines.push(RULE, "⭐ <b>Tool of the day</b> · <b>ឧបករណ៍ប្រចាំថ្ងៃ</b>", quote(`<b>${h(t.title)}</b>${t.khmerTitle ? `\n<i>${h(t.khmerTitle)}</i>` : ""}`));
  keyboard.push([{ text: `⭐ Open ${clip(t.title, 40)}`, url: toolUrl(t.id) }]);
  const fresh = recentTools(TOOLS, now, 1);
  if (fresh.length) {
    lines.push("", `🆕 <b>New since yesterday</b> · <b>ថ្មី</b>  <code>${fresh.length}</code>`, ...fresh.slice(0, 6).map((x) => `• <b>${h(x.title)}</b>${x.khmerTitle ? ` <i>${h(x.khmerTitle)}</i>` : ""}`));
    keyboard.push(...fresh.slice(0, 3).map((x) => [{ text: `🆕 ${clip(x.title, 40)}`, url: toolUrl(x.id) }]));
  }
  keyboard.push([{ text: "🤖 Open the bot", url: BOT_LINK }, { text: "🌐 123tool.app", url: BASE_URL }]);
  return { text: lines.join("\n"), keyboard };
}
