#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

type TogglConfig = {
  workspaceId?: number;
  defaultProjectId?: number;
  projectAliases?: Record<string, number>;
};

const API_BASE = "https://api.track.toggl.com/api/v9";

function configPath() {
  return join(homedir(), ".config", "toggl", "config.json");
}

function loadConfig(): TogglConfig {
  const p = configPath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as TogglConfig;
  } catch {
    return {};
  }
}

function saveConfig(cfg: TogglConfig) {
  const p = configPath();
  mkdirSync(join(homedir(), ".config", "toggl"), { recursive: true });
  writeFileSync(p, JSON.stringify(cfg, null, 2) + "\n", "utf-8");
}

function togglToken(): string {
  const t = process.env.TOGGL_API_TOKEN;
  if (!t) {
    throw new Error(
      "TOGGL_API_TOKEN not set. Add it to ~/.env.zsh (global) and restart your shell."
    );
  }
  return t;
}

function authHeader(): string {
  // Toggl Track API v9: basic auth with API token as username, "api_token" as password.
  const raw = `${togglToken()}:api_token`;
  const b64 = Buffer.from(raw, "utf-8").toString("base64");
  return `Basic ${b64}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Toggl API error ${res.status} ${res.statusText} for ${path}${body ? `\n${body}` : ""}`
    );
  }

  // Many endpoints return JSON; some stop endpoints can return empty bodies.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function requireWorkspaceId(argsWid?: number): number {
  if (argsWid) return argsWid;
  const cfg = loadConfig();
  if (cfg.workspaceId) return cfg.workspaceId;
  throw new Error(
    "No workspace configured. Run: toggl init (or toggl init --workspace <id>)"
  );
}

function parseLocalDateTime(input: string): Date {
  // Accept:
  // - "YYYY-MM-DD"
  // - "YYYY-MM-DD HH:MM"
  // - ISO strings
  const s = input.trim();
  if (s.includes("T")) {
    const d = new Date(s);
    if (isNaN(d.getTime())) throw new Error(`Could not parse datetime: ${input}`);
    return d;
  }
  const [datePart, timePart] = s.split(/\s+/, 2);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!m) throw new Error(`Could not parse date: ${input}`);
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  let hour = 0;
  let minute = 0;
  if (timePart) {
    const t = /^(\d{1,2}):(\d{2})$/.exec(timePart);
    if (!t) throw new Error(`Could not parse time: ${input}`);
    hour = Number(t[1]);
    minute = Number(t[2]);
  }
  const d = new Date(year, month, day, hour, minute, 0, 0);
  if (isNaN(d.getTime())) throw new Error(`Could not parse datetime: ${input}`);
  return d;
}

type MeResponse = {
  id: number;
  email: string;
  fullname?: string;
  workspaces?: Array<{ id: number; name: string }>;
};

type CurrentEntryResponse = { data: null | { id: number; wid?: number; workspace_id?: number; description?: string; start?: string; duration?: number } };

const main = defineCommand({
  meta: {
    name: "toggl",
    version: "0.1.0",
    description:
      "Toggl Track CLI (API v9). Requires TOGGL_API_TOKEN in environment.",
  },
  subCommands: {
    me: defineCommand({
      meta: { description: "Show current user + available workspaces" },
      run: async () => {
        const me = await api<MeResponse>("/me");
        console.log(`email: ${me.email}`);
        if (me.fullname) console.log(`name: ${me.fullname}`);
        if (me.workspaces?.length) {
          console.log("workspaces:");
          for (const w of me.workspaces) console.log(`- ${w.id}\t${w.name}`);
        }
      },
    }),

    init: defineCommand({
      meta: { description: "Save default workspaceId to ~/.config/toggl/config.json" },
      args: {
        workspace: { type: "number", description: "Workspace ID to set as default" },
        workspaceName: {
          type: "string",
          description: "Workspace name (substring match) to set as default",
        },
      },
      run: async ({ args }) => {
        const me = await api<MeResponse>("/me");
        const wss = me.workspaces || [];
        if (!wss.length) throw new Error("No workspaces found on /me response.");

        let chosen: { id: number; name: string } | undefined;
        if (args.workspace) chosen = wss.find((w) => w.id === args.workspace);
        if (!chosen && args.workspaceName) {
          const needle = args.workspaceName.toLowerCase();
          chosen = wss.find((w) => w.name.toLowerCase().includes(needle));
        }
        if (!chosen) chosen = wss[0];

        const cfg = loadConfig();
        cfg.workspaceId = chosen.id;
        saveConfig(cfg);
        console.log(`workspaceId set: ${chosen.id}\t${chosen.name}`);
      },
    }),

    status: defineCommand({
      meta: { description: "Show currently running time entry (if any)" },
      run: async () => {
        const cur = await api<CurrentEntryResponse>("/me/time_entries/current");
        if (!cur.data) {
          console.log("No running time entry.");
          return;
        }
        const wid = cur.data.workspace_id ?? cur.data.wid;
        console.log(`id: ${cur.data.id}`);
        if (wid) console.log(`workspaceId: ${wid}`);
        if (cur.data.description) console.log(`description: ${cur.data.description}`);
        if (cur.data.start) console.log(`start: ${cur.data.start}`);
        if (typeof cur.data.duration === "number") console.log(`duration: ${cur.data.duration}`);
      },
    }),

    start: defineCommand({
      meta: { description: "Start a running time entry now" },
      args: {
        desc: { type: "string", required: true, description: "Description" },
        workspace: { type: "number", description: "Workspace ID (overrides config)" },
        projectId: { type: "number", description: "Project ID" },
        tags: { type: "string", description: "Comma-separated tags" },
      },
      run: async ({ args }) => {
        const wid = requireWorkspaceId(args.workspace);
        const payload: any = {
          created_with: "toggl.ts",
          description: args.desc,
          workspace_id: wid,
          duration: -1,
          start: new Date().toISOString(),
          stop: null,
          tags: args.tags ? args.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        };
        if (args.projectId) payload.project_id = args.projectId;
        await api(`/workspaces/${wid}/time_entries`, { method: "POST", body: JSON.stringify(payload) });
        console.log("Started.");
      },
    }),

    stop: defineCommand({
      meta: { description: "Stop the currently running time entry" },
      run: async () => {
        const cur = await api<CurrentEntryResponse>("/me/time_entries/current");
        if (!cur.data) {
          console.log("No running time entry.");
          return;
        }
        const wid = cur.data.workspace_id ?? cur.data.wid;
        if (!wid) throw new Error("Current entry missing workspace id.");
        await api(`/workspaces/${wid}/time_entries/${cur.data.id}/stop`, { method: "PATCH" });
        console.log("Stopped.");
      },
    }),

    log: defineCommand({
      meta: { description: "Create a finished time entry (manual mode)" },
      args: {
        desc: { type: "string", required: true, description: "Description" },
        start: { type: "string", required: true, description: 'Start time, e.g. "2026-02-09 10:00"' },
        minutes: { type: "number", required: true, description: "Duration in minutes" },
        workspace: { type: "number", description: "Workspace ID (overrides config)" },
        projectId: { type: "number", description: "Project ID" },
        tags: { type: "string", description: "Comma-separated tags" },
      },
      run: async ({ args }) => {
        const wid = requireWorkspaceId(args.workspace);
        const startDt = parseLocalDateTime(args.start);
        const seconds = Math.round(args.minutes * 60);
        const payload: any = {
          created_with: "toggl.ts",
          description: args.desc,
          workspace_id: wid,
          duration: seconds,
          start: startDt.toISOString(),
          tags: args.tags ? args.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        };
        if (args.projectId) payload.project_id = args.projectId;
        await api(`/workspaces/${wid}/time_entries`, { method: "POST", body: JSON.stringify(payload) });
        console.log("Logged.");
      },
    }),
  },
});

runMain(main);

