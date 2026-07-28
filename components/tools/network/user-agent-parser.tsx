"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function UserAgentParser() {
  const [ua, setUa] = useToolState("user-agent-parser:ua", typeof navigator !== "undefined" ? navigator.userAgent : "");

  const info = useMemo(() => {
    const browser =
      /Edg\//.test(ua) ? "Edge" :
      /OPR\//.test(ua) ? "Opera" :
      /Chrome\//.test(ua) && !/Chromium/.test(ua) ? "Chrome" :
      /Firefox\//.test(ua) ? "Firefox" :
      /Safari\//.test(ua) && !/Chrome/.test(ua) ? "Safari" : "Unknown";
    const os =
      /Windows NT/.test(ua) ? "Windows" :
      /Mac OS X/.test(ua) ? "macOS" :
      /Android/.test(ua) ? "Android" :
      /iPhone|iPad|iPod/.test(ua) ? "iOS" :
      /Linux/.test(ua) ? "Linux" : "Unknown";
    const mobile = /Mobi|Android|iPhone/.test(ua);
    return { browser, os, mobile };
  }, [ua]);

  return (
    <ToolShell title="User-Agent String Parser" description="Roughly identifies browser, operating system, and device type from a UA string.">
      <Field label="User-Agent string"><TextArea rows={3} value={ua} onChange={(e) => setUa(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Browser" value={info.browser} />
      <Output label="Operating system" value={info.os} />
      <Output label="Device" value={info.mobile ? "Mobile" : "Desktop"} />
    </ToolShell>
  );
}
