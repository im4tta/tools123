import { ImageResponse } from "next/og";
import { SITE_DOMAIN } from "@/lib/site";

export const alt = "123 Toolbox — free browser-based tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0c0d",
          backgroundImage: "radial-gradient(#1c2023 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          color: "#f5f2ea",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 160,
              borderRadius: 40,
              background: "#0a0c0d",
              border: "2px solid #c9a24b",
              color: "#c9a24b",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -4,
            }}
          >
            123
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: "#f5f2ea" }}>123 Toolbox</div>
            <div style={{ fontSize: 30, color: "#a8b0b8" }}>Free browser-based tools</div>
            <div style={{ fontSize: 28, color: "#c9a24b", fontWeight: 600 }}>{SITE_DOMAIN}</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
