"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function TextWrap() {
  const { text: t } = useLanguage();
  const [content, setContent] = useToolState("wrap:text", "");
  const [width, setWidth] = useToolState("wrap:width", "80");
  const [mode, setMode] = useToolState("wrap:mode", "soft");

  const wrapped = useMemo(() => {
    const w = Number(width);
    if (Number.isNaN(w) || w < 1) return "";
    const re = new RegExp(`.{1,${w}}`, "g");
    return content
      .split("\n")
      .map((line) => {
        if (mode === "soft") {
          const out: string[] = [];
          let current = "";
          for (const word of line.split(" ")) {
            if (current && (current + " " + word).length > w) {
              out.push(current);
              current = word;
            } else {
              current = current ? current + " " + word : word;
            }
          }
          if (current) out.push(current);
          return out.join("\n");
        }
        return (line.match(re) ?? [line]).join("\n");
      })
      .join("\n");
  }, [content, width, mode]);

  return (
    <ToolShell
      title="Text Wrapper"
      khmerTitle="បង្វែរបន្ទាត់អត្ថបទ"
      description="Hard-wrap or soft-wrap text at a fixed character width."
      descriptionKm="បង្វែរអត្ថបទតាមទទឹងតួអក្សរកំណត់ បែប hard ឬ soft wrap។"
    >
      <Row>
        <Field label={t("Width (characters)", "ទទឹង (តួអក្សរ)")}>
          <TextInput inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} />
        </Field>
        <Field label={t("Mode", "របៀប")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="soft">{t("Soft (word wrap)", "Soft (កុំកាត់ពាក្យ)")}</option>
            <option value="hard">{t("Hard (character wrap)", "Hard (កាត់តាមតួអក្សរ)")}</option>
          </Select>
        </Field>
      </Row>
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("Paste text here…", "បិទភ្ជាប់អត្ថបទនៅទីនេះ…")} />
      </Field>
      <Output label={t("Wrapped text", "អត្ថបទបានបង្វែរ")} value={wrapped} mono />
    </ToolShell>
  );
}