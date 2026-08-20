"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import html2canvas from "html2canvas";
import {
  ArrowUpFromDot,
  BarChart3,
  Bookmark,
  Download,
  Globe,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { ToolShell, Field, TextInput, TextArea } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

type PlatformId = "x" | "facebook" | "telegram" | "instagram";

const PLATFORMS: Record<PlatformId, { label: string; km: string; w: number }> = {
  x: { label: "X / Twitter", km: "អ៊ិច / ធ្វីតធឺ", w: 600 },
  facebook: { label: "Facebook", km: "ហ្វេសប៊ុក", w: 500 },
  telegram: { label: "Telegram", km: "តេឡេក្រាម", w: 400 },
  instagram: { label: "Instagram", km: "អាំងស្តាក្រាម", w: 400 },
};

type Theme = { bg: string; card: string; ink: string; dim: string; border: string; brand: string };

const THEMES: Record<PlatformId, { light: Theme; dark: Theme }> = {
  x: {
    light: { bg: "#ffffff", card: "#ffffff", ink: "#0f1419", dim: "#536471", border: "#eff3f4", brand: "#1d9bf0" },
    dark: { bg: "#000000", card: "#000000", ink: "#e7e9ea", dim: "#71767b", border: "#2f3336", brand: "#1d9bf0" },
  },
  facebook: {
    light: { bg: "#ffffff", card: "#ffffff", ink: "#050505", dim: "#65676b", border: "#ced0d4", brand: "#1877f2" },
    dark: { bg: "#18191a", card: "#242526", ink: "#e4e6eb", dim: "#b0b3b8", border: "#3e4042", brand: "#1877f2" },
  },
  telegram: {
    light: { bg: "#ffffff", card: "#ffffff", ink: "#0f0f0f", dim: "#707579", border: "#e3e5e7", brand: "#0088cc" },
    dark: { bg: "#212121", card: "#2b2b2b", ink: "#ffffff", dim: "#8d969c", border: "#3a3a3a", brand: "#0088cc" },
  },
  instagram: {
    light: { bg: "#ffffff", card: "#ffffff", ink: "#262626", dim: "#8e8e8e", border: "#dbdbdb", brand: "#e1306c" },
    dark: { bg: "#000000", card: "#000000", ink: "#fafafa", dim: "#a8a8a8", border: "#262626", brand: "#e1306c" },
  },
};

interface Settings {
  platform: PlatformId;
  name: string;
  username: string;
  text: string;
  avatar: string | null;
  postImage: string | null;
  verified: boolean;
  dark: boolean;
}

const initial: Settings = {
  platform: "x",
  name: "Your Name",
  username: "yourname",
  text: "Your post text goes here. Write something worth sharing, and add #hashtags to highlight them like a real feed.",
  avatar: null,
  postImage: null,
  verified: true,
  dark: false,
};

function BrandIcon({ name, size = 18 }: { name: PlatformId; size?: number }) {
  switch (name) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path fill="currentColor" d="M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.5l-5.9-7.7-6.7 7.7H.2l8.6-9.9L0 1.2h7.7l5.3 7 6-7z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path
            fill="#1877f2"
            d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.2" fill="none" stroke="#E4405F" strokeWidth="2" />
          <circle cx="12" cy="12" r="4.3" fill="none" stroke="#E4405F" strokeWidth="2" />
          <circle cx="17.4" cy="6.6" r="1.5" fill="#E4405F" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path
            fill="#0088cc"
            d="M2.7 11.2 20.5 3.6c.6-.3 1.3.1 1.2.8l-3.2 16.2c-.1.6-.8.9-1.3.5l-5-3.9-2.8 2.7c-.4.4-1 .1-1-.5V15L2.9 12.6c-.4-.2-.4-.9-.2-1.4z"
          />
        </svg>
      );
  }
}

function VerifiedBadge({ size = 18, color = "#1d9bf0", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={color} />
      <path d="M7 12.5l3.2 3.2L17 9.2" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({
  src,
  name,
  size = 48,
  className = "",
  style,
  onError,
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  onError?: () => void;
}) {
  const [err, setErr] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setErr(false), [src]);
  if (!src || err) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    const initial = (name.trim()[0] ?? "?").toUpperCase();
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${className}`}
        style={{ width: size, height: size, background: `hsl(${hue} 60% 45%)`, color: "#ffffff", fontWeight: 700, fontSize: size * 0.42, ...style }}
      >
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={() => {
        setErr(true);
        onError?.();
      }}
    />
  );
}

function PostImg({ src, className = "", style, onError }: { src: string | null; className?: string; style?: CSSProperties; onError?: () => void }) {
  const [err, setErr] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setErr(false), [src]);
  if (!src || err) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Post image" className={className} style={style} onError={() => { setErr(true); onError?.(); }} />
  );
}

/** Renders text word-by-word, colouring `#hashtag` tokens like a live feed. */
function Rich({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(#[A-Za-z0-9_]+)/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("#")) {
      nodes.push(
        <span key={i} style={{ color: accent, fontWeight: 600 }}>
          {part}
        </span>,
      );
    } else {
      nodes.push(<span key={i}>{part}</span>);
    }
  });
  return <>{nodes}</>;
}

export default function SocialPostGeneratorTool() {
  const { text, mode } = useLanguage();
  const [s, setS] = useToolState<Settings>("social-post-generator", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  const platform = PLATFORMS[s.platform] ? s.platform : "x";
  const theme = THEMES[platform][s.dark ? "dark" : "light"];

  const [brokenAvatar, setBrokenAvatar] = useState(false);
  const [brokenPost, setBrokenPost] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => setBrokenAvatar(false), [s.avatar]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => setBrokenPost(false), [s.postImage]); // eslint-disable-line react-hooks/set-state-in-effect

  const avatarOk = !!s.avatar && !brokenAvatar;
  const postOk = !!s.postImage && !brokenPost;

  function readFileAsDataUrl(file: File, key: "avatar" | "postImage") {
    const reader = new FileReader();
    reader.onload = () => update({ [key]: reader.result as string });
    reader.readAsDataURL(file);
  }

  const locale = mode === "km" || mode === "bi" ? "km-KH" : mode === "en" ? "en-US" : undefined;
  const dateStr = new Date().toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  // Preview scaling -----------------------------------------------------------
  const areaRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const area = areaRef.current;
    const cap = captureRef.current;
    if (!area || !cap) return;
    const update = () => {
      const w = cap.offsetWidth || PLATFORMS[platform].w;
      const h = cap.offsetHeight || 1;
      setNat({ w, h });
      const avail = area.clientWidth - 48;
      setScale(Math.max(0.05, Math.min(1, avail / w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(area);
    ro.observe(cap);
    return () => ro.disconnect();
  }, [platform, s.text, s.avatar, s.postImage, s.dark]);

  async function download() {
    const node = captureRef.current;
    if (!node || rendering) return;
    setRendering(true);
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const url = canvas.toDataURL("image/png");
      const watermarked = await watermarkImageDataUrl(url, "image/png");
      const a = document.createElement("a");
      a.href = watermarked;
      a.download = `social-post-${platform}.png`;
      a.click();
      recordExport();
    } catch (err) {
      console.error("Social post export failed", err);
    } finally {
      setRendering(false);
    }
  }

  const post = (() => {
    const p = theme;
    if (platform === "x") {
      return (
        <div className="rounded-[16px] border p-4" style={{ background: p.bg, color: p.ink, borderColor: p.border }}>
          <div className="flex gap-3">
            <Avatar src={avatarOk ? s.avatar : null} name={s.name} size={48} onError={() => setBrokenAvatar(true)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate text-[15px] font-bold">{s.name}</span>
                  {s.verified && <VerifiedBadge size={18} color={p.brand} />}
                  <span className="truncate text-[15px]" style={{ color: p.dim }}>
                    @{s.username}
                  </span>
                  <span className="text-[15px]" style={{ color: p.dim }}>
                    ·
                  </span>
                  <span className="text-[15px]" style={{ color: p.dim }}>
                    {text("1h", "1ម៉ោង")}
                  </span>
                </div>
                <MoreHorizontal size={20} style={{ color: p.dim }} className="shrink-0" />
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-normal" style={{ color: p.ink }}>
                <Rich text={s.text} accent={p.brand} />
              </p>
              {postOk && (
                <PostImg
                  src={s.postImage}
                  className="mt-3 max-h-[400px] w-full rounded-2xl border object-cover"
                  style={{ borderColor: p.border }}
                  onError={() => setBrokenPost(true)}
                />
              )}
              <div className="mt-3 flex w-full max-w-md items-center justify-between text-[13px]" style={{ color: p.dim }}>
                <span className="flex items-center gap-1">
                  <MessageCircle size={15} /> 12
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 size={15} /> 5
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={15} /> 124
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 size={15} /> 1.2K
                </span>
                <ArrowUpFromDot size={15} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (platform === "facebook") {
      return (
        <div className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.2)]" style={{ background: p.bg, color: p.ink }}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar src={avatarOk ? s.avatar : null} name={s.name} size={40} onError={() => setBrokenAvatar(true)} />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] font-semibold">{s.name}</span>
                    {s.verified && <VerifiedBadge size={16} color="#1877f2" />}
                  </div>
                  <div className="flex items-center gap-1 text-[13px]" style={{ color: p.dim }}>
                    <span>{dateStr}</span>
                    <span>·</span>
                    <Globe size={12} />
                  </div>
                </div>
              </div>
              <MoreHorizontal size={18} style={{ color: p.dim }} className="shrink-0" />
            </div>
            <div className="mb-3 whitespace-pre-wrap break-words text-[15px]" style={{ color: p.ink }}>
              <Rich text={s.text} accent="#1877f2" />
            </div>
          </div>
          {postOk && (
            <PostImg src={s.postImage} className="max-h-[500px] w-full object-cover" onError={() => setBrokenPost(true)} />
          )}
          <div className="px-4 py-2">
            <div className="mb-1 flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: p.border }}>
              <div className="flex items-center">
                <span className="z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#1877f2] shadow-sm">
                  <ThumbsUp size={9} className="text-white" />
                </span>
                <span className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#f02849] shadow-sm">
                  <Heart size={9} className="text-white" />
                </span>
                <span className="ml-1 text-[13px]" style={{ color: p.dim }}>
                  1.5K
                </span>
              </div>
              <div className="text-right text-[13px]" style={{ color: p.dim }}>
                {text("120 comments · 45 shares", "120 យោបល់ · 45 ចែករំលែក")}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-[14px] font-semibold" style={{ color: p.dim }}>
              <span className="flex flex-1 items-center justify-center gap-2 py-2">
                <ThumbsUp size={18} />
                {text("Like", "ចូលចិត្ត")}
              </span>
              <span className="flex flex-1 items-center justify-center gap-2 py-2">
                <MessageCircle size={18} />
                {text("Comment", "មតិ")}
              </span>
              <span className="flex flex-1 items-center justify-center gap-2 py-2">
                <Share2 size={18} />
                {text("Share", "ចែករំលែក")}
              </span>
            </div>
          </div>
        </div>
      );
    }
    if (platform === "telegram") {
      return (
        <div className="relative">
          <div
            className="rounded-xl p-3 shadow-[0_1px_2px_rgba(114,114,114,0.25)]"
            style={{ background: p.card, color: p.ink, borderBottomRightRadius: 0 }}
          >
            <div className="mb-1 flex items-center gap-1 text-[15px] font-semibold text-[#0088cc]">
              {s.name}
              {s.verified && <VerifiedBadge size={15} color="#0088cc" />}
            </div>
            {postOk && (
              <PostImg src={s.postImage} className="mb-2 max-h-[300px] w-full rounded-lg object-cover" onError={() => setBrokenPost(true)} />
            )}
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed" style={{ color: p.ink }}>
              <Rich text={s.text} accent="#0088cc" />
            </div>
            <div className="mt-1 flex items-center justify-end gap-2 text-[12px]" style={{ color: p.dim }}>
              <span>1.2K</span>
              <span>{timeStr}</span>
            </div>
          </div>
          <div
            className="absolute -right-[10px] bottom-0 h-5 w-5"
            style={{ background: `radial-gradient(circle at top right, transparent 50%, ${p.card} 50%)`, clipPath: "polygon(0 100%, 100% 100%, 0 0)" }}
          />
        </div>
      );
    }
    return (
      <div className="rounded-[3px] border" style={{ background: p.bg, color: p.ink, borderColor: p.border }}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
              <Avatar src={avatarOk ? s.avatar : null} name={s.name} size={32} className="border-2 border-white" onError={() => setBrokenAvatar(true)} />
            </div>
            <span className="flex items-center gap-1 text-[14px] font-semibold">
              {s.username}
              {s.verified && <VerifiedBadge size={14} color="#1877f2" />}
            </span>
          </div>
          <MoreHorizontal size={20} style={{ color: p.ink }} className="shrink-0" />
        </div>
        {postOk ? (
          <PostImg src={s.postImage} className="aspect-square w-full object-cover" onError={() => setBrokenPost(true)} />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
            <ImageIcon size={40} />
          </div>
        )}
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-4" style={{ color: p.ink }}>
              <Heart size={24} />
              <MessageCircle size={24} />
              <Send size={24} />
            </div>
            <Bookmark size={24} style={{ color: p.ink }} />
          </div>
          <div className="mb-1 text-[14px] font-semibold">{text("8,492 likes", "៨,៤៩២ ចូលចិត្ត")}</div>
          <div className="whitespace-pre-wrap break-words text-[14px]" style={{ color: p.ink }}>
            <span className="mr-1 font-semibold">{s.username}</span>
            <Rich text={s.text} accent="#e1306c" />
          </div>
          <div className="mt-2 cursor-pointer text-[12px] uppercase text-gray-500">{text("2 HOURS AGO", "២ ម៉ោងមុន")}</div>
        </div>
      </div>
    );
  })();

  return (
    <ToolShell
      title="Social Post Generator"
      description="Compose a realistic post for X, Facebook, Telegram, or Instagram — rendered like the real app, exported as PNG."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-card)] p-6 shadow-sm lg:col-span-4">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-[var(--ink)]">{text("Create a post", "បង្កើតប៉ុស្តិ៍")}</h2>
            <p className="mb-6 text-sm text-[var(--ink-dim)]">{text("Design and download your social media post", "រចនា និងទាញយកប៉ុស្តិ៍បណ្ដាញសង្គមរបស់អ្នក")}</p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-[var(--ink-dim)]">{text("Choose platform", "ជ្រើសរើសវេទិកា")}</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLATFORMS) as PlatformId[]).map((id) => {
                const active = id === platform;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update({ platform: id })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                      active ? "border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:bg-[var(--ground-raised)]"
                    }`}
                  >
                    <BrandIcon name={id} size={18} />
                    {text(PLATFORMS[id].label, PLATFORMS[id].km)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--ground-line)] pt-4">
            <Field label="Name" labelKm="ឈ្មោះ">
              <TextInput value={s.name} placeholder={text("Your Name", "ឈ្មោះរបស់អ្នក")} onChange={(e) => update({ name: e.target.value })} />
            </Field>

            {(platform === "x" || platform === "instagram") && (
              <Field label="Username / @handle" labelKm="ឈ្មោះគណនី / @handle">
                <TextInput value={s.username} placeholder="yourname" onChange={(e) => update({ username: e.target.value })} />
              </Field>
            )}

            <Field label="Post text" labelKm="អត្ថបទប៉ុស្តិ៍">
              <TextArea rows={4} value={s.text} placeholder={text("What's happening?", "តើមានអ្វីកើតឡើង?")} onChange={(e) => update({ text: e.target.value })} />
            </Field>

            <Field label="Avatar / image" labelKm="រូបតំណាង / រូបភាព">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <TextInput
                    value={s.avatar ?? ""}
                    placeholder={text("Paste image URL…", "បិទភ្ជាប់ URL រូបភាព…")}
                    onChange={(e) => update({ avatar: e.target.value || null })}
                    className="flex-1"
                  />
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
                    {text("Upload", "បញ្ចូល")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFileAsDataUrl(f, "avatar"); }} />
                  </label>
                </div>
              </div>
            </Field>

            <Field
              label="Post image"
              labelKm="រូបភាពប៉ុស្តិ៍"
              hint={text("Optional photo shown inside the post.", "រូបថតស្រេចចិត្តបង្ហាញក្នុងប៉ុស្តិ៍")}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <TextInput
                    value={s.postImage ?? ""}
                    placeholder={text("Paste image URL…", "បិទភ្ជាប់ URL រូបភាព…")}
                    onChange={(e) => update({ postImage: e.target.value || null })}
                    className="flex-1"
                  />
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
                    {text("Upload post image", "ផ្ទុករូបភាពប៉ុស្តិ៍")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFileAsDataUrl(f, "postImage"); }} />
                  </label>
                </div>
              </div>
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
                <input type="checkbox" checked={s.verified} onChange={(e) => update({ verified: e.target.checked })} className="h-4 w-4 accent-[var(--gold)]" />
                {text("Verified badge", "សញ្ញាផ្ទៀងផ្ទាត់")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
                <input type="checkbox" checked={s.dark} onChange={(e) => update({ dark: e.target.checked })} className="h-4 w-4 accent-[var(--gold)]" />
                {text("Dark mode", "របៀបងងឹត")}
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={download}
            disabled={rendering}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-3 font-semibold text-white shadow-lg shadow-blue-200/40 transition hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70"
          >
            {rendering ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {rendering ? text("Preparing image…", "កំពុងរៀបចំរូបភាព…") : text("Download PNG", "ទាញយក PNG")}
          </button>
        </div>

        {/* Preview */}
        <div className="relative flex min-h-[600px] flex-col items-center overflow-x-auto rounded-2xl bg-[var(--ground-raised)]/60 p-4 md:p-8 lg:col-span-8">
          <p className="mb-4 text-sm text-[var(--ink-dim)]">{text("Preview", "មើលជាមុន")}</p>
          <div ref={areaRef} className="w-full">
            <div className="flex justify-center">
              <div style={{ width: nat.w * scale, height: nat.h * scale }} className="overflow-visible">
                <div ref={captureRef} className="w-fit p-3">
                  <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }} className="w-fit">
                    {post}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}