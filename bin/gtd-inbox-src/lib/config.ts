// Config loader for GTD Inbox Processor
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import type { Config, TodoistProfile } from "../types";

const CONFIG_DIR = join(homedir(), ".config", "gtd-inbox");
const CONFIG_FILE = join(CONFIG_DIR, "config.yaml");
const PROFILES_DIR = join(CONFIG_DIR, "profiles");

let cachedConfig: Config | null = null;

/**
 * Load main configuration
 */
export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  if (!existsSync(CONFIG_FILE)) {
    throw new Error(
      `Config file not found: ${CONFIG_FILE}\n` +
        "Run 'gtd-inbox init' to create default config."
    );
  }

  const content = readFileSync(CONFIG_FILE, "utf-8");
  cachedConfig = parseYaml(content) as Config;

  // Expand ~ in paths
  if (cachedConfig.destinations?.obsidian?.vault) {
    cachedConfig.destinations.obsidian.vault = expandPath(
      cachedConfig.destinations.obsidian.vault
    );
  }
  if (cachedConfig.session?.cache_dir) {
    cachedConfig.session.cache_dir = expandPath(cachedConfig.session.cache_dir);
  }
  if (cachedConfig.copilot?.decision_log) {
    cachedConfig.copilot.decision_log = expandPath(
      cachedConfig.copilot.decision_log
    );
  }
  if (cachedConfig.copilot?.suggestions_file) {
    cachedConfig.copilot.suggestions_file = expandPath(
      cachedConfig.copilot.suggestions_file
    );
  }

  return cachedConfig;
}

/**
 * Load source profile (e.g., todoist, email)
 */
export function loadProfile<T = TodoistProfile>(name: string): T {
  const profilePath = join(PROFILES_DIR, `${name}.yaml`);

  if (!existsSync(profilePath)) {
    throw new Error(
      `Profile not found: ${profilePath}\n` +
        `Available profiles: ${listProfiles().join(", ") || "(none)"}`
    );
  }

  const content = readFileSync(profilePath, "utf-8");
  return parseYaml(content) as T;
}

/**
 * List available profiles
 */
export function listProfiles(): string[] {
  if (!existsSync(PROFILES_DIR)) return [];

  const { readdirSync } = require("fs");
  return readdirSync(PROFILES_DIR)
    .filter((f: string) => f.endsWith(".yaml"))
    .map((f: string) => f.replace(".yaml", ""));
}

/**
 * Get cache directory path
 */
export function getCacheDir(): string {
  const config = loadConfig();
  return config.session?.cache_dir || join(homedir(), ".cache", "gtd-inbox");
}

/**
 * Expand ~ to home directory
 */
export function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

/**
 * Get API token from environment
 */
export function getApiToken(envVar: string): string {
  const token = process.env[envVar];
  if (!token) {
    throw new Error(
      `Environment variable ${envVar} not set.\n` +
        `Please set it in your shell profile or .env file.`
    );
  }
  return token;
}

/**
 * Ensure cache directory exists
 */
export function ensureCacheDir(): string {
  const cacheDir = getCacheDir();
  const { mkdirSync } = require("fs");

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  return cacheDir;
}
