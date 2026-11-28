// The Glossaries hub's term index, shared by the hub page and the Telegram bot so both link to the same term pages.
import { buildGroups, type HubGroup } from "@/lib/glossary-hub";
import { HUB_ENTRIES } from "@/lib/data/glossary-hub-data";
import { assignSlugs } from "@/lib/glossary-share";

export const HUB_GROUPS: HubGroup[] = buildGroups(HUB_ENTRIES);
/** Group key -> URL slug for ?term=. */
export const HUB_SLUGS = assignSlugs(HUB_GROUPS.map((g, i) => ({ id: g.key, term: g.key.replace(/^fr:/, "fr "), order: i })));
/** Terms found in more than one source where the Khmer differs: the pool for "word of the day". */
export const HUB_DIFFERING: HubGroup[] = HUB_GROUPS.filter((g) => g.sources.length > 1 && g.distinctKm > 1);
