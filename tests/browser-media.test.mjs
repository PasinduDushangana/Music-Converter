import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(
  new URL("../lib/browser-media.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source, { module: ts.ModuleKind.CommonJS, esModuleInterop: true });
const testModule = { exports: {} };
new Function("require", "module", "exports", js)(
  require,
  testModule,
  testModule.exports,
);
const { validateBrowserMediaUrl } = testModule.exports;

test("browser URL validation blocks local addresses, YouTube, and pages", () => {
  for (const url of [
    "http://127.0.0.1/file.mp3",
    "https://localhost./file.mp3",
    "http://intranet.local/file.mp3",
    "https://youtube.com/watch?v=abc",
    "https://example.com/article",
  ])
    assert.throws(() => validateBrowserMediaUrl(url));
});

test("browser URL validation accepts an authorized-looking direct link", () => {
  assert.equal(
    validateBrowserMediaUrl("https://example.com/music.ogg").name,
    "music.ogg",
  );
});
