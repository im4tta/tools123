"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useBeam } from "@/contexts/BeamContext";
import { Camera, Send, Shield, WifiOff } from "lucide-react";

export default function OpticalTransfer() {
  const { text: t } = useLanguage();
  const { openSend, openReceive } = useBeam();

  return (
    <ToolShell
      title="Decimen Optical Transfer"
      khmerTitle="ដេស៊ីម៉ិន បញ្ជូនឯកសារតាមពន្លឺ"
      description="Send a file between two devices using only a screen and a camera. No Wi-Fi, no Bluetooth, no pairing — the file travels as light."
      descriptionKm="បញ្ជូនឯកសាររវាងឧបករណ៍ពីរ ដោយប្រើតែអេក្រង់ និងកាមេរ៉ា។ គ្មាន Wi-Fi គ្មាន Bluetooth គ្មានការផ្គូផ្គង — ឯកសារធ្វើដំណើរតាមពន្លឺ។"
    >
      {/* How it works */}
      <div className="mb-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[var(--gold)]/10 p-2.5 text-[var(--gold)]"><Shield size={22} /></div>
          <div>
            <h2 className="font-semibold text-[var(--ink)]">{t("How it works", "របៀបដំណើរការ")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">
              {t(
                "The file is split into blocks and streamed as animated QR codes on the sender's screen. A fountain code ensures frames arrive in any order — a missed or blurred QR never breaks the transfer. The receiver's camera collects frames and rebuilds the file, verified with SHA-256.",
                "ឯកសារត្រូវបានបំបែកជាប្លុក និងបញ្ជូនជាកូដ QR ដែលមានចលនា។ កូដ Fountain ធានាថាស៊ុមទទួលបានតាមលំដាប់ណាក៏ដោយ — QR ដែលខកឬព្រិលមិនបំផ្លាញការបញ្ជូនឡើយ។"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Two launch buttons */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openSend({ kind: 'text', text: '' })}
          className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-8 text-center transition hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--gold)]/20 text-[var(--gold)]"><Send size={28} /></div>
          <div>
            <h3 className="font-semibold text-[var(--ink)]">{t("Send a File", "ផ្ញើឯកសារ")}</h3>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">{t("Drop a file or type text — it streams as animated QR codes on your screen.", "ជ្រើសឯកសារ ឬវាយអត្ថបទ — វានឹងបញ្ជូនជាកូដ QR មានចលនា។")}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={openReceive}
          className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-8 text-center transition hover:bg-[var(--teal)]/10 hover:border-[var(--teal)]/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--teal)]/20 text-[var(--teal)]"><Camera size={28} /></div>
          <div>
            <h3 className="font-semibold text-[var(--ink)]">{t("Receive a File", "ទទួលឯកសារ")}</h3>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">{t("Open this page on a second device, point the camera, and catch the file.", "បើកទំព័រនេះនៅលើឧបករណ៍ទីពីរ តម្រង់កាមេរ៉ា ហើយចាប់យកឯកសារ។")}</p>
          </div>
        </button>
      </div>

      {/* Requirements */}
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Requirements", "តម្រូវការ")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: Camera, text: t("Two devices — one with a screen, one with a camera", "ឧបករណ៍ពីរ — មួយមានអេក្រង់ មួយមានកាមេរ៉ា") },
            { icon: Shield, text: t("HTTPS or localhost — required for camera access (browser security)", "HTTPS ឬ localhost — តម្រូវសម្រាប់ការប្រើកាមេរ៉ា") },
            { icon: WifiOff, text: t("No network needed — the file travels as light between the two devices", "មិនត្រូវការបណ្តាញ — ឯកសារធ្វើដំណើរតាមពន្លឺ") },
            { icon: Send, text: t("Files up to ~10 MB recommended for practical transfer speeds", "ឯកសាររហូតដល់ ~10 MB សម្រាប់ល្បឿនបញ្ជូនជាក់ស្តែង") },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3">
              <item.icon size={16} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" />
              <span className="text-xs text-[var(--ink-dim)]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
