import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const source = join(process.cwd(), "node_modules/@ffmpeg/core/dist/umd");
const target = join(process.cwd(), "public/ffmpeg");
mkdirSync(target, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"])
  copyFileSync(join(source, file), join(target, file));
for (const file of ["ffmpeg.js", "814.ffmpeg.js"])
  copyFileSync(
    join(process.cwd(), "node_modules/@ffmpeg/ffmpeg/dist/umd", file),
    join(target, file),
  );
console.log("Copied FFmpeg runtime to public/ffmpeg");
