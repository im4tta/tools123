"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, Select, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";

type SplitMode = "count" | "size";

function secureRandomInt(maxExclusive: number) {
  if (maxExclusive <= 1) return 0;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const range = 0x100000000;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const value = new Uint32Array(1);
    do cryptoApi.getRandomValues(value); while (value[0] >= limit);
    return value[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function splitTeams(names: string[], mode: SplitMode, amount: number) {
  const shuffled = shuffle(names);
  if (mode === "size") {
    const teams: string[][] = [];
    for (let index = 0; index < shuffled.length; index += amount) teams.push(shuffled.slice(index, index + amount));
    return teams;
  }
  const teams = Array.from({ length: amount }, () => [] as string[]);
  shuffled.forEach((name, index) => teams[index % amount].push(name));
  return teams;
}

export default function TeamGenerator() {
  const { text } = useLanguage();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SplitMode>("count");
  const [amount, setAmount] = useState("2");
  const [teams, setTeams] = useState<string[][]>([]);
  const [error, setError] = useState("");

  const names = useMemo(() => input.split(/\r?\n/).map((name) => name.trim()).filter(Boolean), [input]);
  const numericAmount = Number(amount);
  const validation = !names.length
    ? text("Enter at least one name.", "បញ្ចូលឈ្មោះយ៉ាងហោចណាស់មួយ។")
    : !Number.isInteger(numericAmount) || numericAmount < 1
      ? text("Use a whole number of 1 or more.", "ប្រើលេខគត់ចាប់ពី ១ ឡើងទៅ។")
      : mode === "count" && numericAmount > names.length
        ? text("Team count cannot exceed the number of people.", "ចំនួនក្រុមមិនអាចលើសចំនួនមនុស្សទេ។")
        : "";

  function generate() {
    if (validation) {
      setError(validation);
      setTeams([]);
      return;
    }
    setError("");
    setTeams(splitTeams(names, mode, numericAmount));
  }

  const formatted = useMemo(() => teams.map((team, index) => [
    `${text("Team", "ក្រុម")} ${index + 1} (${team.length})`,
    ...team.map((name, memberIndex) => `${memberIndex + 1}. ${name}`),
  ].join("\n")).join("\n\n"), [teams, text]);

  return (
    <ToolShell
      title="Team Generator"
      khmerTitle="កម្មវិធីបែងចែកក្រុម"
      description="Randomly split a list into balanced teams using an unbiased Fisher–Yates shuffle. Data stays in this tab."
      descriptionKm="បែងចែកបញ្ជីឈ្មោះជាក្រុមស្មើៗគ្នាដោយចៃដន្យ និងយុត្តិធម៌។ ទិន្នន័យស្ថិតនៅក្នុងផ្ទាំងនេះប៉ុណ្ណោះ។"
    >
      <Field label="Names" labelKm="ឈ្មោះ" hint={`${names.length} ${text("people", "នាក់")}`}>
        <TextArea
          rows={10}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setTeams([]);
            setError("");
          }}
          placeholder={text("One name per line", "មួយឈ្មោះក្នុងមួយបន្ទាត់")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Split by" labelKm="បែងចែកតាម">
          <Select value={mode} onChange={(event) => { setMode(event.target.value as SplitMode); setTeams([]); setError(""); }}>
            <option value="count">{text("Number of teams", "ចំនួនក្រុម")}</option>
            <option value="size">{text("People per team", "ចំនួនមនុស្សក្នុងមួយក្រុម")}</option>
          </Select>
        </Field>
        <Field label={mode === "count" ? "Team count" : "Team size"} labelKm={mode === "count" ? "ចំនួនក្រុម" : "ទំហំក្រុម"}>
          <TextInput type="number" min="1" step="1" value={amount} onChange={(event) => { setAmount(event.target.value); setTeams([]); setError(""); }} />
        </Field>
      </div>

      {(error || validation) && !teams.length && (
        <Output label={text("Ready check", "ការត្រួតពិនិត្យ")} value={error || validation} error mono={false} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={generate}>{teams.length ? text("Reshuffle", "ច្របល់ឡើងវិញ") : text("Generate teams", "បង្កើតក្រុម")}</Button>
        {formatted && <CopyButton text={formatted} />}
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, index) => (
            <section key={index} className="overflow-hidden rounded-md border border-[var(--ground-line)]">
              <h2 className="bg-[var(--ground-raised)] px-4 py-3 font-medium text-[var(--ink)]">{text("Team", "ក្រុម")} {index + 1} <span className="text-sm text-[var(--ink-faint)]">({team.length})</span></h2>
              <ol className="space-y-2 p-4 text-sm text-[var(--ink)]">
                {team.map((name, memberIndex) => <li key={`${name}-${memberIndex}`}>{memberIndex + 1}. {name}</li>)}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-[var(--ground-line)] p-8 text-center text-sm text-[var(--ink-faint)]">{text("Add names and generate to see teams here.", "បន្ថែមឈ្មោះ ហើយបង្កើត ដើម្បីមើលក្រុមនៅទីនេះ។")}</p>
      )}
    </ToolShell>
  );
}
