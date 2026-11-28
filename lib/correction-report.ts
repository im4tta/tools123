// "Suggest a correction" for glossary entries: builds a link that opens a pre-filled issue on the project's public
// GitHub repository. Nothing is sent by the site itself; the reader reviews and submits the issue on GitHub.

export const ISSUES_NEW_URL = "https://github.com/im4tta/tools123/issues/new";
/** Keep the whole link well under the ~8 KB that browsers and GitHub accept. */
const MAX_BODY = 5000;

export interface CorrectionReport {
  /** Glossary or source name, e.g. "Climate Change Lexicon". */
  glossary: string;
  term: string;
  km: string;
  definition?: string;
  /** Link back to the entry. */
  link: string;
  suggestion: string;
  note?: string;
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function correctionIssueUrl(r: CorrectionReport): string {
  const title = clip(`Glossary correction: ${r.term} (${r.glossary})`, 120);
  const body = clip(
    [
      `**Glossary:** ${r.glossary}`,
      `**Entry:** ${r.term}`,
      `**Link:** ${r.link}`,
      "",
      "**Khmer as shown**",
      r.km,
      ...(r.definition ? ["", "**Definition as shown**", clip(r.definition, 1500)] : []),
      "",
      "**Suggested correction**",
      r.suggestion.trim() || "(not given)",
      ...(r.note?.trim() ? ["", "**Source or note**", r.note.trim()] : []),
      "",
      "_Sent from the Suggest a correction button. Please check against the printed source before changing the data._",
    ].join("\n"),
    MAX_BODY,
  );
  return `${ISSUES_NEW_URL}?${new URLSearchParams({ title, body }).toString()}`;
}
