"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, BookOpen, CheckCircle, Clock, Coffee, Flag, Gauge, Languages, Leaf, Lightbulb, LogOut, MousePointerClick, Play, RotateCcw, ShoppingCart, Star, Tag, Utensils, Plane, Briefcase, Smile, Building } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const CATEGORIES = [
  { id: "basics", name: "មូលដ្ឋាន (Basics)", icon: BookOpen },
  { id: "daily", name: "ជីវិតប្រចាំថ្ងៃ (Everyday)", icon: Coffee },
  { id: "nature", name: "ធម្មជាតិ (Nature)", icon: Leaf },
  { id: "places", name: "អគារ (Buildings)", icon: Building },
  { id: "shopping", name: "ផ្សារ (Supermarket)", icon: ShoppingCart },
  { id: "food", name: "អាហារ (Food)", icon: Utensils },
  { id: "emotions", name: "អារម្មណ៍ (Emotions)", icon: Smile },
  { id: "travel", name: "ធ្វើដំណើរ (Travel)", icon: Plane },
  { id: "work", name: "ការងារ (Work)", icon: Briefcase },
  { id: "time", name: "ពេលវេលា (Time)", icon: Clock },
];

interface Sentence { c: string; d: number; t: string; p: string; w: string[]; dist: string[] }
const ALL_SENTENCES: Sentence[] = [
  { c: "basics", d: 1, t: "Hello everyone!", p: "Suosdey neak teang os knea", w: ["សួស្តី", "អ្នកទាំងអស់គ្នា"], dist: ["លាហើយ", "ថ្ងៃនេះ"] },
  { c: "basics", d: 1, t: "How are you?", p: "Tae neak sok sabbay te?", w: ["តើ", "អ្នក", "សុខសប្បាយ", "ទេ", "?"], dist: ["ខ្ញុំ", "ឈឺ"] },
  { c: "basics", d: 1, t: "I am fine, thank you.", p: "Knhom sok sabbay, orkun", w: ["ខ្ញុំ", "សុខសប្បាយ", "អរគុណ"], dist: ["សូមទោស", "គាត់"] },
  { c: "basics", d: 1, t: "I am sorry.", p: "Knhom somtos", w: ["ខ្ញុំ", "សូមទោស"], dist: ["មិនអីទេ", "ល្អ"] },
  { c: "basics", d: 1, t: "My name is Sokha.", p: "Knhom chhmuoh Sokha", w: ["ខ្ញុំ", "ឈ្មោះ", "សុខា"], dist: ["គាត់", "បង"] },
  { c: "basics", d: 1, t: "Yes, I understand.", p: "Baht, knhom yol", w: ["បាទ", "ខ្ញុំ", "យល់"], dist: ["ទេ", "មិន"] },
  { c: "basics", d: 1, t: "Nice to meet you.", p: "Rik reay nas dael ban chuob neak", w: ["រីករាយណាស់", "ដែល", "បាន", "ជួប", "អ្នក"], dist: ["ខ្ញុំ", "សប្បាយ"] },
  { c: "basics", d: 1, t: "What is your name?", p: "Tae neak chhmuoh avei?", w: ["តើ", "អ្នក", "ឈ្មោះ", "អ្វី", "?"], dist: ["អាយុ", "ប៉ុន្មាន"] },
  { c: "basics", d: 1, t: "See you later.", p: "Chuob knea pel kraoy", w: ["ជួបគ្នា", "ពេលក្រោយ"], dist: ["ថ្ងៃស្អែក", "ទៅ"] },
  { c: "basics", d: 1, t: "No, I do not want it.", p: "Te, knhom min chong ban te", w: ["ទេ", "ខ្ញុំ", "មិន", "ចង់បាន", "ទេ"], dist: ["បាទ", "ចូលចិត្ត"] },
  { c: "daily", d: 2, t: "I wake up early morning.", p: "Knhom phnheak pi preuk pream", w: ["ខ្ញុំ", "ភ្ញាក់", "ពីព្រលឹម"], dist: ["យប់", "ដេក"] },
  { c: "daily", d: 2, t: "He takes a shower.", p: "Koat mout teuk", w: ["គាត់", "ងូត", "ទឹក"], dist: ["ខ្ញុំ", "ផឹក"] },
  { c: "daily", d: 2, t: "We eat breakfast together.", p: "Yeang nham ahar pel preuk teang os knea", w: ["យើង", "ញ៉ាំ", "អាហារពេលព្រឹក", "ទាំងអស់គ្នា"], dist: ["ដើរ", "យប់"] },
  { c: "daily", d: 2, t: "I go to work now.", p: "Knhom tou thveu kar eylov nih", w: ["ខ្ញុំ", "ទៅ", "ធ្វើការ", "ឥឡូវនេះ"], dist: ["ផ្ទះ", "ស្អែក"] },
  { c: "daily", d: 2, t: "Mother reads a book.", p: "Mday an sievphov", w: ["ម្តាយ", "អាន", "សៀវភៅ"], dist: ["ឪពុក", "ទិញ"] },
  { c: "nature", d: 1, t: "The sky is very blue.", p: "Mekh khev nas", w: ["មេឃ", "ខៀវ", "ណាស់"], dist: ["ពពក", "ខ្មៅ"] },
  { c: "nature", d: 1, t: "The sun is hot today.", p: "Thngai kdav nas thngai nih", w: ["ព្រះអាទិត្យ", "ក្តៅណាស់", "ថ្ងៃនេះ"], dist: ["ត្រជាក់", "ភ្លៀង"] },
  { c: "nature", d: 2, t: "Rain is falling heavily.", p: "Phlieng thleak khlang", w: ["ភ្លៀង", "ធ្លាក់", "ខ្លាំង"], dist: ["ខ្យល់", "តិច"] },
  { c: "nature", d: 1, t: "Trees are green.", p: "Derm chheu por baitong", w: ["ដើមឈើ", "ពណ៌", "បៃតង"], dist: ["ក្រហម", "ផ្កា"] },
  { c: "nature", d: 2, t: "Flowers are very beautiful.", p: "Phka sa-at nas", w: ["ផ្កា", "ស្អាត", "ណាស់"], dist: ["ផ្លែ", "ធុំ"] },
  { c: "places", d: 2, t: "My house is big.", p: "Phteah robosh knhom thom", w: ["ផ្ទះ", "របស់ខ្ញុំ", "ធំ"], dist: ["តូច", "សាលា"] },
  { c: "places", d: 2, t: "The school is near here.", p: "Sala rien nov chit nih", w: ["សាលារៀន", "នៅ", "ជិត", "នេះ"], dist: ["ឆ្ងាយ", "នោះ"] },
  { c: "places", d: 2, t: "The temple is very quiet.", p: "Vot sngat nas", w: ["វត្ត", "ស្ងាត់", "ណាស់"], dist: ["អ៊ូអរ", "ទៅ"] },
  { c: "places", d: 2, t: "The bank is open today.", p: "Thneakear baek thngai nih", w: ["ធនាគារ", "បើក", "ថ្ងៃនេះ"], dist: ["បិទ", "លុយ"] },
  { c: "places", d: 2, t: "This hotel is expensive.", p: "Santhakear nih thlai nas", w: ["សណ្ឋាគារ", "នេះ", "ថ្លៃ", "ណាស់"], dist: ["ថោក", "បន្ទប់"] },
  { c: "shopping", d: 2, t: "I want to buy milk.", p: "Knhom chong tinh teuk doh ko", w: ["ខ្ញុំ", "ចង់", "ទិញ", "ទឹកដោះគោ"], dist: ["លក់", "ផឹក"] },
  { c: "shopping", d: 2, t: "Apples are sweet.", p: "Plae pom ph-aem", w: ["ផ្លែប៉ោម", "ផ្អែម"], dist: ["ជូរ", "ទិញ"] },
  { c: "shopping", d: 2, t: "The bread is warm.", p: "Num pang kdav", w: ["នំប៉័ង", "ក្តៅ"], dist: ["ត្រជាក់", "ឆ្ងាញ់"] },
  { c: "shopping", d: 2, t: "I need to pay money.", p: "Knhom trov bang luy", w: ["ខ្ញុំ", "ត្រូវ", "បង់", "លុយ"], dist: ["យក", "ច្រើន"] },
  { c: "shopping", d: 2, t: "Water is cheap here.", p: "Teuk thaok nov ti nih", w: ["ទឹក", "ថោក", "នៅ", "ទីនេះ"], dist: ["ថ្លៃ", "នោះ"] },
  { c: "food", d: 2, t: "I like drinking coffee.", p: "Knhom choul chett phok kafe", w: ["ខ្ញុំ", "ចូលចិត្ត", "ផឹក", "កាហ្វេ"], dist: ["តែ", "ញ៉ាំ"] },
  { c: "food", d: 2, t: "The soup is tasty.", p: "Somlor chnganh", w: ["សម្ល", "ឆ្ងាញ់"], dist: ["មិនឆ្ងាញ់", "ទឹក"] },
  { c: "food", d: 2, t: "The rice is cooked.", p: "Bay ch-en heuy", w: ["បាយ", "ឆ្អិន", "ហើយ"], dist: ["ឆៅ", "អង្ករ"] },
  { c: "food", d: 2, t: "Fried fish is delicious.", p: "Trei chien chnganh", w: ["ត្រី", "ចៀន", "ឆ្ងាញ់"], dist: ["អាំង", "ហឹរ"] },
  { c: "food", d: 2, t: "Ice cream is cold.", p: "Karem trocheak nas", w: ["ការ៉េម", "ត្រជាក់", "ណាស់"], dist: ["ក្តៅ", "ទឹកកក"] },
  { c: "emotions", d: 2, t: "I am happy today.", p: "Knhom sabbay chett nas", w: ["ខ្ញុំ", "សប្បាយចិត្ត", "ណាស់"], dist: ["កើតទុក្ខ", "យំ"] },
  { c: "emotions", d: 2, t: "She is sad.", p: "Neang kert touk", w: ["នាង", "កើតទុក្ខ"], dist: ["សប្បាយ", "ណាស់"] },
  { c: "emotions", d: 2, t: "He is angry.", p: "Koat kheng", w: ["គាត់", "ខឹង"], dist: ["សើច", "ខ្លាំង"] },
  { c: "emotions", d: 2, t: "We are excited.", p: "Yeang rum pheub", w: ["យើង", "រំភើប"], dist: ["ធុញ", "ណាស់"] },
  { c: "emotions", d: 2, t: "I feel sick.", p: "Knhom mean arom tha chheu", w: ["ខ្ញុំ", "មានអារម្មណ៍ថា", "ឈឺ"], dist: ["ជា", "ថ្នាំ"] },
  { c: "travel", d: 2, t: "I drive a car.", p: "Knhom baek lan", w: ["ខ្ញុំ", "បើក", "ឡាន"], dist: ["ម៉ូតូ", "ជិះ"] },
  { c: "travel", d: 2, t: "Walk fast please.", p: "Som daer leun leun", w: ["សូម", "ដើរ", "លឿនៗ"], dist: ["យឺតៗ", "ឈប់"] },
  { c: "travel", d: 2, t: "Turn left here.", p: "Bot chveng ti nih", w: ["បត់", "ឆ្វេង", "ទីនេះ"], dist: ["ស្តាំ", "នោះ"] },
  { c: "travel", d: 2, t: "Turn right there.", p: "Bot sdam ti noh", w: ["បត់", "ស្តាំ", "ទីនោះ"], dist: ["ឆ្វេង", "នេះ"] },
  { c: "travel", d: 2, t: "Stop the car here.", p: "Chhob lan ti nih", w: ["ឈប់", "ឡាន", "ទីនេះ"], dist: ["ទៅ", "នោះ"] },
  { c: "work", d: 2, t: "I write a letter.", p: "Knhom sorsay sombot", w: ["ខ្ញុំ", "សរសេរ", "សំបុត្រ"], dist: ["អាន", "សៀវភៅ"] },
  { c: "work", d: 2, t: "We speak Khmer language.", p: "Yeang niyeay phasa khmer", w: ["យើង", "និយាយ", "ភាសាខ្មែរ"], dist: ["អង់គ្លេស", "សរសេរ"] },
  { c: "work", d: 2, t: "I ask a question.", p: "Knhom suor somnour", w: ["ខ្ញុំ", "សួរ", "សំណួរ"], dist: ["ឆ្លើយ", "ចម្លើយ"] },
  { c: "work", d: 2, t: "Students learn every day.", p: "Sish rien roal thngai", w: ["សិស្ស", "រៀន", "រាល់ថ្ងៃ"], dist: ["គ្រូ", "យប់"] },
  { c: "work", d: 2, t: "This exam is hard.", p: "Kar brolong nih pibak", w: ["ការប្រឡង", "នេះ", "ពិបាក"], dist: ["ស្រួល", "រៀន"] },
  { c: "time", d: 2, t: "Today is Monday.", p: "Thngai nih cha thngai chann", w: ["ថ្ងៃនេះ", "ជា", "ថ្ងៃចន្ទ"], dist: ["ម្សិលមិញ", "ខែ"] },
  { c: "time", d: 2, t: "Good morning.", p: "A-roun suosdey", w: ["អរុណ", "សួស្តី"], dist: ["ទិវា", "លា"] },
  { c: "time", d: 2, t: "The afternoon is hot.", p: "Pel ro-siel kdav nas", w: ["ពេលរសៀល", "ក្តៅ", "ណាស់"], dist: ["ព្រឹក", "ភ្លៀង"] },
  { c: "time", d: 2, t: "The evening is cool.", p: "Pel lngeach trocheak", w: ["ពេលល្ងាច", "ត្រជាក់"], dist: ["យប់", "ងងឹត"] },
  { c: "time", d: 2, t: "Happy New Year!", p: "Sabbay chnam thmei", w: ["សប្បាយ", "ឆ្នាំ", "ថ្មី"], dist: ["ចាស់", "ថ្ងៃ"] },
];

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export default function KhmerSentenceBuilder() {
  const { text: t } = useLanguage();
  const [screen, setScreen] = useState<"setup" | "game" | "done">("setup");
  const [playerName, setPlayerName] = useToolState("ksb:name", "Sokha");
  const [playerAge, setPlayerAge] = useToolState("ksb:age", "10");
  const [selectedCats, setSelectedCats] = useToolState<string[]>("ksb:cats", CATEGORIES.map((c) => c.id));
  const [difficulty, setDifficulty] = useToolState("ksb:diff", "all");
  const [showPhonetic, setShowPhonetic] = useState(false);

  const [playlist, setPlaylist] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [showWin, setShowWin] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [hinted, setHinted] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  // Floating physics word objects
  interface FloatWord { id: string; text: string; x: number; y: number; vx: number; vy: number; w: number; h: number; dragging: boolean; placed: boolean }
  const [floatWords, setFloatWords] = useState<FloatWord[]>([]);
  const floatRef = useRef<FloatWord[]>([]);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ id: string; ox: number; oy: number; startX: number; startY: number } | null>(null);
  const draggedToStrip = useRef(false);

  const curSentence = playlist[currentIdx];

  function startGame() {
    let filtered = ALL_SENTENCES.filter((s) => selectedCats.includes(s.c));
    if (difficulty !== "all") filtered = filtered.filter((s) => s.d === parseInt(difficulty));
    if (filtered.length < 5) filtered = ALL_SENTENCES.filter((s) => selectedCats.includes(s.c));
    const list = shuffle(filtered).slice(0, 10);
    setPlaylist(list);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setPlaced([]);
    setScreen("game");
    setShowWin(false);
  }

  useEffect(() => {
    if (!curSentence || screen !== "game") return;
    const allWords = shuffle([...curSentence.w, ...curSentence.dist]);
    const words: FloatWord[] = allWords.map((text, i) => ({
      id: `fw-${i}-${Date.now()}`, text, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, dragging: false, placed: false,
    }));
    setFloatWords(words);
    setPlaced([]);
    setShowWin(false);
    setHinted(null);
    draggedToStrip.current = false;
    floatRef.current = words;
    cancelAnimationFrame(animRef.current);
  }, [currentIdx, screen]);

  // Physics loop
  useEffect(() => {
    if (screen !== "game" || floatWords.length === 0) return;
    let running = true;
    function tick() {
      if (!running) return;
      const arena = arenaRef.current;
      if (!arena) { animRef.current = requestAnimationFrame(tick); return; }
      const aw = arena.clientWidth || 400, ah = arena.clientHeight || 220;
      setFloatWords((prev) => {
        const next = prev.map((w) => {
          if (w.dragging || w.placed) return w;
          let { x, y, vx, vy } = w;
          x += vx; y += vy;
          if (x <= 2) { x = 2; vx = Math.abs(vx); }
          if (y <= 2) { y = 2; vy = Math.abs(vy); }
          if (x + w.w >= aw - 2) { x = aw - w.w - 2; vx = -Math.abs(vx); }
          if (y + w.h >= ah - 2) { y = ah - w.h - 2; vy = -Math.abs(vy); }
          return { ...w, x, y, vx, vy };
        });
        floatRef.current = next;
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [screen, floatWords.length]);

  // Initialize positions after mount (need DOM measurements)
  useEffect(() => {
    if (screen !== "game" || floatWords.length === 0) return;
    const arena = arenaRef.current;
    if (!arena) return;
    const aw = arena.clientWidth || 400, ah = arena.clientHeight || 220;
    const t = setTimeout(() => {
      setFloatWords((prev) => prev.map((w) => {
        const estW = Math.max(w.text.length * 18 + 40, 80);
        const estH = 44;
        const x = 10 + Math.random() * Math.max(10, aw - estW - 20);
        const y = 10 + Math.random() * Math.max(10, ah - estH - 20);
        return { ...w, x, y, vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.8, w: estW, h: estH };
      }));
    }, 20);
    return () => clearTimeout(t);
  }, [floatWords.length, screen]);

  // Pointer handlers
  function onPointerDown(e: React.PointerEvent, fw: FloatWord) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    dragRef.current = { id: fw.id, ox, oy, startX: fw.x, startY: fw.y };
    setFloatWords((prev) => prev.map((w) => w.id === fw.id ? { ...w, dragging: true } : w));
  }

  function onPointerMove(e: React.PointerEvent, fw: FloatWord) {
    if (!dragRef.current || dragRef.current.id !== fw.id) return;
    const arena = arenaRef.current;
    if (!arena) return;
    const aRect = arena.getBoundingClientRect();
    const nx = e.clientX - aRect.left - dragRef.current.ox;
    const ny = e.clientY - aRect.top - dragRef.current.oy;
    setFloatWords((prev) => prev.map((w) => w.id === fw.id ? { ...w, x: nx, y: ny } : w));

    // Check if over sentence strip
    const strip = stripRef.current;
    if (strip) {
      const sRect = strip.getBoundingClientRect();
      const over = e.clientX >= sRect.left && e.clientX <= sRect.right && e.clientY >= sRect.top && e.clientY <= sRect.bottom;
      setDragOver(over);
      if (over) draggedToStrip.current = true;
    }
  }

  function onPointerUp(e: React.PointerEvent, fw: FloatWord) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.releasePointerCapture(e.pointerId);
    setDragOver(false);
    const wasOver = draggedToStrip.current;
    draggedToStrip.current = false;

    if (wasOver) {
      placeWord(fw);
    } else {
      setFloatWords((prev) => prev.map((w) =>
        w.id === fw.id ? { ...w, dragging: false, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 } : w
      ));
    }
    dragRef.current = null;
  }

  function placeWord(fw: FloatWord) {
    const nextWord = curSentence.w[placed.length];
    if (fw.text !== nextWord) {
      playBeep(200, 0.3);
      setWobble(true);
      setTimeout(() => setWobble(false), 500);
      setFloatWords((prev) => prev.map((w) =>
        w.id === fw.id ? { ...w, dragging: false, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 } : w
      ));
      return;
    }
    playBeep(600, 0.1);
    setPlaced((p) => [...p, fw.text]);
    setFloatWords((prev) => prev.map((w) => w.id === fw.id ? { ...w, placed: true, dragging: false } : w));
  }

  function removeWord(idx: number) {
    const word = placed[idx];
    setPlaced((p) => p.filter((_, i) => i !== idx));
    // Return word to floating arena
    const arena = arenaRef.current;
    const aw = arena?.clientWidth || 400;
    const ah = arena?.clientHeight || 220;
    setFloatWords((prev) => {
      const fw = prev.find((w) => w.text === word && w.placed);
      if (!fw) return prev;
      return prev.map((w) => w.id === fw.id ? {
        ...w, placed: false, x: aw / 2 - 40 + (Math.random() * 40 - 20), y: ah / 2 - 20 + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
      } : w);
    });
  }
  function clearStrip() {
    const words = [...placed];
    setPlaced([]);
    const arena = arenaRef.current;
    const aw = arena?.clientWidth || 400, ah = arena?.clientHeight || 220;
    setFloatWords((prev) => prev.map((w) => {
      if (words.includes(w.text) && w.placed && prev.filter((x) => x.text === w.text && x.placed).length <= 1) {
        return { ...w, placed: false, x: aw / 2 - 40 + Math.random() * 80 - 40, y: ah / 2 - 20 + Math.random() * 40 - 20, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 };
      }
      return w;
    }));
  }
  function checkAnswer() {
    if (placed.length !== curSentence.w.length) return;
    const correct = curSentence.w.join(" ") === placed.join(" ");
    if (correct) {
      setStreak((s) => s + 1);
      setScore((s) => s + 100 * curSentence.d + (streak + 1) * 10);
      setShowWin(true);
    } else {
      setStreak(0);
      setWobble(true);
      setTimeout(() => setWobble(false), 500);
      playBeep(150, 0.4);
    }
  }

  function nextSentence() {
    setShowWin(false);
    if (currentIdx + 1 >= playlist.length) {
      setScreen("done");
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  function showHint() {
    const nextWord = curSentence.w[placed.length];
    if (!nextWord) return;
    setHinted(nextWord);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHinted(null), 1500);
  }

  const soundRef = useRef<AudioContext | null>(null);
  function playBeep(freq: number, dur: number) {
    try {
      if (!soundRef.current) soundRef.current = new AudioContext();
      const ctx = soundRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch { /* ignore audio errors */ }
  }

  const toggleCat = useCallback((id: string) => {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }, []);

  if (screen === "done") {
    return (
      <ToolShell title="Khmer Sentence Builder" khmerTitle="ល្បែងផ្គុំល្បះខ្មែរ" description="Interactive Khmer sentence building game — drag or tap words to assemble sentences and learn Khmer vocabulary." descriptionKm="ល្បែងផ្គុំពាក្យខ្មែរ — អូស ឬចុចពាក្យដើម្បីផ្គុំល្បះនិងរៀនវាក្យសព្ទខ្មែរ។">
        <div className="mx-auto max-w-sm rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
          <div className="mb-3 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]"><Award size={32} /></div>
          <h2 className="mb-1 text-xl font-bold text-[var(--ink)]">{t("Session Complete!", "ចប់ហើយ!")}</h2>
          <p className="mb-5 text-sm text-[var(--ink-dim)]">{t("Great job practicing Khmer!", "ពូកែណាស់!")}</p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="text-[10px] text-[var(--ink-faint)]">{t("Score", "ពិន្ទុ")}</div><div className="text-2xl font-bold text-[var(--gold)]">{score}</div></div>
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="text-[10px] text-[var(--ink-faint)]">{t("Sentences", "ល្បះ")}</div><div className="text-2xl font-bold text-[var(--success)]">{currentIdx}</div></div>
          </div>
          <button onClick={() => setScreen("setup")} className="w-full rounded-lg bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
            {t("Back to Menu", "ត្រឡប់ទៅម៉ឺនុយ")}
          </button>
        </div>
      </ToolShell>
    );
  }

  if (screen === "setup") {
    return (
      <ToolShell title="Khmer Sentence Builder" khmerTitle="ល្បែងផ្គុំល្បះខ្មែរ" description="Interactive Khmer sentence building game." descriptionKm="ល្បែងផ្គុំពាក្យខ្មែរអន្តរកម្ម។">
        <div className="mx-auto max-w-lg space-y-5">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]"><Flag size={14} /> {t("Player Info", "ព័ត៌មានអ្នកលេង")}</div>
            <div className="grid grid-cols-3 gap-3">
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="col-span-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" placeholder={t("Nickname", "ឈ្មោះ")} />
              <input type="number" value={playerAge} onChange={(e) => setPlayerAge(e.target.value)} min={4} max={99} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-center text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" placeholder={t("Age", "អាយុ")} />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]"><Gauge size={14} /> {t("Difficulty", "កម្រិត")}</div>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: "all", l: t("Mixed", "ចម្រុះ"), c: "text-[var(--ink)]" }, { v: "1", l: t("Beginner", "ងាយ"), c: "text-[var(--success)]" }, { v: "3", l: t("Advanced", "ពិបាក"), c: "text-[var(--danger)]" }].map((d) => (
                <button key={d.v} type="button" onClick={() => setDifficulty(d.v)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${difficulty === d.v ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>{d.l}</button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]"><Tag size={14} /> {t("Topics", "ប្រធានបទ")}</div>
              <div className="flex gap-2 text-[11px]">
                <button type="button" onClick={() => setSelectedCats(CATEGORIES.map((c) => c.id))} className="text-[var(--gold)] hover:underline">{t("All", "ទាំងអស់")}</button>
                <button type="button" onClick={() => setSelectedCats([])} className="text-[var(--ink-faint)] hover:underline">{t("None", "គ្មាន")}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const sel = selectedCats.includes(cat.id);
                return (
                  <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${sel ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>
                    <Icon size={14} /> {cat.name.split(" (")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={startGame} disabled={selectedCats.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-3 text-sm font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
            <Play size={16} /> {t("Start Game", "ចាប់ផ្តើមលេង")}
          </button>
        </div>
      </ToolShell>
    );
  }

  // GAME SCREEN
  if (!curSentence) return null;
  const catInfo = CATEGORIES.find((c) => c.id === curSentence.c);

  return (
    <ToolShell title="Khmer Sentence Builder" khmerTitle="ល្បែងផ្គុំល្បះខ្មែរ" description="Interactive Khmer sentence building game." descriptionKm="ល្បែងផ្គុំពាក្យខ្មែរអន្តរកម្ម។">
      {/* Header strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2.5 text-xs sm:text-sm">
        <button type="button" onClick={() => { setScreen("setup"); }} className="rounded-lg p-1.5 text-[var(--ink-faint)] hover:bg-[var(--ground)]" title={t("Quit", "ចេញ")}><LogOut size={14} /></button>
        <span className="font-bold text-[var(--ink)]">{playerName}</span>
        <span className="ml-auto font-mono-ui text-[var(--ink-dim)]">{currentIdx + 1}/{playlist.length}</span>
        <span className="rounded-md bg-[var(--gold)]/10 px-2 py-0.5 font-mono-ui font-bold text-[var(--gold)]">{score}</span>
        <span className="rounded-md bg-[var(--danger)]/10 px-2 py-0.5 font-mono-ui font-bold text-[var(--danger)]">{streak}</span>
        <button type="button" onClick={() => setShowPhonetic(!showPhonetic)} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${showPhonetic ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "text-[var(--ink-faint)]"}`}><Languages size={14} /></button>
        <button type="button" onClick={showHint} className="rounded-lg bg-[var(--gold)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--gold)]"><Lightbulb size={14} /></button>
      </div>

      {/* Sentence target */}
      <div className={`rounded-xl border p-4 transition ${wobble ? "border-[var(--danger)] animate-pulse" : "border-[var(--ground-line)]"} bg-[var(--ground-raised)]`}>
        <div className="mb-2 flex items-center gap-2">
          {catInfo && <span className="inline-flex items-center gap-1 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-dim)]"><catInfo.icon size={12} /> {catInfo.name.split(" (")[0]}</span>}
          <div className="flex gap-0.5">{Array.from({ length: 3 }, (_, i) => <Star key={i} size={12} className={i < curSentence.d ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--ink-faint)]"} />)}</div>
        </div>
        <div className="text-lg font-bold text-[var(--ink)]">"{curSentence.t}"</div>
        {showPhonetic && <div className="mt-1 font-mono-ui text-xs italic text-[var(--gold)]">({curSentence.p})</div>}

        {/* Sentence strip (drop target) */}
        <div ref={stripRef}
          className={`mt-3 flex min-h-[52px] flex-wrap gap-2 rounded-lg border-2 border-dashed p-2 transition ${dragOver ? "border-[var(--gold)] bg-[var(--gold)]/15" : placed.length === 0 ? "border-[var(--ground-line)]" : "border-[var(--gold)]/40 bg-[var(--gold)]/5"}`}>
          {placed.length === 0 && !dragOver && <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]"><MousePointerClick size={13} /> {t("Drag words here", "អូសពាក្យមកទីនេះ")}</span>}
          {dragOver && placed.length === 0 && <span className="text-xs font-bold text-[var(--gold)]">{t("Drop word here!", "ទម្លាក់ពាក្យនៅទីនេះ!")}</span>}
          {placed.map((w, i) => (
            <button key={`${w}-${i}`} type="button" onClick={() => removeWord(i)}
              className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/15 px-3 py-1.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--danger)]/20 hover:border-[var(--danger)]/50">
              {w} <span className="ml-1 text-[10px] text-[var(--danger)]">✕</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={clearStrip} className="flex items-center gap-1 rounded-lg border border-[var(--ground-line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--danger)]"><RotateCcw size={12} /> {t("Clear", "សម្អាត")}</button>
          <button type="button" onClick={checkAnswer} className="flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#0a0c0d] hover:bg-[var(--gold-dim)]"><CheckCircle size={14} /> {t("Check", "ពិនិត្យ")}</button>
        </div>
      </div>

      {/* Floating words arena */}
      <div ref={arenaRef} className="relative mt-4 overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground)]" style={{ minHeight: "200px", touchAction: "none" }}>
        {/* Background watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
          <span className="font-khmer text-[8rem] font-bold text-[var(--ink)]">ខ្មែរ</span>
        </div>
        {floatWords.filter((fw) => !fw.placed).map((fw) => {
          const isHinted = hinted === fw.text;
          return (
            <div key={fw.id}
              onPointerDown={(e) => onPointerDown(e, fw)}
              onPointerMove={(e) => onPointerMove(e, fw)}
              onPointerUp={(e) => onPointerUp(e, fw)}
              className={`absolute cursor-grab select-none rounded-2xl border px-4 py-2.5 text-sm font-bold transition-shadow ${
                fw.dragging
                  ? "z-[100] scale-110 border-[var(--gold)] bg-[var(--ground-raised-hi)] shadow-xl"
                  : isHinted
                  ? "z-[20] border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)] shadow-[0_0_15px_rgba(212,162,76,0.5)]"
                  : "z-10 border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold)]/40 hover:shadow-md"
              }`}
              style={{
                left: fw.x,
                top: fw.y,
                transition: "border-color 0.15s, background-color 0.15s, box-shadow 0.15s",
              }}
            >{fw.text}</div>
          );
        })}
      </div>

      {/* Win modal */}
      {showWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowWin(false)}>
          <div className="w-full max-w-xs rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]"><Award size={28} /></div>
            <h2 className="mb-1 text-lg font-bold text-[var(--gold)]">{t("Correct!", "ត្រឹមត្រូវណាស់!")}</h2>
            <div className="mb-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3 font-bold text-[var(--ink)]">{curSentence.w.join(" ")}</div>
            <button onClick={nextSentence} className="w-full rounded-lg bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
              {currentIdx + 1 < playlist.length ? t("Next Sentence", "ល្បះបន្ទាប់") : t("Finish", "បញ្ចប់")}
            </button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
