"use client";

import { useRef, useState } from "react";
import { Clipboard, ClipboardPaste, Download, FileText, Link, Upload, Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

export default function WebRTCTransfer() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useState<"send" | "receive">("send");
  const [file, setFile] = useState<{ name: string; size: string; data: Uint8Array; mime: string } | null>(null);
  const [step, setStep] = useState<"idle" | "sharing" | "answering" | "connected" | "transferring" | "done">("idle");
  const [offerText, setOfferText] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<"offer" | "answer" | "">("");
  const [statusText, setStatusText] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  // ---- SEND flow ----
  async function createTransfer() {
    if (!file) return;
    setStep("sharing");
    setStatusText(t("Creating connection offer…", "កំពុងបង្កើតការតភ្ជាប់…"));
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    // Collect ICE candidates
    const candidates: RTCIceCandidateInit[] = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) candidates.push(e.candidate.toJSON());
      // When ICE gathering completes, show the final offer
    };
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        const data = JSON.stringify({ offer: pc.localDescription, candidates });
        setOfferText(data);
        setStatusText(t("Share this connection code with the receiver", "ចែករំលែកកូដតភ្ជាប់នេះទៅអ្នកទទួល"));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected") {
        setStep("connected");
        setStatusText(t("Connected! Waiting for file transfer…", "បានតភ្ជាប់! កំពុងរង់ចាំ…"));
      } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setStatusText(t("Connection lost", "ការតភ្ជាប់បានបាត់បង់"));
      }
    };

    pc.ondatachannel = (e) => {
      const ch = e.channel;
      ch.binaryType = "arraybuffer";
      ch.onopen = () => {
        setStep("transferring");
        setStatusText(t("Sending file…", "កំពុងផ្ញើឯកសារ…"));
        const total = file.data.length;
        const chunkSize = 65536;
        let sent = 0;
        function sendChunk() {
          if (sent >= total) {
            ch.send(JSON.stringify({ type: "done", name: file!.name, mime: file!.mime, size: total }));
            setStep("done");
            setStatusText(t("Transfer complete!", "បញ្ជូនរួចរាល់!"));
            return;
          }
          const end = Math.min(sent + chunkSize, total);
          ch.send(file!.data.slice(sent, end));
          sent = end;
          setProgress(Math.round((sent / total) * 100));
          if (ch.bufferedAmount < chunkSize * 4) sendChunk();
          else setTimeout(sendChunk, 20);
        }
        sendChunk();
      };
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  }

  async function acceptAnswer() {
    if (!pcRef.current || !answerInput.trim()) return;
    try {
      const { answer, candidates } = JSON.parse(answerInput);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      for (const c of candidates) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      }
    } catch {
      setStatusText(t("Invalid connection code", "កូដតភ្ជាប់មិនត្រឹមត្រូវ"));
    }
  }

  // ---- RECEIVE flow ----
  async function connectReceiver() {
    if (!answerInput.trim()) return;
    setStep("sharing");
    try {
      const { offer, candidates } = JSON.parse(answerInput);
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      // Collect our candidates
      const ourCandidates: RTCIceCandidateInit[] = [];
      pc.onicecandidate = (e) => {
        if (e.candidate) ourCandidates.push(e.candidate.toJSON());
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete" && pc.localDescription) {
          const answerText = JSON.stringify({ answer: pc.localDescription, candidates: ourCandidates });
          setOfferText(answerText);
          setStatusText(t("Send this answer back to the sender", "ផ្ញើចម្លើយនេះទៅអ្នកផ្ញើ"));
          setStep("answering");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected") setStep("connected");
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const c of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setStatusText(t("Preparing connection…", "កំពុងរៀបចំការតភ្ជាប់…"));
    } catch {
      setStatusText(t("Invalid connection code", "កូដតភ្ជាប់មិនត្រឹមត្រូវ"));
    }
  }

  // Receiving side: create data channel proactively so .ondatachannel fires on sender
  // Actually for receiver, the sender creates the channel and pc.ondatachannel fires on receiver.
  // But we need to receive. Let the sender create the data channel.

  function reset() {
    pcRef.current?.close(); pcRef.current = null;
    setStep("idle"); setFile(null); setOfferText(""); setAnswerInput(""); setProgress(0); setStatusText("");
  }

  const dropRef = useRef<HTMLDivElement>(null);
  const [dragover, setDragover] = useState(false);

  function handleFile(f: File) {
    const r = new FileReader();
    r.onload = () => setFile({ name: f.name, size: formatBytes(f.size), data: new Uint8Array(r.result as ArrayBuffer), mime: f.type || "application/octet-stream" });
    r.readAsArrayBuffer(f);
    setStep("idle");
  }

  return (
    <ToolShell
      title="WebRTC File Transfer"
      khmerTitle="បញ្ជូនឯកសារតាម WebRTC"
      description="Peer-to-peer file transfer — the fastest local network transfer. No server stores your data. Uses clipboard-based signaling; share the connection code via chat or email."
      descriptionKm="បញ្ជូនឯកសារពី peer ទៅ peer — លឿនបំផុតក្នុងបណ្តាញក្នុងស្រុក។ គ្មាន server រក្សាទុកទិន្នន័យ។ ប្រើ clipboard signaling — ចែករំលែកកូដតភ្ជាប់តាម chat ឬ email។"
    >
      {/* Mode toggle */}
      <div className="mb-5 flex rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1">
        <button onClick={() => { setMode("send"); reset(); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === "send" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
          <Upload size={14} className="inline mr-1" />{t("Send File", "ផ្ញើឯកសារ")}
        </button>
        <button onClick={() => { setMode("receive"); reset(); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === "receive" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
          <Download size={14} className="inline mr-1" />{t("Receive File", "ទទួលឯកសារ")}
        </button>
      </div>

      {/* Status */}
      {statusText && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-sm text-[var(--gold)]">
          <Wifi size={14} className={step === "connected" || step === "transferring" || step === "done" ? "text-[var(--success)]" : ""} />
          {statusText}
        </div>
      )}

      {/* Progress bar */}
      {(step === "transferring" || step === "done") && (
        <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
          <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* SENDER FLOW */}
      {mode === "send" && (
        <div className="space-y-4">
          {/* File picker */}
          {!file ? (
            <>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              <button
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={(e) => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition ${dragover ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--ground-line)] hover:border-[var(--gold)]/30"}`}>
                <Upload size={28} className="text-[var(--ink-faint)]" />
                <div className="text-sm font-semibold text-[var(--ink)]">{t("Drop a file or click to browse", "អូសឯកសារ ឬចុចដើម្បីជ្រើសរើស")}</div>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <FileText size={20} className="text-[var(--gold)]" />
                <div><div className="text-sm font-semibold">{file.name}</div><div className="text-xs text-[var(--ink-faint)]">{file.size}</div></div>
                <button onClick={() => setFile(null)} className="ml-auto rounded border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-faint)]">{t("Change", "ផ្លាស់")}</button>
              </div>

              {step === "idle" && (
                <button onClick={createTransfer} className="w-full rounded-lg bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                  {t("Create Transfer", "បង្កើតការផ្ទេរ")}
                </button>
              )}
            </>
          )}

          {/* Offer display */}
          {step === "sharing" && offerText && (
            <div className="space-y-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-semibold text-[var(--ink-dim)]">
                {t("Send this connection code to the receiver (paste into chat, email, etc.):", "ផ្ញើកូដតភ្ជាប់នេះទៅអ្នកទទួល (បិទភ្ជាប់ក្នុង chat, email)៖")}
              </div>
              <div className="max-h-32 overflow-auto rounded border border-[var(--ground-line)] bg-[var(--ground)] p-2 font-mono-ui text-[11px] text-[var(--ink-dim)] break-all">{offerText}</div>
              <div className="flex gap-2">
                <button onClick={async () => { try { await navigator.clipboard.writeText(offerText); setCopied("offer"); setTimeout(() => setCopied(""), 1500); } catch {} }}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
                  <Clipboard size={12} />{copied === "offer" ? t("Copied!", "បានចម្លង!") : t("Copy", "ចម្លង")}
                </button>
              </div>

              {/* Answer input for receiver's response back to sender */}
              <div className="border-t border-[var(--ground-line)] pt-3">
                <div className="mb-1 text-xs text-[var(--ink-faint)]">{t("Paste the receiver's answer here:", "បិទភ្ជាប់ចម្លើយរបស់អ្នកទទួលនៅទីនេះ៖")}</div>
                <textarea value={answerInput} onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder={t("Paste answer…", "បិទភ្ជាប់ចម្លើយ…")}
                  className="h-20 w-full resize-none rounded border border-[var(--ground-line)] bg-[var(--ground)] p-2 font-mono-ui text-[11px] text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
                <button onClick={acceptAnswer} disabled={!answerInput.trim()}
                  className="mt-2 w-full rounded-lg bg-[var(--teal)]/80 px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--teal)] disabled:opacity-40">
                  {t("Connect to Receiver", "តភ្ជាប់ទៅអ្នកទទួល")}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <button onClick={reset} className="w-full rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white">{t("Transfer Complete — Send Another", "បញ្ជូនរួច — ផ្ញើថ្មី")}</button>
          )}
        </div>
      )}

      {/* RECEIVER FLOW */}
      {mode === "receive" && (
        <div className="space-y-4">
          {step === "idle" && (
            <div className="space-y-3">
              <textarea value={answerInput} onChange={(e) => setAnswerInput(e.target.value)}
                placeholder={t("Paste the sender's connection code here…", "បិទភ្ជាប់កូដតភ្ជាប់របស់អ្នកផ្ញើនៅទីនេះ…")}
                className="h-28 w-full resize-y rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 font-mono-ui text-[11px] text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              <button onClick={connectReceiver} disabled={!answerInput.trim()}
                className="w-full rounded-lg bg-[var(--teal)]/80 px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--teal)] disabled:opacity-40">
                {t("Connect to Sender", "តភ្ជាប់ទៅអ្នកផ្ញើ")}
              </button>
            </div>
          )}

          {(step === "sharing" || step === "answering") && (
            <div className="space-y-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              {step === "answering" && offerText && (
                <>
                  <div className="text-xs font-semibold text-[var(--ink-dim)]">
                    {t("Send this answer back to the sender:", "ផ្ញើចម្លើយនេះទៅអ្នកផ្ញើវិញ៖")}
                  </div>
                  <div className="max-h-32 overflow-auto rounded border border-[var(--ground-line)] bg-[var(--ground)] p-2 font-mono-ui text-[11px] text-[var(--ink-dim)] break-all">{offerText}</div>
                  <div className="flex gap-2">
                    <button onClick={async () => { try { await navigator.clipboard.writeText(offerText); setCopied("answer"); setTimeout(() => setCopied(""), 1500); } catch {} }}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
                      <Clipboard size={12} />{copied === "answer" ? t("Copied!", "បានចម្លង!") : t("Copy Answer", "ចម្លងចម្លើយ")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help */}
      <div className="mt-6 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <strong>{t("How it works:", "របៀបប្រើ៖")}</strong><br />
        <strong>{t("1.", "១.")}</strong> {t("Sender selects a file and clicks 'Create Transfer'", "អ្នកផ្ញើជ្រើសឯកសារ ហើយចុច 'បង្កើតការផ្ទេរ'")}<br />
        <strong>{t("2.", "២.")}</strong> {t("Sender copies the connection code and shares it (chat, email, etc.)", "អ្នកផ្ញើចម្លងកូដតភ្ជាប់ ហើយចែករំលែក (chat, email)")}<br />
        <strong>{t("3.", "៣.")}</strong> {t("Receiver pastes the code and clicks 'Connect'", "អ្នកទទួលបិទភ្ជាប់កូដ ហើយចុច 'តភ្ជាប់'")}<br />
        <strong>{t("4.", "៤.")}</strong> {t("Receiver copies the answer and sends it back to the sender", "អ្នកទទួលចម្លងចម្លើយ ហើយផ្ញើទៅអ្នកផ្ញើវិញ")}<br />
        <strong>{t("5.", "៥.")}</strong> {t("Sender pastes the answer — file transfers directly P2P", "អ្នកផ្ញើបិទភ្ជាប់ចម្លើយ — ឯកសារបញ្ជូនដោយផ្ទាល់ P2P")}
      </div>
    </ToolShell>
  );
}
