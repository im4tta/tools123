"use client";

/**
 * Ouk Chatrang — game logic + rendering.
 * This module is dynamically imported so Three.js only loads when the tool
 * is actually opened.
 *
 * Source & Credits: see ouk-chatrang.tsx
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as THREE from "three";
import {
  Settings2,
  Volume2,
  VolumeX,
  RotateCcw,
  Lightbulb,
  RefreshCw,
  BookOpen,
  X,
  Box,
  LayoutGrid,
  Swords,
  Users,
  Clock as ClockIcon,
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

/* ─────────────────────────────────────────────────────────────────────
   FONTS — Noto Sans Khmer via <style> injection (scope-safe prefix oc-)
──────────────────────────────────────────────────────────────────────*/
function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap');
      .oc-font-khmer { font-family: 'Noto Sans Khmer', var(--font-khmer, sans-serif); }
      .oc-scroll::-webkit-scrollbar { width: 6px; }
      .oc-scroll::-webkit-scrollbar-thumb { background: var(--ground-line); border-radius: 3px; }
      @keyframes oc-fadeIn { from{opacity:0}to{opacity:1} }
      @keyframes oc-fadeSlideDown { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
      @keyframes oc-fadeSlideUp { from{opacity:0;transform:translateY(18px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes oc-scaleIn { from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)} }
      @keyframes oc-slideInRight { from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)} }
      @keyframes oc-popIn { 0%{opacity:0;transform:scale(0.4)}65%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)} }
      @keyframes oc-ping { 0%{transform:scale(1);opacity:0.55}75%,100%{transform:scale(2.6);opacity:0} }
      @keyframes oc-shimmer { 0%,80%,100%{opacity:0.3;transform:scale(0.85)}40%{opacity:1;transform:scale(1)} }
      @keyframes oc-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)} }
      @keyframes oc-glowPulse { 0%,100%{box-shadow:0 2px 12px var(--oc-glow,rgba(0,0,0,0.2))}50%{box-shadow:0 6px 26px var(--oc-glow,rgba(0,0,0,0.2))} }
      @keyframes oc-boardAura { 0%,100%{opacity:0.45;transform:scale(1)}50%{opacity:0.75;transform:scale(1.015)} }
      @keyframes oc-shake { 0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)} }
      .oc-crown-glow { animation: oc-glowPulse 2.6s ease-in-out infinite; }
      .oc-board-aura { animation: oc-boardAura 3.2s ease-in-out infinite; }
      .oc-shake { animation: oc-shake 0.4s ease-in-out; }
      .oc-anim-header { animation: oc-fadeSlideDown 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      .oc-anim-board { animation: oc-scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
      .oc-anim-fade { animation: oc-fadeIn 0.35s ease both; }
      .oc-anim-pop { animation: oc-popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
      .oc-anim-slide-up { animation: oc-fadeSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      .oc-anim-slide-right { animation: oc-slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      .oc-anim-row { animation: oc-fadeSlideDown 0.3s ease both; }
      .oc-btn { transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.16s ease,opacity 0.16s ease,filter 0.16s ease; }
      .oc-btn:hover:not(:disabled) { transform: translateY(-1px) scale(1.025); filter: brightness(1.04); }
      .oc-btn:active:not(:disabled) { transform: scale(0.96); }
      .oc-icon-btn { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),background 0.18s ease,opacity 0.18s ease; }
      .oc-icon-btn:hover { transform: scale(1.14) rotate(-2deg); }
      .oc-icon-btn:active { transform: scale(0.9); }
      .oc-swatch { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),border-color 0.18s ease; }
      .oc-swatch:hover { transform: translateY(-2px); }
      .oc-dot-ping { animation: oc-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
      .oc-shimmer-dot { animation: oc-shimmer 1.2s ease-in-out infinite; }
    `}</style>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — light / dark palettes
──────────────────────────────────────────────────────────────────────*/
type PaletteMode = "light" | "dark";
interface Palette {
  bg: string; surface: string; surface2: string; raised: string;
  border: string; borderStrong: string;
  text: string; textMuted: string; textFaint: string;
  boardA: string; boardB: string;
  pieceW: string; pieceB: string;
  danger: string; dangerSoft: string; success: string;
  shadow: string;
}
const PALETTES: Record<PaletteMode, Palette> = {
  light: {
    bg: "#DEDEE3", surface: "#FFFFFF", surface2: "#E3E3E8", raised: "#FFFFFF",
    border: "#CDCDD4", borderStrong: "#AFAFB8",
    text: "#0A0A0C", textMuted: "#47474F", textFaint: "#68686F",
    boardA: "#EEE7D7", boardB: "#8A7150",
    pieceW: "#FFFFFF", pieceB: "#19191C",
    danger: "#C82A31", dangerSoft: "#FBEAEA", success: "#0D8C51",
    shadow: "rgba(15,15,20,0.28)",
  },
  dark: {
    bg: "#0A0A0C", surface: "#141416", surface2: "#1B1B1F", raised: "#1F1F23",
    border: "#26262B", borderStrong: "#34343A",
    text: "#F5F5F7", textMuted: "#8E8E96", textFaint: "#5C5C63",
    boardA: "#232327", boardB: "#17171A",
    pieceW: "#F2F2F0", pieceB: "#19191B",
    danger: "#F87171", dangerSoft: "#2A1618", success: "#34D399",
    shadow: "rgba(0,0,0,0.45)",
  },
};

const ACCENTS = {
  jade:   { label: { km: "ជេដ",  en: "Jade"   }, hex: "#12B76A" },
  indigo: { label: { km: "ខៀវ",  en: "Indigo" }, hex: "#5B5BF6" },
  amber:  { label: { km: "មាស",  en: "Amber"  }, hex: "#F5A524" },
} as const;
type AccentKey = keyof typeof ACCENTS;

const BOARD_THEMES = {
  walnut:   { label: { km: "ដើមវ៉ាល់នុត", en: "Walnut"     }, light: ["#E4D2AE","#5E3B22"] as [string,string], dark: ["#3A2A1A","#1C130B"] as [string,string] },
  rosewood: { label: { km: "ក្រញូង",       en: "Rosewood"   }, light: ["#E7C9B6","#722A22"] as [string,string], dark: ["#3A1712","#1E0B08"] as [string,string] },
  ivory:    { label: { km: "ដំបូងស",       en: "Ivory Oak"  }, light: ["#EEE7D7","#8A7150"] as [string,string], dark: ["#2B2820","#17140F"] as [string,string] },
  ebony:    { label: { km: "ខ្មៅដំបូល",   en: "Ebony"      }, light: ["#CFC8BC","#242226"] as [string,string], dark: ["#26262A","#0A0A0C"] as [string,string] },
  sen:      { label: { km: "ឫស្សី",        en: "Bamboo"     }, light: ["#EDE4B8","#A2903E"] as [string,string], dark: ["#312D18","#19170D"] as [string,string] },
  jade:     { label: { km: "ថ្មបៃតង",     en: "Jade Stone" }, light: ["#D7E6DA","#3C6B52"] as [string,string], dark: ["#1B2A21","#0B120E"] as [string,string] },
} as const;
type BoardThemeKey = keyof typeof BOARD_THEMES;

const hexToRgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* ─────────────────────────────────────────────────────────────────────
   GAME CONSTANTS
──────────────────────────────────────────────────────────────────────*/
const FILES = ["a","b","c","d","e","f","g","h"];
const KHMER_FILES = ["ក","ខ","គ","ឃ","ង","ច","ឆ","ជ"];
const KHMER_DIGITS = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];
const toKhmerDigits = (n: number) =>
  String(n).split("").map(d => KHMER_DIGITS[parseInt(d)] ?? d).join("");

const squareName = (r: number, c: number, lang: string) =>
  lang === "km"
    ? `${KHMER_FILES[c]}${toKhmerDigits(8 - r)}`
    : `${FILES[c]}${8 - r}`;

type PieceType = "K"|"Q"|"B"|"N"|"R"|"P"|"P_PROM";
interface PieceDef {
  km: string; en: string; symbol: string; val: number;
  desc: { km: string; en: string };
}
const PIECES: Record<PieceType, PieceDef> = {
  K: { km:"ស្តេច", en:"King",           symbol:"♔", val:10000,
       desc:{ km:"ដើរបាន ១ ក្រឡាគ្រប់ទិស។ អាចលោតដូចសេះលើកទី១ ប្រសិនបើមិនជាប់អុក",
              en:"One square in any direction. May leap like a knight on its first move if not in check." }},
  Q: { km:"នាង",   en:"Queen",           symbol:"♕", val:160,
       desc:{ km:"ដើរបាន ១ ក្រឡាបញ្ឆៀង។ អាចលោត ២ ក្រឡាត្រង់ទៅមុខលើកទី១",
              en:"One square diagonally. May leap two squares straight ahead on its first move." }},
  B: { km:"គោល",  en:"Bishop",          symbol:"▲", val:240,
       desc:{ km:"ដើរ ១ ក្រឡាបញ្ឆៀងទាំង ៤ និងត្រង់ទៅមុខ ១ ក្រឡា",
              en:"One square diagonally in any of four directions, or one square straight ahead." }},
  N: { km:"សេះ",  en:"Knight",          symbol:"♞", val:320,
       desc:{ km:"ដើររាងអក្សរ L ហើយអាចលោតរំលងកូនបាន",
              en:"Moves in an L-shape and may jump over other pieces." }},
  R: { km:"ទូក",  en:"Boat",            symbol:"♜", val:540,
       desc:{ km:"ដើរត្រង់ផ្ដេក ឬបញ្ឈរ គ្មានកំណត់ចម្ងាយ",
              en:"Moves any distance horizontally or vertically." }},
  P: { km:"ត្រី",  en:"Fish",            symbol:"●", val:100,
       desc:{ km:"ដើរទៅមុខ ១ ក្រឡា ស៊ីបញ្ឆៀង។ បកលើជួរទី ៦",
              en:"One step forward, captures diagonally. Promotes on reaching its sixth rank." }},
  P_PROM: { km:"ត្រីបក", en:"Promoted Fish", symbol:"★", val:160,
            desc:{ km:"ដើរដូចនាង — ១ ក្រឡាបញ្ឆៀងទាំង ៤ទិស",
                   en:"Moves like a Queen — one square diagonally in any direction." }},
};

interface MoveEntry {
  pieceType: PieceType;
  from: { r: number; c: number };
  to:   { r: number; c: number };
  capture: boolean;
}
const formatMoveNote = (entry: MoveEntry, lang: string) => {
  const label = lang === "km" ? PIECES[entry.pieceType].km : PIECES[entry.pieceType].en;
  return `${label} ${squareName(entry.from.r, entry.from.c, lang)}\u2192${squareName(entry.to.r, entry.to.c, lang)}${entry.capture ? " \u00d7" : ""}`;
};

interface Piece {
  type: PieceType;
  color: "w"|"b";
  moved: boolean;
  id: string;
}
type Board = (Piece|null)[][];

const createInitialBoard = (): Board => {
  const back = (color: "w"|"b"): Piece[] =>
    (["R","N","B","K","Q","B","N","R"] as PieceType[]).map((type, i) => ({
      type, color, moved: false, id: `${color}_${type}${i}`,
    }));
  const trey = (color: "w"|"b"): Piece[] =>
    Array.from({ length: 8 }, (_, i) => ({
      type: "P" as PieceType, color, moved: false, id: `${color}_P${i}`,
    }));
  return [
    back("b"), Array(8).fill(null), trey("b"),
    Array(8).fill(null), Array(8).fill(null),
    trey("w"), Array(8).fill(null), back("w"),
  ];
};

/* ─────────────────────────────────────────────────────────────────────
   SOUND FX
──────────────────────────────────────────────────────────────────────*/
class SoundFX {
  ctx: AudioContext | null = null;
  muted = false;
  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (AC) this.ctx = new AC();
    }
  }
  tone(freq: number, duration: number, type: OscillatorType, gainStart: number, sweepTo?: number) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + duration);
      gain.gain.setValueAtTime(gainStart, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + duration + 0.02);
    } catch { /* no-op */ }
  }
  playMove()    { this.tone(260, 0.07, "triangle", 0.3, 65); }
  playCapture() { this.tone(380, 0.12, "sawtooth", 0.35, 100); }
  playSelect()  { this.tone(520, 0.04, "sine", 0.15); }
  playCheck()   { this.init(); if (!this.ctx || this.muted) return; [600, 900].forEach(f => this.tone(f, 0.18, "sine", 0.22)); }
  playVictory() {
    this.init(); if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      try {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = "triangle"; osc.frequency.setValueAtTime(freq, t0 + i * 0.1);
        gain.gain.setValueAtTime(0.28, t0 + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.1 + 0.3);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t0 + i * 0.1); osc.stop(t0 + i * 0.1 + 0.32);
      } catch { /* no-op */ }
    });
  }
}
const sound = new SoundFX();

/* ─────────────────────────────────────────────────────────────────────
   RULES ENGINE
──────────────────────────────────────────────────────────────────────*/
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

interface RawMove { r: number; c: number; capture: boolean; leap?: boolean }

function rawMoves(board: Board, r: number, c: number, piece: Piece): RawMove[] {
  const moves: RawMove[] = [];
  const { color } = piece;
  const isWhite = color === "w";
  switch (piece.type) {
    case "P": {
      const nr = r + (isWhite ? -1 : 1);
      if (inside(nr, c) && !board[nr][c]) moves.push({ r: nr, c, capture: false });
      ([-1,1] as const).forEach(dc => {
        const nc = c + dc;
        if (inside(nr, nc) && board[nr][nc] && board[nr][nc]!.color !== color)
          moves.push({ r: nr, c: nc, capture: true });
      });
      break;
    }
    case "P_PROM":
    case "Q": {
      ([[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]).forEach(([dr,dc]) => {
        const nr = r+dr, nc = c+dc;
        if (inside(nr,nc)) {
          if (!board[nr][nc]) moves.push({ r:nr, c:nc, capture:false });
          else if (board[nr][nc]!.color !== color) moves.push({ r:nr, c:nc, capture:true });
        }
      });
      if (piece.type === "Q" && !piece.moved) {
        const jr = r + (isWhite ? -2 : 2);
        if (inside(jr,c) && !board[jr][c]) moves.push({ r:jr, c, capture:false, leap:true });
      }
      break;
    }
    case "B": {
      const fwd = isWhite ? -1 : 1;
      ([[-1,-1],[-1,1],[1,-1],[1,1],[fwd,0]] as [number,number][]).forEach(([dr,dc]) => {
        const nr=r+dr, nc=c+dc;
        if (inside(nr,nc)) {
          if (!board[nr][nc]) moves.push({ r:nr, c:nc, capture:false });
          else if (board[nr][nc]!.color !== color) moves.push({ r:nr, c:nc, capture:true });
        }
      });
      break;
    }
    case "N": {
      ([[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]).forEach(([dr,dc]) => {
        const nr=r+dr, nc=c+dc;
        if (inside(nr,nc)) {
          if (!board[nr][nc]) moves.push({ r:nr, c:nc, capture:false });
          else if (board[nr][nc]!.color !== color) moves.push({ r:nr, c:nc, capture:true });
        }
      });
      break;
    }
    case "R": {
      ([[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]).forEach(([dr,dc]) => {
        let step = 1;
        for (;;) {
          const nr=r+dr*step, nc=c+dc*step;
          if (!inside(nr,nc)) break;
          if (!board[nr][nc]) { moves.push({ r:nr, c:nc, capture:false }); }
          else { if (board[nr][nc]!.color !== color) moves.push({ r:nr, c:nc, capture:true }); break; }
          step++;
        }
      });
      break;
    }
    case "K": {
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
        if (!dr && !dc) continue;
        const nr=r+dr, nc=c+dc;
        if (inside(nr,nc)) {
          if (!board[nr][nc]) moves.push({ r:nr, c:nc, capture:false });
          else if (board[nr][nc]!.color !== color) moves.push({ r:nr, c:nc, capture:true });
        }
      }
      if (!piece.moved) {
        ([[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]).forEach(([dr,dc]) => {
          const nr=r+dr, nc=c+dc;
          if (inside(nr,nc) && !board[nr][nc]) moves.push({ r:nr, c:nc, capture:false, leap:true });
        });
      }
      break;
    }
  }
  return moves;
}

function isSquareAttacked(board: Board, tr: number, tc: number, byColor: "w"|"b") {
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    const p = board[r][c];
    if (!p || p.color !== byColor) continue;
    if (p.type === "P") {
      const fwd = p.color === "w" ? -1 : 1;
      if (r+fwd === tr && (c-1 === tc || c+1 === tc)) return true;
    } else if (rawMoves(board, r, c, p).some(m => m.r === tr && m.c === tc)) return true;
  }
  return false;
}

function findKing(board: Board, color: "w"|"b") {
  for (let r=0; r<8; r++) for (let c=0; c<8; c++)
    if (board[r][c]?.type === "K" && board[r][c]?.color === color) return { r, c };
  return null;
}
const isKingInCheck = (board: Board, color: "w"|"b") => {
  const k = findKing(board, color);
  return k ? isSquareAttacked(board, k.r, k.c, color === "w" ? "b" : "w") : false;
};
const cloneBoard = (board: Board): Board => board.map(row => row.map(cell => cell ? { ...cell } : null));

function applyMove(board: Board, fr: number, fc: number, tr: number, tc: number) {
  const next = cloneBoard(board);
  const piece: Piece = { ...next[fr][fc]!, moved: true };
  const captured = next[tr][tc];
  if (piece.type === "P") {
    if (piece.color === "w" && tr <= 2) piece.type = "P_PROM";
    else if (piece.color === "b" && tr >= 5) piece.type = "P_PROM";
  }
  next[tr][tc] = piece; next[fr][fc] = null;
  return { board: next, captured };
}

function legalMoves(board: Board, r: number, c: number): RawMove[] {
  const piece = board[r][c];
  if (!piece) return [];
  const inCheck = isKingInCheck(board, piece.color);
  return rawMoves(board, r, c, piece).filter(m => {
    if (piece.type === "K" && m.leap && inCheck) return false;
    const { board: next } = applyMove(board, r, c, m.r, m.c);
    return !isKingInCheck(next, piece.color);
  });
}

interface AiMove { from: { r:number; c:number }; to: { r:number; c:number }; piece: Piece; capture: boolean }

function allLegalMoves(board: Board, color: "w"|"b"): AiMove[] {
  const all: AiMove[] = [];
  for (let r=0; r<8; r++) for (let c=0; c<8; c++)
    if (board[r][c]?.color === color)
      legalMoves(board, r, c).forEach(m =>
        all.push({ from:{r,c}, to:{r:m.r,c:m.c}, piece:board[r][c]!, capture:m.capture }));
  return all;
}

/* ─────────────────────────────────────────────────────────────────────
   AI (alpha-beta minimax)
──────────────────────────────────────────────────────────────────────*/
function evaluate(board: Board, aiColor: "w"|"b") {
  let score = 0;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    const p = board[r][c];
    if (!p) continue;
    let val = PIECES[p.type]?.val ?? 0;
    val += (7 - (Math.abs(3.5-r) + Math.abs(3.5-c))) * 4;
    if (p.type === "P") val += (p.color === "w" ? (7-r) : r) * 14;
    score += p.color === aiColor ? val : -val;
  }
  return score;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean, aiColor: "w"|"b"): number {
  const turn: "w"|"b" = maximizing ? aiColor : (aiColor === "w" ? "b" : "w");
  const moves = allLegalMoves(board, turn);
  if (moves.length === 0) return isKingInCheck(board, turn) ? (maximizing ? -30000+depth : 30000-depth) : 0;
  if (depth === 0) return evaluate(board, aiColor);
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const { board: nb } = applyMove(board, m.from.r, m.from.c, m.to.r, m.to.c);
      best = Math.max(best, minimax(nb, depth-1, alpha, beta, false, aiColor));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const { board: nb } = applyMove(board, m.from.r, m.from.c, m.to.r, m.to.c);
    best = Math.min(best, minimax(nb, depth-1, alpha, beta, true, aiColor));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

type Difficulty = "easy"|"medium"|"hard";
function bestAiMove(board: Board, aiColor: "w"|"b", difficulty: Difficulty): AiMove|null {
  const moves = allLegalMoves(board, aiColor);
  if (!moves.length) return null;
  if (difficulty === "easy" && Math.random() < 0.5) return moves[Math.floor(Math.random() * moves.length)];
  const depth = difficulty === "hard" ? 3 : 2;
  const shuffled = [...moves].sort(() => Math.random()-0.5);
  let best = shuffled[0], bestScore = -Infinity;
  for (const m of shuffled) {
    const { board: nb } = applyMove(board, m.from.r, m.from.c, m.to.r, m.to.c);
    const score = minimax(nb, depth-1, -Infinity, Infinity, false, aiColor);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

/* ─────────────────────────────────────────────────────────────────────
   PERSISTENCE — toolbox storage helper
──────────────────────────────────────────────────────────────────────*/
const GAME_KEY  = "ouk-chatrang:autosave";
const PREFS_KEY = "ouk-chatrang:prefs";

interface SavedGame {
  board: Board; turn: "w"|"b"; history: MoveEntry[];
  capturedWhite: Piece[]; capturedBlack: Piece[];
  lastMove: { from:{r:number;c:number}; to:{r:number;c:number} }|null;
  gameMode: string; aiColor: "w"|"b"; aiDifficulty: Difficulty; status: string;
}
interface SavedPrefs {
  mode?: PaletteMode; accent?: AccentKey; boardTheme?: BoardThemeKey;
  lang?: string; showLabels?: boolean; soundMuted?: boolean;
}

const saveGameState = (state: SavedGame)  => storage.set(GAME_KEY,  state);
const loadGameState = (): SavedGame|null  => storage.get<SavedGame|null>(GAME_KEY, null);
const clearGameState = ()                 => storage.remove(GAME_KEY);
const savePrefs      = (p: SavedPrefs)    => storage.set(PREFS_KEY, p);
const loadPrefs      = (): SavedPrefs|null => storage.get<SavedPrefs|null>(PREFS_KEY, null);

/* ─────────────────────────────────────────────────────────────────────
   TEXTURE CACHES (Three.js canvas-based)
──────────────────────────────────────────────────────────────────────*/
const badgeCache = new Map<string, THREE.CanvasTexture>();
function getBadgeTexture(type: PieceType, color: "w"|"b", lang: string, selected: boolean, P: Palette, accentHex: string) {
  const key = `${type}_${color}_${lang}_${selected?1:0}_${P.text}_${accentHex}`;
  if (badgeCache.has(key)) return badgeCache.get(key)!;
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 100;
  const ctx = canvas.getContext("2d")!;
  const text = lang === "km" ? PIECES[type].km : PIECES[type].en;
  const isWhite = color === "w";
  const rx=16, ry=14, rw=224, rh=72, radius=18;
  ctx.beginPath();
  ctx.moveTo(rx+radius, ry);
  ctx.arcTo(rx+rw, ry, rx+rw, ry+rh, radius);
  ctx.arcTo(rx+rw, ry+rh, rx, ry+rh, radius);
  ctx.arcTo(rx, ry+rh, rx, ry, radius);
  ctx.arcTo(rx, ry, rx+rw, ry, radius);
  ctx.closePath();
  ctx.fillStyle = isWhite ? "#FFFFFF" : "#1A1A1C";
  ctx.fill();
  ctx.lineWidth = selected ? 5 : 2;
  ctx.strokeStyle = selected ? accentHex : (isWhite ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.14)");
  ctx.stroke();
  ctx.font = '600 34px "Noto Sans Khmer", Inter, sans-serif';
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = isWhite ? "#101012" : "#F5F5F7";
  ctx.fillText(text, 128, ry+rh/2+1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  badgeCache.set(key, texture);
  return texture;
}

const boardTexCache = new Map<string, THREE.CanvasTexture>();
function getBoardTexture(boardColors: [string,string], accentHex: string, lang: string) {
  const [boardA, boardB] = boardColors;
  const key = `${boardA}_${boardB}_${accentHex}_${lang}`;
  if (boardTexCache.has(key)) return boardTexCache.get(key)!;
  const size = 1024, cell = size/8;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    const isLight = (r+c)%2 === 0;
    ctx.fillStyle = isLight ? boardA : boardB;
    ctx.fillRect(c*cell, r*cell, cell, cell);
    ctx.save();
    ctx.beginPath(); ctx.rect(c*cell, r*cell, cell, cell); ctx.clip();
    const grainDark  = isLight ? "rgba(0,0,0,0.05)"    : "rgba(0,0,0,0.16)";
    const grainLight = isLight ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.045)";
    for (let g=0; g<4; g++) {
      const gy = r*cell + (g+0.5)*(cell/4) + (Math.sin(r*12.9+c*7.3+g)*8);
      ctx.strokeStyle = g%2===0 ? grainDark : grainLight;
      ctx.lineWidth = 1+(g%2);
      ctx.beginPath();
      ctx.moveTo(c*cell, gy);
      for (let px=0; px<=cell; px+=9) {
        ctx.lineTo(c*cell+px, gy+Math.sin((px+g*27+r*5)*0.06)*3.2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = hexToRgba(accentHex, 0.16);
  ctx.lineWidth = 2;
  for (let i=0; i<=8; i++) {
    ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(size,i*cell); ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba(accentHex, 0.5);
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, size-6, size-6);
  ctx.font = "600 20px Inter, sans-serif";
  ctx.fillStyle = hexToRgba(accentHex, 0.7);
  const filesArr = lang === "km" ? KHMER_FILES : FILES;
  ctx.textAlign = "center";
  for (let c=0; c<8; c++) ctx.fillText(filesArr[c], c*cell+cell/2, size-10);
  ctx.textAlign = "left";
  for (let r=0; r<8; r++) ctx.fillText(String(8-r), 10, r*cell+22);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  boardTexCache.set(key, texture);
  return texture;
}

/* ─────────────────────────────────────────────────────────────────────
   3D BOARD
──────────────────────────────────────────────────────────────────────*/
interface ThreeBoardProps {
  board: Board; selected: {r:number;c:number}|null; validMoves: RawMove[];
  lastMove: {from:{r:number;c:number};to:{r:number;c:number}}|null;
  checkColor: "w"|"b"|null; onSelect: (r:number,c:number)=>void;
  lang: string; showLabels: boolean; mode: PaletteMode; accentHex: string;
  cameraPreset: string; boardTheme: BoardThemeKey;
}

function ThreeBoard({ board, selected, validMoves, lastMove, checkColor, onSelect,
    lang, showLabels, mode, accentHex, cameraPreset, boardTheme }: ThreeBoardProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera|null>(null);
  const piecesGroupRef= useRef<THREE.Group|null>(null);
  const meshMapRef    = useRef(new Map<string, { group:THREE.Group; type:PieceType; sprite:THREE.Sprite|null; target:THREE.Vector3 }>());
  const dyingRef      = useRef<{ group:THREE.Group; type:PieceType; sprite:THREE.Sprite|null; target:THREE.Vector3 }[]>([]);
  const overlayRef    = useRef<{
    selRing:THREE.Mesh; checkRing:THREE.Mesh; hoverMark:THREE.Mesh;
    lastMoveMeshes:THREE.Mesh[]; movePool:THREE.Mesh[]; shadowPool:THREE.Mesh[];
    dangerColor:THREE.Color; accentColor:THREE.Color;
  }|null>(null);
  const camParamsRef  = useRef({ theta: Math.PI/4, phi: Math.PI/3.3, radius: 17 });
  const draggingRef   = useRef(false);
  const lastPointerRef= useRef({ x:0, y:0 });
  const movedRef      = useRef(false);
  const activePointersRef = useRef(new Map<number,{x:number;y:number}>());
  const pinchStartRef = useRef<{dist:number; radius:number}|null>(null);
  const onSelectRef   = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const buildPiece = useCallback((piece: Piece, P: Palette, accent: string) => {
    const group = new THREE.Group();
    const isWhite = piece.color === "w";
    const mat = new THREE.MeshPhysicalMaterial({
      color: isWhite ? P.pieceW : P.pieceB, roughness:0.32, metalness:0.08,
      clearcoat:0.5, clearcoatRoughness:0.3,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accent, roughness:0.3, metalness:0.3, emissive: accent, emissiveIntensity:0.15,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.44,0.14,28), mat);
    base.position.y = 0.07; base.castShadow = true; base.receiveShadow = true;
    group.add(base);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4,0.022,10,28), accentMat);
    band.rotation.x = Math.PI/2; band.position.y = 0.14;
    group.add(band);
    let height = 0.9;
    switch (piece.type) {
      case "K": {
        height=1.55;
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.32,0.95,24),mat); shaft.position.y=0.62; shaft.castShadow=true; group.add(shaft);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.028,10,24),accentMat); ring.rotation.x=Math.PI/2; ring.position.y=1.08; group.add(ring);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.15,18,18),mat); cap.position.y=1.32; group.add(cap); break;
      }
      case "Q": {
        height=1.25;
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.72,24),mat); shaft.position.y=0.5; shaft.castShadow=true; group.add(shaft);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.18,18,18),mat); cap.position.y=0.95; group.add(cap); break;
      }
      case "B": {
        height=1.05;
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.28,0.58,20),mat); shaft.position.y=0.43; shaft.castShadow=true; group.add(shaft);
        const cap=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.34,20),mat); cap.position.y=0.85; group.add(cap); break;
      }
      case "N": {
        height=0.95;
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,0.5,20),mat); shaft.position.y=0.39; shaft.castShadow=true; group.add(shaft);
        const head=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,0.52,3),mat);
        head.position.set(0,0.8,isWhite?0.04:-0.04); head.rotation.y=Math.PI/6; head.rotation.z=isWhite?-0.32:0.32; head.castShadow=true; group.add(head); break;
      }
      case "R": {
        height=0.75;
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.36,0.5,24),mat); shaft.position.y=0.39; shaft.castShadow=true; group.add(shaft);
        const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.3,0.12,24),mat); cap.position.y=0.7; group.add(cap); break;
      }
      case "P":
      case "P_PROM": {
        height=0.62;
        const isProm=piece.type==="P_PROM";
        const body=new THREE.Mesh(new THREE.SphereGeometry(0.26,20,20),mat); body.position.y=0.36; body.scale.set(1,1.1,1); body.castShadow=true; group.add(body);
        if (isProm) {
          const halo=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.024,10,24),accentMat); halo.rotation.x=Math.PI/2; halo.position.y=0.56; group.add(halo);
        }
        break;
      }
    }
    const badge = getBadgeTexture(piece.type, piece.color, lang, false, P, accent);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:badge, depthTest:false, transparent:true, opacity:0.95 }));
    sprite.scale.set(0.66,0.26,1); sprite.position.y=height+0.3; sprite.renderOrder=99;
    group.add(sprite);
    group.userData = { type: piece.type, sprite };
    return group;
  }, [lang]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width  = container.clientWidth;
    const height = container.clientHeight || 600;
    const P = PALETTES[mode];
    const scene = new THREE.Scene();
    // Capture ref value at effect-run time so the cleanup closure is stable.
    const meshMap = meshMapRef.current;
    const camera = new THREE.PerspectiveCamera(36, width/height, 0.1, 100);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, mode==="light"?0.7:0.55));
    const dir = new THREE.DirectionalLight(0xffffff, mode==="light"?0.85:0.95);
    dir.position.set(9,20,11); dir.castShadow=true;
    dir.shadow.mapSize.set(2048,2048); dir.shadow.bias=-0.0003;
    scene.add(dir);
    const fill=new THREE.DirectionalLight(0xffffff, mode==="light"?0.18:0.12); fill.position.set(-8,10,-6); scene.add(fill);
    const rim=new THREE.PointLight(new THREE.Color(accentHex), mode==="light"?0.3:0.6, 34); rim.position.set(-11,7,-11); scene.add(rim);
    const boardGroup=new THREE.Group();
    const themeColors=(BOARD_THEMES[boardTheme]||BOARD_THEMES.walnut)[mode];
    const plinth=new THREE.Mesh(new THREE.BoxGeometry(10.2,0.3,10.2), new THREE.MeshStandardMaterial({ color:themeColors[1], roughness:0.85, metalness:0.05 }));
    plinth.position.y=-0.16; plinth.receiveShadow=true; boardGroup.add(plinth);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10.24,0.31,10.24)), new THREE.LineBasicMaterial({ color:new THREE.Color(accentHex), transparent:true, opacity:0.35 }));
    edges.position.y=-0.16; boardGroup.add(edges);
    const surface=new THREE.Mesh(new THREE.PlaneGeometry(8,8), new THREE.MeshStandardMaterial({ map:getBoardTexture(themeColors,accentHex,lang), roughness:0.55, metalness:0.02 }));
    surface.rotation.x=-Math.PI/2; surface.position.y=0.015; surface.receiveShadow=true; boardGroup.add(surface);
    scene.add(boardGroup);
    const piecesGroup=new THREE.Group(); scene.add(piecesGroup); piecesGroupRef.current=piecesGroup;
    const overlays=new THREE.Group(); scene.add(overlays);
    const accentColor=new THREE.Color(accentHex);
    const dangerColor=new THREE.Color(P.danger);
    const selRing=new THREE.Mesh(new THREE.RingGeometry(0.18,0.44,32), new THREE.MeshBasicMaterial({ color:accentColor, side:THREE.DoubleSide, depthTest:false }));
    selRing.rotation.x=Math.PI/2; selRing.position.y=0.055; selRing.visible=false; selRing.renderOrder=5; overlays.add(selRing);
    const checkRing=new THREE.Mesh(new THREE.RingGeometry(0.22,0.5,32), new THREE.MeshBasicMaterial({ color:dangerColor, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthTest:false }));
    checkRing.rotation.x=Math.PI/2; checkRing.position.y=0.06; checkRing.visible=false; checkRing.renderOrder=6; overlays.add(checkRing);
    const hoverMark=new THREE.Mesh(new THREE.RingGeometry(0.43,0.47,32), new THREE.MeshBasicMaterial({ color:accentColor, transparent:true, opacity:0.4, side:THREE.DoubleSide, depthTest:false }));
    hoverMark.rotation.x=Math.PI/2; hoverMark.position.y=0.05; hoverMark.visible=false; hoverMark.renderOrder=4; overlays.add(hoverMark);
    const lastMoveMeshes=[0,1].map(()=>{
      const p=new THREE.Mesh(new THREE.PlaneGeometry(0.92,0.92), new THREE.MeshBasicMaterial({ color:accentColor, transparent:true, opacity:0.22, side:THREE.DoubleSide }));
      p.rotation.x=Math.PI/2; p.position.y=0.045; p.visible=false; overlays.add(p); return p;
    });
    const movePool=Array.from({length:32},()=>{
      const m=new THREE.Mesh(new THREE.CircleGeometry(0.15,20), new THREE.MeshBasicMaterial({ color:accentColor, transparent:true, opacity:0.9, side:THREE.DoubleSide, depthTest:false }));
      m.rotation.x=Math.PI/2; m.position.y=0.065; m.visible=false; m.renderOrder=7; overlays.add(m); return m;
    });
    const shadowPool=Array.from({length:32},()=>{
      const m=new THREE.Mesh(new THREE.CircleGeometry(0.4,24), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:mode==="light"?0.24:0.4, side:THREE.DoubleSide, depthTest:false }));
      m.rotation.x=Math.PI/2; m.position.y=0.022; m.visible=false; m.renderOrder=2; overlays.add(m); return m;
    });
    overlayRef.current={ selRing, checkRing, hoverMark, lastMoveMeshes, movePool, shadowPool, dangerColor, accentColor };
    const updateCam=()=>{
      const{theta,phi,radius}=camParamsRef.current;
      camera.position.set(radius*Math.sin(phi)*Math.sin(theta), radius*Math.cos(phi), radius*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
    };
    updateCam();
    const raycaster=new THREE.Raycaster();
    const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const pickSquare=(clientX:number,clientY:number)=>{
      const rect=container.getBoundingClientRect();
      const mouse=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1, -((clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(mouse,camera);
      const hit=new THREE.Vector3();
      if(raycaster.ray.intersectPlane(plane,hit)&&hit.x>=-4&&hit.x<=4&&hit.z>=-4&&hit.z<=4){
        const col=Math.floor(hit.x+4),row=Math.floor(hit.z+4);
        if(inside(row,col)) return{row,col};
      }
      return null;
    };
    const pointers=activePointersRef.current;
    const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
    const onPointerDown=(e:PointerEvent)=>{
      (dom as HTMLElement & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1){ draggingRef.current=true; movedRef.current=false; lastPointerRef.current={x:e.clientX,y:e.clientY}; }
      else if(pointers.size===2){ draggingRef.current=false; const[a,b]=Array.from(pointers.values()); pinchStartRef.current={dist:distance(a,b),radius:camParamsRef.current.radius}; }
    };
    const onPointerMove=(e:PointerEvent)=>{
      if(!pointers.has(e.pointerId)){
        if(e.pointerType!=="touch"){
          const sq=pickSquare(e.clientX,e.clientY);
          if(sq&&hoverMark){hoverMark.position.set(-3.5+sq.col,0.05,-3.5+sq.row);hoverMark.visible=true;}
          else if(hoverMark) hoverMark.visible=false;
        }
        return;
      }
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2&&pinchStartRef.current){
        const[a,b]=Array.from(pointers.values());
        const ratio=pinchStartRef.current.dist/Math.max(1,distance(a,b));
        camParamsRef.current.radius=Math.max(10,Math.min(27,pinchStartRef.current.radius*ratio));
        updateCam(); return;
      }
      if(draggingRef.current&&pointers.size===1){
        const dx=e.clientX-lastPointerRef.current.x,dy=e.clientY-lastPointerRef.current.y;
        if(Math.abs(dx)+Math.abs(dy)>3) movedRef.current=true;
        camParamsRef.current.theta-=dx*0.007;
        camParamsRef.current.phi=Math.max(0.18,Math.min(Math.PI/2.05,camParamsRef.current.phi-dy*0.007));
        updateCam(); lastPointerRef.current={x:e.clientX,y:e.clientY};
      }
    };
    const onPointerUp=(e:PointerEvent)=>{
      const wasSingleTap=pointers.size===1&&!movedRef.current;
      pointers.delete(e.pointerId);
      (dom as HTMLElement & { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(e.pointerId);
      if(pointers.size<2) pinchStartRef.current=null;
      if(pointers.size===0) draggingRef.current=false;
      if(wasSingleTap){ const sq=pickSquare(e.clientX,e.clientY); if(sq) onSelectRef.current(sq.row,sq.col); }
    };
    const onPointerCancel=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(pointers.size===0)draggingRef.current=false;pinchStartRef.current=null;};
    const onWheel=(e:WheelEvent)=>{e.preventDefault();camParamsRef.current.radius=Math.max(10,Math.min(27,camParamsRef.current.radius+e.deltaY*0.015));updateCam();};
    const dom=renderer.domElement;
    (dom.style as CSSStyleDeclaration).touchAction="none";
    dom.addEventListener("pointerdown",onPointerDown);
    dom.addEventListener("pointermove",onPointerMove);
    window.addEventListener("pointerup",onPointerUp);
    window.addEventListener("pointercancel",onPointerCancel);
    dom.addEventListener("wheel",onWheel,{passive:false});
    let animId: number;
    const ONE=new THREE.Vector3(1,1,1);
    const animate=()=>{
      animId=requestAnimationFrame(animate);
      meshMapRef.current.forEach(entry=>{
        entry.group.position.lerp(entry.target,0.22);
        entry.group.scale.lerp(ONE,0.18);
      });
      if(dyingRef.current.length){
        dyingRef.current=dyingRef.current.filter(entry=>{
          entry.group.scale.multiplyScalar(0.8);
          entry.group.position.y+=0.014;
          entry.group.rotation.y+=0.12;
          if(entry.group.scale.x<0.04){piecesGroup.remove(entry.group);return false;}
          return true;
        });
      }
      const t=performance.now()*0.003;
      const ov=overlayRef.current;
      if(ov?.selRing?.visible){const s=1+Math.sin(t*2.2)*0.09;ov.selRing.scale.set(s,s,1);}
      if(ov?.checkRing?.visible){
        const s=1+Math.sin(t*3.4)*0.14;ov.checkRing.scale.set(s,s,1);
        (ov.checkRing.material as THREE.MeshBasicMaterial).opacity=0.65+Math.sin(t*3.4)*0.3;
      }
      renderer.render(scene,camera);
    };
    animate();
    const onResize=()=>{
      const w=container.clientWidth,h=container.clientHeight||600;
      camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
    };
    window.addEventListener("resize",onResize);
    return ()=>{
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown",onPointerDown);
      dom.removeEventListener("pointermove",onPointerMove);
      window.removeEventListener("pointerup",onPointerUp);
      window.removeEventListener("pointercancel",onPointerCancel);
      dom.removeEventListener("wheel",onWheel);
      window.removeEventListener("resize",onResize);
      // meshMap was captured at effect-run time above (stable ref).
      meshMap.clear();
      renderer.dispose();
      if(dom&&container.contains(dom)) container.removeChild(dom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode,accentHex,buildPiece,boardTheme]);

  useEffect(()=>{
    if(!cameraRef.current) return;
    const p=camParamsRef.current;
    if(cameraPreset==="top"){p.theta=0;p.phi=0.06;p.radius=16.5;}
    else if(cameraPreset==="white"){p.theta=0;p.phi=Math.PI/3.4;p.radius=16.5;}
    else if(cameraPreset==="black"){p.theta=Math.PI;p.phi=Math.PI/3.4;p.radius=16.5;}
    else{p.theta=Math.PI/4;p.phi=Math.PI/3.3;p.radius=17;}
    const cam=cameraRef.current;
    cam.position.set(p.radius*Math.sin(p.phi)*Math.sin(p.theta),p.radius*Math.cos(p.phi),p.radius*Math.sin(p.phi)*Math.cos(p.theta));
    cam.lookAt(0,0,0);
  },[cameraPreset]);

  useEffect(()=>{
    if(!piecesGroupRef.current) return;
    const P=PALETTES[mode];
    const piecesGroup=piecesGroupRef.current;
    const meshMap=meshMapRef.current;
    const seen=new Set<string>();
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const piece=board[r][c]; if(!piece) continue;
      seen.add(piece.id);
      const isSel=selected&&selected.r===r&&selected.c===c;
      const targetX=-3.5+c,targetZ=-3.5+r,targetY=isSel?0.32:0.05;
      let entry=meshMap.get(piece.id);
      if(!entry||entry.type!==piece.type){
        if(entry){meshMap.delete(piece.id);dyingRef.current.push(entry);}
        const group=buildPiece(piece,P,accentHex);
        group.position.set(targetX,targetY,targetZ);
        group.scale.set(0.001,0.001,0.001);
        piecesGroup.add(group);
        entry={group,type:piece.type,sprite:group.userData.sprite as THREE.Sprite|null,target:new THREE.Vector3(targetX,targetY,targetZ)};
        meshMap.set(piece.id,entry);
      } else { entry.target.set(targetX,targetY,targetZ); }
      if(entry.sprite){
        entry.sprite.visible=showLabels;
        if(showLabels){
          const tex=getBadgeTexture(piece.type,piece.color,lang,!!isSel,P,accentHex);
          if(entry.sprite.material.map!==tex){entry.sprite.material.map=tex;entry.sprite.material.needsUpdate=true;}
        }
      }
    }
    meshMap.forEach((entry,id)=>{if(!seen.has(id)){meshMap.delete(id);dyingRef.current.push(entry);}});
    const ov=overlayRef.current;
    if(!ov) return;
    const{selRing,checkRing,lastMoveMeshes,movePool,shadowPool,dangerColor,accentColor}=ov;
    if(selRing){if(selected){selRing.position.set(-3.5+selected.c,0.055,-3.5+selected.r);selRing.visible=true;}else selRing.visible=false;}
    if(checkRing){const kp=checkColor?findKing(board,checkColor):null;if(kp){checkRing.position.set(-3.5+kp.c,0.06,-3.5+kp.r);checkRing.visible=true;}else checkRing.visible=false;}
    if(lastMoveMeshes){
      if(lastMove){lastMoveMeshes[0].position.set(-3.5+lastMove.from.c,0.045,-3.5+lastMove.from.r);lastMoveMeshes[1].position.set(-3.5+lastMove.to.c,0.045,-3.5+lastMove.to.r);lastMoveMeshes[0].visible=true;lastMoveMeshes[1].visible=true;}
      else{lastMoveMeshes[0].visible=false;lastMoveMeshes[1].visible=false;}
    }
    if(movePool){movePool.forEach((m,i)=>{if(i<validMoves.length){m.position.set(-3.5+validMoves[i].c,0.065,-3.5+validMoves[i].r);(m.material as THREE.MeshBasicMaterial).color.copy(validMoves[i].capture?dangerColor:accentColor);m.visible=true;}else m.visible=false;});}
    if(shadowPool){let sIdx=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){if(board[r][c]&&sIdx<shadowPool.length){const isSel=selected&&selected.r===r&&selected.c===c;shadowPool[sIdx].position.set(-3.5+c,isSel?0.03:0.022,-3.5+r);shadowPool[sIdx].scale.setScalar(isSel?1.25:1);shadowPool[sIdx].visible=true;sIdx++;}}for(;sIdx<shadowPool.length;sIdx++)shadowPool[sIdx].visible=false;}
  },[board,selected,validMoves,lastMove,checkColor,showLabels,lang,mode,accentHex,buildPiece]);

  const P=PALETTES[mode];
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{
      background: mode==="light"
        ? `radial-gradient(circle at 50% 30%,${hexToRgba(accentHex,0.07)},${P.bg} 65%)`
        : `radial-gradient(circle at 50% 30%,${hexToRgba(accentHex,0.1)},${P.bg} 65%)`,
    }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-xs pointer-events-none flex items-center gap-1.5"
        style={{background:P.raised,color:P.textMuted,border:`1px solid ${P.border}`,boxShadow:`0 6px 20px ${P.shadow}`}}>
        <span className="w-1.5 h-1.5 rounded-full" style={{background:accentHex}}/>
        {lang==="km" ? "អូសដើម្បីបង្វិល • ច្របាច់ដើម្បីពង្រីក" : "Drag to orbit · Pinch to zoom"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   2D FLAT BOARD
──────────────────────────────────────────────────────────────────────*/
interface FlatBoardProps {
  board: Board; selected: {r:number;c:number}|null; validMoves: RawMove[];
  lastMove: {from:{r:number;c:number};to:{r:number;c:number}}|null;
  checkColor: "w"|"b"|null; onSelect: (r:number,c:number)=>void;
  lang: string; showLabels: boolean; P: Palette; accentHex: string;
  mode: PaletteMode; boardTheme: BoardThemeKey;
}
function FlatBoard({ board,selected,validMoves,lastMove,checkColor,onSelect,lang,showLabels,P,accentHex,boardTheme,mode }: FlatBoardProps) {
  const [themeA,themeB]=(BOARD_THEMES[boardTheme]||BOARD_THEMES.walnut)[mode];
  return (
    <div className="w-full h-full flex items-center justify-center p-3">
      <div className="w-full max-w-[520px] rounded-2xl overflow-hidden" style={{border:`1px solid ${P.border}`,boxShadow:`0 20px 60px ${P.shadow}`}}>
        {Array.from({length:8},(_,r)=>(
          <div key={r} className="flex">
            {Array.from({length:8},(_,c)=>{
              const piece=board[r][c];
              const isSel=selected&&selected.r===r&&selected.c===c;
              const move=validMoves.find(m=>m.r===r&&m.c===c);
              const isLast=lastMove&&((lastMove.from.r===r&&lastMove.from.c===c)||(lastMove.to.r===r&&lastMove.to.c===c));
              const isCheckedKing=piece?.type==="K"&&piece.color===checkColor;
              const dark=(r+c)%2===1;
              return (
                <button key={c} onClick={()=>onSelect(r,c)} className="relative aspect-square flex-1 flex items-center justify-center transition"
                  style={{background:isCheckedKing?hexToRgba(P.danger,0.35):isSel?hexToRgba(accentHex,0.24):isLast?hexToRgba(accentHex,0.1):(dark?themeB:themeA)}}>
                  {move&&!piece&&<div className="w-2.5 h-2.5 rounded-full" style={{background:move.capture?P.danger:accentHex}}/>}
                  {move&&piece&&<div className="absolute inset-1 rounded-lg" style={{boxShadow:`inset 0 0 0 2px ${P.danger}`}}/>}
                  {piece&&(
                    <div className="flex flex-col items-center">
                      {showLabels&&(
                        <span className="px-1 rounded font-medium leading-tight mb-0.5 oc-font-khmer" style={{fontSize:"9px",background:piece.color==="w"?P.pieceW:P.pieceB,color:piece.color==="w"?P.pieceB:P.pieceW}}>
                          {lang==="km"?PIECES[piece.type].km:PIECES[piece.type].en}
                        </span>
                      )}
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{background:piece.color==="w"?P.pieceW:P.pieceB,color:piece.color==="w"?P.pieceB:P.pieceW,border:`1px solid ${P.border}`}}>
                        {PIECES[piece.type].symbol}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SUB-UI: Segmented / SwitchRow / Divider
──────────────────────────────────────────────────────────────────────*/
function Segmented({ options, value, onChange, P }: { options:{value:string;label:string}[]; value:string; onChange:(v:string)=>void; P:Palette }) {
  return (
    <div className="flex p-0.5 rounded-lg gap-0.5" style={{background:P.surface2,border:`1px solid ${P.border}`}}>
      {options.map(opt=>(
        <button key={opt.value} onClick={()=>onChange(opt.value)} className="flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition"
          style={{background:value===opt.value?P.raised:"transparent",color:value===opt.value?P.text:P.textMuted,boxShadow:value===opt.value?`0 1px 4px ${P.shadow}`:"none"}}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
function SwitchRow({ label, checked, onChange, P, accentHex }: { label:string; checked:boolean; onChange:(v:boolean)=>void; P:Palette; accentHex:string }) {
  return (
    <label className="flex items-center justify-between text-sm cursor-pointer" style={{color:P.text}}>
      <span>{label}</span>
      <span onClick={()=>onChange(!checked)} className="relative inline-flex items-center rounded-full transition" style={{width:38,height:22,background:checked?accentHex:P.border}}>
        <span className="absolute rounded-full bg-white transition-transform" style={{width:16,height:16,top:3,left:3,transform:checked?"translateX(16px)":"translateX(0)",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
      </span>
    </label>
  );
}
function Divider({ P }: { P: Palette }) {
  return <div style={{height:1,background:P.border,margin:"14px 0"}}/>;
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN GAME COMPONENT
──────────────────────────────────────────────────────────────────────*/
export default function OukChatrangGame() {
  const { text: tHook } = useLanguage();

  // ── board state ────────────────────────────────────────────────
  const [board,setBoard]                   = useState<Board>(createInitialBoard);
  const [turn,setTurn]                     = useState<"w"|"b">("w");
  const [selected,setSelected]             = useState<{r:number;c:number}|null>(null);
  const [validMoves,setValidMoves]          = useState<RawMove[]>([]);
  const [history,setHistory]               = useState<MoveEntry[]>([]);
  const [undoStack,setUndoStack]           = useState<{board:Board;turn:"w"|"b";lastMove:typeof lastMove;capturedWhite:Piece[];capturedBlack:Piece[]}[]>([]);
  const [capturedWhite,setCapturedWhite]   = useState<Piece[]>([]);
  const [capturedBlack,setCapturedBlack]   = useState<Piece[]>([]);
  const [status,setStatus]                  = useState<"active"|"checkmate"|"stalemate"|"timeout">("active");
  const [winner,setWinner]                  = useState<"w"|"b"|"draw"|null>(null);
  const [lastMove,setLastMove]             = useState<{from:{r:number;c:number};to:{r:number;c:number}}|null>(null);

  // ── preferences (persisted) ────────────────────────────────────
  const [lang,setLang]             = useState<"km"|"en">("km");
  const [mode,setMode]             = useState<PaletteMode>("light");
  const [accent,setAccent]         = useState<AccentKey>("jade");
  const [boardTheme,setBoardTheme] = useState<BoardThemeKey>("walnut");
  const [viewMode,setViewMode]     = useState<"3d"|"2d">("3d");
  const [cameraPreset,setCameraPreset] = useState("perspective");
  const [showLabels,setShowLabels] = useState(true);
  const [soundMuted,setSoundMuted] = useState(false);

  // ── game options ───────────────────────────────────────────────
  const [gameMode,setGameMode]         = useState<"ai"|"pass">("ai");
  const [aiDifficulty,setAiDifficulty] = useState<Difficulty>("medium");
  const [aiColor,setAiColor]           = useState<"w"|"b">("b");
  const [aiThinking,setAiThinking]     = useState(false);

  // ── timed mode ──────────────────────────────────────────────────
  const [timedMode,setTimedMode]   = useState(false);
  const [whiteTime,setWhiteTime]   = useState(600);
  const [blackTime,setBlackTime]   = useState(600);
  const [clockRunning,setClockRunning] = useState(false);

  // ── UI state ────────────────────────────────────────────────────
  const [showSettings,setShowSettings] = useState(false);
  const [showRules,setShowRules]       = useState(false);
  const [toast,setToast]               = useState<string|null>(null);
  const [restored,setRestored]         = useState(false);
  const [checkShake,setCheckShake]     = useState(false);

  const P         = PALETTES[mode];
  const accentHex = ACCENTS[accent].hex;

  // bilingual helper — respects the toolbox language, not a standalone toggle
  // (lang state here controls board notation / piece labels only;
  //  the toolbox UI language drives tHook)
  const t = useCallback((km: string, en: string) => lang === "km" ? km : en, [lang]);

  const notify = (text: string) => { setToast(text); setTimeout(() => setToast(null), 2600); };

  useEffect(() => { sound.muted = soundMuted; }, [soundMuted]);

  // ── restore saved game & prefs on mount ────────────────────────
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const prefs = loadPrefs();
    if (prefs) {
      if (prefs.mode)   setMode(prefs.mode);
      if (prefs.accent) setAccent(prefs.accent);
      if (prefs.boardTheme) setBoardTheme(prefs.boardTheme);
      if (prefs.lang)   setLang(prefs.lang as "km"|"en");
      if (typeof prefs.showLabels === "boolean") setShowLabels(prefs.showLabels);
      if (typeof prefs.soundMuted === "boolean") setSoundMuted(prefs.soundMuted);
    }
    const saved = loadGameState();
    if (saved?.board && saved.status === "active") {
      setBoard(saved.board);
      setTurn(saved.turn);
      setHistory(saved.history ?? []);
      setCapturedWhite(saved.capturedWhite ?? []);
      setCapturedBlack(saved.capturedBlack ?? []);
      setLastMove(saved.lastMove ?? null);
      setGameMode(saved.gameMode as "ai"|"pass" ?? "ai");
      setAiColor(saved.aiColor ?? "b");
      setAiDifficulty(saved.aiDifficulty ?? "medium");
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (restored) savePrefs({ mode, accent, boardTheme, lang, showLabels, soundMuted });
  }, [mode,accent,boardTheme,lang,showLabels,soundMuted,restored]);

  useEffect(() => {
    if (!restored || status !== "active") return;
    saveGameState({ board,turn,history,capturedWhite,capturedBlack,lastMove,gameMode,aiColor,aiDifficulty,status });
  }, [board,turn,history,capturedWhite,capturedBlack,lastMove,gameMode,aiColor,aiDifficulty,status,restored]);

  // ── derived / memoised ─────────────────────────────────────────
  const checkColor = useMemo<"w"|"b"|null>(() => {
    if (isKingInCheck(board,"w")) return "w";
    if (isKingInCheck(board,"b")) return "b";
    return null;
  }, [board]);

  useEffect(() => {
    if (!checkColor) return;
    setCheckShake(true); // eslint-disable-line react-hooks/set-state-in-effect
    const timer = setTimeout(() => setCheckShake(false), 400);
    return () => clearTimeout(timer);
  }, [checkColor]);

  const materialEdge = useMemo(() => {
    const w = capturedBlack.reduce((a,p) => a + (PIECES[p.type]?.val ?? 0), 0);
    const b = capturedWhite.reduce((a,p) => a + (PIECES[p.type]?.val ?? 0), 0);
    return w - b;
  }, [capturedWhite,capturedBlack]);

  // ── game logic ─────────────────────────────────────────────────
  const endGameIfNeeded = useCallback((nextBoard: Board, nextTurn: "w"|"b") => {
    if (allLegalMoves(nextBoard, nextTurn).length > 0) return;
    setClockRunning(false);
    if (isKingInCheck(nextBoard, nextTurn)) {
      setStatus("checkmate"); setWinner(nextTurn==="w"?"b":"w"); sound.playVictory(); clearGameState();
    } else {
      setStatus("stalemate"); setWinner("draw"); clearGameState();
    }
  }, []);

  const commitMove = useCallback((fromR: number, fromC: number, toR: number, toC: number) => {
    const { board: nextBoard, captured } = applyMove(board, fromR, fromC, toR, toC);
    const movingPiece = board[fromR][fromC]!;
    const nextTurn: "w"|"b" = turn==="w"?"b":"w";
    if (captured) {
      sound.playCapture();
      if (captured.color==="w") setCapturedWhite(prev=>[...prev,captured]);
      else setCapturedBlack(prev=>[...prev,captured]);
    } else sound.playMove();
    if (isKingInCheck(nextBoard, nextTurn)) sound.playCheck();
    const note: MoveEntry = { pieceType: movingPiece.type, from:{r:fromR,c:fromC}, to:{r:toR,c:toC}, capture:!!captured };
    setUndoStack(prev=>[...prev,{board,turn,lastMove,capturedWhite,capturedBlack}]);
    setBoard(nextBoard); setTurn(nextTurn);
    setLastMove({from:{r:fromR,c:fromC},to:{r:toR,c:toC}});
    setHistory(prev=>[...prev,note]);
    setSelected(null); setValidMoves([]);
    if (timedMode) setClockRunning(true);
    endGameIfNeeded(nextBoard, nextTurn);
  }, [board,turn,lastMove,capturedWhite,capturedBlack,timedMode,endGameIfNeeded]);

  const handleSelect = useCallback((r: number, c: number) => {
    if (status!=="active"||aiThinking) return;
    if (gameMode==="ai"&&turn===aiColor) return;
    const clicked=board[r][c];
    if (!selected) {
      if (clicked&&clicked.color===turn) { setSelected({r,c}); setValidMoves(legalMoves(board,r,c)); sound.playSelect(); }
      return;
    }
    if (clicked&&clicked.color===turn) { setSelected({r,c}); setValidMoves(legalMoves(board,r,c)); sound.playSelect(); return; }
    const target=validMoves.find(m=>m.r===r&&m.c===c);
    if (target) commitMove(selected.r,selected.c,r,c);
    else { setSelected(null); setValidMoves([]); }
  }, [board,turn,selected,validMoves,status,aiThinking,gameMode,aiColor,commitMove]);

  // ── AI moves ───────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode!=="ai"||turn!==aiColor||status!=="active") return;
    setAiThinking(true); // eslint-disable-line react-hooks/set-state-in-effect
    const timer = setTimeout(() => {
      const move = bestAiMove(board, aiColor, aiDifficulty);
      if (move) commitMove(move.from.r, move.from.c, move.to.r, move.to.c);
      setAiThinking(false);
    }, 480);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board,turn,gameMode,aiColor,aiDifficulty,status]);

  // ── Clock ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!timedMode||!clockRunning||status!=="active") return;
    const timer = setInterval(() => {
      if (turn==="w") setWhiteTime(v=>{ if(v<=1){setStatus("timeout");setWinner("b");setClockRunning(false);return 0;} return v-1; });
      else setBlackTime(v=>{ if(v<=1){setStatus("timeout");setWinner("w");setClockRunning(false);return 0;} return v-1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timedMode,clockRunning,turn,status]);

  // ── helpers ────────────────────────────────────────────────────
  const handleHint = () => {
    if (status!=="active"||(gameMode==="ai"&&turn===aiColor)) return;
    const move = bestAiMove(board, turn, "hard");
    if (move) {
      setSelected(move.from); setValidMoves(legalMoves(board, move.from.r, move.from.c));
      notify(t(
        `${PIECES[move.piece.type].km} ${squareName(move.from.r,move.from.c,"km")} \u2192 ${squareName(move.to.r,move.to.c,"km")}`,
        `Try ${PIECES[move.piece.type].en} ${squareName(move.from.r,move.from.c,"en")} \u2192 ${squareName(move.to.r,move.to.c,"en")}`,
      ));
    }
  };

  const handleUndo = () => {
    if (!undoStack.length||status!=="active") return;
    const steps = gameMode==="ai"?2:1;
    const idx = Math.max(0, undoStack.length-steps);
    const prev = undoStack[idx];
    setBoard(prev.board); setTurn(prev.turn); setLastMove(prev.lastMove);
    setCapturedWhite(prev.capturedWhite); setCapturedBlack(prev.capturedBlack);
    setUndoStack(u=>u.slice(0,idx)); setHistory(h=>h.slice(0,idx));
    setSelected(null); setValidMoves([]);
    notify(t("បានត្រឡប់ក្រោយ","Move undone"));
  };

  const startNewGame = useCallback((nextMode: "ai"|"pass" = gameMode) => {
    setBoard(createInitialBoard()); setTurn("w"); setSelected(null); setValidMoves([]);
    setHistory([]); setUndoStack([]); setCapturedWhite([]); setCapturedBlack([]);
    setStatus("active"); setWinner(null); setLastMove(null);
    setWhiteTime(600); setBlackTime(600); setClockRunning(false);
    setGameMode(nextMode);
    clearGameState();
    notify(t("ការប្រកួតថ្មី","New match started"));
  }, [gameMode, t]);

  const turnLabel = turn==="w" ? t("ភាគីស","White") : t("ភាគីខ្មៅ","Black");
  const statusText = useMemo(() => {
    if (status==="checkmate") return t(`អុកដាច់! ភាគី${winner==="w"?"ស":"ខ្មៅ"}ឈ្នះ`,`Checkmate — ${winner==="w"?"White":"Black"} wins`);
    if (status==="stalemate") return t("ស្មើគ្នា — គ្មានច្រកដើរ","Stalemate — draw");
    if (status==="timeout")   return t(`អស់ម៉ោង — ភាគី${winner==="w"?"ស":"ខ្មៅ"}ឈ្នះ`,`Time's up — ${winner==="w"?"White":"Black"} wins`);
    if (checkColor)           return t(`អុក! ${checkColor==="w"?"ភាគីស":"ភាគីខ្មៅ"}កំពុងជាប់អុក`,`Check — ${checkColor==="w"?"White":"Black"} is threatened`);
    return t(`វេនរបស់ ${turnLabel}`,`${turnLabel} to move`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status,winner,checkColor,turnLabel,lang]);

  const formatClock = (sec: number) => {
    const m=Math.floor(sec/60), s=sec%60;
    return `${m}:${s<10?"0":""}${s}`;
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="w-full flex flex-col" style={{ color: P.text }}>
      <FontLoader />

      {/* toolbar */}
      <div className="oc-anim-header flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-sm font-medium" style={{color:P.textMuted}}>
          <span>{tHook("Board language:", "ភាសាក្តារ:")}</span>
          <button onClick={()=>setLang(l=>l==="km"?"en":"km")}
            className="oc-icon-btn px-2 py-0.5 rounded text-xs border"
            style={{borderColor:P.border, color:P.text}}>
            {lang==="km"?"ខ្មែរ → EN":"EN → ខ្មែរ"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={()=>setSoundMuted(m=>!m)} className="oc-icon-btn p-2 rounded-lg" title={tHook("Sound","សំឡេង")}>
            {soundMuted?<VolumeX size={16} style={{color:P.textMuted}}/>:<Volume2 size={16} style={{color:P.textMuted}}/>}
          </button>
          <button onClick={()=>setShowRules(true)} className="oc-icon-btn p-2 rounded-lg" title={tHook("Rules","ក្បួន")}>
            <BookOpen size={16} style={{color:P.textMuted}}/>
          </button>
          <button onClick={()=>setShowSettings(true)} className="oc-icon-btn p-2 rounded-lg" title={tHook("Settings","ការកំណត់")}>
            <Settings2 size={16} style={{color:P.textMuted}}/>
          </button>
        </div>
      </div>

      {/* main layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* board column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* status bar */}
          <div className={`flex items-center justify-between flex-wrap gap-2 ${checkShake?"oc-shake":""}`}>
            <div className="flex items-center gap-2">
              <span className="relative inline-flex w-2.5 h-2.5">
                {status==="active"&&<span className="oc-dot-ping absolute inline-flex w-full h-full rounded-full" style={{background:checkColor?P.danger:accentHex}}/>}
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{background:status==="active"?(checkColor?P.danger:accentHex):accentHex}}/>
              </span>
              <span className="font-display text-sm md:text-base oc-font-khmer">{statusText}</span>
              {gameMode==="ai"&&aiThinking&&(
                <span className="flex items-center gap-0.5 text-xs oc-font-khmer" style={{color:P.textFaint}}>
                  {t("កំពុងគិត","thinking")}
                  <span className="oc-shimmer-dot" style={{animationDelay:"0s"}}>.</span>
                  <span className="oc-shimmer-dot" style={{animationDelay:"0.15s"}}>.</span>
                  <span className="oc-shimmer-dot" style={{animationDelay:"0.3s"}}>.</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {timedMode&&(
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{background:P.raised,border:`1px solid ${P.border}`}}>
                  <ClockIcon size={12} style={{color:accentHex}}/>
                  <span style={{fontWeight:turn==="w"?700:400,opacity:turn==="w"?1:0.5}}>{formatClock(whiteTime)}</span>
                  <span style={{opacity:0.3}}>/</span>
                  <span style={{fontWeight:turn==="b"?700:400,opacity:turn==="b"?1:0.5}}>{formatClock(blackTime)}</span>
                </div>
              )}
              <button onClick={()=>setViewMode(v=>v==="3d"?"2d":"3d")} className="oc-icon-btn p-1.5 rounded-lg" title={t("ប្តូរទិដ្ឋភាព","Toggle view")}>
                {viewMode==="3d"?<LayoutGrid size={16} style={{color:P.textMuted}}/>:<Box size={16} style={{color:P.textMuted}}/>}
              </button>
            </div>
          </div>

          {/* board */}
          <div className="relative">
            <div className="oc-board-aura absolute -inset-2 rounded-[28px] pointer-events-none" style={{background:`radial-gradient(ellipse at center,${hexToRgba(checkColor?P.danger:accentHex,0.35)},transparent 72%)`,filter:"blur(22px)",zIndex:0}}/>
            <div className="oc-anim-board relative w-full rounded-2xl overflow-hidden" style={{height:"58vh",minHeight:420,maxHeight:720,border:`1px solid ${P.border}`,boxShadow:`0 24px 70px ${P.shadow}`,zIndex:1}}>
              {viewMode==="3d"?(
                <ThreeBoard board={board} selected={selected} validMoves={validMoves} lastMove={lastMove} checkColor={checkColor}
                  onSelect={handleSelect} lang={lang} showLabels={showLabels} mode={mode} accentHex={accentHex} cameraPreset={cameraPreset} boardTheme={boardTheme}/>
              ):(
                <FlatBoard board={board} selected={selected} validMoves={validMoves} lastMove={lastMove} checkColor={checkColor}
                  onSelect={handleSelect} lang={lang} showLabels={showLabels} P={P} accentHex={accentHex} mode={mode} boardTheme={boardTheme}/>
              )}
            </div>
          </div>

          {/* action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={()=>startNewGame()} className="oc-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium" style={{background:accentHex,color:"#0A0A0C"}}>
              <RefreshCw size={14}/> {t("លេងម្ដងទៀត","New game")}
            </button>
            <button onClick={handleUndo} disabled={!undoStack.length||status!=="active"} className="oc-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
              style={{background:P.raised,border:`1px solid ${P.border}`,color:P.text}}>
              <RotateCcw size={14}/> {t("ត្រឡប់ក្រោយ","Undo")}
            </button>
            <button onClick={handleHint} disabled={status!=="active"||(gameMode==="ai"&&turn===aiColor)} className="oc-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
              style={{background:P.raised,border:`1px solid ${P.border}`,color:P.text}}>
              <Lightbulb size={14}/> {t("ជំនួយ","Hint")}
            </button>
          </div>
        </div>

        {/* sidebar */}
        <aside className="oc-anim-fade w-full lg:w-72 rounded-2xl p-4" style={{background:P.surface,border:`1px solid ${P.border}`,animationDelay:"0.1s"}}>
          {/* captured */}
          <div>
            <h2 className="text-sm mb-3 font-medium" style={{color:P.textMuted}}>{t("កូនត្រូវចាប់","Captured")}</h2>
            <div className="space-y-2.5">
              <div>
                <p className="text-[11px] mb-1" style={{color:P.textFaint}}>{t("ភាគីខ្មៅបានចាប់","Taken from White")}</p>
                {capturedWhite.length===0?<span className="text-xs opacity-40 oc-font-khmer">{t("គ្មាន","None")}</span>:(
                  <div className="flex flex-wrap gap-1">
                    {capturedWhite.map((p,i)=><span key={i} className="oc-anim-pop w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{background:hexToRgba(accentHex,0.08),border:`1px solid ${P.border}`,color:P.text}}>{PIECES[p.type].symbol}</span>)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{color:P.textFaint}}>{t("ភាគីសបានចាប់","Taken from Black")}</p>
                {capturedBlack.length===0?<span className="text-xs opacity-40 oc-font-khmer">{t("គ្មាន","None")}</span>:(
                  <div className="flex flex-wrap gap-1">
                    {capturedBlack.map((p,i)=><span key={i} className="oc-anim-pop w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{background:hexToRgba(accentHex,0.08),border:`1px solid ${P.border}`,color:P.text}}>{PIECES[p.type].symbol}</span>)}
                  </div>
                )}
              </div>
              {materialEdge!==0&&(
                <p className="text-xs pt-1" style={{color:accentHex}}>
                  {materialEdge>0?t("ភាគីសមានប្រៀប","White is ahead"):t("ភាគីខ្មៅមានប្រៀប","Black is ahead")}
                </p>
              )}
            </div>
          </div>
          <Divider P={P}/>
          {/* move log */}
          <div>
            <h2 className="text-sm mb-3 font-medium" style={{color:P.textMuted}}>
              {t("កំណត់ត្រាដើរ","Move log")} <span style={{color:P.textFaint}}>({lang==="km"?toKhmerDigits(history.length):history.length})</span>
            </h2>
            <div className="oc-scroll overflow-y-auto space-y-1 pr-1" style={{maxHeight:220}}>
              {history.length===0?<p className="text-xs italic" style={{color:P.textFaint}}>{t("មិនទាន់មានការដើរ","No moves yet")}</p>:(
                history.map((m,i)=>(
                  <div key={i} className="oc-anim-row flex items-center gap-2 text-xs px-2 py-1 rounded" style={{background:i===history.length-1?hexToRgba(accentHex,0.08):"transparent"}}>
                    <span style={{color:P.textFaint,width:20}}>{lang==="km"?toKhmerDigits(i+1):i+1}.</span>
                    <span className="oc-font-khmer" style={{color:P.text}}>{formatMoveNote(m,lang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <Divider P={P}/>
          {/* mode indicator */}
          <div className="flex items-center gap-2 text-xs">
            {gameMode==="ai"?<Swords size={14} style={{color:accentHex}}/>:<Users size={14} style={{color:accentHex}}/>}
            <span style={{color:P.textMuted}}>
              {gameMode==="ai"
                ?t(`ទល់នឹងកុំព្យូទ័រ (${aiDifficulty==="easy"?"ងាយ":aiDifficulty==="hard"?"ពិបាក":"មធ្យម"})`,`Vs Computer (${aiDifficulty})`)
                :t("លេងជុំវិញតុ","Pass & play")}
            </span>
          </div>
        </aside>
      </div>

      {/* ── Settings panel ─────────────────────────────────────── */}
      {showSettings&&(
        <div className="oc-anim-fade fixed inset-0 z-50 flex justify-end" style={{background:"rgba(10,10,12,0.55)"}} onClick={()=>setShowSettings(false)}>
          <div className="oc-anim-slide-right w-full max-w-sm h-full overflow-y-auto p-5" style={{background:P.surface,borderLeft:`1px solid ${P.border}`}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">{t("ការកំណត់","Settings")}</h3>
              <button onClick={()=>setShowSettings(false)} className="oc-icon-btn"><X size={18} style={{color:P.textMuted}}/></button>
            </div>
            <Divider P={P}/>
            <p className="text-xs uppercase tracking-wide mb-2" style={{color:P.textFaint}}>{t("រូបរាង","Appearance")}</p>
            <Segmented P={P} value={mode} onChange={v=>setMode(v as PaletteMode)}
              options={[{value:"light",label:t("ភ្លឺ","Light")},{value:"dark",label:t("ងងឹត","Dark")}]}/>
            <div className="flex gap-2 mt-2.5">
              {(Object.entries(ACCENTS) as [AccentKey, typeof ACCENTS[AccentKey]][]).map(([id,a])=>(
                <button key={id} onClick={()=>setAccent(id)} className="oc-swatch flex-1 rounded-lg py-2 flex flex-col items-center gap-1.5"
                  style={{border:accent===id?`2px solid ${a.hex}`:`1px solid ${P.border}`}}>
                  <span className="w-5 h-5 rounded-full" style={{background:a.hex}}/>
                  <span style={{fontSize:"10px",color:P.textMuted}}>{t(a.label.km,a.label.en)}</span>
                </button>
              ))}
            </div>
            <Divider P={P}/>
            <p className="text-xs uppercase tracking-wide mb-2" style={{color:P.textFaint}}>{t("របៀបលេង","Game mode")}</p>
            <Segmented P={P} value={gameMode} onChange={v=>startNewGame(v as "ai"|"pass")}
              options={[{value:"ai",label:t("ទល់នឹងកុំព្យូទ័រ","Vs Computer")},{value:"pass",label:t("ជុំវិញតុ","Pass & play")}]}/>
            {gameMode==="ai"&&(
              <div className="mt-2.5 space-y-2.5">
                <Segmented P={P} value={aiDifficulty} onChange={v=>setAiDifficulty(v as Difficulty)}
                  options={[{value:"easy",label:t("ងាយ","Easy")},{value:"medium",label:t("មធ្យម","Medium")},{value:"hard",label:t("ពិបាក","Hard")}]}/>
                <Segmented P={P} value={aiColor} onChange={v=>setAiColor(v as "w"|"b")}
                  options={[{value:"b",label:t("អ្នកលេងជាភាគីស","You = White")},{value:"w",label:t("អ្នកលេងជាភាគីខ្មៅ","You = Black")}]}/>
              </div>
            )}
            <Divider P={P}/>
            <p className="text-xs uppercase tracking-wide mb-2" style={{color:P.textFaint}}>{t("សម្ភារៈក្តារ","Board material")}</p>
            <div className="grid grid-cols-3 gap-2 mb-1">
              {(Object.entries(BOARD_THEMES) as [BoardThemeKey, typeof BOARD_THEMES[BoardThemeKey]][]).map(([id,th])=>{
                const[swA,swB]=th[mode]; const isActive=boardTheme===id;
                return (
                  <button key={id} onClick={()=>setBoardTheme(id)} className="oc-swatch rounded-lg overflow-hidden flex flex-col items-center"
                    style={{border:isActive?`2px solid ${accentHex}`:`1px solid ${P.border}`}}>
                    <span className="w-full h-8 flex" style={{background:swA}}>
                      <span className="w-1/2 h-full" style={{background:swB}}/>
                    </span>
                    <span className="text-[10px] py-1.5 font-medium" style={{color:isActive?accentHex:P.textMuted}}>{t(th.label.km,th.label.en)}</span>
                  </button>
                );
              })}
            </div>
            <Divider P={P}/>
            <p className="text-xs uppercase tracking-wide mb-2" style={{color:P.textFaint}}>{t("ក្តារ","Board")}</p>
            <div className="space-y-3">
              <Segmented P={P} value={cameraPreset} onChange={setCameraPreset}
                options={[{value:"perspective",label:t("ធម្មតា","Default")},{value:"top",label:t("លើ","Top")},{value:"white",label:t("ស","White")},{value:"black",label:t("ខ្មៅ","Black")}]}/>
              <SwitchRow P={P} accentHex={accentHex} label={t("បង្ហាញឈ្មោះកូន","Show piece labels")} checked={showLabels} onChange={setShowLabels}/>
              <SwitchRow P={P} accentHex={accentHex} label={t("លេងកំណត់ម៉ោង ១០ នាទី","10-minute timed match")} checked={timedMode} onChange={v=>{ setTimedMode(v); setWhiteTime(600); setBlackTime(600); }}/>
            </div>
          </div>
        </div>
      )}

      {/* ── Rules modal ────────────────────────────────────────── */}
      {showRules&&(
        <div className="oc-anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(10,10,12,0.6)"}} onClick={()=>setShowRules(false)}>
          <div className="oc-anim-slide-up w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-5 space-y-3" style={{background:P.surface,border:`1px solid ${P.border}`}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">{t("ក្បួនដើរ","How pieces move")}</h3>
              <button onClick={()=>setShowRules(false)} className="oc-icon-btn"><X size={18} style={{color:P.textMuted}}/></button>
            </div>
            {(Object.entries(PIECES) as [PieceType, PieceDef][]).map(([key,p],idx)=>(
              <div key={key} className="oc-anim-row flex items-start gap-3 p-3 rounded-xl" style={{background:P.surface2,animationDelay:`${idx*0.04}s`}}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{background:hexToRgba(accentHex,0.12),color:accentHex,border:`1px solid ${hexToRgba(accentHex,0.3)}`}}>{p.symbol}</span>
                <div>
                  <p className="text-sm font-semibold oc-font-khmer">{lang==="km"?p.km:p.en}</p>
                  <p className="text-xs mt-0.5" style={{color:P.textMuted}}>{lang==="km"?p.desc.km:p.desc.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Game-over overlay ──────────────────────────────────── */}
      {status!=="active"&&(
        <div className="oc-anim-fade fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(10,10,12,0.65)"}}>
          <div className="oc-anim-pop w-full max-w-sm rounded-2xl p-6 text-center space-y-4" style={{background:P.surface,border:`1px solid ${hexToRgba(accentHex,0.4)}`,boxShadow:`0 30px 80px ${hexToRgba(accentHex,0.25)}`}}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{background:hexToRgba(accentHex,0.12),animation:"oc-float 2.2s ease-in-out infinite"}}>
              <span style={{fontSize:26,color:accentHex}}>♔</span>
            </div>
            <h3 className="font-display text-xl oc-font-khmer">{statusText}</h3>
            <button onClick={()=>startNewGame()} className="oc-btn w-full px-4 py-2.5 rounded-lg font-medium" style={{background:accentHex,color:"#0A0A0C"}}>
              {t("លេងម្ដងទៀត","Play again")}
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast&&(
        <div className="oc-anim-slide-up fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-xl oc-font-khmer" style={{background:P.raised,border:`1px solid ${P.border}`,color:P.text}}>
          {toast}
        </div>
      )}
    </div>
  );
}
