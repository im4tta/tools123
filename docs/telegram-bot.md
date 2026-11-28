# 123 Toolbox Telegram bot

The bot runs inside this Next.js app on Vercel. It needs no separate server and no database.

- Webhook: `app/api/telegram/route.ts`
- Setup: `app/api/telegram/setup/route.ts`
- Daily channel post: `app/api/telegram/daily/route.ts`, run by Vercel Cron (`vercel.json`) at 01:00 UTC (08:00 in Cambodia)
- Logic: `lib/telegram/` (`bot.ts` holds menus and flows, `core.ts` search and parsing with tests, `png.ts` QR images, `api.ts` the Telegram client)

## What it does

- **Menu with buttons:** Find a tool, Browse by category, Glossary term, Word of the day, Number → Khmer words, Khmer date, QR code, New tools and Tool of the day.
- **Typing anything:** a number gives its Khmer words, a known term gives its glossary entry, and anything else lists matching tools as buttons. In groups, the bot answers only commands.
- **Inline mode:** typing `@BotName watershed` in any chat shares a term or tool card.
- **Channel:** a daily post with the word of the day, the tool of the day and any tools added since yesterday.
- **Privacy:** nothing users send is stored. Glossary answers name their source and say they are not official translations.

## Setup (once)

1. In Telegram, open **@BotFather** and send `/newbot`. Copy the token, and keep it private.
2. In @BotFather, send `/setinline`, choose the bot and type a placeholder (e.g. `tool or term…`). This turns inline mode on.
3. Optional channel: create a channel, add the bot as an admin that can post, and note its `@username`.
4. In Vercel, open **Project → Settings → Environment Variables** (Production) and add:
   - `TELEGRAM_BOT_TOKEN`: the token from step 1
   - `TELEGRAM_WEBHOOK_SECRET`: a long random string (letters, digits, `_` and `-` only, up to 256 characters)
   - `TELEGRAM_CHANNEL_ID`: e.g. `@your_channel` (optional)
   - `CRON_SECRET`: another long random string. Vercel sends it to the daily route automatically.
5. Redeploy, then open `https://123tool.app/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>` once. It registers the webhook, the command list and the bot's description. Run it again after changing commands.

## Cost on the Vercel free plan

Each message is one short function call with a few KB of text (a QR image is about 1–5 KB). The glossary and tool data are bundled with the function, not downloaded per message. Requests without the webhook secret are refused before any work is done. Vercel Hobby runs cron jobs once a day, which is all the channel post needs.
