import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import ipaddr from "ipaddr.js";
import type { IncomingMessage } from "node:http";
const MAX_BYTES = 4 * 1024 * 1024;
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
export class MediaError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function validateUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new MediaError("Enter a valid direct media URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  )
    throw new MediaError("Only public HTTP or HTTPS URLs are supported.");
  if (
    /(?:^|\.)youtube\.com$|(?:^|\.)youtu\.be$/.test(url.hostname.toLowerCase())
  )
    throw new MediaError(
      "YouTube pages are not direct media files. Use official playback or metadata instead.",
    );
  if (
    !url.hostname.includes(".") ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".internal")
  )
    throw new MediaError("Private or local addresses are not allowed.");
  return url;
}
function publicIp(ip: string) {
  try {
    return ipaddr.parse(ip).range() === "unicast";
  } catch {
    return false;
  }
}
async function safeAddresses(hostname: string) {
  if (ipaddr.isValid(hostname))
    throw new MediaError(
      "Use a public media hostname instead of an IP address.",
    );
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((a) => !publicIp(a.address)))
    throw new MediaError(
      "This address resolves to a private or restricted network.",
    );
  return addresses;
}
function fetchOnce(
  url: URL,
  address: string,
  family: number,
): Promise<{ response: IncomingMessage; data: Buffer }> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: "GET",
        lookup: (_host, _options, callback) => callback(null, address, family),
        headers: {
          "User-Agent": "SONIX/1.0 direct-media-fetch",
          Accept: "audio/*,video/*,application/octet-stream",
        },
        timeout: 10000,
        maxHeaderSize: 16384,
      },
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
          response.resume();
          resolve({ response, data: Buffer.alloc(0) });
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new MediaError(
              "The media server did not return a downloadable file.",
              422,
            ),
          );
          return;
        }
        const size = Number(response.headers["content-length"] || 0);
        if (size > MAX_BYTES) {
          response.destroy();
          reject(
            new MediaError("Direct URL files must be 4 MB or smaller.", 413),
          );
          return;
        }
        const type = String(response.headers["content-type"] || "")
          .split(";")[0]
          .toLowerCase();
        const ext = url.pathname.split(".").pop()?.toLowerCase() || "";
        if (!(
          type.startsWith("audio/") ||
          type.startsWith("video/") ||
          type === "application/ogg" ||
          type === "application/mp4" ||
          (type === "application/octet-stream" && extensions.has(ext))
        )) {
          response.resume();
          reject(
            new MediaError(
              "This URL does not point to a supported media file.",
              415,
            ),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        response.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_BYTES) {
            response.destroy();
            reject(
              new MediaError("Direct URL files must be 4 MB or smaller.", 413),
            );
          } else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({ response, data: Buffer.concat(chunks) }),
        );
        response.on("error", reject);
      },
    );
    request.on("timeout", () =>
      request.destroy(
        new MediaError("The media server took too long to respond.", 504),
      ),
    );
    request.on("error", reject);
    request.end();
  });
}
export async function fetchMedia(raw: string) {
  let url = validateUrl(raw);
  for (let redirects = 0; redirects < 3; redirects++) {
    const addresses = await safeAddresses(url.hostname);
    const { response, data } = await fetchOnce(
      url,
      addresses[0].address,
      addresses[0].family,
    );
    const status = response.statusCode || 0;
    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = response.headers.location;
      if (!location)
        throw new MediaError(
          "The media URL redirected without a destination.",
          422,
        );
      url = validateUrl(new URL(location, url).toString());
      continue;
    }
    const contentType = String(
      response.headers["content-type"] || "application/octet-stream",
    ).split(";")[0];
    const basename =
      decodeURIComponent(url.pathname.split("/").pop() || "remote-media.mp3")
        .replace(/[^a-zA-Z0-9._ -]/g, "_")
        .slice(0, 100) || "remote-media.mp3";
    if (!extensions.has(basename.split(".").pop()?.toLowerCase() || ""))
      throw new MediaError(
        "The direct media link must end with a supported file extension.",
        415,
      );
    return { data, contentType, basename };
  }
  throw new MediaError("Too many redirects from the media URL.", 422);
}
