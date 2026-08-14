"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Download, Smartphone, Laptop, Tablet, Watch, Monitor,
  Image as ImageIcon, X, Check, Sun, Moon, Sparkles, Copy,
  ZoomIn, ZoomOut, Maximize2, Grid, Wand2,
  Type, LayoutGrid, RotateCw,
  Sparkle, Palette, Flame, Box,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

/* ---------------------------------------------------------
   Stock Wallpaper Presets
--------------------------------------------------------- */
const SCREEN_PRESETS = [
  { id: "dashboard", label: "ផ្ទាំងវិភាគ SaaS", icon: "📊" },
  { id: "ios18", label: "iOS 18 Mesh", icon: "🌌" },
  { id: "sequoia", label: "macOS Sequoia", icon: "🏔️" },
  { id: "finance", label: "កាបូបលុយ Crypto", icon: "💳" },
  { id: "code", label: "VS Code Dark", icon: "⚡" },
  { id: "rings", label: "កង់កាយសម្ពន្ធ", icon: "⭕" },
];

/* ---------------------------------------------------------
   Device Hardware Specifications
--------------------------------------------------------- */
const DEVICE_GROUPS = [
  { id: "all", label: "ឧបករណ៍ទាំងអស់" },
  { id: "iphone", label: "iPhone" },
  { id: "mac", label: "Mac & iMac" },
  { id: "ipad", label: "iPad" },
  { id: "watch", label: "Apple Watch" }
];

const DEVICES = [
  // --- IPHONE SERIES ---
  {
    id: "17pm",
    label: "iPhone 17 Pro Max",
    group: "iphone",
    type: "phone",
    resW: 1320, resH: 2868,
    bezelRatio: 0.038, outerRadiusRatio: 0.185, screenRadiusRatio: 0.155,
    islandWRatio: 0.28, islandHRatio: 0.032,
    material: "ទីតាញ៉ូម Forged",
    cameraControl: true,
    colors: [
      { name: "ទឹកក្រូច Cosmic", hex: "#C86A34", dark: "#8f4a22" },
      { name: "ខៀវចាស់", hex: "#33465A", dark: "#212e3c" },
      { name: "ប្រាក់ទីតាញ៉ូម", hex: "#D8D7D2", dark: "#a8a7a2" },
      { name: "ខ្មៅ Space Black", hex: "#2B2B2C", dark: "#181819" },
    ],
  },
  {
    id: "17p",
    label: "iPhone 17 Pro",
    group: "iphone",
    type: "phone",
    resW: 1206, resH: 2622,
    bezelRatio: 0.040, outerRadiusRatio: 0.185, screenRadiusRatio: 0.155,
    islandWRatio: 0.30, islandHRatio: 0.033,
    material: "ទីតាញ៉ូម Forged",
    cameraControl: true,
    colors: [
      { name: "ទឹកក្រូច Cosmic", hex: "#C86A34", dark: "#8f4a22" },
      { name: "ខៀវចាស់", hex: "#33465A", dark: "#212e3c" },
      { name: "ប្រាក់ទីតាញ៉ូម", hex: "#D8D7D2", dark: "#a8a7a2" },
      { name: "ខ្មៅ Space Black", hex: "#2B2B2C", dark: "#181819" },
    ],
  },
  {
    id: "17",
    label: "iPhone 17",
    group: "iphone",
    type: "phone",
    resW: 1206, resH: 2622,
    bezelRatio: 0.044, outerRadiusRatio: 0.18, screenRadiusRatio: 0.15,
    islandWRatio: 0.30, islandHRatio: 0.033,
    material: "អាលុយមីញ៉ូម Aerospace",
    cameraControl: true,
    colors: [
      { name: "ស្វាយ Lavender", hex: "#CFC9DE", dark: "#a49dc0" },
      { name: "ខៀវ Mist Blue", hex: "#AFC2D0", dark: "#8299ab" },
      { name: "បៃតង Sage", hex: "#AEB79A", dark: "#88926f" },
      { name: "ស", hex: "#F2F1EC", dark: "#c7c6c1" },
      { name: "ខ្មៅ", hex: "#232326", dark: "#141416" },
    ],
  },
  {
    id: "16pm",
    label: "iPhone 16 Pro Max",
    group: "iphone",
    type: "phone",
    resW: 1320, resH: 2868,
    bezelRatio: 0.038, outerRadiusRatio: 0.185, screenRadiusRatio: 0.155,
    islandWRatio: 0.28, islandHRatio: 0.032,
    material: "ទីតាញ៉ូម Grade 5",
    cameraControl: true,
    colors: [
      { name: "ទីតាញ៉ូមធម្មជាតិ", hex: "#8E887C", dark: "#6c675e" },
      { name: "ទីតាញ៉ូមវាលខ្សាច់", hex: "#BAA07E", dark: "#8f7a5f" },
      { name: "ទីតាញ៉ូមខ្មៅ", hex: "#3B3B3C", dark: "#232324" },
      { name: "ទីតាញ៉ូមស", hex: "#EDEAE1", dark: "#c2bfb7" },
    ],
  },

  // --- MAC & IMAC ---
  {
    id: "imac24",
    label: "iMac 24\" M4",
    group: "mac",
    type: "desktop",
    resW: 2240, resH: 1260,
    bezelRatio: 0.022,
    chinRatio: 0.20,
    material: "អាលុយមីញ៉ូម Anodized",
    colors: [
      { name: "ខៀវប៉ាស៊ីហ្វិក", hex: "#4D7FA9", chinHex: "#7BAFD4", dark: "#2C5274" },
      { name: "បៃតងព្រៃ", hex: "#417960", chinHex: "#6BA288", dark: "#254D3B" },
      { name: "ផ្កាឈូក", hex: "#B24F65", chinHex: "#E07C91", dark: "#7E2A3C" },
      { name: "ប្រាក់", hex: "#C5C8CD", chinHex: "#E2E5EA", dark: "#8B8E93" },
      { name: "លឿង Solar", hex: "#D99B26", chinHex: "#F2C355", dark: "#926510" },
      { name: "ទឹកក្រូចថ្ងៃលិច", hex: "#CF6030", chinHex: "#E88B59", dark: "#8C3814" },
      { name: "ស្វាយចាស់", hex: "#6B5B95", chinHex: "#9180BA", dark: "#413660" },
    ],
  },
  {
    id: "mbp16",
    label: "MacBook Pro 16\" M4",
    group: "mac",
    type: "laptop",
    resW: 1728, resH: 1117,
    bezelRatio: 0.022,
    notchWRatio: 0.10, notchHRatio: 0.028,
    baseHeightRatio: 0.065,
    material: "អាលុយមីញ៉ូមច្នៃឡើងវិញ",
    colors: [
      { name: "ខ្មៅ Space Black", hex: "#2D2E32", dark: "#18181B" },
      { name: "ប្រាក់", hex: "#E1E2E6", dark: "#A2A4A8" },
    ],
  },
  {
    id: "mba15",
    label: "MacBook Air 15\" M3",
    group: "mac",
    type: "laptop",
    resW: 1440, resH: 932,
    bezelRatio: 0.025,
    notchWRatio: 0.11, notchHRatio: 0.030,
    baseHeightRatio: 0.058,
    material: "អាលុយមីញ៉ូមស្ដើងខ្លាំង",
    colors: [
      { name: "Midnight ខ្មៅ", hex: "#1F2633", dark: "#10141C" },
      { name: "Starlight", hex: "#E3DAC9", dark: "#A89F8E" },
      { name: "ប្រផេះ Space Gray", hex: "#55575E", dark: "#323338" },
      { name: "ប្រាក់", hex: "#E2E3E7", dark: "#A5A7AC" },
    ],
  },

  // --- IPAD ---
  {
    id: "ipadpro13",
    label: "iPad Pro 13\" M4",
    group: "ipad",
    type: "tablet",
    resW: 2064, resH: 2752,
    bezelRatio: 0.042, outerRadiusRatio: 0.07, screenRadiusRatio: 0.045,
    material: "អាលុយមីញ៉ូមស្ដើងខ្លាំង",
    colors: [
      { name: "ខ្មៅ Space Black", hex: "#29292B", dark: "#161617" },
      { name: "ប្រាក់", hex: "#E1E2E5", dark: "#A4A5A8" },
    ],
  },

  // --- APPLE WATCH ---
  {
    id: "watch10",
    label: "Apple Watch Series 10",
    group: "watch",
    type: "watch",
    resW: 832, resH: 992,
    bezelRatio: 0.045, outerRadiusRatio: 0.38, screenRadiusRatio: 0.33,
    material: "អាលុយមីញ៉ូមរលោង",
    colors: [
      { name: "ខ្មៅ Jet Black", hex: "#18181A", dark: "#0A0A0B" },
      { name: "មាសផ្កាឈូក", hex: "#E0B3A2", dark: "#9E7262" },
      { name: "ប្រាក់", hex: "#DCDDE1", dark: "#98999E" },
    ],
  },
  {
    id: "watchultra2",
    label: "Apple Watch Ultra 2",
    group: "watch",
    type: "watch",
    resW: 820, resH: 1004,
    bezelRatio: 0.075, outerRadiusRatio: 0.32, screenRadiusRatio: 0.25,
    material: "ទីតាញ៉ូម Aerospace",
    colors: [
      { name: "ទីតាញ៉ូមធម្មជាតិ", hex: "#A49F96", accentHex: "#FF5500", dark: "#69655F" },
      { name: "ទីតាញ៉ូមខ្មៅ", hex: "#2E2F32", accentHex: "#FF5500", dark: "#171719" },
    ],
  },
];

const BACKDROPS = [
  { id: "none", label: "គ្មានផ្ទៃខាងក្រោយ (ថ្លា)", type: "transparent" },
  { id: "studio-light", label: "ពន្លឺស្ទូឌីយូ", type: "gradient", stops: ["#FFFFFF", "#F8FAFC", "#F1F5F9"] },
  { id: "warm-sand", label: "ខ្សាច់ក្តៅឧណ្ហៗ", type: "gradient", stops: ["#FAF8F5", "#F3EFEA", "#E5DEC9"] },
  { id: "mesh-blobs", label: "ពន្លឺ Aura Mesh", type: "mesh" },
  { id: "sunset-glow", label: "ថ្ងៃលិច Glowing", type: "gradient", stops: ["#FFF7ED", "#FFEDD5", "#FED7AA"] },
  { id: "mint-breeze", label: "ខ្យល់បក Mint", type: "gradient", stops: ["#F0FDF4", "#DCFCE7", "#A7F3D0"] },
  { id: "lavender-sky", label: "មេឃស្វាយ Lavender", type: "gradient", stops: ["#FAF5FF", "#F3E8FF", "#DDD6FE"] },
  { id: "cyber-neon", label: "ងងឹត Cyber Dark", type: "gradient", stops: ["#090D16", "#111827", "#1F2937"] },
  { id: "ocean-deep", label: "សមុទ្រជ្រៅ Ocean", type: "gradient", stops: ["#0F172A", "#1E3A8A", "#2563EB"] },
  { id: "studio-dark", label: "ស្ទូឌីយូងងឹត", type: "solid", value: "#0F1117" },
];

// Expanded BG Color Swatches Palette
const EXPANDED_BG_COLORS = [
  { label: "សបរិសុទ្ធ (White)", hex: "#FFFFFF" },
  { label: "ប្រផេះស្រាល (Light Gray)", hex: "#F1F5F9" },
  { label: "ប្រផេះ Soft Slate", hex: "#94A3B8" },
  { label: "ប្រផេះចាស់ (Slate)", hex: "#334155" },
  { label: "ខ្មៅងងឹត (Pure Black)", hex: "#000000" },
  { label: "ក្រហម Crimson", hex: "#EF4444" },
  { label: "ទឹកក្រូច Orange", hex: "#F97316" },
  { label: "លឿងទុំ Amber", hex: "#F59E0B" },
  { label: "បៃតង Emerald", hex: "#10B981" },
  { label: "ខៀវស្រាល Teal", hex: "#14B8A6" },
  { label: "ខៀវមេឃ Sky Blue", hex: "#06B6D4" },
  { label: "ខៀវរាជវង្ស Royal Blue", hex: "#2563EB" },
  { label: "ស្វាយ Indigo", hex: "#6366F1" },
  { label: "ស្វាយចាស់ Violet", hex: "#8B5CF6" },
  { label: "ផ្កាឈូកស្រស់ Pink", hex: "#EC4899" },
  { label: "កុលាប Rose", hex: "#F43F5E" },
  { label: "គ្រើម Beige", hex: "#F5EBE0" },
  { label: "បៃតងអូលីវ Olive", hex: "#556B2F" },
  { label: "ខ្មៅធ្យូង Charcoal", hex: "#1E1E24" },
];

const ASPECT_RATIOS = [
  { id: "auto", label: "តម្រូវស្វ័យប្រវត្តិ", ratio: null },
  { id: "1:1", label: "1:1 ការ៉េ (Square)", ratio: 1 },
  { id: "4:3", label: "4:3 Dribbble", ratio: 4 / 3 },
  { id: "16:9", label: "16:9 បដា (Banner)", ratio: 16 / 9 },
  { id: "9:16", label: "9:16 Story/Reels", ratio: 9 / 16 },
  { id: "3:2", label: "3:2 អត្ថបទ", ratio: 3 / 2 },
];

const FONT_FAMILIES = [
  { id: "Plus Jakarta Sans", label: "Plus Jakarta" },
  { id: "Inter", label: "Inter" },
  { id: "Space Grotesk", label: "Space Grotesk" },
  { id: "Playfair Display", label: "Playfair Serif" },
  { id: "JetBrains Mono", label: "Monospace" },
];

const STUDIO_TEMPLATES = [
  {
    id: "appstore",
    label: "បដា App Store",
    desc: "បដាបញ្ឈរ 9:16 សម្រាប់រូបភាព App Store iOS",
    deviceId: "17pm",
    backdropId: "studio-light",
    aspectRatioId: "9:16",
    showTextOverlay: true,
    badgeText: "ការចេញផ្សាយថ្មី v3.0",
    headlineText: "លើកកម្ពស់កម្មវិធីទូរស័ព្ទរបស់អ្នក",
    subtitleText: "រចនាឡើងសម្រាប់ល្បឿនលឿន និងបទពិសោធន៍ iOS ដ៏រលូន។",
    showCtaBadge: true,
    showReflection: true,
    pitch3D: 0, yaw3D: 0, roll3D: 0,
  },
  {
    id: "dribbble",
    label: "សម្តែងលើ Dribbble",
    desc: "ផ្ទាំងរូបភាព 4:3 ជាមួយពន្លឺ Aura ដ៏ទាក់ទាញ",
    deviceId: "mbp16",
    backdropId: "mesh-blobs",
    aspectRatioId: "4:3",
    showTextOverlay: false,
    showReflection: true,
    pitch3D: -5, yaw3D: 8, roll3D: -2,
  },
  {
    id: "producthunt",
    label: "ការសម្ពោធ Product Hunt",
    desc: "បដាសម្ពោធផលិតផលជាមួយផ្លាកសញ្ញា CTA",
    deviceId: "17pm",
    backdropId: "sunset-glow",
    aspectRatioId: "16:9",
    showTextOverlay: true,
    badgeText: "🐱 PRODUCT HUNT លេខ ១",
    headlineText: "ស្ទូឌីយូរចនារូបភាពគំរូកំពូល",
    subtitleText: "នាំចេញរូបភាពគំរូឧបករណ៍កម្រិតច្បាស់ខ្ពស់ក្នុងរយៈពេលប៉ុន្មានវិនាទី។",
    showCtaBadge: false,
    showReflection: false,
    pitch3D: 0, yaw3D: -10, roll3D: 0,
  },
  {
    id: "cyber",
    label: "បដា SaaS ងងឹត Cyber",
    desc: "ពន្លឺស្ទូឌីយូងងឹតសម្រាប់កម្មវិធីវេប Enterprise",
    deviceId: "imac24",
    backdropId: "cyber-neon",
    aspectRatioId: "16:9",
    showTextOverlay: true,
    badgeText: "ENTERPRISE SAAS",
    headlineText: "ផ្ទាំងគ្រប់គ្រងទិន្នន័យពេលវេលាពិត",
    subtitleText: "តាមដានសូចនាករហេដ្ឋារចនាសម្ព័ន្ធលើគ្រប់ឧបករណ៍។",
    showCtaBadge: false,
    showReflection: true,
    pitch3D: 0, yaw3D: 0, roll3D: 0,
  },
];

/* ---------------------------------------------------------
   Canvas Rendering Core Engine
--------------------------------------------------------- */
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | { tl: number; tr: number; br: number; bl: number }) {
  const rr = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rr.tl, y);
  ctx.lineTo(x + w - rr.tr, y);
  ctx.arcTo(x + w, y, x + w, y + rr.tr, rr.tr);
  ctx.lineTo(x + w, y + h - rr.br);
  ctx.arcTo(x + w, y + h, x + w - rr.br, y + h, rr.br);
  ctx.lineTo(x + rr.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr.bl, rr.bl);
  ctx.lineTo(x, y + rr.tl);
  ctx.arcTo(x, y, x + rr.tl, y, rr.tl);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, tx: number, ty: number, tw: number, th: number, fitMode = "cover", imgZoom = 1, offsetX = 0, offsetY = 0, brightness = 1, contrast = 1) {
  ctx.save();
  if (brightness !== 1 || contrast !== 1) {
    ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
  }

  if (fitMode === "fill") {
    ctx.drawImage(img, tx, ty, tw, th);
    ctx.restore();
    return;
  }

  const imgRatio = (img.width as number) / (img.height as number);
  const targetRatio = tw / th;

  let dw = tw * imgZoom;
  let dh = th * imgZoom;

  if (fitMode === "contain") {
    if (imgRatio > targetRatio) {
      dh = (tw / imgRatio) * imgZoom;
    } else {
      dw = (th * imgRatio) * imgZoom;
    }
  } else {
    if (imgRatio > targetRatio) {
      dw = (th * imgRatio) * imgZoom;
    } else {
      dh = (tw / targetRatio) * imgZoom;
    }
  }

  const dx = tx + (tw - dw) / 2 + (offsetX * tw);
  const dy = ty + (th - dh) / 2 + (offsetY * th);

  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(tx, ty, tw, th);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPresetScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, presetId: string) {
  ctx.save();
  ctx.translate(x, y);

  if (presetId === "ios18") {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#4F46E5");
    bg.addColorStop(0.5, "#7C3AED");
    bg.addColorStop(1, "#DB2777");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.25, w * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.round(w * 0.16)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("09:41", w / 2, h * 0.22);
  } else if (presetId === "sequoia") {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#1E293B");
    bg.addColorStop(0.5, "#0F172A");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.8);
    glow.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    roundedRectPath(ctx, w * 0.12, h * 0.2, w * 0.76, h * 0.6, 12);
    ctx.fill();
  } else if (presetId === "code") {
    ctx.fillStyle = "#1E1E2E";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#F38BA8";
    ctx.fillRect(w * 0.08, h * 0.12, w * 0.3, h * 0.018);
    ctx.fillStyle = "#89B4FA";
    ctx.fillRect(w * 0.42, h * 0.12, w * 0.25, h * 0.018);

    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#A6E3A1" : "#CBA6F7";
      ctx.fillRect(w * 0.12, h * 0.18 + i * (h * 0.045), w * (0.2 + (i % 3) * 0.18), h * 0.014);
    }
  } else if (presetId === "finance") {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#090A0F");
    bg.addColorStop(1, "#171923");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const cardBg = ctx.createLinearGradient(w * 0.08, h * 0.15, w * 0.92, h * 0.38);
    cardBg.addColorStop(0, "#2563EB");
    cardBg.addColorStop(1, "#7C3AED");
    ctx.fillStyle = cardBg;
    roundedRectPath(ctx, w * 0.08, h * 0.15, w * 0.84, h * 0.22, 16);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.round(w * 0.07)}px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("$34,820.50", w * 0.14, h * 0.27);
  } else if (presetId === "rings") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2, r = w * 0.25;
    ctx.lineWidth = w * 0.07;
    ctx.lineCap = "round";

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 1.6);
    ctx.strokeStyle = "#FA114F"; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 1.3);
    ctx.strokeStyle = "#92E82A"; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 1.1);
    ctx.strokeStyle = "#00D5D8"; ctx.stroke();
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#0F172A"); bg.addColorStop(1, "#1E293B");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const sideW = w * 0.22;
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, 0, sideW, h);

    const cardW = (w - sideW - w * 0.08) / 2;
    const cardH = h * 0.25;
    for (let i = 0; i < 2; i++) {
      const cx = sideW + w * 0.03 + i * (cardW + w * 0.02);
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      roundedRectPath(ctx, cx, h * 0.15, cardW, cardH, 12);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderDeviceMesh(
  ctx: CanvasRenderingContext2D,
  device: typeof DEVICES[number],
  color: { hex: string; dark: string; chinHex?: string; accentHex?: string },
  fx: number, fy: number, frameW: number, frameH: number,
  resW: number, resH: number, bezel: number,
  img: HTMLImageElement | null, imageFit: string, shadowIntensity: number,
  showGlare: boolean, isLandscape: boolean, screenPreset: string,
  imgZoom = 1, offsetX = 0, offsetY = 0, brightness = 1, contrast = 1
) {
  if (device.type === "phone") {
    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${0.35 * shadowIntensity})`;
      ctx.shadowBlur = resW * (0.08 * shadowIntensity);
      ctx.shadowOffsetY = resW * (0.04 * shadowIntensity);
      roundedRectPath(ctx, fx, fy, frameW, frameH, resW * (device.outerRadiusRatio ?? 0.18));
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.restore();
    }

    roundedRectPath(ctx, fx, fy, frameW, frameH, resW * (device.outerRadiusRatio ?? 0.18));
    ctx.fillStyle = color.hex;
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, fx + 1, fy + 1, frameW - 2, frameH - 2, resW * (device.outerRadiusRatio ?? 0.18));
    ctx.lineWidth = Math.max(1, resW * 0.003);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.stroke();
    ctx.restore();

    const sx = fx + bezel, sy = fy + bezel;
    roundedRectPath(ctx, sx, sy, resW, resH, resW * (device.screenRadiusRatio ?? 0.15));
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, sx, sy, resW, resH, resW * (device.screenRadiusRatio ?? 0.15));
    ctx.clip();

    if (img) {
      drawCover(ctx, img, sx, sy, resW, resH, imageFit, imgZoom, offsetX, offsetY, brightness, contrast);
    } else {
      drawPresetScreen(ctx, sx, sy, resW, resH, screenPreset);
    }

    if (showGlare) {
      const sheen = ctx.createLinearGradient(sx, sy, sx + resW * 0.6, sy + resH * 0.6);
      sheen.addColorStop(0, "rgba(255,255,255,0.12)");
      sheen.addColorStop(0.3, "rgba(255,255,255,0.0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(sx, sy, resW, resH);
    }
    ctx.restore();

    if (!isLandscape) {
      const islW = resW * (device.islandWRatio || 0.30);
      const islH = resH * (device.islandHRatio || 0.033);
      const islX = sx + (resW - islW) / 2;
      const islY = sy + resH * 0.018;
      roundedRectPath(ctx, islX, islY, islW, islH, islH / 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(islX + islW - islH * 0.7, islY + islH / 2, islH * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "#1c2430";
      ctx.fill();
    }

    ctx.fillStyle = color.dark;
    const btnW = Math.max(2, resW * 0.008);
    if (!isLandscape) {
      roundedRectPath(ctx, fx - btnW, sy + resH * 0.10, btnW, resH * 0.045, btnW / 2); ctx.fill();
      roundedRectPath(ctx, fx - btnW, sy + resH * 0.17, btnW, resH * 0.07, btnW / 2); ctx.fill();
      roundedRectPath(ctx, fx - btnW, sy + resH * 0.25, btnW, resH * 0.07, btnW / 2); ctx.fill();
      roundedRectPath(ctx, fx + frameW, sy + resH * 0.14, btnW, resH * 0.09, btnW / 2); ctx.fill();
      if (device.cameraControl) {
        roundedRectPath(ctx, fx + frameW, sy + resH * 0.27, btnW, resH * 0.055, btnW / 2); ctx.fill();
      }
    }
  } else if (device.type === "tablet") {
    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${0.30 * shadowIntensity})`;
      ctx.shadowBlur = resW * (0.06 * shadowIntensity);
      ctx.shadowOffsetY = resW * (0.03 * shadowIntensity);
      roundedRectPath(ctx, fx, fy, frameW, frameH, resW * (device.outerRadiusRatio ?? 0.07));
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.restore();
    }

    roundedRectPath(ctx, fx, fy, frameW, frameH, resW * (device.outerRadiusRatio ?? 0.07));
    ctx.fillStyle = color.hex;
    ctx.fill();

    const sx = fx + bezel, sy = fy + bezel;
    roundedRectPath(ctx, sx, sy, resW, resH, resW * (device.screenRadiusRatio ?? 0.045));
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, sx, sy, resW, resH, resW * (device.screenRadiusRatio ?? 0.045));
    ctx.clip();

    if (img) {
      drawCover(ctx, img, sx, sy, resW, resH, imageFit, imgZoom, offsetX, offsetY, brightness, contrast);
    } else {
      drawPresetScreen(ctx, sx, sy, resW, resH, screenPreset);
    }

    if (showGlare) {
      const sheen = ctx.createLinearGradient(sx, sy, sx + resW * 0.5, sy + resH * 0.5);
      sheen.addColorStop(0, "rgba(255,255,255,0.1)");
      sheen.addColorStop(0.3, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(sx, sy, resW, resH);
    }
    ctx.restore();
  } else if (device.type === "laptop") {
    const baseH = frameW * (device.baseHeightRatio || 0.065);
    const baseW = frameW * 1.08;
    const bx = fx - (baseW - frameW) / 2;
    const by = fy + frameH - 1;

    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowIntensity})`;
      ctx.shadowBlur = baseW * (0.07 * shadowIntensity);
      ctx.shadowOffsetY = baseW * (0.04 * shadowIntensity);
      roundedRectPath(ctx, bx, by, baseW, baseH, { tl: 2, tr: 2, br: baseH * 0.5, bl: baseH * 0.5 });
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.restore();
    }

    const lidRadius = frameW * 0.025;
    roundedRectPath(ctx, fx, fy, frameW, frameH, { tl: lidRadius, tr: lidRadius, br: 2, bl: 2 });
    ctx.fillStyle = color.hex;
    ctx.fill();

    const sx = fx + bezel, sy = fy + bezel;
    roundedRectPath(ctx, sx, sy, resW, resH, frameW * 0.012);
    ctx.fillStyle = "#0a0a0c";
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, sx, sy, resW, resH, frameW * 0.012);
    ctx.clip();

    if (img) {
      drawCover(ctx, img, sx, sy, resW, resH, imageFit, imgZoom, offsetX, offsetY, brightness, contrast);
    } else {
      drawPresetScreen(ctx, sx, sy, resW, resH, screenPreset);
    }

    if (showGlare) {
      const sheen = ctx.createLinearGradient(sx, sy, sx + resW * 0.5, sy + resH * 0.5);
      sheen.addColorStop(0, "rgba(255,255,255,0.08)");
      sheen.addColorStop(0.3, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(sx, sy, resW, resH);
    }

    const notchW = resW * (device.notchWRatio || 0.10);
    const notchH = resH * (device.notchHRatio || 0.028);
    const notchX = sx + (resW - notchW) / 2;
    roundedRectPath(ctx, notchX, sy, notchW, notchH, { tl: 0, tr: 0, br: 6, bl: 6 });
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.restore();

    roundedRectPath(ctx, bx, by, baseW, baseH, { tl: 3, tr: 3, br: baseH * 0.6, bl: baseH * 0.6 });
    ctx.fillStyle = color.hex;
    ctx.fill();
  } else if (device.type === "desktop") {
    const chinH = resH * (device.chinRatio || 0.20);
    const panelH = resH + bezel * 2 + chinH;

    const standW = frameW * 0.22;
    const standH = panelH * 0.34;
    const standX = fx + (frameW - standW) / 2;
    const standY = fy + panelH - 2;

    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0,0,0,${0.35 * shadowIntensity})`;
      ctx.shadowBlur = standW * (0.3 * shadowIntensity);
      ctx.shadowOffsetY = standW * (0.1 * shadowIntensity);
      ctx.beginPath();
      ctx.ellipse(standX + standW / 2, standY + standH, standW * 0.8, standH * 0.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(standX + standW * 0.15, standY);
    ctx.lineTo(standX + standW * 0.85, standY);
    ctx.lineTo(standX + standW, standY + standH);
    ctx.lineTo(standX, standY + standH);
    ctx.closePath();
    const standGrad = ctx.createLinearGradient(standX, standY, standX + standW, standY + standH);
    standGrad.addColorStop(0, color.chinHex || color.hex);
    standGrad.addColorStop(1, color.hex);
    ctx.fillStyle = standGrad;
    ctx.fill();

    roundedRectPath(ctx, fx, fy, frameW, panelH, frameW * 0.015);
    ctx.fillStyle = color.hex;
    ctx.fill();

    const sx = fx + bezel, sy = fy + bezel;
    roundedRectPath(ctx, sx, sy, resW, resH, 4);
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, sx, sy, resW, resH, 4);
    ctx.clip();

    if (img) {
      drawCover(ctx, img, sx, sy, resW, resH, imageFit, imgZoom, offsetX, offsetY, brightness, contrast);
    } else {
      drawPresetScreen(ctx, sx, sy, resW, resH, screenPreset);
    }

    if (showGlare) {
      const sheen = ctx.createLinearGradient(sx, sy, sx + resW * 0.4, sy + resH * 0.4);
      sheen.addColorStop(0, "rgba(255,255,255,0.1)");
      sheen.addColorStop(0.3, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(sx, sy, resW, resH);
    }
    ctx.restore();

    const chinY = sy + resH;
    roundedRectPath(ctx, fx, chinY, frameW, chinH + bezel, { tl: 0, tr: 0, br: frameW * 0.015, bl: frameW * 0.015 });
    ctx.fillStyle = color.chinHex || color.hex;
    ctx.fill();
  } else if (device.type === "watch") {
    const outerR = resW * (device.outerRadiusRatio ?? 0.38);

    // Top & Bottom Strap mounts
    const strapW = frameW * 0.65;
    const strapH = frameH * 0.25;
    const strapX = fx + (frameW - strapW) / 2;
    ctx.fillStyle = color.dark;
    roundedRectPath(ctx, strapX, fy - strapH * 0.6, strapW, strapH, 12);
    ctx.fill();
    roundedRectPath(ctx, strapX, fy + frameH - strapH * 0.4, strapW, strapH, 12);
    ctx.fill();

    if (shadowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowIntensity})`;
      ctx.shadowBlur = resW * (0.12 * shadowIntensity);
      ctx.shadowOffsetY = resW * (0.05 * shadowIntensity);
      roundedRectPath(ctx, fx, fy, frameW, frameH, outerR);
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.restore();
    }

    roundedRectPath(ctx, fx, fy, frameW, frameH, outerR);
    ctx.fillStyle = color.hex;
    ctx.fill();

    const crownW = frameW * 0.08;
    const crownH = frameH * 0.18;
    const crownX = fx + frameW - 2;
    const crownY = fy + frameH * 0.22;
    roundedRectPath(ctx, crownX, crownY, crownW, crownH, crownW / 2);
    ctx.fillStyle = color.dark;
    ctx.fill();

    if (color.accentHex) {
      ctx.beginPath();
      ctx.arc(crownX + crownW / 2, crownY + crownH / 2, crownW * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = color.accentHex;
      ctx.fill();
    }

    const sx = fx + bezel, sy = fy + bezel;
    const screenR = resW * (device.screenRadiusRatio ?? 0.33);
    roundedRectPath(ctx, sx, sy, resW, resH, screenR);
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.save();
    roundedRectPath(ctx, sx, sy, resW, resH, screenR);
    ctx.clip();

    if (img) {
      drawCover(ctx, img, sx, sy, resW, resH, imageFit, imgZoom, offsetX, offsetY, brightness, contrast);
    } else {
      drawPresetScreen(ctx, sx, sy, resW, resH, screenPreset);
    }

    if (showGlare) {
      const sheen = ctx.createLinearGradient(sx, sy, sx + resW * 0.6, sy + resH * 0.6);
      sheen.addColorStop(0, "rgba(255,255,255,0.18)");
      sheen.addColorStop(0.3, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(sx, sy, resW, resH);
    }
    ctx.restore();
  }
}

function buildComposite(params: {
  device: typeof DEVICES[number];
  colorIdx: number;
  img: HTMLImageElement | null;
  backdrop: typeof BACKDROPS[number];
  customColor: string;
  paddingPct: number;
  scale: number;
  orientation?: string;
  imageFit?: string;
  shadowIntensity?: number;
  showGlare?: boolean;
  screenPreset?: string;
  showReflection?: boolean;
  pitch3D?: number;
  yaw3D?: number;
  roll3D?: number;
  aspectRatioId?: string;
  showTextOverlay?: boolean;
  badgeText?: string;
  headlineText?: string;
  subtitleText?: string;
  textAlign?: string;
  fontFamily?: string;
  extractedColorGradient?: [string, string] | null;
  layoutMode?: string;
  device2?: typeof DEVICES[number] | null;
  colorIdx2?: number;
  img2?: HTMLImageElement | null;
  appLogoImg?: HTMLImageElement | null;
  imgZoom?: number;
  offsetX?: number;
  offsetY?: number;
  brightness?: number;
  contrast?: number;
  showCtaBadge?: boolean;
  ctaType?: string;
  noiseIntensity?: number;
  customBgImg?: HTMLImageElement | null;
}): HTMLCanvasElement {
  const {
    device, colorIdx, img, backdrop, customColor, paddingPct, scale,
    orientation = "portrait", imageFit = "cover", shadowIntensity = 0.6,
    showGlare = true, screenPreset = "dashboard", showReflection = false,
    pitch3D = 0, yaw3D = 0, roll3D = 0, aspectRatioId = "auto",
    showTextOverlay = false, badgeText = "", headlineText = "", subtitleText = "",
    textAlign = "center", fontFamily = "Plus Jakarta Sans", extractedColorGradient = null,
    layoutMode = "single", device2 = null, colorIdx2 = 0, img2 = null, appLogoImg = null,
    imgZoom = 1, offsetX = 0, offsetY = 0, brightness = 1, contrast = 1,
    showCtaBadge = false, ctaType = "appstore", noiseIntensity = 0, customBgImg = null,
  } = params;
  const color = device.colors[colorIdx] || device.colors[0];
  let isLandscape = orientation === "landscape" && (device.type === "phone" || device.type === "tablet");
  let resW = (isLandscape ? device.resH : device.resW) * scale;
  let resH = (isLandscape ? device.resW : device.resH) * scale;

  let frameW = resW;
  let frameH = resH;
  let totalDeviceW = resW;
  let totalDeviceH = resH;

  const bezel = Math.round(resW * (device.bezelRatio || 0.04));

  if (device.type === "phone" || device.type === "tablet" || device.type === "watch") {
    frameW = resW + bezel * 2;
    frameH = resH + bezel * 2;
    totalDeviceW = frameW;
    totalDeviceH = frameH;
  } else if (device.type === "laptop") {
    frameW = resW + bezel * 2;
    frameH = resH + bezel * 2;
    const baseH = frameW * (device.baseHeightRatio || 0.065);
    const baseW = frameW * 1.08;
    totalDeviceW = baseW;
    totalDeviceH = frameH + baseH;
  } else if (device.type === "desktop") {
    const chinH = resH * (device.chinRatio || 0.20);
    frameW = resW + bezel * 2;
    frameH = resH + bezel * 2 + chinH;
    const standH = frameH * 0.34;
    totalDeviceW = frameW;
    totalDeviceH = frameH + standH;
  }

  let compositionW = totalDeviceW;
  let compositionH = totalDeviceH;

  if (layoutMode === "dual" && device2) {
    compositionW = totalDeviceW * 1.8;
  }

  const pad = Math.round(compositionW * paddingPct);
  let textHeaderHeight = showTextOverlay ? Math.round(compositionH * 0.25) : 0;
  let extraBottomPad = showReflection ? Math.round(compositionH * 0.28) : 0;

  let rawW = Math.round(compositionW + pad * 2);
  let rawH = Math.round(compositionH + pad * 2 + textHeaderHeight + extraBottomPad);

  let canvasW = rawW;
  let canvasH = rawH;

  const targetAspectObj = ASPECT_RATIOS.find((a) => a.id === aspectRatioId);
  if (targetAspectObj && targetAspectObj.ratio) {
    const targetRatio = targetAspectObj.ratio;
    if (canvasW / canvasH > targetRatio) {
      canvasH = Math.round(canvasW / targetRatio);
    } else {
      canvasW = Math.round(canvasH * targetRatio);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // Backdrop Fill
  if (customBgImg) {
    drawCover(ctx, customBgImg, 0, 0, canvasW, canvasH, "cover");
  } else if (backdrop.id === "mesh-blobs") {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, canvasW, canvasH);
    const g1 = ctx.createRadialGradient(canvasW * 0.2, canvasH * 0.3, 10, canvasW * 0.2, canvasH * 0.3, canvasW * 0.5);
    g1.addColorStop(0, "rgba(99, 102, 241, 0.45)");
    g1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const g2 = ctx.createRadialGradient(canvasW * 0.8, canvasH * 0.7, 10, canvasW * 0.8, canvasH * 0.7, canvasW * 0.5);
    g2.addColorStop(0, "rgba(236, 72, 153, 0.35)");
    g2.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (extractedColorGradient && backdrop.id === "auto") {
    const g = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    g.addColorStop(0, extractedColorGradient[0]);
    g.addColorStop(1, extractedColorGradient[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (backdrop.type === "solid") {
    ctx.fillStyle = customColor || (backdrop as { value: string }).value;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (backdrop.type === "gradient") {
    const g = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    (backdrop as { stops: string[] }).stops.forEach((stop: string, idx: number) => {
      g.addColorStop(idx / ((backdrop as { stops: string[] }).stops.length - 1), stop);
    });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Noise Overlay
  if (noiseIntensity > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    for (let i = 0; i < canvasW * canvasH * (noiseIntensity * 0.0005); i++) {
      const nx = Math.random() * canvasW;
      const ny = Math.random() * canvasH;
      ctx.fillRect(nx, ny, 1.5, 1.5);
    }
    ctx.restore();
  }

  // Text Overlay
  if (showTextOverlay) {
    ctx.save();
    const textY = Math.round(canvasH * 0.08);
    const textX = textAlign === "center" ? canvasW / 2 : textAlign === "right" ? canvasW - pad : pad;
    ctx.textAlign = textAlign as CanvasTextAlign;

    // App Logo
    if (appLogoImg) {
      const iconSize = 48 * scale;
      let ix = textX;
      if (textAlign === "center") ix = textX - iconSize / 2;
      else if (textAlign === "right") ix = textX - iconSize;
      ctx.save();
      roundedRectPath(ctx, ix, textY, iconSize, iconSize, 12 * scale);
      ctx.clip();
      ctx.drawImage(appLogoImg, ix, textY, iconSize, iconSize);
      ctx.restore();
    }

    const startTextY = appLogoImg ? textY + 60 * scale : textY;

    // Badge
    if (badgeText.trim()) {
      ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
      const bW = Math.max(120, badgeText.length * scale * 9);
      const bH = 28 * scale;
      let bx = textX;
      if (textAlign === "center") bx = textX - bW / 2;
      else if (textAlign === "right") bx = textX - bW;
      roundedRectPath(ctx, bx, startTextY, bW, bH, bH / 2);
      ctx.fill();

      ctx.fillStyle = "#2563EB";
      ctx.font = `700 ${Math.round(12 * scale)}px '${fontFamily}', sans-serif`;
      ctx.fillText(badgeText.toUpperCase(), textX, startTextY + bH * 0.68);
    }

    ctx.fillStyle = backdrop.id === "cyber-neon" || backdrop.id === "studio-dark" || backdrop.id === "ocean-deep" ? "#FFFFFF" : "#0F172A";
    ctx.font = `800 ${Math.round(28 * scale)}px '${fontFamily}', sans-serif`;
    ctx.fillText(headlineText, textX, startTextY + (badgeText.trim() ? 65 * scale : 35 * scale));

    ctx.fillStyle = backdrop.id === "cyber-neon" || backdrop.id === "studio-dark" || backdrop.id === "ocean-deep" ? "#94A3B8" : "#64748B";
    ctx.font = `500 ${Math.round(15 * scale)}px '${fontFamily}', sans-serif`;
    ctx.fillText(subtitleText, textX, startTextY + (badgeText.trim() ? 95 * scale : 65 * scale));

    if (showCtaBadge) {
      const ctaY = startTextY + (badgeText.trim() ? 120 * scale : 90 * scale);
      const btnW = 160 * scale;
      const btnH = 40 * scale;
      let btnX = textX;
      if (textAlign === "center") btnX = textX - btnW / 2;
      else if (textAlign === "right") btnX = textX - btnW;

      roundedRectPath(ctx, btnX, ctaY, btnW, btnH, 8 * scale);
      ctx.fillStyle = "#000000";
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 ${Math.round(11 * scale)}px '${fontFamily}', sans-serif`;
      ctx.fillText(ctaType === "appstore" ? " Download on App Store" : "Get on Mac App Store", btnX + btnW / 2, ctaY + btnH * 0.62);
    }

    ctx.restore();
  }

  // Device Positioning
  const deviceStartX = (canvasW - compositionW) / 2;
  const deviceStartY = (canvasH - compositionH - extraBottomPad + textHeaderHeight) / 2;

  const fx = deviceStartX + (totalDeviceW - frameW) / 2;
  const fy = deviceStartY;

  // 3D Matrix Transform
  ctx.save();
  const centerX = fx + frameW / 2;
  const centerY = fy + frameH / 2;
  ctx.translate(centerX, centerY);

  const pitchRad = (pitch3D * Math.PI) / 180;
  const yawRad = (yaw3D * Math.PI) / 180;
  const rollRad = (roll3D * Math.PI) / 180;

  const m11 = Math.cos(yawRad) * Math.cos(rollRad);
  const m12 = Math.sin(rollRad);
  const m21 = -Math.sin(rollRad);
  const m22 = Math.cos(pitchRad) * Math.cos(rollRad);

  ctx.transform(m11, m12, m21, m22, 0, 0);
  ctx.translate(-centerX, -centerY);

  renderDeviceMesh(ctx, device, color, fx, fy, frameW, frameH, resW, resH, bezel, img, imageFit, shadowIntensity, showGlare, isLandscape, screenPreset, imgZoom, offsetX, offsetY, brightness, contrast);

  if (showReflection) {
    ctx.save();
    ctx.translate(0, fy + totalDeviceH * 2);
    ctx.scale(1, -1);
    ctx.globalAlpha = 0.18;
    renderDeviceMesh(ctx, device, color, fx, fy, frameW, frameH, resW, resH, bezel, img, imageFit, 0, false, isLandscape, screenPreset, imgZoom, offsetX, offsetY, brightness, contrast);
    ctx.restore();

    const fade = ctx.createLinearGradient(0, fy + totalDeviceH, 0, canvasH);
    fade.addColorStop(0, "rgba(255,255,255,0)");
    fade.addColorStop(1, backdrop.type === "solid" ? (customColor || (backdrop as { value: string }).value) : "rgba(240,240,240,0.9)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, fy + totalDeviceH, canvasW, extraBottomPad + pad);
  }

  ctx.restore();

  // Dual Device Rendering
  if (layoutMode === "dual" && device2) {
    const d2Color = device2.colors[colorIdx2] || device2.colors[0];
    const fx2 = fx + totalDeviceW * 0.82;
    const fy2 = fy + totalDeviceH * 0.08;

    ctx.save();
    const cx2 = fx2 + frameW / 2;
    const cy2 = fy2 + frameH / 2;
    ctx.translate(cx2, cy2);
    ctx.transform(m11, m12, m21, m22, 0, 0);
    ctx.translate(-cx2, -cy2);

    renderDeviceMesh(ctx, device2, d2Color, fx2, fy2, frameW * 0.9, frameH * 0.9, resW * 0.9, resH * 0.9, bezel * 0.9, img2 || img, imageFit, shadowIntensity, showGlare, isLandscape, screenPreset);
    ctx.restore();
  }

  return canvas;
}

function extractColorsFromImage(image: HTMLImageElement, callback: (colors: [string, string]) => void) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 64;
  canvas.height = 64;
  ctx.drawImage(image, 0, 0, 64, 64);

  const imgData = ctx.getImageData(0, 0, 64, 64).data;
  let r = 0, g = 0, b = 0;
  let r2 = 0, g2 = 0, b2 = 0;
  const len = imgData.length;

  for (let i = 0; i < len; i += 16) {
    r += imgData[i];
    g += imgData[i + 1];
    b += imgData[i + 2];

    r2 += imgData[len - 1 - i - 3];
    g2 += imgData[len - 1 - i - 2];
    b2 += imgData[len - 1 - i - 1];
  }

  const count = len / 16;
  const c1 = `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
  const c2 = `rgb(${Math.round(r2 / count)}, ${Math.round(g2 / count)}, ${Math.round(b2 / count)})`;

  callback([c1, c2]);
}

/* ---------------------------------------------------------
   Main React Studio Application
--------------------------------------------------------- */
export default function FrameStudio() {
  const [deviceId, setDeviceId] = useState("17pm");
  const [colorIdx, setColorIdx] = useState(0);
  const [device2Id] = useState("17");
  const [colorIdx2] = useState(0);
  const [layoutMode, setLayoutMode] = useState("single");

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [img2, setImg2] = useState<HTMLImageElement | null>(null);
  const [appLogoImg, setAppLogoImg] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [screenPreset, setScreenPreset] = useState("dashboard");
  const [backdropId, setBackdropId] = useState("studio-light");
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [extractedGradient, setExtractedGradient] = useState<[string, string] | null>(null);
  const [customBgImg] = useState<HTMLImageElement | null>(null);

  const [imgZoom, setImgZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [brightness] = useState(1);
  const [contrast] = useState(1);

  const [pitch3D, setPitch3D] = useState(0);
  const [yaw3D, setYaw3D] = useState(0);
  const [roll3D, setRoll3D] = useState(0);
  const [isDraggingTrackpad, setIsDraggingTrackpad] = useState(false);

  const [paddingPct, setPaddingPct] = useState(0.12);
  const [exportScale, setExportScale] = useState(2);
  const [exportFormat, setExportFormat] = useState("image/png");
  const [orientation, setOrientation] = useState("portrait");
  const [imageFit] = useState("cover");
  const [shadowIntensity] = useState(0.6);
  const [showGlare] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const [noiseIntensity, setNoiseIntensity] = useState(0);
  const [aspectRatioId, setAspectRatioId] = useState("auto");

  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [badgeText, setBadgeText] = useState("PRO RELEASE");
  const [headlineText, setHeadlineText] = useState("Designed for Performance");
  const [subtitleText, setSubtitleText] = useState("Build, preview, and showcase hardware mockups in seconds.");
  const [textAlign] = useState("center");
  const [fontFamily, setFontFamily] = useState("Plus Jakarta Sans");
  const [showCtaBadge, setShowCtaBadge] = useState(false);
  const [ctaType] = useState("appstore");

  const { theme, toggle: toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [activeTab, setActiveTab] = useState("templates");
  const [activeGroup, setActiveGroup] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const trackpadRef = useRef<HTMLDivElement>(null);

  const device = DEVICES.find((d) => d.id === deviceId) || DEVICES[0];
  const device2 = DEVICES.find((d) => d.id === device2Id) || DEVICES[2];
  const backdrop = BACKDROPS.find((b) => b.id === backdropId) || BACKDROPS[1];

  useEffect(() => {
    if (colorIdx >= device.colors.length) setColorIdx(0);
  }, [deviceId, device.colors.length, colorIdx]);

  const loadFile = useCallback((file: File | null, slot: number | "logo" = 1) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new window.Image();
      image.onload = () => {
        if (slot === 1) {
          setImg(image);
          extractColorsFromImage(image, (gradient) => setExtractedGradient(gradient));
        } else if (slot === 2) {
          setImg2(image);
        } else if (slot === "logo") {
          setAppLogoImg(image);
        }
      };
      image.src = e.target!.result as string;
    };
    if (slot === 1) setFileName(file.name);
    reader.readAsDataURL(file);
  }, []);

  const applyTemplate = (tpl: typeof STUDIO_TEMPLATES[number]) => {
    setDeviceId(tpl.deviceId || "17pm");
    setBackdropId(tpl.backdropId || "studio-light");
    setAspectRatioId(tpl.aspectRatioId || "auto");
    setShowTextOverlay(!!tpl.showTextOverlay);
    if (tpl.badgeText !== undefined) setBadgeText(tpl.badgeText);
    if (tpl.headlineText !== undefined) setHeadlineText(tpl.headlineText);
    if (tpl.subtitleText !== undefined) setSubtitleText(tpl.subtitleText);
    if (tpl.showCtaBadge !== undefined) setShowCtaBadge(tpl.showCtaBadge);
    if (tpl.showReflection !== undefined) setShowReflection(tpl.showReflection);
    if (tpl.pitch3D !== undefined) setPitch3D(tpl.pitch3D);
    if (tpl.yaw3D !== undefined) setYaw3D(tpl.yaw3D);
    if (tpl.roll3D !== undefined) setRoll3D(tpl.roll3D);
  };

  const handleTrackpadMove = (e: React.MouseEvent) => {
    if (!isDraggingTrackpad || !trackpadRef.current) return;
    const rect = trackpadRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setYaw3D(Math.round((x / (rect.width / 2)) * 30));
    setPitch3D(Math.round((-y / (rect.height / 2)) * 30));
  };

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const composite = buildComposite({
      device, colorIdx, img, backdrop, customColor, paddingPct, scale: 1,
      orientation, imageFit, shadowIntensity, showGlare, screenPreset, showReflection,
      pitch3D, yaw3D, roll3D, aspectRatioId, showTextOverlay, badgeText, headlineText, subtitleText,
      textAlign, fontFamily, extractedColorGradient: extractedGradient, layoutMode, device2, colorIdx2, img2, appLogoImg,
      imgZoom, offsetX, offsetY, brightness, contrast, showCtaBadge, ctaType, noiseIntensity, customBgImg
    });
    canvas.width = composite.width;
    canvas.height = composite.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(composite, 0, 0);
  }, [
    device, colorIdx, img, backdrop, customColor, paddingPct, orientation,
    imageFit, shadowIntensity, showGlare, screenPreset, showReflection,
    pitch3D, yaw3D, roll3D, aspectRatioId, showTextOverlay, badgeText, headlineText,
    subtitleText, textAlign, fontFamily, extractedGradient, layoutMode, device2, colorIdx2, img2, appLogoImg,
    imgZoom, offsetX, offsetY, brightness, contrast, showCtaBadge, ctaType, noiseIntensity, customBgImg
  ]);

  const handleDownload = async () => {
    const composite = buildComposite({
      device, colorIdx, img, backdrop, customColor, paddingPct, scale: exportScale,
      orientation, imageFit, shadowIntensity, showGlare, screenPreset, showReflection,
      pitch3D, yaw3D, roll3D, aspectRatioId, showTextOverlay, badgeText, headlineText, subtitleText,
      textAlign, fontFamily, extractedColorGradient: extractedGradient, layoutMode, device2, colorIdx2, img2, appLogoImg,
      imgZoom, offsetX, offsetY, brightness, contrast, showCtaBadge, ctaType, noiseIntensity, customBgImg
    });
    const link = document.createElement("a");
    const suffix = device.label.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const ext = exportFormat === "image/jpeg" ? "jpg" : exportFormat === "image/webp" ? "webp" : "png";
    link.download = `${suffix}-studio-mockup.${ext}`;
    link.href = await watermarkImageDataUrl(composite.toDataURL(exportFormat, 0.95), exportFormat);
    link.click();
    recordExport();
  };

  const handleCopy = async () => {
    try {
      const composite = buildComposite({
        device, colorIdx, img, backdrop, customColor, paddingPct, scale: exportScale,
        orientation, imageFit, shadowIntensity, showGlare, screenPreset, showReflection,
        pitch3D, yaw3D, roll3D, aspectRatioId, showTextOverlay, badgeText, headlineText, subtitleText,
        textAlign, fontFamily, extractedColorGradient: extractedGradient, layoutMode, device2, colorIdx2, img2, appLogoImg,
        imgZoom, offsetX, offsetY, brightness, contrast, showCtaBadge, ctaType, noiseIntensity, customBgImg
      });
      composite.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        } catch (err) {
          console.error(err);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRandomize = () => {
    const randDevice = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    const randColor = Math.floor(Math.random() * randDevice.colors.length);
    const randBackdrop = BACKDROPS[Math.floor(Math.random() * (BACKDROPS.length - 1)) + 1];

    setDeviceId(randDevice.id);
    setColorIdx(randColor);
    setBackdropId(randBackdrop.id);
  };

  const filteredDevices = activeGroup === "all"
    ? DEVICES
    : DEVICES.filter((d) => d.group === activeGroup);

  return (
    <div className={`min-h-screen w-full font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-300 ${
      isDarkMode ? "bg-[#090D16] text-slate-100" : "bg-[#F8FAFC] text-slate-800"
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&family=Playfair+Display:wght@600;800&family=JetBrains+Mono:wght@500;600&display=swap');
        .disp { font-family: 'Kantumruy Pro', 'Plus Jakarta Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .fs-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #2563EB; cursor: pointer; box-shadow: 0 2px 4px rgba(37,99,235,0.3); }
        .fs-range { -webkit-appearance: none; height: 4px; border-radius: 2px; }
        .fs-fs-no-scrollbar::-webkit-scrollbar { display: none; }
        .fs-fs-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isDarkMode ? "bg-[#090D16]/80 border-slate-800/80" : "bg-white/80 border-slate-200/80 shadow-xs"
      }`}>
        <div className="max-w-[1650px] mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white p-2 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="disp font-extrabold text-lg tracking-tight">Frame Studio</h1>
                <span className="mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Pro 3D ភាសាខ្មែរ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">កម្មវិធីបង្កើតរូបភាពគំរូឧបករណ៍ Apple & បដា App Store</p>
            </div>
          </div>

          {/* Aspect Ratio Quick Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {ASPECT_RATIOS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspectRatioId(a.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  aspectRatioId === a.id
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isDarkMode ? "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
            >
              <Wand2 size={14} className="text-amber-500" />
              <span>ចៃដន្យ (Incite Me)</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
              }`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className="max-w-[1650px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6">

        {/* SIDEBAR NAVIGATION CONTROL PANEL */}
        <aside className="space-y-4 order-2 lg:order-1">

          {/* Navigation Bar */}
          <div className={`p-1 rounded-2xl border flex items-center gap-1 overflow-x-auto fs-no-scrollbar ${
            isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200/80"
          }`}>
            {[
              { id: "templates", label: "គំរូស្រាប់", icon: Flame },
              { id: "device", label: "ឧបករណ៍", icon: Smartphone },
              { id: "content", label: "អេក្រង់", icon: ImageIcon },
              { id: "banner", label: "បដាអក្សរ", icon: Type },
              { id: "stage", label: "ផ្ទៃខាងក្រោយ", icon: Palette },
              { id: "effects", label: "3D & បែបផែន", icon: RotateCw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl font-bold text-[10px] transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTROL TAB PANELS */}
          <div className={`p-5 rounded-2xl border transition-all min-h-[480px] ${
            isDarkMode ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>

            {/* TAB 0: 1-CLICK STUDIO TEMPLATES */}
            {activeTab === "templates" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">គំរូរចនាស្រាប់ៗភ្លាមៗ</p>
                <div className="space-y-2.5">
                  {STUDIO_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                        isDarkMode ? "border-slate-800 bg-slate-800/40 hover:border-blue-500" : "border-slate-200 bg-slate-50/70 hover:border-blue-500"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">{tpl.label}</span>
                          <span className="text-[10px] mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold">{tpl.aspectRatioId}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{tpl.desc}</p>
                      </div>
                      <Sparkle size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 1: DEVICE SELECTION */}
            {activeTab === "device" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">ការរៀបចំឧបករណ៍</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLayoutMode("single")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        layoutMode === "single"
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                          : isDarkMode ? "border-slate-800 bg-slate-800/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Smartphone size={14} /> ឧបករណ៍តែមួយ
                    </button>
                    <button
                      onClick={() => setLayoutMode("dual")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        layoutMode === "dual"
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                          : isDarkMode ? "border-slate-800 bg-slate-800/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <LayoutGrid size={14} /> ឧបករណ៍ទន្ទឹមគ្នា ២
                    </button>
                  </div>
                </div>

                <div>
                  <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">ប្រភេទឧបករណ៍</p>
                  <div className="flex gap-1 overflow-x-auto pb-1 fs-no-scrollbar">
                    {DEVICE_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveGroup(g.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                          activeGroup === g.id
                            ? "bg-slate-800 text-white dark:bg-blue-600"
                            : isDarkMode ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">ជ្រើសរើសម៉ូដែល</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 fs-no-scrollbar">
                    {filteredDevices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDeviceId(d.id)}
                        className={`flex items-center gap-2 text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          deviceId === d.id
                            ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                            : isDarkMode ? "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700" : "border-slate-200/80 bg-slate-50/60 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {d.type === "phone" && <Smartphone size={15} className="shrink-0 opacity-70" />}
                        {d.type === "desktop" && <Monitor size={15} className="shrink-0 opacity-70" />}
                        {d.type === "laptop" && <Laptop size={15} className="shrink-0 opacity-70" />}
                        {d.type === "tablet" && <Tablet size={15} className="shrink-0 opacity-70" />}
                        {d.type === "watch" && <Watch size={15} className="shrink-0 opacity-70" />}
                        <span className="truncate">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400">ពណ៌សម្បកឧបករណ៍</p>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{device.colors[colorIdx]?.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {device.colors.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => setColorIdx(i)}
                        title={c.name}
                        className={`relative w-9 h-9 rounded-full border-2 transition-transform ${
                          colorIdx === i
                            ? "border-blue-600 scale-110 shadow-md ring-2 ring-blue-500/30"
                            : isDarkMode ? "border-slate-700 hover:scale-105" : "border-slate-200 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {colorIdx === i && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className={c.hex === "#F2F1EC" || c.hex === "#F3F2ED" || c.hex === "#EDEAE1" || c.hex === "#E1E2E5" || c.hex === "#FFFFFF" ? "text-slate-900" : "text-white"} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {(device.type === "phone" || device.type === "tablet") && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ទិសដៅឧបករណ៍</span>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { id: "portrait", label: "បញ្ឈរ" },
                        { id: "landscape", label: "ផ្តេក" }
                      ].map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setOrientation(o.id)}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                            orientation === o.id ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCREEN CONTENT & ADJUSTMENTS */}
            {activeTab === "content" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400">រូបភាពអេក្រង់ទី ១</p>
                    {img && (
                      <button onClick={() => { setImg(null); setFileName(""); setExtractedGradient(null); }} className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1">
                        <X size={12} /> លុបរូបភាព
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0], 1); }}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                      dragOver
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                        : isDarkMode ? "border-slate-800 hover:border-slate-700 bg-slate-950/40" : "border-slate-200 hover:border-blue-400 bg-slate-50/50"
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null, 1)} />
                    {img ? (
                      <div className="flex items-center gap-2 justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <ImageIcon size={16} className="text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{fileName}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600">
                          <Upload size={16} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">ទម្លាក់រូបភាពអេក្រង់ ឬចុចជ្រើសរើស</span>
                      </div>
                    )}
                  </div>
                </div>

                {img && extractedGradient && (
                  <button
                    onClick={() => setBackdropId("auto")}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      backdropId === "auto"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkle size={15} className="text-amber-500" />
                      <span className="text-xs font-bold">ផ្គូផ្គងពណ៌តាមរូបភាពអេក្រង់</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: extractedGradient[0] }}></span>
                      <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: extractedGradient[1] }}></span>
                    </div>
                  </button>
                )}

                {img && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400">កែសម្រួលរូបភាពអេក្រង់</p>
                    
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-slate-300">ពង្រីក/បង្រួម</span>
                        <span className="mono text-slate-400">{Math.round(imgZoom * 100)}%</span>
                      </div>
                      <input type="range" min={0.5} max={2} step={0.05} value={imgZoom} onChange={(e) => setImgZoom(parseFloat(e.target.value))} className="fs-range w-full" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-slate-300">ផ្លាស់ទីដេក X</span>
                        <span className="mono text-slate-400">{Math.round(offsetX * 100)}</span>
                      </div>
                      <input type="range" min={-0.5} max={0.5} step={0.02} value={offsetX} onChange={(e) => setOffsetX(parseFloat(e.target.value))} className="fs-range w-full" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-slate-300">ផ្លាស់ទីឈរ Y</span>
                        <span className="mono text-slate-400">{Math.round(offsetY * 100)}</span>
                      </div>
                      <input type="range" min={-0.5} max={0.5} step={0.02} value={offsetY} onChange={(e) => setOffsetY(parseFloat(e.target.value))} className="fs-range w-full" />
                    </div>
                  </div>
                )}

                {!img && (
                  <div>
                    <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">រូបភាពអេក្រង់គំរូស្រាប់</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SCREEN_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setScreenPreset(p.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            screenPreset === p.id
                              ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                              : isDarkMode ? "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700" : "border-slate-200/80 bg-slate-50/60 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-base">{p.icon}</span>
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BANNER OVERLAYS & CTA */}
            {activeTab === "banner" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">បង្ហាញបដាអក្សរក្បាល</span>
                  <input
                    type="checkbox" checked={showTextOverlay}
                    onChange={(e) => setShowTextOverlay(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </div>

                {showTextOverlay && (
                  <div className="space-y-3 pt-2">
                    {/* App Logo Uploader */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">រូបតំណាងកម្មវិធី (App Icon)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2"
                        >
                          <Upload size={14} /> ផ្ទុកឡើង Icon
                        </button>
                        {appLogoImg && (
                          <button onClick={() => setAppLogoImg(null)} className="text-xs text-rose-500 hover:underline">
                            លុប Logo
                          </button>
                        )}
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null, "logo")} />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">អក្សរផ្លាកសញ្ញា (Badge Tag)</label>
                      <input
                        type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ចំណងជើងធំ</label>
                      <input
                        type="text" value={headlineText} onChange={(e) => setHeadlineText(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ការពិពណ៌នា</label>
                      <textarea
                        rows={2} value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ពុម្ពអក្សរ (Font)</label>
                      <select
                        value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        {FONT_FAMILIES.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">បង្ហាញប៊ូតុង App Store CTA</span>
                      <input
                        type="checkbox" checked={showCtaBadge}
                        onChange={(e) => setShowCtaBadge(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STAGE & BACKDROP */}
            {activeTab === "stage" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Dedicated Quick Background Removal Button */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">លុបផ្ទៃខាងក្រោយ (ថ្លា/Transparent)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">ធ្វើឱ្យផ្ទៃខាងក្រោយថ្លាគ្មានពណ៌</p>
                  </div>
                  <button
                    onClick={() => setBackdropId("none")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      backdropId === "none"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {backdropId === "none" ? "បានលុបផ្ទៃ" : "លុបផ្ទៃ"}
                  </button>
                </div>

                <div>
                  <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">រចនាប័ទ្មផ្ទៃខាងក្រោយ Gradient</p>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {BACKDROPS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBackdropId(b.id)}
                        className={`h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                          backdropId === b.id ? "border-blue-600 ring-2 ring-blue-500/30 scale-[1.02]" : "border-slate-200 dark:border-slate-800"
                        }`}
                        style={{
                          background: b.type === "transparent"
                            ? "repeating-conic-gradient(#CBD5E1 0% 25%, #F1F5F9 0% 50%) 50% / 10px 10px"
                            : b.type === "gradient"
                              ? `linear-gradient(135deg, ${(b as { stops: string[] }).stops[0]}, ${(b as { stops: string[] }).stops[1]})`
                              : b.value,
                        }}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.id === "studio-dark" || b.id === "cyber-neon" || b.id === "ocean-deep" ? "text-white bg-black/40" : "text-slate-800 bg-white/60"
                        }`}>
                          {b.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded Solid Color Options */}
                <div>
                  <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">ជម្រើសពណ៌ផ្ទៃទោលច្រើនប្រភេទ (Solid Colors)</p>
                  <div className="grid grid-cols-6 gap-2 mb-3 max-h-[140px] overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl fs-no-scrollbar">
                    {EXPANDED_BG_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => { setCustomColor(col.hex); setBackdropId("none"); }}
                        title={col.label}
                        className={`w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-transform hover:scale-110 ${
                          customColor === col.hex && backdropId !== "none" && backdrop.type !== "gradient" && backdrop.type !== "mesh" ? "ring-2 ring-blue-600 scale-105" : ""
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {customColor === col.hex && backdropId !== "none" && backdrop.type !== "gradient" && (
                          <Check size={14} className={col.hex === "#FFFFFF" || col.hex === "#F1F5F9" || col.hex === "#F5EBE0" ? "text-slate-900" : "text-white"} />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ជ្រើសរើសពណ៌ផ្ទាល់ខ្លួន (Color Picker)</span>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => { setCustomColor(e.target.value); setBackdropId("none"); }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">បន្ថែមគ្រាប់អុច Noise</span>
                    <span className="mono text-slate-400">{noiseIntensity}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={noiseIntensity} onChange={(e) => setNoiseIntensity(parseInt(e.target.value))} className="fs-range w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">ចន្លោះគែមផ្ទៃខាងក្រោយ (Padding)</span>
                    <span className="mono text-slate-400">{Math.round(paddingPct * 100)}%</span>
                  </div>
                  <input type="range" min={0.02} max={0.28} step={0.01} value={paddingPct} onChange={(e) => setPaddingPct(parseFloat(e.target.value))} className="fs-range w-full" />
                </div>
              </div>
            )}

            {/* TAB 5: 3D TRANSFORMATIONS & EFFECTS */}
            {activeTab === "effects" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <p className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">ផ្ទាំងបញ្ជា 3D និម្មិត</p>
                
                {/* 3D Trackpad Joystick Widget */}
                <div
                  ref={trackpadRef}
                  onMouseDown={() => setIsDraggingTrackpad(true)}
                  onMouseUp={() => setIsDraggingTrackpad(false)}
                  onMouseLeave={() => setIsDraggingTrackpad(false)}
                  onMouseMove={handleTrackpadMove}
                  className="w-full h-32 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative cursor-crosshair flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
                  <div
                    className="w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center absolute transition-transform"
                    style={{
                      transform: `translate(${(yaw3D / 30) * 80}px, ${(-pitch3D / 30) * 45}px)`
                    }}
                  >
                    <Box size={14} />
                  </div>
                  <span className="text-[10px] mono text-slate-400 absolute bottom-2 left-2">អូសកណ្តុរដើម្បីបង្វិលមុំ 3D</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">មុំងើយ (អ័ក្ស X)</span>
                    <span className="mono text-slate-400">{pitch3D}°</span>
                  </div>
                  <input type="range" min={-30} max={30} value={pitch3D} onChange={(e) => setPitch3D(parseInt(e.target.value))} className="fs-range w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">មុំបង្វិល (អ័ក្ស Y)</span>
                    <span className="mono text-slate-400">{yaw3D}°</span>
                  </div>
                  <input type="range" min={-30} max={30} value={yaw3D} onChange={(e) => setYaw3D(parseInt(e.target.value))} className="fs-range w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">មុំផ្អៀង (អ័ក្ស Z)</span>
                    <span className="mono text-slate-400">{roll3D}°</span>
                  </div>
                  <input type="range" min={-30} max={30} value={roll3D} onChange={(e) => setRoll3D(parseInt(e.target.value))} className="fs-range w-full" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">បាំងផ្លាតបាតក្រោម 3D</p>
                    <p className="text-[10px] text-slate-400">បែបផែនឆ្លុះចាំងលើផ្ទៃខាងក្រោម</p>
                  </div>
                  <input
                    type="checkbox" checked={showReflection}
                    onChange={(e) => setShowReflection(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </div>
              </div>
            )}

          </div>

          {/* EXPORT ACTION FOOTER */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <span className="disp text-[11px] font-bold uppercase tracking-wider text-slate-400">ទំហំរូបភាព (Scale)</span>
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border-0 text-slate-700 dark:text-slate-200"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WEBP</option>
                </select>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setExportScale(s)}
                      className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all ${
                        exportScale === s ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-400"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-1.5 disp font-bold text-xs py-3 rounded-xl border transition-all ${
                  copied
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-400"
                    : isDarkMode ? "border-slate-800 hover:bg-slate-800 text-slate-200" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Copy size={14} />
                <span>{copied ? "បានចម្លង!" : "ចម្លងរូបភាព"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disp font-bold text-xs py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <Download size={14} />
                <span>ទាញយករូបភាព</span>
              </button>
            </div>
          </div>

        </aside>

        {/* MAIN PREVIEW CANVAS STAGE */}
        <main className="order-1 lg:order-2 flex flex-col">
          
          <div className={`relative flex-1 min-h-[580px] lg:min-h-[720px] rounded-3xl border flex items-center justify-center p-6 overflow-hidden transition-all ${
            isDarkMode
              ? "bg-gradient-to-b from-slate-900 via-slate-950 to-[#070A10] border-slate-800"
              : "bg-slate-200/50 border-slate-300/60 shadow-inner"
          }`}>

            {showGrid && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)`,
                  backgroundSize: `20px 20px`,
                  backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`
                }}
              />
            )}

            {/* Floating Toolbar */}
            <div className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between px-4 py-2 rounded-2xl border backdrop-blur-md transition-all ${
              isDarkMode ? "bg-slate-900/80 border-slate-800 text-slate-300" : "bg-white/80 border-slate-200/80 text-slate-700 shadow-sm"
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate">{device.label}</span>
                <span className="text-slate-400 font-normal">({device.resW}×{device.resH}px)</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded-lg transition-colors ${showGrid ? "text-blue-600 bg-blue-50 dark:bg-blue-950" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  title="បង្ហាញ/លាក់ Grid"
                >
                  <Grid size={15} />
                </button>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button
                  onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="mono text-[11px] font-semibold w-10 text-center">{Math.round(previewZoom * 100)}%</span>
                <button
                  onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setPreviewZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 ml-1"
                  title="កំណត់ទំហំដើម"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${previewZoom})` }}
            >
              <canvas
                ref={previewRef}
                className="max-w-full max-h-[640px] w-auto h-auto object-contain drop-shadow-2xl"
              />
            </div>

          </div>

        </main>

      </div>
    </div>
  );
}