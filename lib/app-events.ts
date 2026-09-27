/**
 * Cancelable event dispatched on `document` to open the current page's command palette
 * (the mobile bottom nav's Search tab). Kept in its own tiny module so the nav, which is on
 * every page, does not import the palette or the tool registry just for the name.
 */
export const OPEN_SEARCH_EVENT = "tools123:open-search";
