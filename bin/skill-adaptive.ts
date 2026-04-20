#!/usr/bin/env bun
// Adaptive commands for skill-profile: stats, replay, reflect, review.

import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";

import {
  parseSessionFile,
  listSessionFiles,
  loadMistakes,
  type Turn,
  type MistakeEntry,
} from "./skill-transcript";

const HOME = homedir();
const FIRING_LOG = join(HOME, ".claude", "skill-firing.jsonl");
const PROPOSALS_DIR = join(HOME, ".claude", "skill-proposals", "pending");
const REJECTED_DIR = join(HOME, ".claude", "skill-proposals", "rejected");
const ACCEPTED_DIR = join(HOME, ".claude", "skill-proposals", "accepted");
const CANONICAL_DIR = join(HOME, ".dotfiles", "agents", "skills");

const ansi = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

// --- Firing log parsing ---------------------------------------------------

type FiringEvent = {
  ts: string;
  session_id?: string;
  cwd?: string;
  hook?: string;
  last_user_ts?: string;
  last_user_preview?: string;
  tool_counts?: Record<string, number>;
  skills_invoked?: string[];
  latency_ms?: number;
};

function loadFiringEvents(sinceDays?: number): FiringEvent[] {
  if (!existsSync(FIRING_LOG)) return [];
  const cutoff = sinceDays ? Date.now() - sinceDays * 86400_000 : 0;
  const lines = readFileSync(FIRING_LOG, "utf-8").split("\n").filter(Boolean);
  const events: FiringEvent[] = [];
  for (const line of lines) {
    try {
      const ev = JSON.parse(line) as FiringEvent;
      if (cutoff && new Date(ev.ts).getTime() < cutoff) continue;
      events.push(ev);
    } catch {
      continue;
    }
  }
  return events;
}

// --- Canonical skills inventory -------------------------------------------

function canonicalSkillNames(): string[] {
  if (!existsSync(CANONICAL_DIR)) return [];
  return readdirSync(CANONICAL_DIR)
    .filter((name) => existsSync(join(CANONICAL_DIR, name, "SKILL.md")))
    .sort();
}

function readSkillBody(skill: string): string | null {
  const path = join(CANONICAL_DIR, skill, "SKILL.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function extractSkillDescription(body: string): string {
  const m = /^---\s*\n([\s\S]*?)\n---/m.exec(body);
  if (!m) return "";
  const fm = m[1];
  const d = /description:\s*(.+)$/m.exec(fm);
  return d ? d[1].trim().replace(/^"|"$/g, "") : "";
}

// --- Mistake-corpus replay events ----------------------------------------

type ReplayEvent = {
  source: "mistake" | "keyword" | "correction";
  sourceId: string;
  ts: string;
  skill: string;
  userMessage: string;
  sessionPath?: string;
};

function mistakesForSkill(skill: string): MistakeEntry[] {
  return loadMistakes().filter((m) => {
    if (m.guide === skill) return true;
    const n = (m.notes ?? "").toLowerCase();
    if (n.includes(skill.toLowerCase())) return true;
    return false;
  });
}

function findUserMessageNearTimestamp(
  targetTs: string,
  sinceDays = 365
): { userText: string; sessionPath: string } | null {
  const target = new Date(targetTs).getTime();
  if (Number.isNaN(target)) return null;
  const files = listSessionFiles(sinceDays);
  let best: { text: string; path: string; deltaMs: number } | null = null;
  for (const file of files) {
    let turns: Turn[] = [];
    try {
      turns = parseSessionFile(file);
    } catch {
      continue;
    }
    for (const t of turns) {
      if (!t.userTs || !t.userText) continue;
      const ts = new Date(t.userTs).getTime();
      if (Number.isNaN(ts)) continue;
      const delta = Math.abs(ts - target);
      if (delta > 4 * 3600_000) continue;
      if (!best || delta < best.deltaMs) {
        best = { text: t.userText, path: file, deltaMs: delta };
      }
    }
  }
  return best ? { userText: best.text, sessionPath: best.path } : null;
}

function eventsFromMistakes(skill: string): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  for (const m of mistakesForSkill(skill)) {
    let userText = m.condition ?? m.notes ?? "";
    let sessionPath: string | undefined;
    const contextual = m.ts ? findUserMessageNearTimestamp(m.ts) : null;
    if (contextual) {
      userText = contextual.userText;
      sessionPath = contextual.sessionPath;
    }
    events.push({
      source: "mistake",
      sourceId: m.mistake_id ?? m.ts,
      ts: m.ts,
      skill,
      userMessage: userText,
      sessionPath,
    });
  }
  return events;
}

// --- Subagent simulation via Claude CLI (using Bun.spawn) ----------------

type SimulationResult = {
  fired: boolean;
  rationale: string;
};

async function callClaudeCLI(prompt: string, systemPrompt: string): Promise<string> {
  const proc = Bun.spawn(
    ["claude", "-p", prompt, "--append-system-prompt", systemPrompt, "--model", "haiku"],
    { stdin: "ignore", stdout: "pipe", stderr: "pipe" }
  );
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`claude exited ${exitCode}: ${stderr}`);
  }
  return stdout;
}

async function simulateFiringDecision(
  skillBody: string,
  userMessage: string
): Promise<SimulationResult> {
  const descr = extractSkillDescription(skillBody).slice(0, 400);
  const system = `You are a skill-firing judge. Decide whether the following skill's description matches the user's message strongly enough that an assistant SHOULD invoke this skill before responding.

Skill description:
"""
${descr}
"""

Respond with a single JSON object on one line, no prose: {"fired": true|false, "rationale": "<one sentence>"}`;

  const prompt = `User message:\n"""\n${userMessage.slice(0, 1500)}\n"""\n\nReturn the JSON decision.`;

  try {
    const out = await callClaudeCLI(prompt, system);
    const m = /\{[^{}]*"fired"[^{}]*\}/.exec(out);
    if (!m) return { fired: false, rationale: "unparseable output" };
    const parsed = JSON.parse(m[0]) as { fired?: boolean; rationale?: string };
    return {
      fired: Boolean(parsed.fired),
      rationale: String(parsed.rationale ?? ""),
    };
  } catch (e) {
    return { fired: false, rationale: `error: ${(e as Error).message}` };
  }
}

// --- stats ---------------------------------------------------------------

export function cmdStats(args: string[]): void {
  const sinceIdx = args.indexOf("--since");
  let since: number | undefined;
  if (sinceIdx >= 0) {
    const m = /^(\d+)d$/.exec(args[sinceIdx + 1] ?? "");
    if (m) since = Number(m[1]);
  }

  const events = loadFiringEvents(since);
  const canonical = canonicalSkillNames();

  const skillCounts = new Map<string, number>();
  const toolCounts = new Map<string, number>();
  const latencies: number[] = [];
  const sessions = new Set<string>();

  for (const ev of events) {
    if (ev.session_id) sessions.add(ev.session_id);
    if (typeof ev.latency_ms === "number") latencies.push(ev.latency_ms);
    for (const s of ev.skills_invoked ?? []) {
      skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
    }
    for (const [name, count] of Object.entries(ev.tool_counts ?? {})) {
      toolCounts.set(name, (toolCounts.get(name) ?? 0) + count);
    }
  }

  const neverFired = canonical.filter((s) => !skillCounts.has(s));
  const windowLabel = since ? `last ${since}d` : "all time";

  console.log(ansi.cyan(`\nSkill-firing stats (${windowLabel}):`));
  console.log(`  events: ${events.length}`);
  console.log(`  distinct sessions: ${sessions.size}`);
  if (latencies.length > 0) {
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    console.log(`  logger latency: p50=${p50}ms · p95=${p95}ms`);
  }

  console.log(ansi.cyan("\nSkills invoked via Skill tool (top 15):"));
  if (skillCounts.size === 0) {
    console.log(ansi.dim("  (none yet — waiting for sessions)"));
  } else {
    const sorted = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted.slice(0, 15)) {
      console.log(`  ${String(count).padStart(4)} · ${name}`);
    }
  }

  console.log(ansi.cyan("\nTool usage (top 10):"));
  if (toolCounts.size === 0) {
    console.log(ansi.dim("  (none yet)"));
  } else {
    const sorted = [...toolCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted.slice(0, 10)) {
      console.log(`  ${String(count).padStart(5)} · ${name}`);
    }
  }

  console.log(
    ansi.cyan(
      `\nNever-explicitly-invoked canonical skills (${neverFired.length}/${canonical.length}):`
    )
  );
  if (events.length === 0) {
    console.log(ansi.dim("  (no telemetry yet — run more sessions first)"));
  } else {
    for (const s of neverFired.slice(0, 20)) console.log(`  ${s}`);
    if (neverFired.length > 20) console.log(`  ... and ${neverFired.length - 20} more`);
    console.log(
      ansi.dim(
        "  Note: most skills load via system-prompt context, not Skill tool invocation. " +
          "Low/zero here doesn't necessarily mean unused."
      )
    );
  }

  if (existsSync(PROPOSALS_DIR)) {
    const pending = readdirSync(PROPOSALS_DIR).filter((f) => f.endsWith(".md"));
    console.log(ansi.cyan(`\nPending proposals: ${pending.length}`));
    for (const f of pending.slice(0, 10)) console.log(`  ${f}`);
  }
  console.log();
}

// --- replay --------------------------------------------------------------

export async function cmdReplay(args: string[]): Promise<void> {
  const skill = args[0];
  if (!skill) {
    console.error(
      "usage: skill-profile replay <skill> [--proposed <path>]"
    );
    process.exit(1);
  }

  const proposedIdx = args.indexOf("--proposed");
  const proposedPath = proposedIdx >= 0 ? args[proposedIdx + 1] : undefined;

  const currentBody = readSkillBody(skill);
  if (!currentBody) {
    console.error(`Unknown canonical skill: ${skill}`);
    process.exit(1);
  }
  const proposedBody = proposedPath ? readFileSync(proposedPath, "utf-8") : null;

  const events = eventsFromMistakes(skill);
  if (events.length === 0) {
    console.log(
      ansi.dim(
        `No replay events found for ${skill}. Mistake corpus has no entries ` +
          `naming it. (Keyword/correction replay not wired up yet.)`
      )
    );
    return;
  }

  console.log(ansi.cyan(`Replaying ${skill} against ${events.length} event(s)…`));

  type Row = {
    ev: ReplayEvent;
    current: SimulationResult;
    proposed?: SimulationResult;
  };
  const rows: Row[] = [];

  for (const ev of events) {
    process.stdout.write(`  ${ev.sourceId} · ${ev.ts.slice(0, 10)} `);
    const current = await simulateFiringDecision(currentBody, ev.userMessage);
    process.stdout.write(current.fired ? ansi.green("✓") : ansi.red("✗"));
    let proposed: SimulationResult | undefined;
    if (proposedBody) {
      proposed = await simulateFiringDecision(proposedBody, ev.userMessage);
      process.stdout.write(proposed.fired ? ansi.green(" → ✓") : ansi.red(" → ✗"));
    }
    process.stdout.write("\n");
    rows.push({ ev, current, proposed });
  }

  const currentFired = rows.filter((r) => r.current.fired).length;
  console.log(
    `\n${ansi.cyan("Current:")} fires ${currentFired}/${rows.length}  ${ansi.dim("(goal: all events should fire — they're known mistakes)")}`
  );
  if (proposedBody) {
    const proposedFired = rows.filter((r) => r.proposed?.fired).length;
    const delta = proposedFired - currentFired;
    const sign = delta >= 0 ? "+" : "";
    console.log(
      `${ansi.cyan("Proposed:")} fires ${proposedFired}/${rows.length}  ${ansi.dim(`(${sign}${delta})`)}`
    );
  }

  console.log(ansi.cyan("\nDetails:"));
  for (const r of rows) {
    const marker = r.current.fired ? ansi.green("now  ✓") : ansi.red("now  ✗");
    const preview = r.ev.userMessage.slice(0, 100).replace(/\s+/g, " ");
    console.log(`  ${marker}  ${r.ev.sourceId}`);
    console.log(
      `    user: ${preview}${r.ev.userMessage.length > 100 ? "…" : ""}`
    );
    console.log(`    current: ${r.current.rationale}`);
    if (r.proposed) {
      const pm = r.proposed.fired ? ansi.green("proposed ✓") : ansi.red("proposed ✗");
      console.log(`    ${pm}: ${r.proposed.rationale}`);
    }
  }
}

// --- reflect --------------------------------------------------------------

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function slugTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function cmdReflect(args: string[]): Promise<void> {
  const skill = args[0];
  if (!skill) {
    console.error("usage: skill-profile reflect <skill>");
    process.exit(1);
  }
  const body = readSkillBody(skill);
  if (!body) {
    console.error(`Unknown canonical skill: ${skill}`);
    process.exit(1);
  }

  const mistakes = mistakesForSkill(skill);
  const events = loadFiringEvents(30);
  const invokedCount = events.reduce(
    (acc, ev) => acc + (ev.skills_invoked?.filter((s) => s === skill).length ?? 0),
    0
  );

  const context = [
    `Skill file: agents/skills/${skill}/SKILL.md`,
    `Recent (30d) explicit invocations via Skill tool: ${invokedCount}`,
    `Mentions in mistake log: ${mistakes.length}`,
    ...mistakes.map(
      (m) => `  - ${m.ts}  ${m.mistake_id ?? "?"}  ${m.notes ?? ""}`.slice(0, 300)
    ),
    "",
    "Current skill body (truncated to 4KB):",
    body.slice(0, 4000),
  ].join("\n");

  const system = `You are a skill editor. Given evidence about a skill's recent usage and mistakes, propose at most ONE targeted edit to its description or trigger conditions that would improve recall without hurting precision. If no change is warranted, say so explicitly.

Respond with markdown:

# Proposal for ${skill}

## Diagnosis
<2-3 sentences summarizing the evidence>

## Proposed edit
<either a unified diff of the frontmatter/description, OR "no change needed" with a reason>

## Evidence
<bulleted list citing specific mistake IDs or sessions>

## Risk
<what could go wrong — too narrow, too broad, style drift>
`;

  const prompt = `Evidence:\n\n${context}\n\nWrite the proposal.`;

  console.log(ansi.cyan(`Generating reflection for ${skill}…`));
  let response = "";
  try {
    response = await callClaudeCLI(prompt, system);
  } catch (e) {
    console.error(`reflect failed: ${(e as Error).message}`);
    process.exit(1);
  }

  ensureDir(PROPOSALS_DIR);
  const outPath = join(PROPOSALS_DIR, `${skill}-${slugTimestamp()}.md`);
  const header = `---\nskill: ${skill}\nts: ${new Date().toISOString()}\nstatus: pending\n---\n\n`;
  writeFileSync(outPath, header + response + "\n");
  console.log(ansi.green(`Wrote proposal: ${outPath}`));
}

// --- review ---------------------------------------------------------------

export async function cmdReview(): Promise<void> {
  ensureDir(PROPOSALS_DIR);
  ensureDir(REJECTED_DIR);
  ensureDir(ACCEPTED_DIR);

  const pending = readdirSync(PROPOSALS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => join(PROPOSALS_DIR, f));

  if (pending.length === 0) {
    console.log(ansi.dim("No pending proposals."));
    return;
  }

  console.log(ansi.cyan(`${pending.length} pending proposal(s):\n`));
  for (const path of pending) {
    console.log(ansi.dim(`--- ${basename(path)} ---`));
    console.log(readFileSync(path, "utf-8"));
    console.log();
    console.log(
      ansi.dim(
        `  accept: mv "${path}" "${ACCEPTED_DIR}/"\n` +
          `  reject: mv "${path}" "${REJECTED_DIR}/"\n`
      )
    );
  }
}
