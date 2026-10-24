# SONIX

A private, responsive MP3 converter built with Next.js, TypeScript, Tailwind CSS, Framer Motion and FFmpeg WebAssembly.

## Run locally

Requires Node.js 20.9+ and npm. Run `npm ci`, then `npm run dev`. Open http://localhost:3000. `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` verify the project. The postinstall script copies the official `@ffmpeg/core` runtime into `public/ffmpeg` for self-hosting.

## How it works

Selected files are processed in the browser by FFmpeg WebAssembly, one at a time. No account or server upload is needed for local files. Outputs live in browser memory until the page closes or the file is removed. Conversion history contains only filenames, bitrate and date in local storage. Maximum local input size is 100 MB; memory-limited devices may require smaller files. Progress comes from FFmpeg and can be uneven for some codecs.

Authorized direct media URLs use `/api/media`, which resolves only public DNS addresses, pins the resolved address for the request, limits redirects, validates media type and filename, and enforces a 4 MB download limit and a 10-second request timeout. This route runs on the server and does not persist media. The 4 MB limit accommodates common serverless response limits. URLs must end with a supported media extension. Webpage, YouTube and private-network URLs are not supported. The per-instance URL rate limit is a best-effort guard; use a shared rate-limit store for high-traffic production deployments.

Supported input extensions: MP3, WAV, M4A, AAC, FLAC, OGG, MP4 and WebM. The actual codec must be supported by the FFmpeg browser build. Output is MP3 at 128, 192, 256 or 320 kbps. Raising output bitrate cannot restore lost source quality.

## Deployment

Deploy the Next.js app to Vercel with default build settings. The FFmpeg runtime is copied during `npm ci`/postinstall. No secrets are required. Keep the Node.js API runtime enabled for URL imports. URL fetching is intentionally limited to small files. For high-volume usage, add a shared rate-limit store and an appropriate media proxy service.
