#!/usr/bin/env bun
/**
 * missing-goals.ts
 *
 * Shows companies in active groups (1-10) that haven't submitted their initial 2-week goals.
 * Always fetches fresh data from Google Sheets first.
 */
import { readFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";
import { execSync } from "child_process";

const CSV_PATH = "/Users/michael/clawd-founders/data/google-sheet.csv";
const GOAL_COL = "[01/07/26]  - Two Week Goals";

// Always fetch fresh data first
console.log("Fetching fresh data from Google Sheets...\n");
execSync("bun /Users/michael/clawd-founders/scripts/sync-goals.ts --fetch", { stdio: "inherit" });

// Now parse the fresh CSV
const csv = readFileSync(CSV_PATH, "utf-8");
const records = parse(csv, { columns: true, bom: true, relax_column_count: true });

interface MissingEntry {
  company: string;
  group: number;
}

const missing: MissingEntry[] = [];
const hasGoals: MissingEntry[] = [];

for (const record of records) {
  const rawName = record["Company"] || "";
  const company = rawName.replace(/\s*\([^)]+\)\s*/g, "").replace(/\s*\n.*/g, "").trim();
  const groupStr = record["Group"] || "";
  const goal = (record[GOAL_COL] || "").trim();

  if (!company || company === "Unknown") continue;

  // Only care about companies in active groups (1-10)
  const groupNum = parseInt(groupStr, 10);
  if (isNaN(groupNum) || groupNum < 1 || groupNum > 10) continue;

  if (!goal) {
    missing.push({ company, group: groupNum });
  } else {
    hasGoals.push({ company, group: groupNum });
  }
}

console.log(`\n=== ACTIVE GROUP COMPANIES MISSING INITIAL 2-WEEK GOALS (${missing.length}) ===\n`);
missing.sort((a, b) => a.group - b.group);

let currentGroup = 0;
for (const c of missing) {
  if (c.group !== currentGroup) {
    if (currentGroup !== 0) console.log("");
    console.log(`Group ${c.group}:`);
    currentGroup = c.group;
  }
  console.log(`  - ${c.company}`);
}

console.log("\n---");
console.log(`Missing goals: ${missing.length}`);
console.log(`Have goals: ${hasGoals.length}`);
