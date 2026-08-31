"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

export default function PwaManifestGenerator() {
  const { text: t } = useLanguage();
  const [name, setName] = useToolState("pwa:name", "");
  const [shortName, setShortName] = useToolState("pwa:short_name", "");
  const [description, setDescription] = useToolState("pwa:description", "");
  const [startUrl, setStartUrl] = useToolState("pwa:start_url", "/");
  const [display, setDisplay] = useToolState("pwa:display", "standalone");
  const [themeColor, setThemeColor] = useToolState("pwa:theme_color", "#1a1a2e");
  const [bgColor, setBgColor] = useToolState("pwa:bg_color", "#f7f5ef");
  const [orientation, setOrientation] = useToolState("pwa:orientation", "any");
  const [scope, setScope] = useToolState("pwa:scope", "/");
  const [lang, setLang] = useToolState("pwa:lang", "en");
  const [iconSrc, setIconSrc] = useToolState("pwa:icon_src", "");
  const [iconSizes, setIconSizes] = useToolState("pwa:icon_sizes", "192x192");
  const [iconPurpose, setIconPurpose] = useToolState("pwa:icon_purpose", "any");

  const themeOk = HEX_RE.test(themeColor);
  const bgOk = HEX_RE.test(bgColor);
  const missing = !name.trim() || !startUrl.trim();

  const manifest = useMemo(() => {
    const m: Record<string, string | string[] | Record<string, string>[]> = {};
    if (name.trim()) m.name = name.trim();
    if (shortName.trim()) m.short_name = shortName.trim();
    if (description.trim()) m.description = description.trim();
    if (startUrl.trim()) m.start_url = startUrl.trim();
    if (scope.trim()) m.scope = scope.trim();
    m.display = display;
    if (orientation !== "any") m.orientation = orientation;
    if (lang.trim()) m.lang = lang.trim();
    if (themeOk) m.theme_color = themeColor;
    if (bgOk) m.background_color = bgColor;
    if (iconSrc.trim()) {
      const icon: Record<string, string> = { src: iconSrc.trim(), sizes: iconSizes.trim() || "any" };
      if (iconPurpose !== "any") icon.purpose = iconPurpose;
      m.icons = [icon];
    }
    return JSON.stringify(m, null, 2);
  }, [name, shortName, description, startUrl, scope, display, orientation, lang, themeColor, bgColor, themeOk, bgOk, iconSrc, iconSizes, iconPurpose]);

  function download() {
    const blob = new Blob([manifest], { type: "application/manifest+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest.webmanifest";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="PWA Manifest Generator"
      khmerTitle="បង្កើត PWA Manifest"
      description="Generate a valid PWA web app manifest (manifest.json / manifest.webmanifest)."
      descriptionKm="បង្កើត manifest កម្មវិធីបណ្ដាញ PWA ឱ្យបានត្រឹមត្រូវ (manifest.json / manifest.webmanifest)។"
    >
      <Row>
        <Field label="Name" labelKm="ឈ្មោះ">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="My PWA" />
        </Field>
        <Field label="Short name" labelKm="ឈ្មោះខ្លី">
          <TextInput value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="MyPWA" />
        </Field>
      </Row>
      <Row>
        <Field label="Description" labelKm="ការពណ៌នា">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Start URL" labelKm="URL ចាប់ផ្តើម">
          <TextInput value={startUrl} onChange={(e) => setStartUrl(e.target.value)} placeholder="/" />
        </Field>
      </Row>
      <Row>
        <Field label="Display" labelKm="របៀបបង្ហាញ">
          <Select value={display} onChange={(e) => setDisplay(e.target.value)}>
            <option value="standalone">standalone</option>
            <option value="fullscreen">fullscreen</option>
            <option value="minimal-ui">minimal-ui</option>
            <option value="browser">browser</option>
          </Select>
        </Field>
        <Field label="Orientation" labelKm="ទិស">
          <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
            <option value="any">any</option>
            <option value="natural">natural</option>
            <option value="portrait">portrait</option>
            <option value="landscape">landscape</option>
            <option value="portrait-primary">portrait-primary</option>
            <option value="portrait-secondary">portrait-secondary</option>
            <option value="landscape-primary">landscape-primary</option>
            <option value="landscape-secondary">landscape-secondary</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field
          label="Theme color"
          labelKm="ពណ៌ប្រធានបទ"
          hint={themeOk ? undefined : t("Expected a hex color, e.g. #1a1a2e", "រំពឹងពណ៌ hex ដូចជា #1a1a2e")}
          hintKm={themeOk ? undefined : "រំពឹងពណ៌ hex ដូចជា #1a1a2e"}
        >
          <div className="flex items-center gap-2">
            <TextInput value={themeColor} onChange={(e) => setThemeColor(e.target.value)} placeholder="#1a1a2e" className="font-mono-ui" />
            {themeOk && <span className="h-8 w-8 shrink-0 rounded-md border border-[var(--ground-line)]" style={{ backgroundColor: themeColor }} />}
          </div>
        </Field>
        <Field
          label="Background color"
          labelKm="ពណ៌ផ្ទៃខាងក្រោយ"
          hint={bgOk ? undefined : t("Expected a hex color, e.g. #f7f5ef", "រំពឹងពណ៌ hex ដូចជា #f7f5ef")}
          hintKm={bgOk ? undefined : "រំពឹងពណ៌ hex ដូចជា #f7f5ef"}
        >
          <div className="flex items-center gap-2">
            <TextInput value={bgColor} onChange={(e) => setBgColor(e.target.value)} placeholder="#f7f5ef" className="font-mono-ui" />
            {bgOk && <span className="h-8 w-8 shrink-0 rounded-md border border-[var(--ground-line)]" style={{ backgroundColor: bgColor }} />}
          </div>
        </Field>
      </Row>
      <Row>
        <Field label="Scope" labelKm="វិសាលភាព">
          <TextInput value={scope} onChange={(e) => setScope(e.target.value)} placeholder="/" />
        </Field>
        <Field label="Language (lang)" labelKm="ភាសា (lang)">
          <TextInput value={lang} onChange={(e) => setLang(e.target.value)} placeholder="en, km, fr…" />
        </Field>
      </Row>
      <Row>
        <Field label="Icon URL (src)" labelKm="URL រូបតំណាង (src)">
          <TextInput value={iconSrc} onChange={(e) => setIconSrc(e.target.value)} placeholder="/icons/icon-192.png" />
        </Field>
        <Field label="Icon sizes" labelKm="ទំហំរូបតំណាង">
          <TextInput value={iconSizes} onChange={(e) => setIconSizes(e.target.value)} placeholder="192x192" className="font-mono-ui" />
        </Field>
      </Row>
      <Field label="Icon purpose" labelKm="គោលបំណងរូបតំណាង">
        <Select value={iconPurpose} onChange={(e) => setIconPurpose(e.target.value)}>
          <option value="any">any</option>
          <option value="maskable">maskable</option>
          <option value="monochrome">monochrome</option>
          <option value="any maskable">any maskable</option>
        </Select>
      </Field>

      {missing && (
        <p className="text-sm text-[var(--danger)]">{t("Name and start_url are required.", "Name និង start_url ត្រូវបានទាមទារ។")}</p>
      )}

      <Output label="manifest.json" value={manifest} error={missing} />
      {!missing && <Button onClick={download}>{t("Download manifest.webmanifest", "ទាញយក manifest.webmanifest")}</Button>}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        {t("Generated manifest follows the PWA installability guidance from —", "manifest ដែលបានបង្កើត អនុវត្តតាមការណែនាំអំពីការដំឡើង PWA ពី —")}{" "}
        <a className="underline" href="https://web.dev/articles/add-manifest" target="_blank" rel="noreferrer">web.dev/articles/add-manifest</a>
        {t(" (W3C Web App Manifest — original Tools123 implementation).", " (W3C Web App Manifest — ការសរសេរដើមរបស់ Tools123)។")}
      </div>
    </ToolShell>
  );
}
