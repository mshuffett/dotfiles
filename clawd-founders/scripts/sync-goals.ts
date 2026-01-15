#!/usr/bin/env bun
/**
 * sync-goals.ts
 *
 * Syncs the Google Sheet goals/progress to company markdown files.
 *
 * Usage:
 *   bun sync-goals.ts              # Uses cached CSV
 *   bun sync-goals.ts --fetch      # Fetches fresh from Google Sheets
 *
 * The script updates the "Current Progress" section in each company file.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";

// Config
const SHEET_ID = "1WrCH7jrhUmpBaIKLPlv39Yoeb_FnqukaAsPOC2wiBPo";
const SHEET_GID = "0"; // First sheet
const CSV_PATH = "/Users/michael/clawd-founders/data/google-sheet.csv";
const FOUNDERS_DIR = "/Users/michael/clawd-founders/founders";

// Slugify company name (must match generate-company-files.ts)
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Extract just the company name (remove founder names in parens)
function extractCompanyName(raw: string): string {
  return raw.replace(/\s*\([^)]+\)\s*/g, "").replace(/\s*\n.*/g, "").trim();
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

interface SheetRow {
  group: number | null;
  company: string;
  slug: string;
  demoGoal: string;
  goals: { period: string; goal: string; progress: string }[];
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

    const goals: SheetRow["goals"] = [];
    for (const col of goalCols) {
      const goal = record[col.goal] || "";
      const progress = record[col.progress] || "";
      if (goal || progress) {
        goals.push({ period: col.period, goal, progress });
      }
    }

    rows.push({
      group: groupStr ? parseInt(groupStr, 10) : null,
      company: companyName,
      slug: slugify(companyName),
      demoGoal: record["Demo Day Goal"] || "",
      goals,
    });
  }

  return rows;
}

function updateCompanyFile(row: SheetRow): boolean {
  const filePath = `${FOUNDERS_DIR}/${row.slug}.md`;

  if (!existsSync(filePath)) {
    // Try alternative slugs
    const altSlugs = [
      row.slug.replace(/-ai$/, ""),
      row.slug + "-ai",
      row.slug.replace(/-labs$/, ""),
    ];
    for (const alt of altSlugs) {
      const altPath = `${FOUNDERS_DIR}/${alt}.md`;
      if (existsSync(altPath)) {
        return updateCompanyFileAtPath(row, altPath);
      }
    }
    return false;
  }

  return updateCompanyFileAtPath(row, filePath);
}

function updateCompanyFileAtPath(row: SheetRow, filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");

  // Find and replace the "Current Progress" section
  const progressStart = content.indexOf("## Current Progress");
  const progressEnd = content.indexOf("\n## ", progressStart + 1);

  if (progressStart === -1) {
    // Add section before "## Context" or at the end
    const contextStart = content.indexOf("## Context");
    const interactionStart = content.indexOf("## Interaction Log");

    let insertPoint = contextStart;
    if (insertPoint === -1) insertPoint = interactionStart;
    if (insertPoint === -1) insertPoint = content.length;

    const progressSection = buildProgressSection(row);
    const newContent =
      content.slice(0, insertPoint) + progressSection + "\n" + content.slice(insertPoint);

    writeFileSync(filePath, newContent);
    return true;
  }

  // Replace existing section
  const endPoint = progressEnd === -1 ? content.indexOf("## Context") : progressEnd;
  if (endPoint === -1) return false;

  const progressSection = buildProgressSection(row);
  const newContent = content.slice(0, progressStart) + progressSection + content.slice(endPoint);

  writeFileSync(filePath, newContent);
  return true;
}

function buildProgressSection(row: SheetRow): string {
  const lines: string[] = [];
  lines.push("## Current Progress");

  if (row.goals.length === 0) {
    lines.push("*No goals set yet*");
    lines.push("");
  } else {
    for (const g of row.goals) {
      lines.push(`### ${g.period}`);
      if (g.goal) lines.push(`**Goal:** ${g.goal}`);
      if (g.progress) lines.push(`**Progress:** ${g.progress}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// Main
async function main() {
  console.log("=== Goals Sync ===\n");

  const csv = await loadCSV();
  const rows = parseSheet(csv);

  console.log(`\nParsed ${rows.length} companies from sheet\n`);

  let updated = 0;
  let notFound = 0;
  const notFoundList: string[] = [];

  for (const row of rows) {
    if (updateCompanyFile(row)) {
      updated++;
    } else {
      notFound++;
      notFoundList.push(`${row.company} (${row.slug})`);
    }
  }

  console.log(`Updated: ${updated} company files`);
  console.log(`Not found: ${notFound} companies`);

  if (notFoundList.length > 0 && notFoundList.length <= 20) {
    console.log("\nMissing files for:");
    for (const name of notFoundList) {
      console.log(`  - ${name}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
