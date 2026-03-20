#!/usr/bin/env bun
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type RuntimeName = "claude" | "codex";
type RuntimeSelection = RuntimeName | "both";

type ProfileDefinition = {
  description?: string;
  extends?: string[];
  include?: string[];
  exclude?: string[];
};

type RuntimeState = {
  currentProfile?: string;
  previousTarget?: string | null;
  updatedAt?: string;
};

type State = {
  version: 2;
  runtimes: Record<RuntimeName, RuntimeState>;
};

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_SKILLS_DIR = join(REPO_ROOT, "agents", "skills");
const PROFILE_DIR = join(REPO_ROOT, "agents", "skill-profiles");
const CONFIG_DIR = join(homedir(), ".config", "skill-profile");
const LOCAL_PROFILE_DIR = join(CONFIG_DIR, "profiles");
const STATE_FILE = join(CONFIG_DIR, "state.json");
const DATA_DIR = join(homedir(), ".local", "share", "skill-profile");

const RUNTIMES: Record<
  RuntimeName,
  { label: string; linkPath: string; activeDir: string }
> = {
  claude: {
    label: "Claude",
    linkPath: join(homedir(), ".claude", "skills"),
    activeDir: join(DATA_DIR, "active-claude"),
  },
  codex: {
    label: "Codex",
    linkPath: join(homedir(), ".codex", "skills"),
    activeDir: join(DATA_DIR, "active-codex"),
  },
};

function green(text: string) {
  return `\x1b[32m${text}\x1b[0m`;
}

function yellow(text: string) {
  return `\x1b[33m${text}\x1b[0m`;
}

function cyan(text: string) {
  return `\x1b[36m${text}\x1b[0m`;
}

function dim(text: string) {
  return `\x1b[2m${text}\x1b[0m`;
}

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

function usage(): never {
  console.log(`skill-profile: activate named skill sets without deleting canonical skills

Usage:
  skill-profile list
  skill-profile show <profile>
  skill-profile resolve <profile>
  skill-profile status [--runtime codex|claude|both]
  skill-profile apply <profile> [--runtime codex|claude|both]
  skill-profile sync [--runtime codex|claude|both]
  skill-profile restore [--runtime codex|claude|both]

Defaults:
  --runtime defaults to "both" for apply/sync/restore and status.

Profiles are loaded from:
  ${PROFILE_DIR}
  ${LOCAL_PROFILE_DIR} ${dim("(optional local overrides)")}
`);
  process.exit(0);
}

function emptyState(): State {
  return {
    version: 2,
    runtimes: {
      claude: {},
      codex: {},
    },
  };
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJsonFile(path: string, value: unknown) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

function safeLstat(path: string) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

function resolveRuntimeNames(selection: RuntimeSelection): RuntimeName[] {
  return selection === "both" ? ["claude", "codex"] : [selection];
}

function listCanonicalSkills(): string[] {
  return readdirSync(CANONICAL_SKILLS_DIR)
    .filter((name) => existsSync(join(CANONICAL_SKILLS_DIR, name, "SKILL.md")))
    .sort();
}

function listProfileFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(dir, name))
    .sort();
}

function loadProfiles(): Map<string, ProfileDefinition> {
  const files = [...listProfileFiles(PROFILE_DIR), ...listProfileFiles(LOCAL_PROFILE_DIR)];
  const profiles = new Map<string, ProfileDefinition>();

  for (const file of files) {
    profiles.set(basename(file, ".json"), readJsonFile<ProfileDefinition>(file));
  }

  return profiles;
}

function toRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function matchSkills(patterns: string[] | undefined, skills: string[]): string[] {
  if (!patterns?.length) return [];
  const matched = new Set<string>();

  for (const pattern of patterns) {
    if (pattern === "*") {
      for (const skill of skills) matched.add(skill);
      continue;
    }

    const regex = toRegex(pattern);
    const hits = skills.filter((skill) => regex.test(skill));
    if (hits.length === 0) {
      die(`No canonical skills matched pattern ${JSON.stringify(pattern)}`);
    }

    for (const hit of hits) matched.add(hit);
  }

  return [...matched].sort();
}

function expandProfile(
  name: string,
  profiles: Map<string, ProfileDefinition>,
  skills: string[],
  stack: string[] = []
): { description: string; skills: string[] } {
  if (stack.includes(name)) {
    die(`Profile cycle detected: ${[...stack, name].join(" -> ")}`);
  }

  const definition = profiles.get(name);
  if (!definition) {
    die(`Unknown profile: ${name}`);
  }

  const selected = new Set<string>();

  for (const parent of definition.extends ?? []) {
    const expanded = expandProfile(parent, profiles, skills, [...stack, name]);
    for (const skill of expanded.skills) selected.add(skill);
  }

  for (const skill of matchSkills(definition.include, skills)) selected.add(skill);
  for (const skill of matchSkills(definition.exclude, skills)) selected.delete(skill);

  return {
    description: definition.description ?? "",
    skills: [...selected].sort(),
  };
}

function migrateState(raw: unknown): State {
  const state = emptyState();
  if (!raw || typeof raw !== "object") return state;

  const value = raw as Record<string, unknown>;
  if (value.version === 2 && value.runtimes && typeof value.runtimes === "object") {
    const runtimes = value.runtimes as Record<string, RuntimeState>;
    for (const runtime of ["claude", "codex"] as RuntimeName[]) {
      const current = runtimes[runtime];
      if (!current || typeof current !== "object") continue;
      state.runtimes[runtime] = {
        currentProfile: current.currentProfile,
        previousTarget:
          current.previousTarget === undefined ? undefined : current.previousTarget,
        updatedAt: current.updatedAt,
      };
    }
    return state;
  }

  const previousTargets =
    value.previousTargets && typeof value.previousTargets === "object"
      ? (value.previousTargets as Record<string, string | null>)
      : {};
  const currentProfile =
    typeof value.currentProfile === "string" ? value.currentProfile : undefined;
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : undefined;

  for (const runtime of ["claude", "codex"] as RuntimeName[]) {
    state.runtimes[runtime].previousTarget = previousTargets[RUNTIMES[runtime].linkPath];
    state.runtimes[runtime].currentProfile = currentProfile;
    state.runtimes[runtime].updatedAt = updatedAt;
  }

  return state;
}

function loadState(): State {
  if (!existsSync(STATE_FILE)) return emptyState();
  try {
    return migrateState(readJsonFile<unknown>(STATE_FILE));
  } catch {
    return emptyState();
  }
}

function saveState(state: State) {
  writeJsonFile(STATE_FILE, state);
}

function resolveLinkTarget(path: string): string | null {
  const stat = safeLstat(path);
  if (!stat?.isSymbolicLink()) return null;
  return readlinkSync(path);
}

function pointsAtManagedDir(runtime: RuntimeName): boolean {
  const { linkPath, activeDir } = RUNTIMES[runtime];
  const stat = safeLstat(linkPath);
  if (!stat?.isSymbolicLink()) return false;
  return resolve(dirname(linkPath), readlinkSync(linkPath)) === activeDir;
}

function listActiveSkills(runtime: RuntimeName): string[] {
  const activeDir = RUNTIMES[runtime].activeDir;
  if (!existsSync(activeDir)) return [];
  return readdirSync(activeDir).sort();
}

function pointLink(path: string, target: string) {
  ensureDir(dirname(path));
  const stat = safeLstat(path);
  if (stat?.isSymbolicLink()) {
    rmSync(path, { force: true });
  } else if (stat) {
    die(`${path} exists and is not a symlink. Refusing to overwrite it.`);
  }
  symlinkSync(target, path);
}

function capturePreviousTarget(state: State, runtime: RuntimeName) {
  const runtimeState = state.runtimes[runtime];
  const { linkPath } = RUNTIMES[runtime];
  const stat = safeLstat(linkPath);

  if (!stat) {
    runtimeState.previousTarget = null;
    return;
  }

  if (!stat.isSymbolicLink()) {
    die(`${linkPath} exists and is not a symlink. Refusing to overwrite it.`);
  }

  if (!pointsAtManagedDir(runtime)) {
    runtimeState.previousTarget = readlinkSync(linkPath);
  } else if (runtimeState.previousTarget === undefined) {
    runtimeState.previousTarget = null;
  }
}

function rebuildActiveDir(runtime: RuntimeName, skills: string[]) {
  const activeDir = RUNTIMES[runtime].activeDir;
  rmSync(activeDir, { recursive: true, force: true });
  ensureDir(activeDir);

  for (const skill of skills) {
    symlinkSync(join(CANONICAL_SKILLS_DIR, skill), join(activeDir, skill));
  }
}

function applyProfile(profile: string, selection: RuntimeSelection) {
  const skills = listCanonicalSkills();
  const profiles = loadProfiles();
  const expanded = expandProfile(profile, profiles, skills);
  const state = loadState();

  for (const runtime of resolveRuntimeNames(selection)) {
    capturePreviousTarget(state, runtime);
    rebuildActiveDir(runtime, expanded.skills);
    pointLink(RUNTIMES[runtime].linkPath, RUNTIMES[runtime].activeDir);
    state.runtimes[runtime].currentProfile = profile;
    state.runtimes[runtime].updatedAt = new Date().toISOString();
    console.log(
      `${green("Applied")} ${cyan(profile)} to ${RUNTIMES[runtime].label} ${dim(
        `(${expanded.skills.length} skills)`
      )}`
    );
  }

  saveState(state);
}

function syncProfiles(selection: RuntimeSelection) {
  const state = loadState();

  for (const runtime of resolveRuntimeNames(selection)) {
    const profile = state.runtimes[runtime].currentProfile ?? "full";
    applyProfile(profile, runtime);
  }
}

function restoreProfiles(selection: RuntimeSelection) {
  const state = loadState();

  for (const runtime of resolveRuntimeNames(selection)) {
    const runtimeState = state.runtimes[runtime];
    const previous = runtimeState.previousTarget;

    if (previous === undefined) {
      die(`No saved target state found for ${runtime}.`);
    }

    if (previous === null) {
      if (pointsAtManagedDir(runtime)) {
        rmSync(RUNTIMES[runtime].linkPath, { force: true });
      }
    } else {
      pointLink(RUNTIMES[runtime].linkPath, previous);
    }

    runtimeState.currentProfile = undefined;
    runtimeState.updatedAt = new Date().toISOString();
    console.log(`${green("Restored")} ${RUNTIMES[runtime].label}`);
  }

  saveState(state);
}

function showStatus(selection: RuntimeSelection) {
  const state = loadState();

  for (const runtime of resolveRuntimeNames(selection)) {
    const currentState = state.runtimes[runtime];
    const { label, linkPath, activeDir } = RUNTIMES[runtime];
    const rawTarget = resolveLinkTarget(linkPath);

    console.log(`${label}:`);
    console.log(`  currentProfile: ${currentState.currentProfile ?? yellow("none")}`);
    console.log(`  activeDir: ${activeDir}`);
    console.log(`  activeSkills: ${listActiveSkills(runtime).length}`);
    if (rawTarget === null) {
      console.log(`  link: ${yellow("missing or not a symlink")}`);
    } else {
      const managed = pointsAtManagedDir(runtime) ? green("managed") : dim("external");
      console.log(`  link: ${linkPath} -> ${rawTarget} ${dim(`(${managed})`)}`);
    }
  }
}

function listProfiles() {
  const skills = listCanonicalSkills();
  const profiles = loadProfiles();

  for (const name of [...profiles.keys()].sort()) {
    const expanded = expandProfile(name, profiles, skills);
    console.log(
      `${name.padEnd(12)} ${String(expanded.skills.length).padStart(2)} skills  ${expanded.description}`
    );
  }
}

function showProfile(name: string) {
  const skills = listCanonicalSkills();
  const profiles = loadProfiles();
  const expanded = expandProfile(name, profiles, skills);

  console.log(`${cyan(name)} ${dim(`(${expanded.skills.length} skills)`)}`);
  if (expanded.description) {
    console.log(expanded.description);
  }
  console.log();
  for (const skill of expanded.skills) {
    console.log(`- ${skill}`);
  }
}

function resolveProfile(name: string) {
  const skills = listCanonicalSkills();
  const profiles = loadProfiles();
  const expanded = expandProfile(name, profiles, skills);

  for (const skill of expanded.skills) {
    console.log(skill);
  }
}

function parseRuntime(args: string[]): { runtime: RuntimeSelection; rest: string[] } {
  const rest: string[] = [];
  let runtime: RuntimeSelection = "both";

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--runtime") {
      const value = args[i + 1];
      if (value !== "claude" && value !== "codex" && value !== "both") {
        die(`Invalid runtime: ${value ?? "(missing)"}`);
      }
      runtime = value;
      i += 1;
      continue;
    }

    rest.push(arg);
  }

  return { runtime, rest };
}

function main() {
  const [, , command, ...args] = process.argv;
  const parsed = parseRuntime(args);

  switch (command) {
    case "list":
      listProfiles();
      return;
    case "show":
      if (!parsed.rest[0]) usage();
      showProfile(parsed.rest[0]);
      return;
    case "resolve":
      if (!parsed.rest[0]) usage();
      resolveProfile(parsed.rest[0]);
      return;
    case "status":
      showStatus(parsed.runtime);
      return;
    case "apply":
      if (!parsed.rest[0]) usage();
      applyProfile(parsed.rest[0], parsed.runtime);
      return;
    case "sync":
      syncProfiles(parsed.runtime);
      return;
    case "restore":
      restoreProfiles(parsed.runtime);
      return;
    case "-h":
    case "--help":
    case undefined:
      usage();
      return;
    default:
      die(`Unknown command: ${command}`);
  }
}

main();
