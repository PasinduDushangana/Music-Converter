import ipaddr from "ipaddr.js";

const maxBytes = 100 * 1024 * 1024;
const extensions = new Set([
  "mp3",
  "wav",
  "m4a",
  "aac",
  "flac",
  "ogg",
  "oga",
  "mp4",
  "m4v",
  "webm",
]);

export function validateBrowserMediaUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid direct media URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Only public HTTP or HTTPS media URLs are supported.");
  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
  if (
    !hostname.includes(".") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  )
    throw new Error("Local or private media addresses are not supported.");
  if (/(?:^|\.)(?:youtube\.com|youtu\.be)$/.test(hostname))
    throw new Error(
      "YouTube pages are not direct media files. Use official playback instead.",
    );
  if (ipaddr.isValid(hostname) && ipaddr.parse(hostname).range() !== "unicast")
    throw new Error(
      "Private or restricted network addresses are not supported.",
    );
  const name = decodeURIComponent(url.pathname.split("/").pop() || "")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .slice(0, 100);
  if (!extensions.has(name.split(".").pop()?.toLowerCase() || ""))
    throw new Error(
      "The direct link must end with a supported media extension.",
    );
  return { url, name };
}

export async function fetchBrowserMedia(raw: string) {
  const { url, name } = validateBrowserMediaUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
      });
    } catch {
      throw new Error(
        "This source did not allow a browser download. Use a CORS-enabled direct media link or upload the file.",
      );
    }
    if (!response.ok)
      throw new Error("The media server did not return a downloadable file.");
    const type =
      response.headers.get("content-type")?.split(";")[0].toLowerCase() || "";
    if (!(
      type.startsWith("audio/") ||
      type.startsWith("video/") ||
      type === "application/octet-stream" ||
      type === "application/ogg" ||
      type === "application/mp4"
    ))
      throw new Error("This URL does not point to a supported media file.");
    if (Number(response.headers.get("content-length") || 0) > maxBytes)
      throw new Error("Direct URL files must be 100 MB or smaller.");
    if (!response.body)
      throw new Error("The browser could not read this media response.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error("Direct URL files must be 100 MB or smaller.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    if (!total) throw new Error("The media file is empty.");
    return new File(chunks as BlobPart[], name, { type });
  } finally {
    clearTimeout(timer);
  }
}
