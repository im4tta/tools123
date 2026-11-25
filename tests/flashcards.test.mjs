import { test } from "node:test";
import assert from "node:assert/strict";
import { countDue, pickRound, review, INTERVALS, MAX_BOX } from "../lib/flashcards.ts";

const same = (l) => [...l];

test("review moves up a box on success and resets on a miss", () => {
  assert.deepEqual(review(undefined, true, 100), { box: 1, due: 100 + INTERVALS[1] });
  assert.deepEqual(review({ box: 2, due: 90 }, true, 100), { box: 3, due: 104 });
  assert.deepEqual(review({ box: MAX_BOX, due: 90 }, true, 100), { box: MAX_BOX, due: 100 + INTERVALS[MAX_BOX] });
  assert.deepEqual(review({ box: 4, due: 90 }, false, 100), { box: 0, due: 100 });
});

test("round puts due cards first, then new ones, and skips cards not yet due", () => {
  const map = { a: { box: 1, due: 99 }, b: { box: 2, due: 95 }, c: { box: 3, due: 120 } };
  assert.deepEqual(pickRound(["a", "b", "c", "d", "e"], map, 100, 10, same), ["b", "a", "d", "e"]);
  assert.deepEqual(pickRound(["a", "b", "c", "d", "e"], map, 100, 3, same), ["b", "a", "d"]);
});

test("countDue counts only seen cards that are due", () => {
  assert.equal(countDue(["a", "b", "c", "z"], { a: { box: 0, due: 100 }, b: { box: 1, due: 101 }, c: { box: 1, due: 50 } }, 100), 2);
});
