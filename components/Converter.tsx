"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownToLine,
  AudioLines,
  Check,
  CircleAlert,
  Clock3,
  FileAudio2,
  Globe2,
  Link2,
  LockKeyhole,
  LoaderCircle,
  Music2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { fetchFile as FetchFile } from "@ffmpeg/util";
type Status = "queued" | "converting" | "done" | "error";
type Item = {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
  outputUrl?: string;
  bitrate: number;
  duration?: number;
};
type History = { name: string; bitrate: number; date: string };
const MAX_FILE = 100 * 1024 * 1024;
const supported = new Set([
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
const fmtSize = (n: number) =>
  n >= 1048576
    ? `${(n / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;
const nameOf = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[\x00-\x1f<>:"/\\|?*]/g, "_")
    .slice(0, 100) || "sonix-audio";
export default function Converter() {
  const [items, setItems] = useState<Item[]>([]),
    [bitrate, setBitrate] = useState(192),
    [url, setUrl] = useState(""),
    [busyUrl, setBusyUrl] = useState(false),
    [error, setError] = useState(""),
    [drag, setDrag] = useState(false),
    [history, setHistory] = useState<History[]>([]),
    [active, setActive] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null),
    ff = useRef<FFmpeg | null>(null),
    working = useRef(false),
    canceled = useRef(false),
    itemsRef = useRef<Item[]>([]),
    mounted = useRef(true);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHistory(JSON.parse(localStorage.getItem("sonix-history") || "[]"));
      } catch {}
    });
    return () => {
      mounted.current = false;
      ff.current?.terminate();
      itemsRef.current.forEach((i) => {
        if (i.outputUrl) URL.revokeObjectURL(i.outputUrl);
      });
    };
  }, []);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const update = useCallback(
    (id: string, patch: Partial<Item>) =>
      setItems((old) => old.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [],
  );
  const addFiles = useCallback(
    (files: File[]) => {
      setError("");
      const valid: Item[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (!supported.has(ext)) {
          setError(
            `Unsupported file: ${file.name}. Choose MP3, WAV, M4A, AAC, FLAC, OGG, MP4 or WebM.`,
          );
          continue;
        }
        if (file.size > MAX_FILE) {
          setError(`${file.name} is over the 100 MB browser limit.`);
          continue;
        }
        if (!file.size) {
          setError(`${file.name} is empty.`);
          continue;
        }
        valid.push({
          id: crypto.randomUUID(),
          file,
          status: "queued",
          progress: 0,
          bitrate,
        });
      }
      setItems((old) => [...old, ...valid]);
    },
    [bitrate],
  );
  async function importUrl() {
    setError("");
    setBusyUrl(true);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not fetch this media URL." }));
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const filename = decodeURIComponent(
        res.headers.get("X-Media-Name") || "remote-media.mp3",
      );
      addFiles([new File([blob], filename, { type: blob.type })]);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch this URL.");
    } finally {
      setBusyUrl(false);
    }
  }
  async function getFfmpeg() {
    if (ff.current?.loaded) return ff.current;
    const { toBlobURL } = await import("@ffmpeg/util");
    if (
      !(window as typeof window & { FFmpegWASM?: { FFmpeg: new () => FFmpeg } })
        .FFmpegWASM
    ) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/ffmpeg/ffmpeg.js";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Could not load the conversion engine."));
        document.head.appendChild(script);
      });
    }
    const engine = new (
      window as typeof window & { FFmpegWASM: { FFmpeg: new () => FFmpeg } }
    ).FFmpegWASM.FFmpeg();
    await engine.load({
      coreURL: await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
      wasmURL: await toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm"),
    });
    ff.current = engine;
    return engine;
  }
  async function convert(item: Item) {
    if (working.current) return;
    working.current = true;
    canceled.current = false;
    setActive(item.id);
    update(item.id, { status: "converting", progress: 0, error: undefined });
    const inputName = `input-${item.id}.${item.file.name.split(".").pop()?.toLowerCase()}`;
    const outputName = `output-${item.id}.mp3`;
    try {
      const engine = await getFfmpeg();
      if (canceled.current) return;
      const { fetchFile } = (await import("@ffmpeg/util")) as {
        fetchFile: typeof FetchFile;
      };
      const progress = ({ progress }: { progress: number }) => {
        if (mounted.current && !canceled.current && Number.isFinite(progress))
          update(item.id, {
            progress: Math.min(95, Math.max(0, Math.round(progress * 95))),
          });
      };
      engine.on("progress", progress);
      try {
        await engine.writeFile(inputName, await fetchFile(item.file));
        const code = await engine.exec(
          [
            "-i",
            inputName,
            "-vn",
            "-map",
            "0:a:0",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            `${item.bitrate}k`,
            "-ar",
            "44100",
            outputName,
          ],
          -1,
        );
        if (code !== 0)
          throw new Error(
            "Conversion failed. This file may contain an unsupported codec or no audio track.",
          );
        if (canceled.current) return;
        const data = await engine.readFile(outputName);
        const bytes = new Uint8Array(data as Uint8Array);
        const outputUrl = URL.createObjectURL(
          new Blob([bytes], { type: "audio/mpeg" }),
        );
        update(item.id, { status: "done", progress: 100, outputUrl });
        setHistory((old) => {
          const next = [
            {
              name: item.file.name,
              bitrate: item.bitrate,
              date: new Date().toISOString(),
            },
            ...old,
          ].slice(0, 12);
          localStorage.setItem("sonix-history", JSON.stringify(next));
          return next;
        });
      } finally {
        engine.off("progress", progress);
        await engine.deleteFile(inputName).catch(() => {});
        await engine.deleteFile(outputName).catch(() => {});
      }
    } catch (e) {
      if (!canceled.current)
        update(item.id, {
          status: "error",
          error:
            e instanceof Error
              ? e.message
              : "Conversion failed. Try a smaller or different file.",
        });
    } finally {
      working.current = false;
      setActive(null);
    }
  }
  function cancel() {
    canceled.current = true;
    ff.current?.terminate();
    ff.current = null;
    if (active)
      update(active, { status: "error", error: "Conversion canceled." });
    working.current = false;
    setActive(null);
  }
  function remove(id: string) {
    const item = itemsRef.current.find((i) => i.id === id);
    if (item?.outputUrl) URL.revokeObjectURL(item.outputUrl);
    if (active === id) cancel();
    setItems((old) => old.filter((i) => i.id !== id));
  }
  return (
    <div className="converter-layout">
      <div className="converter-card">
        <div className="card-top">
          <div className="card-title">
            <span className="converter-icon">
              <AudioLines size={19} />
            </span>
            <div>
              <h3>Audio converter</h3>
              <p>Your studio, right here.</p>
            </div>
          </div>
          <span className="local-badge">
            <ShieldCheck size={13} /> PRIVATE PROCESSING
          </span>
        </div>
        <div
          className={`dropzone ${drag ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <input
            ref={input}
            type="file"
            multiple
            accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.oga,.mp4,.m4v,.webm,audio/*,video/mp4,video/webm"
            className="sr-only"
            aria-label="Choose media files"
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
          <div className="upload-icon">
            <UploadCloud size={29} />
          </div>
          <strong>
            Drop your files here, or{" "}
            <button
              type="button"
              className="inline-button"
              onClick={() => input.current?.click()}
            >
              browse files
            </button>
          </strong>
          <span>
            MP3, WAV, M4A, AAC, FLAC, OGG, MP4, WebM · Up to 100 MB each
          </span>
        </div>
        <div className="or-divider">
          <span>OR ADD A DIRECT MEDIA LINK</span>
        </div>
        <div className="url-row">
          <label className="sr-only" htmlFor="media-url">
            Authorized direct media URL
          </label>
          <Link2 size={17} />
          <input
            id="media-url"
            type="url"
            placeholder="https://example.com/your-audio.mp3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="button" onClick={importUrl} disabled={!url || busyUrl}>
            {busyUrl ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <span>Add URL</span>
            )}
          </button>
        </div>
        <p className="url-hint">
          Use a direct link to media you own or have permission to convert.
          Webpage and YouTube links are not supported.
        </p>
        {error && (
          <div className="notice error" role="alert">
            <CircleAlert size={17} />
            {error}
          </div>
        )}
        <div className="settings-row">
          <div>
            <label htmlFor="output-format">OUTPUT FORMAT</label>
            <div className="select-wrap">
              <Music2 size={17} />
              <select id="output-format" value="mp3" disabled>
                <option value="mp3">MP3 Audio</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="bitrate">AUDIO QUALITY</label>
            <div className="select-wrap">
              <AudioLines size={17} />
              <select
                id="bitrate"
                value={bitrate}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setBitrate(n);
                  setItems((old) =>
                    old.map((i) =>
                      i.status === "queued" ? { ...i, bitrate: n } : i,
                    ),
                  );
                }}
              >
                {[128, 192, 256, 320].map((n) => (
                  <option key={n} value={n}>
                    {n} kbps {n === 192 ? "· Recommended" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <p className="quality-note">
          Higher bitrates make larger files; they cannot improve a low-quality
          source.
        </p>
        {items.length > 0 && (
          <div className="file-list">
            <div className="file-list-title">
              <b>
                Your files <span>{items.length}</span>
              </b>
              <span>Processed one at a time</span>
            </div>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  className="file-item"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className="file-icon">
                    <FileAudio2 size={20} />
                  </span>
                  <div className="file-info">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <small>
                      {fmtSize(item.file.size)} · {item.bitrate} kbps MP3 ·{" "}
                      {item.status === "done"
                        ? "Ready"
                        : item.status === "converting"
                          ? "Converting"
                          : item.status === "error"
                            ? "Failed"
                            : "Queued"}
                    </small>
                    {item.status === "converting" && (
                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-label={`Converting ${item.file.name}`}
                        aria-valuenow={item.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                    {item.error && (
                      <small className="item-error" role="alert">
                        {item.error}
                      </small>
                    )}
                    {item.outputUrl && (
                      <audio
                        controls
                        preload="none"
                        src={item.outputUrl}
                        aria-label={`Preview ${item.file.name}`}
                      />
                    )}
                  </div>
                  <div className="file-actions">
                    {item.status === "done" && (
                      <a
                        className="download-icon"
                        href={item.outputUrl}
                        download={`${nameOf(item.file.name)}.mp3`}
                        aria-label={`Download ${item.file.name} as MP3`}
                      >
                        <ArrowDownToLine size={18} />
                      </a>
                    )}
                    {item.status === "error" && (
                      <button
                        type="button"
                        aria-label={`Retry ${item.file.name}`}
                        onClick={() =>
                          update(item.id, {
                            status: "queued",
                            error: undefined,
                            progress: 0,
                          })
                        }
                      >
                        <RotateCcw size={17} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => remove(item.id)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <button
          className="convert-button"
          type="button"
          disabled={!items.some((i) => i.status === "queued") || !!active}
          onClick={async () => {
            for (const item of itemsRef.current.filter(
              (i) => i.status === "queued",
            )) {
              if (canceled.current) break;
              await convert(item);
            }
          }}
        >
          {active ? (
            <>
              <LoaderCircle className="spin" size={19} /> Converting…
            </>
          ) : (
            <>
              <AudioLines size={19} /> Convert to MP3 <span>↗</span>
            </>
          )}
        </button>
        {active && (
          <button className="cancel-button" type="button" onClick={cancel}>
            Cancel conversion
          </button>
        )}
        <div className="privacy-line">
          <LockKeyhole size={13} /> Local files are converted on your device.
          URL files briefly pass through our server.
        </div>
      </div>
      <aside className="converter-aside">
        <div className="aside-card">
          <div className="aside-heading">
            <span>
              <AudioLines size={18} />
            </span>
            <h3>Made for your music</h3>
          </div>
          <p>
            Professional-quality conversion, without making you jump through
            hoops.
          </p>
          <div className="aside-benefit">
            <Check size={15} /> No account needed
          </div>
          <div className="aside-benefit">
            <Check size={15} /> No permanent uploads
          </div>
          <div className="aside-benefit">
            <Check size={15} /> Your quality, your choice
          </div>
          <div className="aside-bottom">
            <Globe2 size={16} /> Works wherever you listen
          </div>
        </div>
        <div className="history-card">
          <div className="history-heading">
            <h3>
              <Clock3 size={17} /> Recent conversions
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => {
                  localStorage.removeItem("sonix-history");
                  setHistory([]);
                }}
                aria-label="Clear conversion history"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p>
              Your recent conversions will appear here. Only names and settings
              are saved in this browser.
            </p>
          ) : (
            <ul>
              {history.map((h, i) => (
                <li key={`${h.date}-${i}`}>
                  <Music2 size={15} />
                  <span title={h.name}>{h.name}</span>
                  <small>{h.bitrate}k</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
