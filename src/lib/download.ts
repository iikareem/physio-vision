/** Trigger a browser download (or open) for a fetched Blob with clear UX fallbacks. */

export type DownloadResult =
  | { ok: true; mode: "download" | "open" }
  | { ok: false; error: string };

function isProbablyPdf(fileName: string, contentType?: string | null) {
  const name = fileName.toLowerCase();
  const type = (contentType || "").toLowerCase();
  return name.endsWith(".pdf") || type.includes("pdf");
}

export async function saveBlobAsFile(
  blob: Blob,
  fileName: string,
): Promise<DownloadResult> {
  try {
    const url = URL.createObjectURL(blob);
    const pdf = isProbablyPdf(fileName, blob.type);
    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/i.test(navigator.userAgent);

    // iOS Safari often ignores the download attribute — open instead.
    if (isIOS || pdf) {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return { ok: true, mode: "open" };
      }
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "document";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Keep the URL alive briefly in case the browser queues the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { ok: true, mode: "download" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Download failed",
    };
  }
}
