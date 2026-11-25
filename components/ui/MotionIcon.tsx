"use client";
// Animated icon from Jiggicons (jiggicons.com, by Adrian Abelarde): the 80 free icons in the jiggicons-react package,
// used under the Jiggicons licence (free icons, no credit required; not offered for download). The icon moves on hover
// or focus (and stays still under prefers-reduced-motion); it plays its sound when pressed, only if the visitor turned
// on "Icon sounds" in Settings. `autoplay` plays it once when it appears (used for success moments).
import type { JiggiconComponent } from "jiggicons-react";
import { useIconSound } from "@/lib/icon-sound";

export function MotionIcon({
  icon: Icon,
  size = 16,
  filled = false,
  autoplay = false,
  className,
}: {
  icon: JiggiconComponent;
  size?: number;
  filled?: boolean;
  autoplay?: boolean;
  className?: string;
}) {
  const sound = useIconSound();
  return <Icon size={size} variant={filled ? "solid" : "outline"} animate={autoplay ? "mount" : "hover"} sound={sound} volume={0.4} className={className} />;
}
