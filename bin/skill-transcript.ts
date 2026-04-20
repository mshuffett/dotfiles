#!/usr/bin/env bun
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";

export type Turn = {
  sessionId: string;
  cwd?: string;
  gitBranch?: string;
  userTs?: string;
  userText?: string;
  assistantTs?: string;
  assistantText?: string;
  toolUses: { name: string; input: unknown; ts?: string }[];
  skillsInvoked: string[];
};

export type MistakeEntry = {
  ts: string;
  mistake_id?: string;
  type?: string;
  scope?: string;
  detector?: string;
  notes?: string;
  guide?: string;
  condition?: string;
  repo?: string;
  action_taken?: string;
  sessionId?: string;
  raw: Record<string, unknown>;
};

const PROJECTS_DIR = join(homedir(), ".claude", "projects");
const MISTAKES_FILE = join(homedir(), ".claude", "mistakes.jsonl");

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const item of content) {
    if (item && typeof item === "object") {
      const it = item as { type?: string; text?: string };
      if (it.type === "text" && typeof it.text === "string") parts.push(it.text);
    }
  }
  return parts.join("\n");
}

function extractToolUses(content: unknown): { name: string; input: unknown }[] {
  if (!Array.isArray(content)) return [];
  const uses: { name: string; input: unknown }[] = [];
  for (const item of content) {
    if (item && typeof item === "object" && (item as { type?: string }).type === "tool_use") {
      const tu = item as { name?: string; input?: unknown };
      if (typeof tu.name === "string") uses.push({ name: tu.name, input: tu.input });
    }
  }
  return uses;
}

export function parseSessionFile(path: string): Turn[] {
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n").filter(Boolean);
  const turns: Turn[] = [];
  let current: Turn | null = null;

  for (const line of lines) {
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const type = entry.type as string | undefined;
    if (type === "user") {
      if (current) turns.push(current);
      const msg = entry.message as { content?: unknown } | undefined;
      current = {
        sessionId: (entry.sessionId as string) ?? "",
        cwd: entry.cwd as string | undefined,
        gitBranch: entry.gitBranch as string | undefined,
        userTs: entry.timestamp as string | undefined,
        userText: extractText(msg?.content ?? ""),
        toolUses: [],
        skillsInvoked: [],
      };
    } else if (type === "assistant" && current) {
      const msg = entry.message as { content?: unknown } | undefined;
      current.assistantTs = entry.timestamp as string | undefined;
      const assistantText = extractText(msg?.content ?? "");
      if (assistantText) current.assistantText = (current.assistantText ?? "") + assistantText;
      const uses = extractToolUses(msg?.content ?? []);
      for (const u of uses) {
        current.toolUses.push({ name: u.name, input: u.input, ts: entry.timestamp as string | undefined });
        if (u.name === "Skill") {
          const input = u.input as { skill?: string } | undefined;
          if (input?.skill) current.skillsInvoked.push(input.skill);
        }
      }
    }
  }

  if (current) turns.push(current);
  return turns;
}

export function listSessionFiles(sinceDays?: number): string[] {
  if (!existsSync(PROJECTS_DIR)) return [];
  const cutoff = sinceDays ? Date.now() - sinceDays * 24 * 60 * 60 * 1000 : 0;
  const result: string[] = [];
  for (const project of readdirSync(PROJECTS_DIR)) {
    const projectDir = join(PROJECTS_DIR, project);
    let stat;
    try {
      stat = statSync(projectDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    for (const name of readdirSync(projectDir)) {
      if (!name.endsWith(".jsonl")) continue;
      const path = join(projectDir, name);
      try {
        const s = statSync(path);
        if (cutoff && s.mtimeMs < cutoff) continue;
        result.push(path);
      } catch {
        continue;
      }
    }
  }
  return result;
}

export function loadMistakes(): MistakeEntry[] {
  if (!existsSync(MISTAKES_FILE)) return [];
  const lines = readFileSync(MISTAKES_FILE, "utf-8").split("\n").filter(Boolean);
  const entries: MistakeEntry[] = [];
  for (const line of lines) {
    try {
      const raw = JSON.parse(line) as Record<string, unknown>;
      entries.push({
        ts: (raw.ts as string) ?? (raw.timestamp as string) ?? "",
        mistake_id: raw.mistake_id as string | undefined,
        type: raw.type as string | undefined,
        scope: raw.scope as string | undefined,
        detector: raw.detector as string | undefined,
        notes: (raw.notes as string | undefined) ?? (raw.description as string | undefined),
        guide: raw.guide as string | undefined,
        condition: raw.condition as string | undefined,
        repo: raw.repo as string | undefined,
        action_taken: raw.action_taken as string | undefined,
        raw,
      });
    } catch {
      continue;
    }
  }
  return entries;
}

function main() {
  const [, , command, ...args] = process.argv;
  if (!command || command === "--help" || command === "-h") {
    console.log(`skill-transcript: parse Claude session files and mistake log

Usage:
  skill-transcript sessions [--since Nd]
  skill-transcript parse <session-file>
  skill-transcript mistakes
`);
    return;
  }

  if (command === "sessions") {
    const sinceIdx = args.indexOf("--since");
    let since: number | undefined;
    if (sinceIdx >= 0) {
      const spec = args[sinceIdx + 1];
      const m = /^(\d+)d$/.exec(spec ?? "");
      if (m) since = Number(m[1]);
    }
    const files = listSessionFiles(since);
    console.log(`${files.length} session files`);
    for (const f of files.slice(0, 20)) console.log(`  ${f}`);
    if (files.length > 20) console.log(`  ... and ${files.length - 20} more`);
    return;
  }

  if (command === "parse") {
    const path = args[0];
    if (!path) {
      console.error("usage: skill-transcript parse <path>");
      process.exit(1);
    }
    const turns = parseSessionFile(path);
    console.log(`Session: ${basename(path)}`);
    console.log(`Turns: ${turns.length}`);
    const allTools = new Map<string, number>();
    const allSkills = new Map<string, number>();
    for (const t of turns) {
      for (const u of t.toolUses) allTools.set(u.name, (allTools.get(u.name) ?? 0) + 1);
      for (const s of t.skillsInvoked) allSkills.set(s, (allSkills.get(s) ?? 0) + 1);
    }
    console.log(`Tool usage:`);
    for (const [name, count] of [...allTools.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${name}: ${count}`);
    }
    if (allSkills.size > 0) {
      console.log(`Skills invoked:`);
      for (const [name, count] of [...allSkills.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${name}: ${count}`);
      }
    }
    return;
  }

  if (command === "mistakes") {
    const entries = loadMistakes();
    console.log(`${entries.length} mistake entries`);
    for (const m of entries) {
      console.log(`  ${m.ts}  guide=${m.guide ?? "?"}  id=${m.mistake_id ?? "?"}`);
      if (m.notes) console.log(`    ${m.notes.slice(0, 120)}`);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (import.meta.main) main();
