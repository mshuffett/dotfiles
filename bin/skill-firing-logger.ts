#!/usr/bin/env bun
// Reads a Stop hook payload on stdin, appends a compact JSON event to ~/.claude/skill-firing.jsonl.
// Designed to run fire-and-forget (the hook wrapper calls this in background).

import { existsSync, appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_FILE = join(homedir(), ".claude", "skill-firing.jsonl");

type HookInput = {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: string;
};

function tailJsonl(path: string, n = 200): Record<string, unknown>[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n").filter(Boolean);
  const tail = lines.slice(-n);
  const entries: Record<string, unknown>[] = [];
  for (const line of tail) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      continue;
    }
  }
  return entries;
}

function lastTurnSignals(
  entries: Record<string, unknown>[]
): {
  lastUserTs?: string;
  lastUserText?: string;
  toolUses: { name: string; input?: unknown }[];
  skillsInvoked: string[];
} {
  let lastUserIdx = -1;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if ((entries[i]?.type as string) === "user") {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return { toolUses: [], skillsInvoked: [] };

  const user = entries[lastUserIdx] as {
    timestamp?: string;
    message?: { content?: unknown };
  };
  const content = user.message?.content;
  let lastUserText = "";
  if (typeof content === "string") lastUserText = content;
  else if (Array.isArray(content)) {
    for (const item of content) {
      if (item && typeof item === "object") {
        const it = item as { type?: string; text?: string };
        if (it.type === "text" && typeof it.text === "string") lastUserText += it.text;
      }
    }
  }

  const toolUses: { name: string; input?: unknown }[] = [];
  const skillsInvoked: string[] = [];
  for (let i = lastUserIdx + 1; i < entries.length; i += 1) {
    const e = entries[i] as { type?: string; message?: { content?: unknown } };
    if (e.type !== "assistant") continue;
    const c = e.message?.content;
    if (!Array.isArray(c)) continue;
    for (const item of c) {
      if (item && typeof item === "object") {
        const it = item as { type?: string; name?: string; input?: unknown };
        if (it.type === "tool_use" && typeof it.name === "string") {
          toolUses.push({ name: it.name, input: it.input });
          if (it.name === "Skill") {
            const input = it.input as { skill?: string } | undefined;
            if (input?.skill) skillsInvoked.push(input.skill);
          }
        }
      }
    }
  }

  return {
    lastUserTs: user.timestamp,
    lastUserText: lastUserText.slice(0, 400),
    toolUses,
    skillsInvoked,
  };
}

async function main() {
  const t0 = Date.now();
  let payload: HookInput = {};
  try {
    const stdin = await Bun.stdin.text();
    payload = JSON.parse(stdin) as HookInput;
  } catch {
    // fall through; we still log a minimal event
  }

  const transcript = payload.transcript_path;
  const signals =
    transcript && existsSync(transcript)
      ? lastTurnSignals(tailJsonl(transcript, 200))
      : { toolUses: [] as { name: string; input?: unknown }[], skillsInvoked: [] };

  const toolCounts: Record<string, number> = {};
  for (const u of signals.toolUses) toolCounts[u.name] = (toolCounts[u.name] ?? 0) + 1;

  const event = {
    ts: new Date().toISOString(),
    session_id: payload.session_id,
    cwd: payload.cwd,
    hook: payload.hook_event_name ?? "Stop",
    last_user_ts: signals.lastUserTs,
    last_user_preview: signals.lastUserText,
    tool_counts: toolCounts,
    skills_invoked: signals.skillsInvoked,
    latency_ms: Date.now() - t0,
  };

  try {
    appendFileSync(LOG_FILE, JSON.stringify(event) + "\n", { encoding: "utf-8" });
  } catch {
    // swallow - never fail the hook
  }
}

main();
