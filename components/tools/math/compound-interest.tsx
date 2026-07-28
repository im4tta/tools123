"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

export default function CompoundInterestTool() {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [freq, setFreq] = useState("12");
  const [contribution, setContribution] = useState(0);

  const { finalAmount, totalContributions, totalInterest, schedule } = useMemo(() => {
    const n = Number(freq);
    const r = rate / 100;
    const periods = Math.round(years * n);
    let balance = principal;
    let contributed = principal;
    const rows: { period: number; balance: number }[] = [];
    for (let i = 1; i <= periods; i++) {
      balance = balance * (1 + r / n) + contribution;
      contributed += contribution;
      if (i % n === 0 || i === periods) rows.push({ period: Math.round(i / n), balance });
    }
    return {
      finalAmount: balance,
      totalContributions: contributed,
      totalInterest: balance - contributed,
      schedule: rows,
    };
  }, [principal, rate, years, freq, contribution]);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <ToolShell
      title="Compound Interest Calculator"
      description="Project how a principal (plus optional recurring contributions) grows over time at a given interest rate."
    >
      <Row>
        <Field label="Principal">
          <TextInput type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
        </Field>
        <Field label="Annual rate (%)">
          <TextInput type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </Field>
      </Row>
      <Row>
        <Field label="Years">
          <TextInput type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </Field>
        <Field label="Compounding frequency">
          <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option value="1">Annually</option>
            <option value="2">Semi-annually</option>
            <option value="4">Quarterly</option>
            <option value="12">Monthly</option>
            <option value="365">Daily</option>
          </Select>
        </Field>
      </Row>
      <Field label="Contribution per period" hint="Added each compounding period">
        <TextInput type="number" value={contribution} onChange={(e) => setContribution(Number(e.target.value))} className="w-48" />
      </Field>
      <Output
        label="Summary"
        mono={false}
        value={`Final amount: ${fmt(finalAmount)}\nTotal contributed: ${fmt(totalContributions)}\nTotal interest earned: ${fmt(totalInterest)}`}
      />
      <Output label="Year-end balances" value={schedule.map((r) => `Year ${r.period}: ${fmt(r.balance)}`).join("\n")} />
    </ToolShell>
  );
}
