#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { rewriteOutput, safeString } from "./codex-hook-rewrite.mjs";

export function resolveUpstreamHook() {
  const explicit = safeString(process.env.OMX_NATIVE_HOOK_IMPL).trim();
  if (explicit) return explicit;

  const installRoot = dirname(dirname(process.execPath));
  return join(
    installRoot,
    "lib",
    "node_modules",
    "oh-my-codex",
    "dist",
    "scripts",
    "codex-native-hook.js",
  );
}

export function main() {
  const chunks = [];
  process.stdin.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))));
  process.stdin.on("end", () => {
    const rawInput = Buffer.concat(chunks).toString("utf8");
    let payload = {};
    try {
      payload = rawInput.trim() ? JSON.parse(rawInput) : {};
    } catch (error) {
      process.stderr.write(
        `[omx-wrapper] invalid hook payload: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
      return;
    }
    const upstreamHook = resolveUpstreamHook();

    if (!existsSync(upstreamHook)) {
      process.stderr.write(`[omx-wrapper] upstream hook not found: ${upstreamHook}\n`);
      process.exitCode = 1;
      return;
    }

    const child = spawnSync(process.execPath, [upstreamHook], {
      input: rawInput,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    if (child.stderr) {
      process.stderr.write(child.stderr);
    }

    const stdoutText = safeString(child.stdout).trim();
    if (stdoutText) {
      let nextStdout = stdoutText;
      try {
        const parsed = JSON.parse(stdoutText);
        const rewritten = rewriteOutput(payload, parsed);
        nextStdout = rewritten ? JSON.stringify(rewritten) : "";
      } catch {
        nextStdout = stdoutText;
      }

      if (nextStdout) {
        process.stdout.write(`${nextStdout}\n`);
      }
    }

    process.exitCode = child.status ?? 0;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
