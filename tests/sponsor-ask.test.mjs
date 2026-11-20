// Verification suite for lib/sponsor-ask.ts. Run with: node tests/sponsor-ask.test.mjs
import assert from "node:assert";
import { isSponsorAskCount, sponsorAskAllowed, SPONSOR_COOLDOWN_DAYS } from "../lib/sponsor-ask.ts";

const MILESTONES = [1, 5, 10, 20];
const DAY = 86_400_000;
let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

check("asks on 3, 8 and 15", () => [3, 8, 15].forEach((n) => assert.equal(isSponsorAskCount(n, MILESTONES), true)));
check("then every 15th export", () => [30, 45, 90].forEach((n) => assert.equal(isSponsorAskCount(n, MILESTONES), true)));
check("not on other counts", () => [2, 4, 7, 16, 29, 31].forEach((n) => assert.equal(isSponsorAskCount(n, MILESTONES), false)));
check("never on a share milestone", () => MILESTONES.forEach((n) => assert.equal(isSponsorAskCount(n, MILESTONES), false)));
check("a schedule count that is a milestone is skipped", () => assert.equal(isSponsorAskCount(15, [15]), false));
check("zero, negative and fractional counts", () => [0, -3, 3.5, NaN].forEach((n) => assert.equal(isSponsorAskCount(n, MILESTONES), false)));
check("allowed when never asked", () => assert.equal(sponsorAskAllowed({}), true));
check("not allowed after opting out", () => assert.equal(sponsorAskAllowed({ optedOut: true }), false));
check("not allowed within the cooldown", () => assert.equal(sponsorAskAllowed({ lastAskedAt: 1_000 * DAY }, 1_000 * DAY + (SPONSOR_COOLDOWN_DAYS - 1) * DAY), false));
check("allowed once the cooldown has passed", () => assert.equal(sponsorAskAllowed({ lastAskedAt: 1_000 * DAY }, 1_000 * DAY + SPONSOR_COOLDOWN_DAYS * DAY), true));

console.log(`${passed} checks passed`);
