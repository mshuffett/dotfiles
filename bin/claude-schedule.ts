#!/usr/bin/env bun
/**
 * claude-schedule - Schedule Claude Code tasks to run in the background
 *
 * Usage:
 *   claude-schedule add <name> --every 30m --prompt "do something"
 *   claude-schedule add <name> --once --in 2h --prompt "do once"
 *   claude-schedule list
 *   claude-schedule logs <name>
 *   claude-schedule remove <name>
 */
import { defineCommand, runMain } from "citty";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, symlinkSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join, basename } from "path";
import { $ } from "bun";

// Paths
const SCHEDULE_DIR = join(homedir(), ".claude", "scheduled");
const TASKS_FILE = join(SCHEDULE_DIR, "tasks.json");
const LOGS_DIR = join(SCHEDULE_DIR, "logs");
const NOTES_DIR = join(SCHEDULE_DIR, "notes");
const RUNNER_LOCK = join(SCHEDULE_DIR, ".runner.lock");

// System prompt for scheduled tasks
const SYSTEM_PROMPT = `You are running as a scheduled background task. The user is not watching.

NOTIFICATIONS: To notify the user, add a task to their Todoist inbox using the Todoist MCP tool or REST API with $TODOIST_API_TOKEN. For urgent items, set due_string to "today".

NOTES: You can write persistent notes to ~/.claude/scheduled/notes/<task-name>.md (task-specific) or ~/.claude/scheduled/notes/shared.md (shared across tasks).

GUIDELINES: Be concise. Only notify if necessary. Log findings to notes. Complete your task efficiently.`;

// Types
interface Task {
  name: string;
  prompt?: string;
  file?: string;
  interval_ms?: number; // undefined for one-time tasks
  once: boolean;
  created_at: string;
  last_run?: string;
  next_due: string;
  status: "active" | "paused" | "completed";
  keep_logs: number;
  cwd?: string;
}

interface RunRecord {
  run_id: string;
  started: string;
  finished?: string;
  duration_ms?: number;
  exit_code?: number;
  log_file: string;
}

// Helpers
function ensureDirs() {
  mkdirSync(SCHEDULE_DIR, { recursive: true });
  mkdirSync(LOGS_DIR, { recursive: true });
}

function loadTasks(): Task[] {
  if (!existsSync(TASKS_FILE)) return [];
  return JSON.parse(readFileSync(TASKS_FILE, "utf-8"));
}

function saveTasks(tasks: Task[]) {
  ensureDirs();
  writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function parseInterval(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid interval: ${str}. Use format like 30s, 5m, 1h, 1d`);
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  switch (unit) {
    case "s": return n * 1000;
    case "m": return n * 60 * 1000;
    case "h": return n * 60 * 60 * 1000;
    case "d": return n * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown unit: ${unit}`);
  }
}

function formatInterval(ms: number): string {
  if (ms < 60 * 1000) return `${Math.round(ms / 1000)}s`;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / 60000)}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < 60000) return `in ${Math.round(absDiff / 1000)}s`;
    if (absDiff < 3600000) return `in ${Math.round(absDiff / 60000)}m`;
    if (absDiff < 86400000) return `in ${Math.round(absDiff / 3600000)}h`;
    return `in ${Math.round(absDiff / 86400000)}d`;
  }
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}

function generateRunId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getTaskLogDir(name: string): string {
  return join(LOGS_DIR, name);
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "").substring(0, 15);
}

async function runTask(task: Task): Promise<{ exitCode: number; logFile: string }> {
  const logDir = getTaskLogDir(task.name);
  mkdirSync(logDir, { recursive: true });
  mkdirSync(NOTES_DIR, { recursive: true });

  const started = new Date();
  const logFileName = `${formatTimestamp(started)}.log`;
  const logFile = join(logDir, logFileName);
  const historyFile = join(logDir, "history.jsonl");
  const latestLink = join(logDir, "latest.log");

  const runId = generateRunId();
  const userPrompt = task.prompt || readFileSync(task.file!, "utf-8");

  // Combine system prompt with user prompt
  const prompt = `${SYSTEM_PROMPT}

## Your Task
Task name: ${task.name}
Notes file: ~/.claude/scheduled/notes/${task.name}.md

${userPrompt}`;

  // Write log header
  const header = `${"═".repeat(70)}
Task: ${task.name}
Run ID: ${runId}
Started: ${started.toISOString()}
Prompt: ${prompt.substring(0, 200)}${prompt.length > 200 ? "..." : ""}
CWD: ${task.cwd || process.cwd()}
${"═".repeat(70)}

`;
  writeFileSync(logFile, header);

  // Run Claude with user's environment
  const cwd = task.cwd || process.cwd();

  // Write prompt to temp file to avoid escaping issues
  const promptFile = join(SCHEDULE_DIR, `.prompt-${runId}.txt`);
  writeFileSync(promptFile, prompt);

  const proc = Bun.spawn(
    ["claude", "--dangerously-skip-permissions", "-p", prompt],
    {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOME: homedir(),
        PATH: `${homedir()}/.local/bin:${homedir()}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`,
        SHELL: "/bin/zsh",
      },
    }
  );

  // Clean up prompt file after process exits (non-blocking)
  proc.exited.then(() => {
    try { unlinkSync(promptFile); } catch {}
  });

  // Stream output to log file
  const stdout = proc.stdout;
  const stderr = proc.stderr;

  const stdoutReader = stdout.getReader();
  const stderrReader = stderr.getReader();

  const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      appendFileSync(logFile, value);
    }
  };

  await Promise.all([readStream(stdoutReader), readStream(stderrReader)]);
  const exitCode = await proc.exited;

  const finished = new Date();
  const duration_ms = finished.getTime() - started.getTime();

  // Write log footer
  const footer = `
${"═".repeat(70)}
Finished: ${finished.toISOString()}
Duration: ${Math.round(duration_ms / 1000)}s
Exit code: ${exitCode}
${"═".repeat(70)}
`;
  appendFileSync(logFile, footer);

  // Update latest symlink
  try {
    if (existsSync(latestLink)) unlinkSync(latestLink);
    symlinkSync(logFileName, latestLink);
  } catch {}

  // Append to history
  const record: RunRecord = {
    run_id: runId,
    started: started.toISOString(),
    finished: finished.toISOString(),
    duration_ms,
    exit_code: exitCode,
    log_file: logFileName,
  };
  appendFileSync(historyFile, JSON.stringify(record) + "\n");

  // Cleanup old logs
  cleanupLogs(task.name, task.keep_logs);

  return { exitCode, logFile };
}

function cleanupLogs(name: string, keep: number) {
  const logDir = getTaskLogDir(name);
  if (!existsSync(logDir)) return;

  const files = readdirSync(logDir)
    .filter(f => f.endsWith(".log") && f !== "latest.log")
    .sort()
    .reverse();

  for (const file of files.slice(keep)) {
    try {
      unlinkSync(join(logDir, file));
    } catch {}
  }
}

// Commands
const main = defineCommand({
  meta: {
    name: "claude-schedule",
    version: "1.0.0",
    description: "Schedule Claude Code tasks to run in the background",
  },
  subCommands: {
    add: defineCommand({
      meta: { description: "Add a new scheduled task" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
        every: { type: "string", description: "Run interval (e.g., 5m, 1h, 1d)" },
        once: { type: "boolean", description: "Run only once" },
        in: { type: "string", description: "Run once after delay (e.g., 2h)" },
        at: { type: "string", description: "Run once at specific time (ISO format)" },
        prompt: { type: "string", description: "Claude prompt" },
        file: { type: "string", description: "File containing prompt" },
        keep: { type: "string", description: "Number of logs to keep (default: 50)" },
        cwd: { type: "string", description: "Working directory for task" },
      },
      run: async ({ args }) => {
        const tasks = loadTasks();

        if (tasks.find(t => t.name === args.name)) {
          console.error(`Task "${args.name}" already exists. Remove it first.`);
          process.exit(1);
        }

        if (!args.prompt && !args.file) {
          console.error("Must specify --prompt or --file");
          process.exit(1);
        }

        if (args.file && !existsSync(args.file)) {
          console.error(`File not found: ${args.file}`);
          process.exit(1);
        }

        const isOnce = args.once || args.in || args.at;
        let next_due: Date;
        let interval_ms: number | undefined;

        if (args.every) {
          interval_ms = parseInterval(args.every);
          next_due = new Date(Date.now() + interval_ms);
        } else if (args.in) {
          const delay = parseInterval(args.in);
          next_due = new Date(Date.now() + delay);
        } else if (args.at) {
          next_due = new Date(args.at);
          if (isNaN(next_due.getTime())) {
            console.error(`Invalid date: ${args.at}`);
            process.exit(1);
          }
        } else {
          console.error("Must specify --every, --in, or --at");
          process.exit(1);
        }

        const task: Task = {
          name: args.name,
          prompt: args.prompt,
          file: args.file ? join(process.cwd(), args.file) : undefined,
          interval_ms,
          once: !!isOnce,
          created_at: new Date().toISOString(),
          next_due: next_due.toISOString(),
          status: "active",
          keep_logs: parseInt(args.keep || "50", 10),
          cwd: args.cwd ? join(process.cwd(), args.cwd) : process.cwd(),
        };

        tasks.push(task);
        saveTasks(tasks);

        console.log(`✓ Scheduled task "${args.name}"`);
        console.log(`  ${isOnce ? "Runs once" : `Runs every ${formatInterval(interval_ms!)}`}`);
        console.log(`  Next run: ${formatRelative(next_due)}`);

        // Ensure runner is set up
        await ensureRunner();
      },
    }),

    list: defineCommand({
      meta: { description: "List all scheduled tasks" },
      run: async () => {
        const tasks = loadTasks();

        if (tasks.length === 0) {
          console.log("No scheduled tasks.");
          return;
        }

        console.log("NAME".padEnd(20) + "INTERVAL".padEnd(12) + "NEXT RUN".padEnd(15) + "LAST RUN".padEnd(15) + "STATUS");
        console.log("─".repeat(75));

        for (const task of tasks) {
          const interval = task.once ? "once" : formatInterval(task.interval_ms!);
          const nextRun = formatRelative(new Date(task.next_due));
          const lastRun = task.last_run ? formatRelative(new Date(task.last_run)) : "never";

          console.log(
            task.name.padEnd(20) +
            interval.padEnd(12) +
            nextRun.padEnd(15) +
            lastRun.padEnd(15) +
            task.status
          );
        }
      },
    }),

    remove: defineCommand({
      meta: { description: "Remove a scheduled task" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
      },
      run: async ({ args }) => {
        const tasks = loadTasks();
        const idx = tasks.findIndex(t => t.name === args.name);

        if (idx === -1) {
          console.error(`Task "${args.name}" not found.`);
          process.exit(1);
        }

        tasks.splice(idx, 1);
        saveTasks(tasks);
        console.log(`✓ Removed task "${args.name}"`);
      },
    }),

    pause: defineCommand({
      meta: { description: "Pause a scheduled task" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
      },
      run: async ({ args }) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.name === args.name);

        if (!task) {
          console.error(`Task "${args.name}" not found.`);
          process.exit(1);
        }

        task.status = "paused";
        saveTasks(tasks);
        console.log(`✓ Paused task "${args.name}"`);
      },
    }),

    resume: defineCommand({
      meta: { description: "Resume a paused task" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
      },
      run: async ({ args }) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.name === args.name);

        if (!task) {
          console.error(`Task "${args.name}" not found.`);
          process.exit(1);
        }

        task.status = "active";
        // If next_due is in the past, set it to now (will run on next tick)
        if (new Date(task.next_due) < new Date()) {
          task.next_due = new Date().toISOString();
        }
        saveTasks(tasks);
        console.log(`✓ Resumed task "${args.name}"`);
      },
    }),

    run: defineCommand({
      meta: { description: "Run a task immediately" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
      },
      run: async ({ args }) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.name === args.name);

        if (!task) {
          console.error(`Task "${args.name}" not found.`);
          process.exit(1);
        }

        console.log(`Running task "${args.name}"...`);
        const { exitCode, logFile } = await runTask(task);

        // Update task state
        task.last_run = new Date().toISOString();
        if (task.once) {
          task.status = "completed";
        } else {
          task.next_due = new Date(Date.now() + task.interval_ms!).toISOString();
        }
        saveTasks(tasks);

        console.log(`✓ Task completed with exit code ${exitCode}`);
        console.log(`  Log: ${logFile}`);
      },
    }),

    logs: defineCommand({
      meta: { description: "View task logs" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
        follow: { type: "boolean", alias: ["f"], description: "Follow log output" },
        all: { type: "boolean", description: "List all log files" },
        run: { type: "string", description: "Show specific run (1 = most recent)" },
      },
      run: async ({ args }) => {
        const logDir = getTaskLogDir(args.name);

        if (!existsSync(logDir)) {
          console.error(`No logs found for task "${args.name}"`);
          process.exit(1);
        }

        if (args.all) {
          const files = readdirSync(logDir)
            .filter(f => f.endsWith(".log") && f !== "latest.log")
            .sort()
            .reverse();
          console.log(`Logs for "${args.name}":`);
          files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
          return;
        }

        let logFile: string;
        if (args.run) {
          const files = readdirSync(logDir)
            .filter(f => f.endsWith(".log") && f !== "latest.log")
            .sort()
            .reverse();
          const idx = parseInt(args.run, 10) - 1;
          if (idx < 0 || idx >= files.length) {
            console.error(`Run ${args.run} not found. Use --all to list runs.`);
            process.exit(1);
          }
          logFile = join(logDir, files[idx]);
        } else {
          logFile = join(logDir, "latest.log");
        }

        if (!existsSync(logFile)) {
          console.error(`Log file not found: ${logFile}`);
          process.exit(1);
        }

        if (args.follow) {
          await $`tail -f ${logFile}`;
        } else {
          const content = readFileSync(logFile, "utf-8");
          console.log(content);
        }
      },
    }),

    notes: defineCommand({
      meta: { description: "View or edit task notes" },
      args: {
        name: { type: "positional", description: "Task name (or 'shared' for shared notes)" },
        edit: { type: "boolean", alias: ["e"], description: "Open in editor" },
      },
      run: async ({ args }) => {
        mkdirSync(NOTES_DIR, { recursive: true });
        const notesFile = join(NOTES_DIR, `${args.name || "shared"}.md`);

        if (args.edit) {
          const editor = process.env.EDITOR || "vim";
          await $`${editor} ${notesFile}`;
        } else {
          if (!existsSync(notesFile)) {
            console.log(`No notes found for "${args.name || "shared"}"`);
            console.log(`Create with: claude-schedule notes ${args.name || "shared"} --edit`);
            return;
          }
          console.log(readFileSync(notesFile, "utf-8"));
        }
      },
    }),

    history: defineCommand({
      meta: { description: "Show run history for a task" },
      args: {
        name: { type: "positional", description: "Task name", required: true },
        limit: { type: "string", description: "Number of runs to show (default: 10)" },
      },
      run: async ({ args }) => {
        const historyFile = join(getTaskLogDir(args.name), "history.jsonl");

        if (!existsSync(historyFile)) {
          console.error(`No history found for task "${args.name}"`);
          process.exit(1);
        }

        const lines = readFileSync(historyFile, "utf-8").trim().split("\n");
        const limit = parseInt(args.limit || "10", 10);
        const records: RunRecord[] = lines.slice(-limit).map(l => JSON.parse(l)).reverse();

        console.log("RUN".padEnd(10) + "STARTED".padEnd(22) + "DURATION".padEnd(12) + "EXIT");
        console.log("─".repeat(50));

        for (const r of records) {
          const started = new Date(r.started).toLocaleString();
          const duration = r.duration_ms ? `${Math.round(r.duration_ms / 1000)}s` : "-";
          const exit = r.exit_code?.toString() ?? "-";
          console.log(
            r.run_id.padEnd(10) +
            started.padEnd(22) +
            duration.padEnd(12) +
            exit
          );
        }
      },
    }),

    tick: defineCommand({
      meta: { description: "Run due tasks (called by cron/launchd)" },
      run: async () => {
        const tasks = loadTasks();
        const now = new Date();
        let ran = 0;

        for (const task of tasks) {
          if (task.status !== "active") continue;

          const nextDue = new Date(task.next_due);
          if (nextDue > now) continue;

          console.log(`Running due task: ${task.name}`);
          try {
            await runTask(task);
            task.last_run = now.toISOString();

            if (task.once) {
              task.status = "completed";
            } else {
              // Schedule next run from now (coalesces missed runs)
              task.next_due = new Date(now.getTime() + task.interval_ms!).toISOString();
            }
            ran++;
          } catch (err) {
            console.error(`Error running task ${task.name}:`, err);
          }
        }

        saveTasks(tasks);
        if (ran > 0) console.log(`Ran ${ran} task(s)`);
      },
    }),

    "setup-runner": defineCommand({
      meta: { description: "Set up the background runner (cron/launchd)" },
      run: async () => {
        await ensureRunner();
      },
    }),

    "remove-runner": defineCommand({
      meta: { description: "Remove the background runner" },
      run: async () => {
        await removeRunner();
      },
    }),
  },
});

async function ensureRunner() {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS: use launchd
    const plistPath = join(homedir(), "Library", "LaunchAgents", "com.claude.schedule.plist");
    const binPath = join(homedir(), ".dotfiles", "bin", "claude-schedule");

    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.schedule</string>
    <key>ProgramArguments</key>
    <array>
        <string>${binPath}</string>
        <string>tick</string>
    </array>
    <key>StartInterval</key>
    <integer>60</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${SCHEDULE_DIR}/runner.log</string>
    <key>StandardErrorPath</key>
    <string>${SCHEDULE_DIR}/runner.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${homedir()}/.bun/bin:${homedir()}/.local/bin</string>
    </dict>
</dict>
</plist>`;

    mkdirSync(join(homedir(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync(plistPath, plist);

    await $`launchctl unload ${plistPath} 2>/dev/null`.nothrow();
    await $`launchctl load ${plistPath}`;
    console.log("✓ Runner installed (launchd, runs every 60s)");

  } else {
    // Linux: use cron
    const binPath = join(homedir(), ".dotfiles", "bin", "claude-schedule");
    const cronLine = `* * * * * ${binPath} tick >> ${SCHEDULE_DIR}/runner.log 2>&1`;

    // Check if already in crontab
    const { stdout } = await $`crontab -l 2>/dev/null`.nothrow();
    const currentCron = stdout.toString();

    if (currentCron.includes("claude-schedule tick")) {
      console.log("✓ Runner already installed (cron)");
      return;
    }

    const newCron = currentCron.trim() + "\n" + cronLine + "\n";
    const proc = Bun.spawn(["crontab", "-"], { stdin: "pipe" });
    proc.stdin.write(newCron);
    proc.stdin.end();
    await proc.exited;

    console.log("✓ Runner installed (cron, runs every 60s)");
  }
}

async function removeRunner() {
  const platform = process.platform;

  if (platform === "darwin") {
    const plistPath = join(homedir(), "Library", "LaunchAgents", "com.claude.schedule.plist");
    await $`launchctl unload ${plistPath} 2>/dev/null`.nothrow();
    if (existsSync(plistPath)) unlinkSync(plistPath);
    console.log("✓ Runner removed (launchd)");
  } else {
    const { stdout } = await $`crontab -l 2>/dev/null`.nothrow();
    const lines = stdout.toString().split("\n").filter(l => !l.includes("claude-schedule tick"));
    const proc = Bun.spawn(["crontab", "-"], { stdin: "pipe" });
    proc.stdin.write(lines.join("\n") + "\n");
    proc.stdin.end();
    await proc.exited;
    console.log("✓ Runner removed (cron)");
  }
}

runMain(main);
