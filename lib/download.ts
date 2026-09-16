// Shared, mobile-robust file download helpers.
//
// Rolling a bespoke `<a download>` per tool breaks on mobile in three ways that
// this module fixes in one place:
//   1. A detached anchor's `.click()` is ignored by several mobile browsers —
//      the anchor must be in the DOM.
//   2. iOS Safari ignores the `download` attribute on `data:` URLs and opens
//      them inline instead of saving, so the user never gets a file. We convert
//      data URLs to a Blob and download a `blob:` URL instead.
//   3. Revoking the object URL synchronously after `.click()` can abort an
//      in-flight download on mobile, so revocation is deferred.

/** Trigger a download for an existing URL (blob:, http(s):, …). The caller owns
 *  revoking any object URL it created (downloadBlob does this for you). */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 0);
}

/** Download a Blob via a blob: URL, deferring revocation so mobile browsers
 *  have time to read it. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Download from a data: URL (e.g. `canvas.toDataURL(...)`). Converts to a Blob
 *  first because iOS Safari opens data: URLs inline instead of saving them. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  if (blob) downloadBlob(blob, filename);
  else downloadUrl(dataUrl, filename);
}

/** Convert a data: URL to a Blob. Returns null if it cannot be parsed. */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (!dataUrl.startsWith("data:") || comma === -1) return null;
    const header = dataUrl.slice(5, comma);
    const body = dataUrl.slice(comma + 1);
    const mime = header.split(";")[0] || "application/octet-stream";
    if (/;base64/i.test(header)) {
      const binary = atob(body);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(body)], { type: mime });
  } catch {
    return null;
  }
}
