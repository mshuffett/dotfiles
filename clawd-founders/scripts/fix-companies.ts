#!/usr/bin/env bun
/**
 * fix-companies.ts
 *
 * Updates founders.csv with correct company names based on Google Sheet analysis.
 * Also outputs what the Google Sheet should look like.
 */
import { readFileSync, writeFileSync } from "fs";
import { parse } from "csv-parse/sync";

const FOUNDERS_CSV = "/Users/michael/clawd-founders/data/founders.csv";

// Load founders CSV
const csv = readFileSync(FOUNDERS_CSV, "utf-8");
const records = parse(csv, { columns: true, bom: true });

// Updates to make in founders.csv (based on Google Sheet being correct)
const founderUpdates: Record<string, { company?: string; subgroup?: string }> = {
  "Oliver Zou": { company: "Deep24" },           // Was "Strava", GS has "Deep24"
  "Hardik Vala": { company: "denormalized" },    // Was "Stealth", GS has "denormalized"
  "Connor Engelsberg": { company: "Orvyn" },     // Was "Simon AI", GS has "Orvyn"
  "Aidan Pratt": { company: "AutoStep" },        // Was "Stealth", GS has "AutoStep"
  "Ajay Vasisht": { company: "Irving Technology" }, // Was "Stealth", GS has "Irving Technology"
  "Noah Debrincat": { company: "MISTASHO" },     // Was "MISTACHO", GS has "MISTASHO"
  "Rune Hauge": { subgroup: "4" },               // Was group 1, GS has group 4
};

// Google Sheet corrections (where founders.csv is correct)
const gsCorrections = [
  { gsCompany: "AI Expert Clones", correctCompany: "Mindbase", note: "Keep Mindbase" },
  { gsCompany: "AI Video Studio", correctCompany: "Marketfix.xyz", note: "Keep Marketfix.xyz (Darwin Lo)" },
];

console.log("=== Updating founders.csv ===\n");

for (const record of records) {
  const update = founderUpdates[record.Name];
  if (update) {
    if (update.company) {
      console.log(`${record.Name}: "${record.Company}" -> "${update.company}"`);
      record.Company = update.company;
    }
    if (update.subgroup) {
      console.log(`${record.Name}: Subgroup ${record.Subgroup} -> ${update.subgroup}`);
      record.Subgroup = update.subgroup;
    }
  }
}

// Write updated CSV manually
const columns = Object.keys(records[0]);
const lines = [columns.join(",")];
for (const record of records) {
  const values = columns.map(col => {
    const val = record[col] || "";
    // Quote if contains comma, quote, or newline
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  });
  lines.push(values.join(","));
}
writeFileSync(FOUNDERS_CSV, lines.join("\n") + "\n");
console.log(`\nSaved updated founders.csv`);

console.log("\n=== Google Sheet Corrections Needed ===");
console.log("(These are wrong in Google Sheet, founders.csv is correct)\n");
for (const c of gsCorrections) {
  console.log(`- "${c.gsCompany}" should be "${c.correctCompany}" - ${c.note}`);
}

console.log("\n=== Summary ===");
console.log("Updated in founders.csv:");
for (const [name, update] of Object.entries(founderUpdates)) {
  const parts = [];
  if (update.company) parts.push(`company -> ${update.company}`);
  if (update.subgroup) parts.push(`subgroup -> ${update.subgroup}`);
  console.log(`  - ${name}: ${parts.join(", ")}`);
}
