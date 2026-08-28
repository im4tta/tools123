// Verification suite for lib/calc engines. Run with: node tests/calc.test.mjs
// (Node ≥ 23 strips TS types natively; no dependencies required.)
// Covers zero, negative, empty, invalid, boundary, and extreme values.
import assert from "node:assert";
import { marginMarkup, priceFromMargin, costFromMargin, npv, irr, paybackYears, depreciationSchedule } from "../lib/calc/finance.ts";
import { halfLife, dilutionSolve, molarityFromMass, cleanSequence, transcribe, reverseComplement, gcContent, translate, proteinString } from "../lib/calc/science.ts";
import { sampleSize, marginOfError, zFromConfidence } from "../lib/calc/stats.ts";
import { downloadSeconds, megabytesPerMinute, parseIpv6, expandIpv6, formatIpv6, ipv6Type, ipv6Range } from "../lib/calc/net.ts";
import { secretSantaDraw, parseExclusions } from "../lib/calc/party.ts";

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err?.message ?? err);
    process.exitCode = 1;
  }
}

const round = (x, d = 6) => Number(x.toFixed(d));

// ---- finance: margin / markup ----
check("margin 20/25", () => {
  const r = marginMarkup(20, 25);
  assert.equal(round(r.profit), 5);
  assert.equal(round(r.marginPct, 4), 20);
  assert.equal(round(r.markupPct, 4), 25);
});
check("margin zero price", () => {
  const r = marginMarkup(20, 0);
  assert.equal(r.marginPct, null);
  assert.equal(r.markupPct, -100);
});
check("negative profit", () => {
  const r = marginMarkup(30, 20);
  assert.equal(round(r.marginPct, 4), -50);
});
check("priceFromMargin + boundary", () => {
  assert.equal(round(priceFromMargin(100, 25), 4), 133.3333);
  assert.equal(priceFromMargin(100, 100), null);
  assert.equal(priceFromMargin(100, 150), null);
});
check("costFromMargin", () => {
  assert.equal(round(costFromMargin(80, 20), 4), 64);
});
check("margin round-trip", () => {
  const price = priceFromMargin(120, 30);
  assert.equal(round(marginMarkup(120, price).marginPct, 6), 30);
});

// ---- finance: NPV / IRR / payback ----
check("NPV basic", () => {
  assert.equal(round(npv(0.1, [-1000, 600, 600]), 3), 41.322);
});
check("NPV zero rate = sum", () => {
  assert.equal(npv(0, [-5, 2, 3]), 0);
});
check("IRR textbook", () => {
  // NPV(r)=0 for [-1000, 300, 400, 500, 200] at r ≈ 0.15322
  const rate = irr([-1000, 300, 400, 500, 200]);
  assert.ok(rate !== null && Math.abs(rate - 0.15322) < 5e-5, `got ${rate}`);
});
check("IRR no sign change", () => {
  assert.equal(irr([100, 200, 300]), null);
});
check("IRR invalid input", () => {
  assert.equal(irr([]), null);
  assert.equal(irr([-100]), null);
});
check("IRR two-flow extreme", () => {
  const rate = irr([-1, 2]);
  assert.ok(rate !== null && Math.abs(rate - 1.0) < 1e-6);
});
check("payback crossing", () => {
  assert.equal(round(paybackYears([-1000, 400, 700]), 3), 1.857);
});
check("payback never", () => {
  assert.equal(paybackYears([-1000, 100, 100]), null);
});

// ---- finance: depreciation ----
check("straight-line schedule", () => {
  const rows = depreciationSchedule("straight-line", 10000, 1000, 5);
  assert.equal(rows.length, 5);
  assert.equal(round(rows[0].depreciation, 6), 1800);
  assert.equal(round(rows[4].bookValue, 6), 1000);
  assert.equal(round(rows[4].accumulated, 6), 9000);
});
check("double-declining floors at salvage", () => {
  const rows = depreciationSchedule("double-declining", 1000, 100, 5);
  const last = rows[rows.length - 1];
  assert.equal(round(last.bookValue, 6), 100);
  assert.ok(rows.every((r) => r.depreciation >= -1e-9));
});
check("sum-of-years digits", () => {
  const rows = depreciationSchedule("sum-of-years", 6000, 0, 4);
  assert.equal(round(rows[0].depreciation, 6), 2400);
  assert.equal(round(rows[3].depreciation, 6), 600);
});
check("declining lands on salvage", () => {
  const rows = depreciationSchedule("declining", 10000, 1000, 5);
  assert.equal(round(rows[4].bookValue, 6), 1000);
});
check("depreciation invalid inputs", () => {
  assert.equal(depreciationSchedule("straight-line", 1000, 2000, 5), null);
  assert.equal(depreciationSchedule("straight-line", 1000, 100, 0), null);
  assert.equal(depreciationSchedule("straight-line", -5, 0, 5), null);
  assert.equal(depreciationSchedule("straight-line", 1000, 100, NaN), null);
});

// ---- science: half life ----
check("half life one period", () => {
  const r = halfLife(100, 5, 5);
  assert.equal(round(r.remaining, 9), 50);
  assert.equal(round(r.halfLives), 1);
});
check("half life extreme elapsed", () => {
  const r = halfLife(1e12, 1, 1000);
  assert.ok(r.remaining < 1e-288);
});
check("half life invalid T", () => {
  assert.equal(halfLife(100, 0, 5), null);
  assert.equal(halfLife(100, -2, 5), null);
  assert.equal(halfLife(NaN, 5, 5), null);
});
check("half life zero initial", () => {
  const r = halfLife(0, 3, 3);
  assert.equal(r.remaining, 0);
  assert.equal(r.fraction, 0);
});
check("decay constant / mean lifetime", () => {
  const r = halfLife(8, 10, 0);
  assert.equal(round(r.lambda, 6), round(Math.LN2 / 10, 6));
  assert.equal(round(r.meanLifetime, 6), round(10 / Math.LN2, 6));
});

// ---- science: dilution ----
check("C1V1=C2V2 solve each variable", () => {
  assert.equal(round(dilutionSolve("V1", 5, 0, 1, 100), 9), 20);
  assert.equal(round(dilutionSolve("C1", 0, 20, 1, 100), 9), 5);
  assert.equal(round(dilutionSolve("C2", 5, 20, 0, 100), 9), 1);
  assert.equal(round(dilutionSolve("V2", 5, 20, 1, 0), 9), 100);
});
check("dilution invalid", () => {
  assert.equal(dilutionSolve("V1", 0, 0, 1, 100), null);
  assert.equal(dilutionSolve("V1", -5, 10, 1, 100), null);
  assert.equal(dilutionSolve("V1", NaN, 10, 1, 100), null);
});
check("molarity from mass", () => {
  assert.equal(round(molarityFromMass(58.44, 58.44, 1000), 6), 1);
  assert.equal(round(molarityFromMass(5.844, 58.44, 100), 6), 1);
});
check("molarity invalid", () => {
  assert.equal(molarityFromMass(1, 0, 100), null);
  assert.equal(molarityFromMass(1, 58.44, 0), null);
});

// ---- science: DNA ----
check("clean sequence", () => {
  assert.equal(cleanSequence("  ac gt-12\nTTu"), "ACGTTTU");
  assert.equal(cleanSequence("!!"), null);
});
check("transcribe + reverse complement", () => {
  assert.equal(transcribe("ATGC"), "AUGC");
  assert.equal(reverseComplement("AAAACCCC"), "GGGGTTTT");
  assert.equal(reverseComplement("AUG"), "CAT");
});
check("GC content boundaries", () => {
  assert.equal(gcContent("GGCC"), 1);
  assert.equal(gcContent("AAAA"), 0);
  assert.equal(gcContent(""), 0);
});
check("translation standard code", () => {
  assert.equal(translate("ATGGGGTAATGATAG", 0), "MG***");
  assert.equal(proteinString("ATGGGGTAA", 0), "MG");
});
check("translation known codons", () => {
  assert.equal(translate("CATGCA", 0), "HA");
  assert.equal(translate("TGGTTT", 0), "WF");
});
check("translation unknown codon", () => {
  assert.equal(translate("NNNGGG", 0), "XG");
});
check("translation too short", () => {
  assert.equal(translate("AT", 0), "");
});
check("frame offsets", () => {
  // A[ATG]GC → frame 1 sees ATG → M (only one full codon)
  assert.equal(translate("AATGGC", 1), "M");
  // AA[TGG]C → frame 2 sees TGG → W
  assert.equal(translate("AATGGC", 2), "W");
});

// ---- stats ----
check("z lookup", () => {
  assert.equal(zFromConfidence(95), 1.96);
  assert.equal(zFromConfidence(97), null);
});
check("Cochran n at 95/5/p=.5", () => {
  const r = sampleSize(1.96, 5, 0.5);
  assert.equal(r.sampleSize, 385);
  assert.equal(r.finiteCorrected, false);
});
check("finite population correction", () => {
  const r = sampleSize(1.96, 5, 0.5, 1000);
  assert.equal(r.sampleSize, 278);
  assert.equal(r.finiteCorrected, true);
});
check("sample size invalid", () => {
  assert.equal(sampleSize(1.96, 0, 0.5), null);
  assert.equal(sampleSize(1.96, 200, 0.5), null);
  assert.equal(sampleSize(0, 5, 0.5), null);
  assert.equal(sampleSize(1.96, 5, 1.2), null);
  assert.equal(sampleSize(1.96, 5, 0.5, 0), null);
});
check("margin of error", () => {
  assert.ok(Math.abs(marginOfError(1.96, 385, 0.5) - 5) < 0.01);
});

// ---- net: download time ----
check("1 GB at 100 Mbit/s = 80 s", () => {
  assert.equal(round(downloadSeconds(1, "GB", 100, "Mbit/s"), 6), 80);
});
check("1 GiB at 1 Gbit/s", () => {
  assert.equal(round(downloadSeconds(1, "GiB", 1, "Gbit/s"), 3), 8.59);
});
check("MB/s vs Mbit/s", () => {
  assert.equal(downloadSeconds(500, "MB", 100, "MB/s"), downloadSeconds(500, "MB", 800, "Mbit/s"));
});
check("download invalid", () => {
  assert.equal(downloadSeconds(0, "MB", 10, "Mbit/s"), null);
  assert.equal(downloadSeconds(-1, "MB", 10, "Mbit/s"), null);
  assert.equal(downloadSeconds(1, "XB", 10, "Mbit/s"), null);
  assert.equal(downloadSeconds(1, "MB", 0, "Mbit/s"), null);
  assert.equal(downloadSeconds(NaN, "MB", 10, "Mbit/s"), null);
});
check("MB per minute", () => {
  assert.equal(round(megabytesPerMinute(100, "Mbit/s"), 4), 750);
});

// ---- net: IPv6 ----
check("parse full + compress", () => {
  const r = parseIpv6("2001:0db8:0000:0000:0000:0000:0000:0001/64");
  assert.equal(formatIpv6(r.value), "2001:db8::1");
  assert.equal(r.prefix, 64);
  assert.equal(expandIpv6(r.value), "2001:0db8:0000:0000:0000:0000:0000:0001");
});
check("parse ipv4 tail", () => {
  const r = parseIpv6("::ffff:192.168.0.1");
  assert.equal(expandIpv6(r.value), "0000:0000:0000:0000:0000:ffff:c0a8:0001");
});
check("parse loopback and errors", () => {
  assert.equal(formatIpv6(parseIpv6("::1").value), "::1");
  assert.equal(parseIpv6(""), null);
  assert.equal(parseIpv6("2001::db8::1"), null);
  assert.equal(parseIpv6("2001:db8::/129"), null);
  assert.equal(parseIpv6("gggg::1"), null);
  assert.equal(parseIpv6("12345::"), null);
  assert.equal(parseIpv6("1:2:3"), null);
});
check("address types", () => {
  assert.ok(ipv6Type(parseIpv6("::1").value).startsWith("loopback"));
  assert.ok(ipv6Type(parseIpv6("fe80::1").value).startsWith("link-local"));
  assert.ok(ipv6Type(parseIpv6("fd00::1").value).startsWith("unique local"));
  assert.ok(ipv6Type(parseIpv6("ff02::1").value).startsWith("multicast"));
  assert.ok(ipv6Type(parseIpv6("2001:db8::1").value).startsWith("documentation"));
  assert.ok(ipv6Type(parseIpv6("2606:4700::1").value).startsWith("global unicast"));
  assert.ok(ipv6Type(parseIpv6("::ffff:10.0.0.1").value).startsWith("IPv4-mapped"));
  assert.ok(ipv6Type(parseIpv6("::").value).startsWith("unspecified"));
});
check("subnet range math", () => {
  const { value } = parseIpv6("2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff");
  const range = ipv6Range(value, 64);
  assert.equal(formatIpv6(range.first), "2001:db8:aaaa:bbbb::");
  assert.equal(formatIpv6(range.last), "2001:db8:aaaa:bbbb:ffff:ffff:ffff:ffff");
  assert.equal(range.count, 2n ** 64n);
  const whole = ipv6Range(value, 128);
  assert.equal(whole.first, value);
  assert.equal(whole.last, value);
  assert.equal(whole.count, 1n);
  const zero = ipv6Range(value, 0);
  assert.equal(formatIpv6(zero.first), "::");
  assert.equal(formatIpv6(zero.last), "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
});
check("range invalid prefix", () => {
  const { value } = parseIpv6("2001:db8::1");
  assert.equal(ipv6Range(value, 129), null);
  assert.equal(ipv6Range(value, -1), null);
});

// ---- party: secret santa ----
function sorted(list) {
  return [...list].sort();
}
function countsValid(assignments, names) {
  const givers = sorted(assignments.map((a) => a.giver));
  const receivers = sorted(assignments.map((a) => a.receiver));
  return JSON.stringify(givers) === JSON.stringify(sorted(names))
    && JSON.stringify(receivers) === JSON.stringify(sorted(names));
}
check("derangement respects self + exclusions", () => {
  const names = ["A", "B", "C", "D"];
  let seed = 42;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 100; i++) {
    const result = secretSantaDraw(names, [["A", "B"]], rng);
    assert.ok(result, "draw failed");
    assert.ok(countsValid(result, names));
    for (const a of result) {
      assert.notEqual(a.giver, a.receiver);
      if (a.giver === "A") assert.notEqual(a.receiver, "B");
    }
  }
});
check("default rng draw", () => {
  const names = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let i = 0; i < 25; i++) {
    const result = secretSantaDraw(names, []);
    assert.ok(result && countsValid(result, names));
  }
});
check("impossible exclusions", () => {
  assert.equal(secretSantaDraw(["A", "B"], [["A", "B"], ["B", "A"]]), null);
});
check("dedupe + minimum size", () => {
  // Duplicate names collapse to unique participants: A,A,B → A,B pair up
  const deduped = secretSantaDraw(["A", "A", "B"], []);
  assert.ok(deduped && countsValid(deduped, ["A", "B"]));
  assert.equal(secretSantaDraw(["A"], []), null);
  assert.equal(secretSantaDraw([], []), null);
});
check("large party solvable", () => {
  const names = Array.from({ length: 40 }, (_, i) => `P${i}`);
  const result = secretSantaDraw(names, []);
  assert.ok(result && countsValid(result, names));
});
check("exclusion parser", () => {
  const pairs = parseExclusions("A > B\nC -> D\nE → F\nG, H\n\nI;J");
  assert.equal(pairs.length, 5);
  assert.deepEqual(pairs[0], ["A", "B"]);
  assert.deepEqual(pairs[4], ["I", "J"]);
});

console.log(`${passed} checks passed${process.exitCode ? " (WITH FAILURES)" : ""}`);



