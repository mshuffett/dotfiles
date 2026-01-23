#!/usr/bin/env bun
/**
 * sync-goals.ts
 *
 * Syncs the Google Sheet goals/progress to the SQLite database.
 *
 * Usage:
 *   bun sync-goals.ts              # Uses cached CSV
 *   bun sync-goals.ts --fetch      # Fetches fresh from Google Sheets
 */

import { Database } from "bun:sqlite";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";
import { DB_PATH, GOOGLE_SHEET_CSV_PATH } from "./shared/paths";

// Config
const SHEET_ID = "1WrCH7jrhUmpBaIKLPlv39Yoeb_FnqukaAsPOC2wiBPo";
const SHEET_GID = "0"; // First sheet
const CSV_PATH = GOOGLE_SHEET_CSV_PATH;

// Open database
const db = new Database(DB_PATH);

// Ensure goals table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER REFERENCES founders(id),
    company TEXT NOT NULL,
    period TEXT NOT NULL,
    goal TEXT,
    progress TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company, period)
  );

  CREATE INDEX IF NOT EXISTS idx_goals_company ON goals(company);
  CREATE INDEX IF NOT EXISTS idx_goals_founder ON goals(founder_id);

  -- Add demo_goal column to founders if not exists
  -- SQLite doesn't have IF NOT EXISTS for columns, so we check first
`);

// Check if demo_goal column exists, add if not
const columns = db.query("PRAGMA table_info(founders)").all() as { name: string }[];
if (!columns.some(c => c.name === "demo_goal")) {
  db.exec("ALTER TABLE founders ADD COLUMN demo_goal TEXT");
}

async function fetchGoogleSheet(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  console.log("Fetching from Google Sheets...");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const csv = await response.text();
  writeFileSync(CSV_PATH, csv);
  console.log(`Saved fresh CSV to ${CSV_PATH}`);
  return csv;
}

async function loadCSV(): Promise<string> {
  const shouldFetch = process.argv.includes("--fetch");

  if (shouldFetch) {
    return await fetchGoogleSheet();
  }

  if (!existsSync(CSV_PATH)) {
    console.log("No cached CSV found, fetching...");
    return await fetchGoogleSheet();
  }

  console.log(`Using cached CSV from ${CSV_PATH}`);
  return readFileSync(CSV_PATH, "utf-8");
}

interface GoalPeriod {
  period: string;
  goal: string;
  progress: string;
}

interface SheetRow {
  group: number | null;
  company: string;
  demoGoal: string;
  goals: GoalPeriod[];
}

// Extract just the company name (remove founder names in parens)
function extractCompanyName(raw: string): string {
  return raw.replace(/\s*\([^)]+\)\s*/g, "").replace(/\s*\n.*/g, "").trim();
}

function parseSheet(csv: string): SheetRow[] {
  const records = parse(csv, { columns: true, bom: true, relax_column_count: true });
  const rows: SheetRow[] = [];

  // Goal columns mapping
  const goalCols = [
    { goal: "[01/07/26]  - Two Week Goals", progress: "Progress / Notes 1", period: "01/07/26" },
    { goal: "[01/21/26]  - Two Week Goals", progress: "Progress / Notes 2", period: "01/21/26" },
    { goal: "[02/04/26]  - Two Week Goals", progress: "Progress / Notes 3", period: "02/04/26" },
    { goal: "[02/18/26]  - Two Week Goals", progress: "Progress / Notes 4", period: "02/18/26" },
    { goal: "[03/0426]  - Demo Day", progress: "Progress / Notes Final", period: "03/04/26" },
  ];

  for (const record of records) {
    const rawName = record["Company"] || "";
    if (!rawName.trim()) continue;

    const companyName = extractCompanyName(rawName);
    const groupStr = record["Group"] || "";

    const goals: GoalPeriod[] = [];
    for (const col of goalCols) {
      const goal = (record[col.goal] || "").trim();
      const progress = (record[col.progress] || "").trim();
      if (goal || progress) {
        goals.push({ period: col.period, goal, progress });
      }
    }

    rows.push({
      group: groupStr ? parseInt(groupStr, 10) : null,
      company: companyName,
      demoGoal: (record["Demo Day Goal"] || "").trim(),
      goals,
    });
  }

  return rows;
}

function syncToDatabase(rows: SheetRow[]) {
  // Prepare statements
  const upsertGoal = db.prepare(`
    INSERT INTO goals (company, period, goal, progress, founder_id, updated_at)
    VALUES (?, ?, ?, ?, (SELECT id FROM founders WHERE company = ? LIMIT 1), CURRENT_TIMESTAMP)
    ON CONFLICT(company, period) DO UPDATE SET
      goal = excluded.goal,
      progress = excluded.progress,
      updated_at = CURRENT_TIMESTAMP
  `);

  const updateDemoGoal = db.prepare(`
    UPDATE founders SET demo_goal = ? WHERE company = ?
  `);

  let goalsUpdated = 0;
  let demoGoalsUpdated = 0;
  let companiesProcessed = 0;

  for (const row of rows) {
    companiesProcessed++;

    // Update demo goal for founders at this company
    if (row.demoGoal) {
      const result = updateDemoGoal.run(row.demoGoal, row.company);
      if (result.changes > 0) demoGoalsUpdated++;
    }

    // Insert/update goals
    for (const g of row.goals) {
      upsertGoal.run(row.company, g.period, g.goal, g.progress, row.company);
      goalsUpdated++;
    }
  }

  return { companiesProcessed, goalsUpdated, demoGoalsUpdated };
}

// Main
async function main() {
  console.log("=== Goals Sync ===\n");

  const csv = await loadCSV();
  const rows = parseSheet(csv);

  console.log(`Parsed ${rows.length} companies from sheet\n`);

  const stats = syncToDatabase(rows);

  console.log(`Companies processed: ${stats.companiesProcessed}`);
  console.log(`Goal periods synced: ${stats.goalsUpdated}`);
  console.log(`Demo goals updated: ${stats.demoGoalsUpdated}`);

  // Show summary of current goals
  const withGoals = db.query(`
    SELECT COUNT(DISTINCT company) as count FROM goals WHERE goal IS NOT NULL AND goal != ''
  `).get() as { count: number };

  const totalGoals = db.query(`SELECT COUNT(*) as count FROM goals`).get() as { count: number };

  console.log(`\nDatabase now has:`);
  console.log(`  ${withGoals.count} companies with goals`);
  console.log(`  ${totalGoals.count} total goal periods tracked`);

  db.close();
  console.log("\nDone!");
}

main().catch(console.error);
