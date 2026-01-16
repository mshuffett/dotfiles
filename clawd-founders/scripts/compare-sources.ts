#!/usr/bin/env bun
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

// Load Google Sheet
const gsCsv = readFileSync("/Users/michael/clawd-founders/data/google-sheet.csv", "utf-8");
const gsRecords = parse(gsCsv, { columns: true, bom: true, relax_column_count: true });

// Load founders CSV
const fCsv = readFileSync("/Users/michael/clawd-founders/data/founders.csv", "utf-8");
const fRecords = parse(fCsv, { columns: true, bom: true });

console.log("=== Google Sheet Companies ===");
const gsCompanies: { group: string; company: string; hint: string; demoGoal: string; goal1: string }[] = [];
for (const r of gsRecords) {
  if (r.Group && r.Company) {
    const match = r.Company.match(/\(([^)]+)\)/);
    const hint = match ? match[1] : "";
    const company = r.Company.replace(/\s*\([^)]+\)\s*/g, "").replace(/\n.*/g, "").trim();
    gsCompanies.push({
      group: r.Group,
      company,
      hint,
      demoGoal: r["Demo Day Goal"] || "",
      goal1: r["[01/07/26]  - Two Week Goals"] || "",
    });
  }
}

// Sort by group
gsCompanies.sort((a, b) => parseInt(a.group) - parseInt(b.group));

for (const c of gsCompanies) {
  console.log(`G${c.group} | ${c.company} ${c.hint ? `(${c.hint})` : ""}`);
}

console.log("\n=== Founders CSV by Subgroup ===");
const byGroup: Record<string, { name: string; company: string }[]> = {};
for (const f of fRecords) {
  const g = f.Subgroup || "?";
  if (!byGroup[g]) byGroup[g] = [];
  byGroup[g].push({ name: f.Name, company: f.Company });
}

for (const g of Object.keys(byGroup).sort((a, b) => parseInt(a) - parseInt(b))) {
  console.log(`\nGroup ${g}:`);
  for (const f of byGroup[g]) {
    console.log(`  ${f.name} -> ${f.company}`);
  }
}

console.log("\n=== Suggested Mapping (Google Sheet -> founders.csv) ===");
// Try to match by founder name hints
for (const gs of gsCompanies) {
  // Find matching founder in founders.csv for this group
  const groupFounders = byGroup[gs.group] || [];

  // Check if company names match
  const exactMatch = groupFounders.find(f => f.company === gs.company);
  if (exactMatch) {
    continue; // Already matches
  }

  // Check if hint matches a founder name
  if (gs.hint) {
    const hintMatch = groupFounders.find(f =>
      f.name.toLowerCase().includes(gs.hint.toLowerCase()) ||
      gs.hint.toLowerCase().includes(f.name.split(" ")[0].toLowerCase())
    );
    if (hintMatch) {
      console.log(`G${gs.group}: "${gs.company}" (hint: ${gs.hint}) -> founder "${hintMatch.name}" has company "${hintMatch.company}"`);
    }
  } else {
    // No hint, just report the mismatch
    const fcCompanies = groupFounders.map(f => f.company).filter((v, i, a) => a.indexOf(v) === i);
    console.log(`G${gs.group}: GS has "${gs.company}", FC has: ${fcCompanies.join(", ")}`);
  }
}
