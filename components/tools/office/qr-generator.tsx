"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { Crosshair, Download, ImagePlus, Loader2, ScanLine, ClipboardPaste } from "lucide-react";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

type QrType = "text" | "wifi" | "vcard" | "email" | "sms" | "phone" | "location" | "event" | "google" | "social";
type SocialPlatform = "facebook" | "instagram" | "x" | "youtube" | "linkedin" | "tiktok" | "telegram" | "whatsapp" | "line";
type Preset = "default" | "ocean" | "forest" | "lux" | "sunset" | "midnight" | "gold" | "rose" | "neon" | "cyber";
type PixelShape = "square" | "circle" | "diamond" | "star" | "heart" | "leaf" | "hexagon" | "cross" | "triangle" | "dash";
type EyeShape = "square" | "rounded" | "smooth" | "circle" | "leaf" | "diamond" | "hexagon" | "octagon";
type SocialIcon = "none" | "gmaps" | "facebook" | "youtube" | "x" | "instagram" | "telegram";

interface State {
  type: QrType;
  text: string;
  wifiSsid: string;
  wifiPass: string;
  wifiEnc: "WPA" | "WEP" | "nopass";
  vName: string;
  vPhone: string;
  vEmail: string;
  vOrg: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  smsTo: string;
  smsBody: string;
  phone: string;
  locLat: string;
  locLng: string;
  googleReview: string;
  socialPlatform: SocialPlatform;
  socialHandle: string;
  evTitle: string;
  evLocation: string;
  evStart: string;
  evEnd: string;
  evDesc: string;
  preset: Preset;
  pixel: PixelShape;
  eye: EyeShape;
  social: SocialIcon;
  fg: string;
  bg: string;
  eyeOuter: string;
  eyeInner: string;
  size: number;
  level: "L" | "M" | "Q" | "H";
  logo: string | null;
}

const PRESETS: Record<Preset, { bg: string; fg: string; eyeOuter: string; eyeInner: string }> = {
  default: { bg: "#ffffff", fg: "#0a0c0d", eyeOuter: "#0a0c0d", eyeInner: "#0a0c0d" },
  ocean: { bg: "#e0f2fe", fg: "#0369a1", eyeOuter: "#075985", eyeInner: "#0284c7" },
  forest: { bg: "#dcfce7", fg: "#15803d", eyeOuter: "#166534", eyeInner: "#16a34a" },
  lux: { bg: "#ede9fe", fg: "#6d28d9", eyeOuter: "#4c1d95", eyeInner: "#5b21b6" },
  sunset: { bg: "#ffedd5", fg: "#c2410c", eyeOuter: "#9a3412", eyeInner: "#ea580c" },
  midnight: { bg: "#0f172a", fg: "#f8fafc", eyeOuter: "#e2e8f0", eyeInner: "#cbd5e1" },
  gold: { bg: "#fef3c7", fg: "#b45309", eyeOuter: "#78350f", eyeInner: "#d97706" },
  rose: { bg: "#ffe4e6", fg: "#be123c", eyeOuter: "#881337", eyeInner: "#e11d48" },
  neon: { bg: "#000000", fg: "#39ff14", eyeOuter: "#39ff14", eyeInner: "#39ff14" },
  cyber: { bg: "#020617", fg: "#06b6d4", eyeOuter: "#ec4899", eyeInner: "#8b5cf6" },
};

const PRESET_LIST: { id: Preset; name: string; km: string }[] = [
  { id: "default", name: "Classic", km: "បុរាណ" },
  { id: "ocean", name: "Ocean", km: "មហាសមុទ្រ" },
  { id: "forest", name: "Forest", km: "ព្រៃឈើ" },
  { id: "lux", name: "Diamond", km: "ពេជ្រ" },
  { id: "sunset", name: "Sunset", km: "ថ្ងៃលិច" },
  { id: "midnight", name: "Midnight", km: "អធ្រាត្រ" },
  { id: "gold", name: "Gold", km: "មាស" },
  { id: "rose", name: "Rose", km: "ផ្កាកុលាប" },
  { id: "neon", name: "Neon", km: "ណេអុន" },
  { id: "cyber", name: "Cyberpunk", km: "ស៊ីបឺផាក" },
];

const PIXEL_SHAPES: { id: PixelShape; name: string; km: string }[] = [
  { id: "square", name: "Square", km: "ការេ" },
  { id: "circle", name: "Circle", km: "រង្វង់" },
  { id: "diamond", name: "Diamond", km: "ពេជ្រ" },
  { id: "star", name: "Star", km: "ផ្កាយ" },
  { id: "heart", name: "Heart", km: "បេះដូង" },
  { id: "leaf", name: "Leaf", km: "ស្លឹក" },
  { id: "hexagon", name: "Hexagon", km: "ឆកោន" },
  { id: "cross", name: "Cross", km: "ឈើឆ្កាង" },
  { id: "triangle", name: "Triangle", km: "ត្រីកោណ" },
  { id: "dash", name: "Dash", km: "ស្នាម" },
];

const EYE_SHAPES: { id: EyeShape; name: string; km: string }[] = [
  { id: "square", name: "Square", km: "ការេ" },
  { id: "rounded", name: "Rounded", km: "រាងមូល" },
  { id: "smooth", name: "Smooth", km: "រលោង" },
  { id: "circle", name: "Circle", km: "រង្វង់" },
  { id: "leaf", name: "Leaf", km: "ស្លឹក" },
  { id: "diamond", name: "Diamond", km: "ពេជ្រ" },
  { id: "hexagon", name: "Hexagon", km: "ឆកោន" },
  { id: "octagon", name: "Octagon", km: "ប្រាំបីកោណ" },
];

const SOCIAL_ICONS: { id: SocialIcon; name: string; km: string }[] = [
  { id: "none", name: "None", km: "គ្មាន" },
  { id: "gmaps", name: "Google Maps pin", km: "សញ្ញាផែនទី Google" },
  { id: "facebook", name: "Facebook", km: "ហ្វេសប៊ុក" },
  { id: "youtube", name: "YouTube", km: "យូធូប" },
  { id: "x", name: "X (Twitter)", km: "អ៊ិច (ធ្វីតធឺ)" },
  { id: "instagram", name: "Instagram", km: "អាំងស្តាក្រាម" },
  { id: "telegram", name: "Telegram", km: "តេឡេក្រាម" },
];

/** Google Maps pin silhouette, adapted from the Wikimedia Commons 2026 icon (red pin + white inner circle). */
const GMAPS_PIN_PATH =
  "M96,8c38.11,0,69,30.89,69,69,0,14.15-4.26,27.31-11.57,38.26-14.46,21.66-37.07,37.94-48.72,61.23l-1.54,3.07c-1.48,2.96-4.33,4.44-7.18,4.44-2.85,0-5.69-1.48-7.17-4.44l-1.54-3.07c-11.65-23.29-34.25-39.57-48.71-61.23-7.31-10.95-11.57-24.11-11.57-38.26,0-38.11,30.89-69,69-69Z";

const SOCIAL_PROFILES: { id: SocialPlatform; name: string; km: string; url: (handle: string) => string }[] = [
  { id: "facebook", name: "Facebook", km: "ហ្វេសប៊ុក", url: (h) => `https://www.facebook.com/${h}` },
  { id: "instagram", name: "Instagram", km: "អាំងស្តាក្រាម", url: (h) => `https://www.instagram.com/${h}` },
  { id: "x", name: "X (Twitter)", km: "អ៊ិច (ធ្វីតធឺ)", url: (h) => `https://x.com/${h}` },
  { id: "youtube", name: "YouTube", km: "យូធូប", url: (h) => `https://www.youtube.com/@${h}` },
  { id: "linkedin", name: "LinkedIn", km: "លីងគីន", url: (h) => `https://www.linkedin.com/in/${h}` },
  { id: "tiktok", name: "TikTok", km: "ទីគតុក", url: (h) => `https://www.tiktok.com/@${h}` },
  { id: "telegram", name: "Telegram", km: "តេឡេក្រាម", url: (h) => `https://t.me/${h}` },
  { id: "whatsapp", name: "WhatsApp", km: "វ៉ាត់សាប", url: (h) => `https://wa.me/${h}` },
  { id: "line", name: "LINE", km: "លីន", url: (h) => `https://line.me/ti/p/${h}` },
];

const SOCIAL_PATHS: Record<Exclude<SocialIcon, "none" | "gmaps">, { d: string; fill: string }> = {
  facebook: {
    d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    fill: "#1877F2",
  },
  youtube: {
    d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    fill: "#FF0000",
  },
  x: {
    d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    fill: "#0a0c0d",
  },
  instagram: {
    d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.88z",
    fill: "url(#ig-grad)",
  },
  telegram: {
    d: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.667 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    fill: "#26A5E4",
  },
};

const initial: State = {
  type: "text",
  text: "https://tmeta.me",
  wifiSsid: "",
  wifiPass: "",
  wifiEnc: "WPA",
  vName: "",
  vPhone: "",
  vEmail: "",
  vOrg: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  smsTo: "",
  smsBody: "",
  phone: "",
  locLat: "",
  locLng: "",
  googleReview: "",
  socialPlatform: "facebook",
  socialHandle: "",
  evTitle: "",
  evLocation: "",
  evStart: "",
  evEnd: "",
  evDesc: "",
  preset: "default",
  pixel: "square",
  eye: "square",
  social: "none",
  fg: PRESETS.default.fg,
  bg: PRESETS.default.bg,
  eyeOuter: PRESETS.default.eyeOuter,
  eyeInner: PRESETS.default.eyeInner,
  size: 360,
  level: "M",
  logo: null,
};

function escapeWifi(v: string) {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

function formatDateTime(d: string) {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString().replace(/-|:|\.\d\d\d/g, "");
}

/** Builds a real QR module matrix. Returns null when content can't be encoded. */
function buildMatrix(value: string, level: State["level"]): boolean[][] | null {
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    const qr = qrcode(0, level);
    qr.addData(value, "Byte");
    qr.make();
    const n = qr.getModuleCount();
    const m: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      m.push([]);
      for (let c = 0; c < n; c++) m[r].push(qr.isDark(r, c));
    }
    return m;
  } catch {
    return null;
  }
}

const fmt = (n: number) => Math.round(n * 1000) / 1000;

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, shape: PixelShape, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;

  switch (shape) {
    case "circle": ctx.arc(cx, cy, r * 0.9, 0, 2 * Math.PI); break;
    case "diamond": ctx.moveTo(cx, y); ctx.lineTo(x + w, cy); ctx.lineTo(cx, y + h); ctx.lineTo(x, cy); break;
    case "star":
      ctx.moveTo(cx, y); ctx.quadraticCurveTo(cx, cy, x + w, cy); ctx.quadraticCurveTo(cx, cy, cx, y + h);
      ctx.quadraticCurveTo(cx, cy, x, cy); ctx.quadraticCurveTo(cx, cy, cx, y); break;
    case "heart":
      ctx.moveTo(cx, y + h * 0.3); ctx.bezierCurveTo(cx, y, x, y, x, cy);
      ctx.bezierCurveTo(x, y + h * 0.8, cx, y + h, cx, y + h);
      ctx.bezierCurveTo(cx, y + h, x + w, y + h * 0.8, x + w, cy);
      ctx.bezierCurveTo(x + w, y, cx, y, cx, y + h * 0.3); break;
    case "leaf":
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w, y, x + w, cy);
      ctx.quadraticCurveTo(x + w, y + h, cx, y + h); ctx.quadraticCurveTo(x, y + h, x, cy);
      ctx.quadraticCurveTo(x, y, x, y); break;
    case "hexagon": {
      const a = w / 4; ctx.moveTo(x + a, y); ctx.lineTo(x + w - a, y); ctx.lineTo(x + w, cy);
      ctx.lineTo(x + w - a, y + h); ctx.lineTo(x + a, y + h); ctx.lineTo(x, cy); break;
    }
    case "cross": {
      const thickness = w / 3; ctx.rect(cx - thickness / 2, y + h * 0.1, thickness, h * 0.8);
      ctx.rect(x + w * 0.1, cy - thickness / 2, w * 0.8, thickness); break;
    }
    case "triangle":
      ctx.moveTo(cx, y + h * 0.1); ctx.lineTo(x + w * 0.9, y + h * 0.9); ctx.lineTo(x + w * 0.1, y + h * 0.9); break;
    case "dash": ctx.rect(x + w * 0.1, cy - h / 6, w * 0.8, h / 3); break;
    default: ctx.rect(x + w * 0.05, y + h * 0.05, w * 0.9, h * 0.9); break;
  }
  ctx.fill();
}

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, shape: EyeShape, colors: { outer: string; inner: string }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const outerR = w / 2;
  const innerR = w / 4;
  const thickness = w / 7;

  ctx.strokeStyle = colors.outer;
  ctx.lineWidth = thickness;
  ctx.lineJoin = "round";
  ctx.beginPath();
  switch (shape) {
    case "rounded": ctx.roundRect(x + thickness / 2, y + thickness / 2, w - thickness, h - thickness, w / 4); break;
    case "smooth": ctx.roundRect(x + thickness / 2, y + thickness / 2, w - thickness, h - thickness, w / 2); break;
    case "circle": ctx.arc(cx, cy, outerR - thickness / 2, 0, 2 * Math.PI); break;
    case "leaf":
      ctx.moveTo(cx, y + thickness / 2); ctx.quadraticCurveTo(x + w - thickness / 2, y + thickness / 2, x + w - thickness / 2, cy);
      ctx.lineTo(cx, y + h - thickness / 2); ctx.quadraticCurveTo(x + thickness / 2, y + h - thickness / 2, x + thickness / 2, cy); ctx.closePath(); break;
    case "diamond":
      ctx.moveTo(cx, y + thickness / 2); ctx.lineTo(x + w - thickness / 2, cy);
      ctx.lineTo(cx, y + h - thickness / 2); ctx.lineTo(x + thickness / 2, cy); ctx.closePath(); break;
    case "hexagon": drawPolygon(ctx, cx, cy, outerR - thickness / 2, 6, Math.PI / 2); ctx.closePath(); break;
    case "octagon": drawPolygon(ctx, cx, cy, outerR - thickness / 2, 8, Math.PI / 8); ctx.closePath(); break;
    default: ctx.rect(x + thickness / 2, y + thickness / 2, w - thickness, h - thickness); break;
  }
  ctx.stroke();

  ctx.fillStyle = colors.inner;
  ctx.beginPath();
  switch (shape) {
    case "rounded":
    case "smooth":
    case "circle": ctx.arc(cx, cy, innerR, 0, 2 * Math.PI); break;
    case "leaf":
      ctx.moveTo(cx, cy - innerR); ctx.quadraticCurveTo(cx + innerR, cy - innerR, cx + innerR, cy);
      ctx.lineTo(cx, cy + innerR); ctx.quadraticCurveTo(cx - innerR, cy + innerR, cx - innerR, cy); break;
    case "diamond":
      ctx.moveTo(cx, cy - innerR); ctx.lineTo(cx + innerR, cy);
      ctx.lineTo(cx, cy + innerR); ctx.lineTo(cx - innerR, cy); break;
    case "hexagon": drawPolygon(ctx, cx, cy, innerR, 6, Math.PI / 2); break;
    case "octagon": drawPolygon(ctx, cx, cy, innerR, 8, Math.PI / 8); break;
    default: ctx.rect(cx - innerR, cy - innerR, innerR * 2, innerR * 2); break;
  }
  ctx.fill();
}

function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, sides: number, rotation = 0) {
  ctx.moveTo(cx + radius * Math.cos(rotation), cy + radius * Math.sin(rotation));
  for (let i = 1; i <= sides; i++) {
    ctx.lineTo(cx + radius * Math.cos(rotation + (i * 2 * Math.PI) / sides), cy + radius * Math.sin(rotation + (i * 2 * Math.PI) / sides));
  }
}

function polyPoints(cx: number, cy: number, r: number, sides: number, rot = 0) {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides;
    pts.push(`${fmt(cx + r * Math.cos(a))},${fmt(cy + r * Math.sin(a))}`);
  }
  return pts.join(" ");
}

function pixelSvg(x: number, y: number, w: number, h: number, shape: PixelShape, color: string): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;
  switch (shape) {
    case "circle": return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r * 0.9)}" fill="${color}"/>`;
    case "diamond": return `<polygon points="${fmt(cx)},${fmt(y)} ${fmt(x + w)},${fmt(cy)} ${fmt(cx)},${fmt(y + h)} ${fmt(x)},${fmt(cy)}" fill="${color}"/>`;
    case "star": return `<path d="M ${fmt(cx)} ${fmt(y)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(x + w)} ${fmt(cy)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(cx)} ${fmt(y + h)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(x)} ${fmt(cy)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(cx)} ${fmt(y)} Z" fill="${color}"/>`;
    case "heart": return `<path d="M ${fmt(cx)} ${fmt(y + h * 0.3)} C ${fmt(cx)} ${fmt(y)} ${fmt(x)} ${fmt(y)} ${fmt(x)} ${fmt(cy)} C ${fmt(x)} ${fmt(y + h * 0.8)} ${fmt(cx)} ${fmt(y + h)} ${fmt(cx)} ${fmt(y + h)} C ${fmt(cx)} ${fmt(y + h)} ${fmt(x + w)} ${fmt(y + h * 0.8)} ${fmt(x + w)} ${fmt(cy)} C ${fmt(x + w)} ${fmt(y)} ${fmt(cx)} ${fmt(y)} ${fmt(cx)} ${fmt(y + h * 0.3)} Z" fill="${color}"/>`;
    case "leaf": return `<path d="M ${fmt(x)} ${fmt(y)} Q ${fmt(x + w)} ${fmt(y)} ${fmt(x + w)} ${fmt(cy)} Q ${fmt(x + w)} ${fmt(y + h)} ${fmt(cx)} ${fmt(y + h)} Q ${fmt(x)} ${fmt(y + h)} ${fmt(x)} ${fmt(cy)} Q ${fmt(x)} ${fmt(y)} ${fmt(x)} ${fmt(y)} Z" fill="${color}"/>`;
    case "hexagon": {
      const a = w / 4;
      return `<polygon points="${fmt(x + a)},${fmt(y)} ${fmt(x + w - a)},${fmt(y)} ${fmt(x + w)},${fmt(cy)} ${fmt(x + w - a)},${fmt(y + h)} ${fmt(x + a)},${fmt(y + h)} ${fmt(x)},${fmt(cy)}" fill="${color}"/>`;
    }
    case "cross": {
      const t = w / 3;
      return `<path d="M ${fmt(cx - t / 2)} ${fmt(y + h * 0.1)} h ${fmt(t)} v ${fmt(h * 0.8)} h ${fmt(-t)} Z M ${fmt(x + w * 0.1)} ${fmt(cy - t / 2)} h ${fmt(w * 0.8)} v ${fmt(t)} h ${fmt(-w * 0.8)} Z" fill="${color}"/>`;
    }
    case "triangle": return `<polygon points="${fmt(cx)},${fmt(y + h * 0.1)} ${fmt(x + w * 0.9)},${fmt(y + h * 0.9)} ${fmt(x + w * 0.1)},${fmt(y + h * 0.9)}" fill="${color}"/>`;
    case "dash": return `<rect x="${fmt(x + w * 0.1)}" y="${fmt(cy - h / 6)}" width="${fmt(w * 0.8)}" height="${fmt(h / 3)}" fill="${color}"/>`;
    default: return `<rect x="${fmt(x + w * 0.05)}" y="${fmt(y + h * 0.05)}" width="${fmt(w * 0.9)}" height="${fmt(h * 0.9)}" fill="${color}"/>`;
  }
}

function eyeSvg(x: number, y: number, w: number, h: number, shape: EyeShape, colors: { outer: string; inner: string }): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const outerR = w / 2;
  const innerR = w / 4;
  const thickness = w / 7;
  const stroke = `fill="none" stroke="${colors.outer}" stroke-width="${fmt(thickness)}"`;
  let outer: string;
  let inner: string;
  switch (shape) {
    case "rounded":
      outer = `<rect x="${fmt(x + thickness / 2)}" y="${fmt(y + thickness / 2)}" width="${fmt(w - thickness)}" height="${fmt(h - thickness)}" rx="${fmt(w / 4)}" ${stroke}/>`;
      inner = `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(innerR)}" fill="${colors.inner}"/>`;
      break;
    case "smooth":
      outer = `<rect x="${fmt(x + thickness / 2)}" y="${fmt(y + thickness / 2)}" width="${fmt(w - thickness)}" height="${fmt(h - thickness)}" rx="${fmt(w / 2)}" ${stroke}/>`;
      inner = `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(innerR)}" fill="${colors.inner}"/>`;
      break;
    case "circle":
      outer = `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(outerR - thickness / 2)}" ${stroke}/>`;
      inner = `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(innerR)}" fill="${colors.inner}"/>`;
      break;
    case "leaf":
      outer = `<path d="M ${fmt(cx)} ${fmt(y + thickness / 2)} Q ${fmt(x + w - thickness / 2)} ${fmt(y + thickness / 2)} ${fmt(x + w - thickness / 2)} ${fmt(cy)} L ${fmt(cx)} ${fmt(y + h - thickness / 2)} Q ${fmt(x + thickness / 2)} ${fmt(y + h - thickness / 2)} ${fmt(x + thickness / 2)} ${fmt(cy)} Z" ${stroke}/>`;
      inner = `<path d="M ${fmt(cx)} ${fmt(cy - innerR)} Q ${fmt(cx + innerR)} ${fmt(cy - innerR)} ${fmt(cx + innerR)} ${fmt(cy)} L ${fmt(cx)} ${fmt(cy + innerR)} Q ${fmt(cx - innerR)} ${fmt(cy + innerR)} ${fmt(cx - innerR)} ${fmt(cy)} Z" fill="${colors.inner}"/>`;
      break;
    case "diamond":
      outer = `<polygon points="${fmt(cx)},${fmt(y + thickness / 2)} ${fmt(x + w - thickness / 2)},${fmt(cy)} ${fmt(cx)},${fmt(y + h - thickness / 2)} ${fmt(x + thickness / 2)},${fmt(cy)}" ${stroke}/>`;
      inner = `<polygon points="${fmt(cx)},${fmt(cy - innerR)} ${fmt(cx + innerR)},${fmt(cy)} ${fmt(cx)},${fmt(cy + innerR)} ${fmt(cx - innerR)},${fmt(cy)}" fill="${colors.inner}"/>`;
      break;
    case "hexagon":
      outer = `<polygon points="${polyPoints(cx, cy, outerR - thickness / 2, 6, Math.PI / 2)}" ${stroke}/>`;
      inner = `<polygon points="${polyPoints(cx, cy, innerR, 6, Math.PI / 2)}" fill="${colors.inner}"/>`;
      break;
    case "octagon":
      outer = `<polygon points="${polyPoints(cx, cy, outerR - thickness / 2, 8, Math.PI / 8)}" ${stroke}/>`;
      inner = `<polygon points="${polyPoints(cx, cy, innerR, 8, Math.PI / 8)}" fill="${colors.inner}"/>`;
      break;
    default:
      outer = `<rect x="${fmt(x + thickness / 2)}" y="${fmt(y + thickness / 2)}" width="${fmt(w - thickness)}" height="${fmt(h - thickness)}" ${stroke}/>`;
      inner = `<rect x="${fmt(cx - innerR)}" y="${fmt(cy - innerR)}" width="${fmt(innerR * 2)}" height="${fmt(innerR * 2)}" fill="${colors.inner}"/>`;
      break;
  }
  return outer + inner;
}

interface RenderOpts {
  fg: string;
  bg: string;
  eyeOuter: string;
  eyeInner: string;
  pixel: PixelShape;
  eye: EyeShape;
  social: SocialIcon;
}

function centerLogoSize(matrix: boolean[][]): number {
  const n = matrix.length;
  return Math.max(3, Math.round(n * 0.18));
}

function renderCanvas(ctx: CanvasRenderingContext2D, px: number, matrix: boolean[][], opts: RenderOpts, logoImg: HTMLImageElement | null, gmapsImg: HTMLImageElement | null) {
  const n = matrix.length;
  const quiet = 4;
  const cell = px / (n + quiet * 2);
  const pad = quiet * cell;

  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, px, px);

  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hasCenter = opts.social !== "none" || !!logoImg;
  const centerHalf = hasCenter ? Math.floor(centerLogoSize(matrix) / 2) : 0;
  const centerMid = Math.floor(n / 2);
  const inCenter = (r: number, c: number) =>
    hasCenter && Math.abs(r - centerMid) <= centerHalf && Math.abs(c - centerMid) <= centerHalf;

  ctx.fillStyle = opts.fg;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (inEye(r, c) || inCenter(r, c) || !matrix[r][c]) continue;
      drawPixel(ctx, pad + c * cell, pad + r * cell, cell, cell, opts.pixel, opts.fg);
    }
  }

  const eyeSize = cell * 7;
  const eyeColors = { outer: opts.eyeOuter, inner: opts.eyeInner };
  drawEye(ctx, pad, pad, eyeSize, eyeSize, opts.eye, eyeColors);
  drawEye(ctx, pad + (n - 7) * cell, pad, eyeSize, eyeSize, opts.eye, eyeColors);
  drawEye(ctx, pad, pad + (n - 7) * cell, eyeSize, eyeSize, opts.eye, eyeColors);

  if (hasCenter) {
    const size = cell * centerLogoSize(matrix);
    const cx = px / 2;
    const cy = px / 2;

    const innerSize = size * 0.72;
    if (logoImg) {
      const scale = Math.min(innerSize / logoImg.naturalWidth, innerSize / logoImg.naturalHeight);
      const iw = logoImg.naturalWidth * scale;
      const ih = logoImg.naturalHeight * scale;
      ctx.drawImage(logoImg, cx - iw / 2, cy - ih / 2, iw, ih);
    } else if (opts.social !== "none") {
      if (opts.social === "gmaps") {
        if (gmapsImg) {
          const scale = Math.min(innerSize / gmapsImg.naturalWidth, innerSize / gmapsImg.naturalHeight);
          const iw = gmapsImg.naturalWidth * scale;
          const ih = gmapsImg.naturalHeight * scale;
          ctx.drawImage(gmapsImg, cx - iw / 2, cy - ih / 2, iw, ih);
        } else {
          // Fallback while the official icon loads: red gradient pin + white inner circle.
          const scale = innerSize / 192;
          ctx.save();
          ctx.translate(cx - innerSize / 2, cy - innerSize / 2);
          ctx.scale(scale, scale);
          const g = ctx.createLinearGradient(0, 8, 0, 148);
          g.addColorStop(0, "#ea4335");
          g.addColorStop(0.55, "#c5221f");
          g.addColorStop(1, "#a50e0e");
          ctx.fillStyle = g;
          ctx.fill(new Path2D(GMAPS_PIN_PATH));
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(96, 77, 30, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
      } else {
        const icon = SOCIAL_PATHS[opts.social];
        const scale = innerSize / 24;
        ctx.save();
        ctx.translate(cx - innerSize / 2, cy - innerSize / 2);
        ctx.scale(scale, scale);
        if (opts.social === "instagram") {
          const g = ctx.createLinearGradient(0, 24, 24, 0);
          g.addColorStop(0, "#f09433");
          g.addColorStop(0.3, "#e6683c");
          g.addColorStop(0.6, "#dc2743");
          g.addColorStop(1, "#bc1888");
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = icon.fill;
        }
        ctx.fill(new Path2D(icon.d));
        ctx.restore();
      }
    }
  }
}

function buildSvg(size: number, matrix: boolean[][], opts: RenderOpts, socialIcon: SocialIcon, logo: string | null, gmapsDataUrl: string | null): string {
  const n = matrix.length;
  const quiet = 4;
  const cell = size / (n + quiet * 2);
  const pad = quiet * cell;

  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`];
  if (socialIcon === "instagram") {
    parts.push('<defs><linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#f09433"/><stop offset="0.3" stop-color="#e6683c"/><stop offset="0.6" stop-color="#dc2743"/><stop offset="1" stop-color="#bc1888"/></linearGradient></defs>');
  }
  if (socialIcon === "gmaps" && !gmapsDataUrl) {
    parts.push('<defs><linearGradient id="gmaps-grad" x1="0" y1="8" x2="0" y2="148" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#ea4335"/><stop offset="0.55" stop-color="#c5221f"/><stop offset="1" stop-color="#a50e0e"/></linearGradient></defs>');
  }
  parts.push(`<rect width="${size}" height="${size}" fill="${opts.bg}"/>`);

  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hasCenter = opts.social !== "none" || !!logo;
  const centerHalf = hasCenter ? Math.floor(centerLogoSize(matrix) / 2) : 0;
  const centerMid = Math.floor(n / 2);
  const inCenter = (r: number, c: number) =>
    hasCenter && Math.abs(r - centerMid) <= centerHalf && Math.abs(c - centerMid) <= centerHalf;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (inEye(r, c) || inCenter(r, c) || !matrix[r][c]) continue;
      parts.push(pixelSvg(pad + c * cell, pad + r * cell, cell, cell, opts.pixel, opts.fg));
    }
  }

  const eyeSize = cell * 7;
  const eyeColors = { outer: opts.eyeOuter, inner: opts.eyeInner };
  parts.push(eyeSvg(pad, pad, eyeSize, eyeSize, opts.eye, eyeColors));
  parts.push(eyeSvg(pad + (n - 7) * cell, pad, eyeSize, eyeSize, opts.eye, eyeColors));
  parts.push(eyeSvg(pad, pad + (n - 7) * cell, eyeSize, eyeSize, opts.eye, eyeColors));

  if (hasCenter) {
    const logoSize = cell * centerLogoSize(matrix);
    const cx = size / 2;
    const cy = size / 2;
    const innerSize = logoSize * 0.72;
    if (logo) {
      parts.push(`<image href="${logo}" x="${fmt(cx - innerSize / 2)}" y="${fmt(cy - innerSize / 2)}" width="${fmt(innerSize)}" height="${fmt(innerSize)}" preserveAspectRatio="xMidYMid meet"/>`);
    } else if (socialIcon !== "none") {
      if (socialIcon === "gmaps") {
        if (gmapsDataUrl) {
          parts.push(`<image href="${gmapsDataUrl}" x="${fmt(cx - innerSize / 2)}" y="${fmt(cy - innerSize / 2)}" width="${fmt(innerSize)}" height="${fmt(innerSize)}" preserveAspectRatio="xMidYMid meet"/>`);
        } else {
          const scale = innerSize / 192;
          parts.push(`<g transform="translate(${fmt(cx - innerSize / 2)},${fmt(cy - innerSize / 2)}) scale(${fmt(scale)})"><path d="${GMAPS_PIN_PATH}" fill="url(#gmaps-grad)"/><circle cx="96" cy="77" r="30" fill="#ffffff"/></g>`);
        }
      } else {
        const icon = SOCIAL_PATHS[socialIcon];
        const scale = innerSize / 24;
        parts.push(`<g transform="translate(${fmt(cx - innerSize / 2)},${fmt(cy - innerSize / 2)}) scale(${fmt(scale)})"><path d="${icon.d}" fill="${icon.fill}"/></g>`);
      }
    }
  }

  parts.push("</svg>");
  return parts.join("");
}

function ShapePreview({ shape, color }: { shape: PixelShape; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    canvasRef.current.width = 40;
    canvasRef.current.height = 40;
    ctx.clearRect(0, 0, 40, 40);
    const size = 10;
    const padding = 5;
    drawPixel(ctx, padding, padding, size, size, shape, color);
    drawPixel(ctx, padding + size + 2, padding, size, size, shape, color);
    drawPixel(ctx, padding, padding + size + 2, size, size, shape, color);
    drawPixel(ctx, padding + size + 2, padding + size + 2, size, size, shape, color);
  }, [shape, color]);
  return <canvas ref={canvasRef} className="h-10 w-10" />;
}

function EyePreview({ shape, colorOuter, colorInner }: { shape: EyeShape; colorOuter: string; colorInner: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    canvasRef.current.width = 40;
    canvasRef.current.height = 40;
    ctx.clearRect(0, 0, 40, 40);
    drawEye(ctx, 4, 4, 32, 32, shape, { outer: colorOuter, inner: colorInner });
  }, [shape, colorOuter, colorInner]);
  return <canvas ref={canvasRef} className="h-10 w-10" />;
}

const DEFAULT_CENTER: [number, number] = [11.5564, 104.9282];

/** Interactive OpenStreetMap picker. Dynamically loads Leaflet only when shown. */
function LocationMap({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  const { text } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ map: unknown; marker: unknown } | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocError(true);
      return;
    }
    setLocBusy(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocBusy(false);
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        onChange(la.toFixed(6), ln.toFixed(6));
        const state = mapRef.current;
        if (state) {
          const map = state.map as import("leaflet").Map;
          const marker = state.marker as import("leaflet").Marker;
          marker.setLatLng([la, ln]);
          map.setView([la, ln], 16);
        }
      },
      () => {
        setLocBusy(false);
        setLocError(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;
    let marker: import("leaflet").Marker | null = null;
    let L: typeof import("leaflet");

    (async () => {
      const mod = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposed || !containerRef.current) return;
      L = mod;

      const la = parseFloat(lat);
      const ln = parseFloat(lng);
      const hasValid = Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
      const center: [number, number] = hasValid ? [la, ln] : DEFAULT_CENTER;

      map = L.map(containerRef.current, {
        center,
        zoom: hasValid ? 15 : 12,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:22px;height:22px;background:#d97706;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      marker = L.marker(center, { icon, draggable: true }).addTo(map);

      const applyPosition = (position: { lat: number; lng: number }) => {
        onChange(position.lat.toFixed(6), position.lng.toFixed(6));
      };

      map.on("click", (e) => {
        marker?.setLatLng(e.latlng);
        applyPosition(e.latlng);
      });
      marker.on("dragend", () => {
        const p = marker?.getLatLng();
        if (p) applyPosition(p);
      });

      mapRef.current = { map, marker };
      // Wait for the panel to lay out so the tile grid sizes correctly.
      setTimeout(() => map?.invalidateSize(), 60);
    })();

    return () => {
      disposed = true;
      const state = mapRef.current;
      if (state) {
        (state.map as import("leaflet").Map).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync when the coordinate fields change.
  useEffect(() => {
    const state = mapRef.current;
    if (!state) return;
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    if (Math.abs(la) > 90 || Math.abs(ln) > 180) return;
    const marker = state.marker as import("leaflet").Marker;
    marker.setLatLng([la, ln]);
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="h-72 w-full rounded-md border border-[var(--ground-line)]" />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locBusy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)] disabled:opacity-50"
        >
          {locBusy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Crosshair size={13} />
          )}
          {locBusy ? text("Locating…", "កំពុងរកទីតាំង…") : text("Use my location", "ប្រើទីតាំងរបស់ខ្ញុំ")}
        </button>
        {locError && (
          <span className="text-xs text-[var(--danger)]">
            {text("Location unavailable or permission denied.", "ទីតាំងមិនអាចប្រើបាន ឬត្រូវបានបដិសេធការអនុញ្ញាត។")}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {text("Click or drag the marker on the map to choose the coordinates.", "ចុច ឬអូសសញ្ញាសម្គាល់លើផែនទីដើម្បីជ្រើសរើសកូអរដោនេ។")}
      </p>
    </div>
  );
}

/** Best-effort conversion of a decoded QR payload into the generator's typed fields. */
function payloadToState(payload: string): Partial<State> {
  const raw = payload.trim();
  const lower = raw.toLowerCase();

  if (lower.startsWith("wifi:")) {
    // WIFI:T:WPA;S:ssid;P:pass;H:false;  — field order can vary, so parse by tag.
    const params = new Map<string, string>();
    for (const seg of raw.split(";")) {
      const m = seg.match(/^([TSPH]):(.*)$/s);
      if (m) params.set(m[1], m[2].replace(/\\([\\;,:"])/g, "$1"));
    }
    const enc = (params.get("T") ?? "WPA").toLowerCase();
    return {
      type: "wifi",
      wifiEnc: enc === "wep" ? "WEP" : enc === "nopass" ? "nopass" : "WPA",
      wifiSsid: params.get("S") ?? "",
      wifiPass: params.get("P") ?? "",
    };
  }

  if (/^BEGIN:VCARD/i.test(raw)) {
    const line = (k: string) => {
      const m = raw.match(new RegExp(`(?:^|\\n)${k}(?:;CHARSET=UTF-8)?:([^\\n]*)`, "i"));
      return m ? m[1].trim() : "";
    };
    return { type: "vcard", vName: line("FN"), vOrg: line("ORG"), vPhone: line("TEL"), vEmail: line("EMAIL") };
  }

  if (lower.startsWith("mailto:")) {
    const rest = raw.slice(7);
    const q = rest.indexOf("?");
    const to = q >= 0 ? rest.slice(0, q) : rest;
    const qs = new URLSearchParams(q >= 0 ? rest.slice(q + 1) : "");
    return { type: "email", emailTo: to, emailSubject: qs.get("subject") ?? "", emailBody: qs.get("body") ?? "" };
  }

  if (lower.startsWith("sms:")) {
    const rest = raw.slice(4);
    const q = rest.indexOf("?");
    const to = q >= 0 ? rest.slice(0, q) : rest;
    const qs = new URLSearchParams(q >= 0 ? rest.slice(q + 1) : "");
    return { type: "sms", smsTo: to, smsBody: qs.get("body") ?? "" };
  }

  if (lower.startsWith("tel:")) return { type: "phone", phone: raw.slice(4).trim() };

  if (lower.startsWith("geo:")) {
    const m = raw.slice(4).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) return { type: "location", locLat: m[1], locLng: m[2], social: "gmaps" };
  }

  // Fall back to raw text for plain links and anything else (vCard events, etc.).
  return { type: "text", text: raw };
}

export default function QrGenerator() {
  const { text } = useLanguage();
  const [saved, setSaved] = useToolState<Partial<State>>("qr-generator:v3", {});
  const s = useMemo<State>(() => ({ ...initial, ...saved }), [saved]);
  const update = (patch: Partial<State>) => setSaved((prev) => ({ ...initial, ...prev, ...patch }));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoImg, setLogoImg] = useState<{ src: string; img: HTMLImageElement } | null>(null);
  const [gmapsAsset, setGmapsAsset] = useState<{ img: HTMLImageElement; dataUrl: string } | null>(null);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<{ ok: boolean; en: string; km: string } | null>(null);
  const [decoded, setDecoded] = useState<string | null>(null);

  /** Decodes a QR from an image file and pre-fills the designer with its content. */
  async function redesignFromFile(file: File) {
    setScanBusy(true);
    setScanNote(null);
    setDecoded(null);
    setScanPreview(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      setScanPreview(dataUrl);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image load failed"));
        img.src = dataUrl;
      });
      // Downscale very large images so decoding stays fast and reliable.
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (!code?.data) {
        setScanNote({
          ok: false,
          en: "No QR code found in that image. Try a clearer, straight-on photo with the code fully in frame.",
          km: "រកមិនឃើញកូដ QR ក្នុងរូបភាពនោះទេ។ សូមសាកល្បងរូបភាពច្បាស់ និងត្រង់ ដោយកូដស្ថិតក្នុងស៊ុមទាំងស្រុង។",
        });
        return;
      }
      update(payloadToState(code.data));
      setDecoded(code.data);
      setScanNote({
        ok: true,
        en: "QR decoded — the content is now loaded below; customize the design and export.",
        km: "បានអានកូដ QR — ឥឡូវខ្លឹមសារត្រូវបានផ្ទុកខាងក្រោម អាចកែរចនា និងនាំចេញ។",
      });
    } catch {
      setScanNote({ ok: false, en: "Could not read that image.", km: "មិនអាចអានរូបភាពនោះបានទេ។" });
    } finally {
      setScanBusy(false);
    }
  }

  /** Reads an image from the system clipboard and runs it through the redesign flow. */
  async function redesignFromClipboard() {
    try {
      if (!navigator.clipboard?.read) {
        setScanNote({ ok: false, en: "Clipboard image reading is not supported in this browser.", km: "កម្មវិធីរុករកនេះមិនគាំទ្រការអានរូបភាពពីក្តារតម្បៀតខ្ទាស់ទេ។" });
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          await redesignFromFile(new File([blob], "clipboard-qr.png", { type: blob.type }));
          return;
        }
      }
      setScanNote({ ok: false, en: "No image found on the clipboard.", km: "រកមិនឃើញរូបភាពនៅលើក្តារតម្បៀតខ្ទាស់ទេ។" });
    } catch {
      setScanNote({ ok: false, en: "Could not read the clipboard.", km: "មិនអាចអានក្តារតម្បៀតខ្ទាស់បានទេ។" });
    }
  }

  const value = useMemo(() => {
    switch (s.type) {
      case "wifi":
        return `WIFI:T:${s.wifiEnc};S:${escapeWifi(s.wifiSsid)};${s.wifiEnc === "nopass" ? "" : `P:${escapeWifi(s.wifiPass)};`}H:false;;`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${s.vName}\nORG:${s.vOrg}\nTEL:${s.vPhone}\nEMAIL:${s.vEmail}\nEND:VCARD`;
      case "email":
        return `mailto:${s.emailTo}?subject=${encodeURIComponent(s.emailSubject)}&body=${encodeURIComponent(s.emailBody)}`;
      case "sms":
        return `sms:${s.smsTo}?body=${encodeURIComponent(s.smsBody)}`;
      case "phone":
        return `tel:${s.phone}`;
      case "location":
        return `geo:${s.locLat},${s.locLng}`;
      case "google": {
        const g = s.googleReview.trim();
        if (/^https?:\/\//i.test(g)) return g;
        if (!g) return "";
        return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(g)}`;
      }
      case "social": {
        const h = s.socialHandle.trim().replace(/^@+/, "");
        if (/^https?:\/\//i.test(h)) return h;
        if (!h) return "";
        const profile = SOCIAL_PROFILES.find((p) => p.id === s.socialPlatform);
        return profile ? profile.url(h) : "";
      }
      case "event":
        return `BEGIN:VEVENT\nSUMMARY:${s.evTitle}\nLOCATION:${s.evLocation}\nDTSTART:${formatDateTime(s.evStart)}\nDTEND:${formatDateTime(s.evEnd)}\nDESCRIPTION:${s.evDesc}\nEND:VEVENT`;
      default:
        return s.text;
    }
  }, [s]);

  const matrix = useMemo(() => (value ? buildMatrix(value, s.level) : null), [value, s.level]);

  const opts: RenderOpts = useMemo(
    () => ({ fg: s.fg, bg: s.bg, eyeOuter: s.eyeOuter, eyeInner: s.eyeInner, pixel: s.pixel, eye: s.eye, social: s.social }),
    [s.fg, s.bg, s.eyeOuter, s.eyeInner, s.pixel, s.eye, s.social]
  );

  const logoImage = useMemo(() => (logoImg && logoImg.src === s.logo ? logoImg.img : null), [logoImg, s.logo]);

  useEffect(() => {
    if (!s.logo) return;
    const src = s.logo;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLogoImg({ src, img });
    };
    img.onerror = () => {
      if (!cancelled) setLogoImg(null);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [s.logo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/google-maps-icon.png");
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("read failed"));
          reader.readAsDataURL(blob);
        });
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("image load failed"));
          img.src = dataUrl;
        });
        if (!cancelled) setGmapsAsset({ img, dataUrl });
      } catch {
        // keep the vector fallback if the icon can't load
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const px = Math.max(512, s.size * 2);
    canvas.width = px;
    canvas.height = px;
    if (matrix) {
      renderCanvas(ctx, px, matrix, opts, logoImage, gmapsAsset?.img ?? null);
    } else {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = "#94a3b8";
      ctx.font = `bold ${Math.round(px * 0.05)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text("Enter data", "បញ្ចូលទិន្នន័យ"), px / 2, px / 2);
    }
  }, [matrix, opts, logoImage, gmapsAsset, s.size, text]);

  function pickLogo(file: File) {
    setLogoBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      update({ logo: reader.result as string });
      setLogoBusy(false);
    };
    reader.onerror = () => setLogoBusy(false);
    reader.readAsDataURL(file);
  }

  function applyPreset(id: Preset) {
    const p = PRESETS[id];
    update({ preset: id, fg: p.fg, bg: p.bg, eyeOuter: p.eyeOuter, eyeInner: p.eyeInner });
  }

  async function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !matrix) return;
    const out = document.createElement("canvas");
    out.width = 2048;
    out.height = 2048;
    const octx = out.getContext("2d");
    if (!octx) return;
    renderCanvas(octx, 2048, matrix, opts, logoImage, gmapsAsset?.img ?? null);
    const dataUrl = await watermarkImageDataUrl(out.toDataURL("image/png"), "image/png", includeWatermark);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-code.png";
    a.click();
    recordExport();
  }

  function downloadSvg() {
    if (!matrix) return;
    const source = buildSvg(2048, matrix, opts, s.social, s.logo, gmapsAsset?.dataUrl ?? null);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
    recordExport();
  }

  const pickerClass =
    "flex cursor-pointer items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]";

  const chipBase = "flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition";

  return (
    <ToolShell
      title="QR Code Generator"
      khmerTitle="បង្កើតកូដ QR"
      description="Generate a scannable QR code for a link, Wi-Fi network, contact card, email, SMS, phone, location (pick it on a map), Google review, social profile, or event — styled locally with color presets, custom module and finder shapes, and a center logo, then export as high-resolution PNG or SVG. You can also upload an existing QR image to decode its content and redesign it."
      descriptionKm="បង្កើតកូដ QR ដែលអាចស្កេនបានសម្រាប់តំណ Wi-Fi កាតទំនាក់ទំនង អ៊ីមែល SMS ទូរស័ព្ទ ទីតាំង (ជ្រើសរើសលើផែនទី) ការពិនិត្យ Google ទម្រង់បណ្តាញសង្គម ឬព្រឹត្តិការណ៍ — រចនានៅលើឧបករណ៍ដោយមានពណ៌ប្រេសិត រាងម៉ូឌុល និងស៊ុមស្វែងរកផ្ទាល់ខ្លួន និងស្លាកកណ្តាល រួចនាំចេញជា PNG ឬ SVG គុណភាពខ្ពស់។ អ្នកក៏អាចផ្ទុករូបភាព QR ដែលមានស្រាប់ ដើម្បីអានខ្លឹមសារ និងរចនាឡើងវិញ។"
    >
      <div className="lg:grid lg:h-[calc(100dvh-13rem)] lg:min-h-[440px] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:overflow-hidden">
        <div className="space-y-5 lg:h-full lg:overflow-y-auto lg:pb-4 lg:pr-2">
          <section className="rounded-md border border-[var(--gold-dim)]/40 bg-[var(--ground-raised)] p-3">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
              <ScanLine size={14} />
              {text("Scan & redesign an existing QR", "ស្កេន និងរចនាឡើងវិញនូវ QR ដែលមានស្រាប់")}
            </div>
            <p className="mb-2 text-xs leading-relaxed text-[var(--ink-dim)]">
              {text("Upload a QR image (or paste one with Ctrl+V) to read its content and restyle it here — decoding happens locally, nothing leaves your device.", "ផ្ទុករូបភាព QR (ឬបិទភ្ជាប់ដោយ Ctrl+V) ដើម្បីអានខ្លឹមសារ ហើយរចនាឡើងវិញនៅទីនេះ — ការអានធ្វើនៅក្នុងឧបករណ៍ គ្មានអ្វីចាកចេញទេ។")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className={pickerClass}>
                {scanBusy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {scanBusy ? text("Reading…", "កំពុងអាន…") : text("Upload QR image", "ផ្ទុករូបភាព QR")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void redesignFromFile(f); }} />
              </label>
              <button type="button" className={pickerClass} onClick={() => void redesignFromClipboard()}>
                <ClipboardPaste size={14} />
                {text("Paste image (Ctrl+V)", "បិទភ្ជាប់រូបភាព (Ctrl+V)")}
              </button>
            </div>
            {scanPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scanPreview} alt={text("Uploaded QR image", "រូបភាព QR ដែលបានផ្ទុក")} className="mt-2 max-h-40 rounded-md border border-[var(--ground-line)] object-contain" />
            )}
            {scanNote && (
              <p className={`mt-2 text-xs leading-relaxed ${scanNote.ok ? "text-[var(--teal)]" : "text-[var(--danger)]"}`}>{text(scanNote.en, scanNote.km)}</p>
            )}
            {decoded && (
              <div className="mt-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{text("Decoded content", "ខ្លឹមសារដែលបានអាន")}</span>
                  <CopyButton text={decoded} compact />
                </div>
                <p className="mt-1 break-all font-mono-ui text-xs leading-relaxed text-[var(--ink)]">{decoded}</p>
              </div>
            )}
          </section>

          <Field label="Content type">
            <Select
              value={s.type}
              onChange={(e) => {
                const next = e.target.value as QrType;
                if (next === "location" && s.social === "none") {
                  update({ type: next, social: "gmaps" });
                } else {
                  update({ type: next });
                }
              }}
            >
              <option value="text">{text("URL / Plain text", "តំណ / អត្ថបទ")}</option>
              <option value="wifi">{text("Wi-Fi network", "បណ្តាញ Wi-Fi")}</option>
              <option value="vcard">{text("Contact card (vCard)", "កាតទំនាក់ទំនង (vCard)")}</option>
              <option value="email">{text("Email", "អ៊ីមែល")}</option>
              <option value="sms">SMS</option>
              <option value="phone">{text("Phone number", "លេខទូរស័ព្ទ")}</option>
              <option value="location">{text("Location (GPS)", "ទីតាំង (GPS)")}</option>
              <option value="google">{text("Google review", "ការពិនិត្យ Google")}</option>
              <option value="social">{text("Social profile", "ទម្រង់បណ្តាញសង្គម")}</option>
              <option value="event">{text("Event (calendar)", "ព្រឹត្តិការណ៍ (ប្រតិទិន)")}</option>
            </Select>
          </Field>

          {s.type === "text" && (
            <Field label="Content"><TextArea value={s.text} onChange={(e) => update({ text: e.target.value })} placeholder="https://…" rows={3} /></Field>
          )}

          {s.type === "wifi" && (
            <>
              <Row>
                <Field label="Network name (SSID)"><TextInput value={s.wifiSsid} onChange={(e) => update({ wifiSsid: e.target.value })} /></Field>
                <Field label="Security">
                  <Select value={s.wifiEnc} onChange={(e) => update({ wifiEnc: e.target.value as State["wifiEnc"] })}>
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">{text("Open (no password)", "បើក (គ្មានលេខសម្ងាត់)")}</option>
                  </Select>
                </Field>
              </Row>
              {s.wifiEnc !== "nopass" && <Field label="Password"><TextInput value={s.wifiPass} onChange={(e) => update({ wifiPass: e.target.value })} /></Field>}
            </>
          )}

          {s.type === "vcard" && (
            <>
              <Row>
                <Field label="Full name"><TextInput value={s.vName} onChange={(e) => update({ vName: e.target.value })} /></Field>
                <Field label="Organization"><TextInput value={s.vOrg} onChange={(e) => update({ vOrg: e.target.value })} /></Field>
              </Row>
              <Row>
                <Field label="Phone"><TextInput value={s.vPhone} onChange={(e) => update({ vPhone: e.target.value })} /></Field>
                <Field label="Email"><TextInput value={s.vEmail} onChange={(e) => update({ vEmail: e.target.value })} /></Field>
              </Row>
            </>
          )}

          {s.type === "email" && (
            <>
              <Field label="To"><TextInput value={s.emailTo} onChange={(e) => update({ emailTo: e.target.value })} /></Field>
              <Row>
                <Field label="Subject"><TextInput value={s.emailSubject} onChange={(e) => update({ emailSubject: e.target.value })} /></Field>
                <Field label="Body"><TextArea value={s.emailBody} onChange={(e) => update({ emailBody: e.target.value })} rows={2} /></Field>
              </Row>
            </>
          )}

          {s.type === "sms" && (
            <Row>
              <Field label="To (phone number)"><TextInput value={s.smsTo} onChange={(e) => update({ smsTo: e.target.value })} /></Field>
              <Field label="Message"><TextArea value={s.smsBody} onChange={(e) => update({ smsBody: e.target.value })} rows={2} /></Field>
            </Row>
          )}

          {s.type === "phone" && (
            <Field label="Phone number"><TextInput value={s.phone} onChange={(e) => update({ phone: e.target.value })} /></Field>
          )}

          {s.type === "location" && (
            <>
              <LocationMap lat={s.locLat} lng={s.locLng} onChange={(la, ln) => update({ locLat: la, locLng: ln })} />
              <Row>
                <Field label="Latitude"><TextInput value={s.locLat} onChange={(e) => update({ locLat: e.target.value })} placeholder="11.5564" /></Field>
                <Field label="Longitude"><TextInput value={s.locLng} onChange={(e) => update({ locLng: e.target.value })} placeholder="104.9282" /></Field>
              </Row>
            </>
          )}

          {s.type === "google" && (
            <Field label="Google review link or Place ID" hint={text("Paste the write-a-review link from your Google Business profile, or just the Place ID.", "បិទភ្ជាប់តំណដាក់ពិនិត្យឡើងវិញពីទម្រង់ Google Business របស់អ្នក ឬត្រឹមតែ Place ID។")}>
              <TextArea value={s.googleReview} onChange={(e) => update({ googleReview: e.target.value })} placeholder="https://search.google.com/local/writereview?placeid=…" rows={2} />
            </Field>
          )}

          {s.type === "social" && (
            <>
              <Field label="Platform">
                <Select value={s.socialPlatform} onChange={(e) => update({ socialPlatform: e.target.value as SocialPlatform })}>
                  {SOCIAL_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>{text(p.name, p.km)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Username or link" hint={text("Handle without @, or paste a full profile URL.", "ឈ្មោះដោយគ្មាន @ ឬបិទភ្ជាប់ URL ទំព័រទម្រង់។")}>
                <TextInput value={s.socialHandle} onChange={(e) => update({ socialHandle: e.target.value })} placeholder="yourname" />
              </Field>
            </>
          )}

          {s.type === "event" && (
            <>
              <Field label="Event title"><TextInput value={s.evTitle} onChange={(e) => update({ evTitle: e.target.value })} /></Field>
              <Field label="Location"><TextInput value={s.evLocation} onChange={(e) => update({ evLocation: e.target.value })} /></Field>
              <Row>
                <Field label="Start"><TextInput type="datetime-local" value={s.evStart} onChange={(e) => update({ evStart: e.target.value })} /></Field>
                <Field label="End"><TextInput type="datetime-local" value={s.evEnd} onChange={(e) => update({ evEnd: e.target.value })} /></Field>
              </Row>
              <Field label="Description"><TextArea value={s.evDesc} onChange={(e) => update({ evDesc: e.target.value })} rows={2} /></Field>
            </>
          )}

          <Row>
            <Field label="Foreground color">
              <div className="flex items-center gap-2">
                <input type="color" value={s.fg} onChange={(e) => update({ fg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
                <TextInput value={s.fg} onChange={(e) => update({ fg: e.target.value })} />
              </div>
            </Field>
            <Field label="Background color">
              <div className="flex items-center gap-2">
                <input type="color" value={s.bg} onChange={(e) => update({ bg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
                <TextInput value={s.bg} onChange={(e) => update({ bg: e.target.value })} />
              </div>
            </Field>
          </Row>

          <Row>
            <Field label="Finder outer color">
              <div className="flex items-center gap-2">
                <input type="color" value={s.eyeOuter} onChange={(e) => update({ eyeOuter: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
                <TextInput value={s.eyeOuter} onChange={(e) => update({ eyeOuter: e.target.value })} />
              </div>
            </Field>
            <Field label="Finder inner color">
              <div className="flex items-center gap-2">
                <input type="color" value={s.eyeInner} onChange={(e) => update({ eyeInner: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
                <TextInput value={s.eyeInner} onChange={(e) => update({ eyeInner: e.target.value })} />
              </div>
            </Field>
          </Row>

          <Field label="Style presets">
            <div className="flex flex-wrap gap-2">
              {PRESET_LIST.map((p) => {
                const c = PRESETS[p.id];
                const active = s.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={`${chipBase} ${active ? "border-[var(--gold-dim)] bg-[var(--ground-raised-hi)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}
                  >
                    <span className="h-3.5 w-3.5 rounded-sm border border-black/10" style={{ background: c.fg }} />
                    {text(p.name, p.km)}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Module shape" hint={text("Shapes can reduce scan reliability; keep High error correction for print.", "រាងអាចបន្ថយភាពជឿជាក់នៃការស្កេន សូមរក្សាការកែកំហុសកម្រិតខ្ពស់សម្រាប់បោះពុម្ព។")}>
            <div className="flex flex-wrap gap-2">
              {PIXEL_SHAPES.map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => update({ pixel: sh.id })}
                  title={text(sh.name, sh.km)}
                  className={`${chipBase} flex-col gap-1 ${s.pixel === sh.id ? "border-[var(--gold-dim)] bg-[var(--ground-raised-hi)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}
                >
                  <ShapePreview shape={sh.id} color={s.pixel === sh.id ? s.fg : "#94a3b8"} />
                  <span className="text-[10px] uppercase tracking-wide">{text(sh.name, sh.km)}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Finder (eye) shape">
            <div className="flex flex-wrap gap-2">
              {EYE_SHAPES.map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => update({ eye: sh.id })}
                  title={text(sh.name, sh.km)}
                  className={`${chipBase} flex-col gap-1 ${s.eye === sh.id ? "border-[var(--gold-dim)] bg-[var(--ground-raised-hi)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}
                >
                  <EyePreview shape={sh.id} colorOuter={s.eye === sh.id ? s.eyeOuter : "#94a3b8"} colorInner={s.eye === sh.id ? s.eyeInner : "#94a3b8"} />
                  <span className="text-[10px] uppercase tracking-wide">{text(sh.name, sh.km)}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Center badge">
            <div className="flex flex-wrap items-center gap-2">
              {SOCIAL_ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => update({ social: ic.id })}
                  className={`${chipBase} ${s.social === ic.id ? "border-[var(--gold-dim)] bg-[var(--ground-raised-hi)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}
                >
                  {text(ic.name, ic.km)}
                </button>
              ))}
              <span className="text-xs text-[var(--ink-faint)]">{text("or upload your own:", "ឬផ្ទុករូបភាពផ្ទាល់ខ្លួន៖")}</span>
              <label className={pickerClass}>
                <ImagePlus size={14} />
                {logoBusy ? text("Loading…", "កំពុងផ្ទុក…") : s.logo ? text("Replace logo", "ប្តូរស្លាក") : text("Upload logo", "ផ្ទុកស្លាក")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); }} />
              </label>
              {s.logo && (
                <button type="button" onClick={() => update({ logo: null })} className={`${chipBase} border-[var(--ground-line)] text-[var(--ink-faint)] hover:text-[var(--danger)]`}>
                  {text("Remove", "ដកចេញ")}
                </button>
              )}
            </div>
          </Field>

          <Row>
            <Field label="Size (px)" hint={`${s.size}px`}>
              <input type="range" min={200} max={800} step={10} value={s.size} onChange={(e) => update({ size: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Error correction" hint={s.logo || s.social !== "none" ? text("use High with a badge", "ប្រើកម្រិតខ្ពស់ពេលមានស្លាក") : undefined}>
              <Select value={s.level} onChange={(e) => update({ level: e.target.value as State["level"] })}>
                <option value="L">{text("Low (7%)", "ទាប (7%)")}</option>
                <option value="M">{text("Medium (15%)", "មធ្យម (15%)")}</option>
                <option value="Q">{text("Quartile (25%)", "¼ (25%)")}</option>
                <option value="H">{text("High (30%)", "ខ្ពស់ (30%)")}</option>
              </Select>
            </Field>
          </Row>

          {!matrix && value && (
            <Output label={text("Error", "កំហុស")} value={text("Content is too long to fit in a QR code. Shorten the text or use less error correction.", "ខ្លឹមសារវែងពេកមិនអាចដាក់ក្នុងកូដ QR បានទេ។ សូមកាត់អត្ថបទ ឬប្រើការកែកំហុសតិចជាងនេះ។")} error mono={false} />
          )}
        </div>

        <div className="mt-5 space-y-4 lg:mt-0 lg:flex lg:h-full lg:flex-col lg:overflow-y-auto">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-[var(--ground-line)] p-4" style={{ background: s.bg }}>
            <canvas
              ref={canvasRef}
              className="aspect-square w-full rounded-sm"
              style={{ maxWidth: s.size, maxHeight: "100%" }}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadPng}><Download size={13} className="mr-1.5 inline" />{text("PNG (high-res)", "PNG (គុណភាពខ្ពស់)")}</Button>
            <Button onClick={downloadSvg} className="!bg-[var(--ground-raised)] !text-[var(--ink)] border border-[var(--ground-line)] hover:!bg-[var(--ground-raised-hi)]">
              <Download size={13} className="mr-1.5 inline" />SVG
            </Button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-dim)]">
            <input
              type="checkbox"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--gold)]"
            />
            {text("Include 123tool.app watermark", "បញ្ចូល watermark 123tool.app")}
          </label>
        </div>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {text("QR scanning powered by jsQR (MIT) — github.com/cozmo/jsQR. QR generation by qrcode-generator (MIT).", "ការអាន QR ដោយប្រើ jsQR (MIT) — github.com/cozmo/jsQR។ ការបង្កើត QR ដោយ qrcode-generator (MIT)។")}
      </p>
    </ToolShell>
  );
}
