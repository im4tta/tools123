// Databuddy website client ID. It is public (it ships in every page) and only accepts events from
// the domains configured in the Databuddy dashboard. NEXT_PUBLIC_DATABUDDY_CLIENT_ID overrides it,
// for example to point a staging deployment at a separate Databuddy website.
export const DATABUDDY_CLIENT_ID =
  process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID || "464eb710-df82-49f4-9881-64a563d1aed3";
