"use client";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { ToolShell, Field, Select, TextInput, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";

type Category =
  | "email-opener"
  | "email-follow-up"
  | "email-apology"
  | "email-request"
  | "email-thank-you"
  | "meeting-recap"
  | "admin-notice"
  | "leave-request"
  | "out-of-office"
  | "cover-letter";

type Tone = "formal" | "friendly" | "direct";

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `[${k}]`);
}

const BANK: Record<Category, Record<Tone, string[]>> = {
  "email-opener": {
    formal: [
      "I hope this message finds you well. I am writing to you regarding {topic}.",
      "Thank you for your time. I wanted to reach out concerning {topic}.",
      "I trust this email finds you in good health. I am writing about {topic}.",
    ],
    friendly: [
      "Hope you're doing well! I wanted to check in about {topic}.",
      "Hi there — hope your week's going smoothly. Quick note about {topic}.",
      "Hope all's good on your end. Reaching out about {topic}.",
    ],
    direct: [
      "I'm writing about {topic}.",
      "Following up on {topic} — a few notes below.",
      "Quick update on {topic}.",
    ],
  },
  "email-follow-up": {
    formal: [
      "I am following up on my previous message regarding {topic}, as I have not yet received a response.",
      "I wanted to check in on the status of {topic}, at your earliest convenience.",
      "Per our last conversation about {topic}, I wanted to confirm the next steps.",
    ],
    friendly: [
      "Just circling back on {topic} — no rush, whenever you get a chance!",
      "Wanted to gently follow up on {topic} in case it slipped through the cracks.",
      "Bumping this up in your inbox — any update on {topic}?",
    ],
    direct: [
      "Following up on {topic}. Please advise on status.",
      "Checking in — any update on {topic}?",
      "Second follow-up regarding {topic}.",
    ],
  },
  "email-apology": {
    formal: [
      "I sincerely apologize for the delay regarding {topic}, and I appreciate your patience.",
      "Please accept my apologies for any inconvenience caused by {topic}. I am addressing it promptly.",
      "I regret the oversight concerning {topic} and take full responsibility for the delay.",
    ],
    friendly: [
      "Sorry for the delay on {topic} — totally on me, and I'm on it now!",
      "My apologies for the mix-up with {topic}. Thanks for bearing with me.",
      "Sorry about that! I dropped the ball on {topic} but it's sorted now.",
    ],
    direct: [
      "Apologies for the delay on {topic}. Resolved as of today.",
      "Sorry for the oversight regarding {topic}.",
      "My mistake on {topic} — corrected now.",
    ],
  },
  "email-request": {
    formal: [
      "I would be grateful if you could provide an update on {topic} at your earliest convenience.",
      "Would it be possible to schedule some time to discuss {topic}?",
      "I am writing to request your assistance with {topic}.",
    ],
    friendly: [
      "Would you be able to help out with {topic} when you get a chance?",
      "Any chance we could hop on a quick call about {topic}?",
      "Could you point me in the right direction on {topic}?",
    ],
    direct: [
      "Please send an update on {topic} by end of day.",
      "Need your input on {topic} — can we align this week?",
      "Requesting assistance with {topic}.",
    ],
  },
  "email-thank-you": {
    formal: [
      "Thank you very much for your assistance with {topic}; it is sincerely appreciated.",
      "I wanted to express my gratitude for your support regarding {topic}.",
      "Please accept my thanks for your prompt attention to {topic}.",
    ],
    friendly: [
      "Thanks so much for your help with {topic} — really appreciate it!",
      "Just wanted to say thanks for jumping in on {topic}.",
      "You're a lifesaver for handling {topic} so quickly!",
    ],
    direct: [
      "Thanks for handling {topic}.",
      "Appreciated — {topic} is resolved.",
      "Thanks for the quick turnaround on {topic}.",
    ],
  },
  "meeting-recap": {
    formal: [
      "Thank you for attending today's meeting on {topic}. Below is a summary of the key points discussed and the agreed next steps.",
      "Following our discussion on {topic}, please find a recap of the decisions made and action items assigned.",
      "This email summarizes our meeting regarding {topic}, including responsibilities and deadlines agreed upon.",
    ],
    friendly: [
      "Great chatting today about {topic}! Here's a quick recap so we're all on the same page.",
      "Thanks for the good discussion on {topic} — summary and next steps below.",
      "Recap from our {topic} chat — let me know if I missed anything!",
    ],
    direct: [
      "Recap of {topic} meeting: decisions and action items below.",
      "Summary — {topic}. Next steps attached.",
      "Meeting notes on {topic}, action items follow.",
    ],
  },
  "admin-notice": {
    formal: [
      "This notice is to inform all staff regarding an update to {topic}, effective immediately.",
      "Please be advised that changes have been made to {topic}. Details are outlined below.",
      "This memorandum serves to notify all relevant parties of the update to {topic}.",
    ],
    friendly: [
      "Quick heads-up for the team — there's an update to {topic}!",
      "Wanted to let everyone know about a change to {topic}.",
      "Friendly reminder about the update to {topic} below.",
    ],
    direct: [
      "Notice: {topic} has been updated, effective immediately.",
      "Update to {topic} — see details below.",
      "Action required: review the change to {topic}.",
    ],
  },
  "leave-request": {
    formal: [
      "I am writing to formally request leave from {topic}. I will ensure all pending tasks are handed over prior to my absence.",
      "I would like to request approval for leave regarding {topic}. Please let me know if further information is required.",
      "This is a formal request for leave concerning {topic}, and I have arranged coverage for my responsibilities.",
    ],
    friendly: [
      "Wanted to give you a heads-up that I'll need some time off for {topic}.",
      "Quick note to request leave for {topic} — happy to sort out coverage.",
      "Hoping to take some time off around {topic}, let me know if that works!",
    ],
    direct: [
      "Requesting leave for {topic}.",
      "Leave request: {topic}. Coverage arranged.",
      "Time off needed for {topic} — please approve.",
    ],
  },
  "out-of-office": {
    formal: [
      "Thank you for your email. I am currently out of office regarding {topic} and will respond upon my return.",
      "I am unavailable at this time due to {topic}. For urgent matters, please contact my colleague.",
      "I am currently away from the office in relation to {topic} and will reply as soon as possible upon my return.",
    ],
    friendly: [
      "Thanks for reaching out! I'm currently out for {topic} and will get back to you soon.",
      "I'm away right now for {topic} — I'll reply as soon as I'm back!",
      "Out of office for {topic} at the moment, will respond shortly after I'm back.",
    ],
    direct: [
      "Out of office: {topic}. Will respond upon return.",
      "Away for {topic}. Urgent matters — contact backup.",
      "OOO for {topic}, back soon.",
    ],
  },
  "cover-letter": {
    formal: [
      "I am writing to express my interest in {topic}, and I believe my experience aligns closely with the role's requirements.",
      "It is with great enthusiasm that I apply for {topic}, having developed relevant skills throughout my career.",
      "I am pleased to submit my application for {topic}, confident that my background makes me a strong candidate.",
    ],
    friendly: [
      "I'm excited to apply for {topic} — it's exactly the kind of role I've been hoping to find!",
      "I'd love the opportunity to bring my experience to {topic}.",
      "Applying for {topic} feels like a great fit, and I'm excited to explain why.",
    ],
    direct: [
      "Applying for {topic}. Relevant experience summarized below.",
      "Candidate for {topic} — qualifications outlined below.",
      "Submitting my application for {topic}.",
    ],
  },
};

const LABELS: Record<Category, string> = {
  "email-opener": "Email opener",
  "email-follow-up": "Follow-up email",
  "email-apology": "Apology email",
  "email-request": "Request / ask",
  "email-thank-you": "Thank-you note",
  "meeting-recap": "Meeting recap",
  "admin-notice": "Administrative notice",
  "leave-request": "Leave request",
  "out-of-office": "Out-of-office reply",
  "cover-letter": "Cover letter intro",
};

export default function SampleParagraphGeneratorTool() {
  const [category, setCategory] = useState<Category>("email-opener");
  const [tone, setTone] = useState<Tone>("formal");
  const [topic, setTopic] = useState("the Q3 budget review");
  const [sentences, setSentences] = useState(2);
  const [output, setOutput] = useState("");

  function generate() {
    const bank = BANK[category][tone];
    const used = new Set<number>();
    const parts: string[] = [];
    const count = Math.min(sentences, bank.length);
    while (parts.length < count) {
      const idx = Math.floor(Math.random() * bank.length);
      if (used.has(idx)) continue;
      used.add(idx);
      parts.push(fill(bank[idx], { topic: topic || "the matter" }));
    }
    setOutput(parts.join(" "));
  }

  return (
    <ToolShell
      title="Sample Paragraph Generator"
      description="Generate ready-to-edit paragraphs for common email and administrative writing — pick a category and tone, fill in the topic, and get a natural-sounding draft to start from. Purely template-based and offline, not AI-generated."
    >
      <Row>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {(Object.keys(LABELS) as Category[]).map((c) => (
              <option key={c} value={c}>{LABELS[c]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tone">
          <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
            <option value="formal">Formal</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct / concise</option>
          </Select>
        </Field>
      </Row>

      <Row>
        <Field label="Topic / subject" hint="fills the {topic} placeholder">
          <TextInput value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. the Q3 budget review" />
        </Field>
        <Field label="Sentences" hint={`${sentences}`}>
          <input type="range" min={1} max={3} value={sentences} onChange={(e) => setSentences(Number(e.target.value))} className="w-full" />
        </Field>
      </Row>

      <Button onClick={generate}><Shuffle size={13} className="mr-1.5 inline" />Generate</Button>

      {output && <Output label="Draft paragraph" value={output} mono={false} />}
    </ToolShell>
  );
}
