import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// Compile the pure URL validation module through TypeScript's transpiler for a fast, dependency-free check.
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/media-url.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const testModule = { exports: {} };
const req = (name) => {
  if (name === "node:dns/promises") return {};
  if (name === "node:http" || name === "node:https") return {};
  if (name === "ipaddr.js") return { default: { isValid: () => false } };
  throw new Error(name);
};
new Function("require", "module", "exports", js)(
  req,
  testModule,
  testModule.exports,
);
const { validateUrl } = testModule.exports;
test("rejects local, credentialed, non-web, and YouTube URLs", () => {
  for (const url of [
    "file:///tmp/a.mp3",
    "http://localhost/a.mp3",
    "https://x.local/a.mp3",
    "https://user:pass@example.com/a.mp3",
    "https://youtube.com/watch?v=abc",
  ])
    assert.throws(() => validateUrl(url));
});
test("accepts an ordinary public HTTPS URL", () =>
  assert.equal(
    validateUrl("https://example.com/a.mp3").hostname,
    "example.com",
  ));
