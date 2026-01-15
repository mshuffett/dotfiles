#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";

const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));
const db = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/founders-db.json", "utf-8"));

// Build name -> company mapping from founders-db
// Full name -> company (exact match)
const fullNameToCompany: Record<string, { company: string; group: number }> = {};
// First name -> company (only if unique)
const firstNameCount: Record<string, number> = {};
const firstNameToCompany: Record<string, { company: string; group: number }> = {};

for (const company of db.companies) {
  for (const founder of company.founders || []) {
    if (founder.name) {
      const nameLower = founder.name.toLowerCase().trim();
      fullNameToCompany[nameLower] = { company: company.name, group: company.group };

      // Track first name frequency
      const firstName = nameLower.split(" ")[0];
      if (firstName) {
        firstNameCount[firstName] = (firstNameCount[firstName] || 0) + 1;
        firstNameToCompany[firstName] = { company: company.name, group: company.group };
      }
    }
  }
}

// Only keep first names that are unique (appear exactly once)
const uniqueFirstNames: Record<string, { company: string; group: number }> = {};
for (const [name, count] of Object.entries(firstNameCount)) {
  if (count === 1) {
    uniqueFirstNames[name] = firstNameToCompany[name];
  }
}

console.log("Full names in founders-db:", Object.keys(fullNameToCompany).length);
console.log("Unique first names (safe to match):", Object.keys(uniqueFirstNames).length);

// Clear previous company/group assignments to start fresh
for (const info of Object.values(phoneIndex) as any[]) {
  delete info.company;
  delete info.group;
}

// Try to match our identified names
let matched = 0;
let unmatched = 0;
const unmatchedNames: string[] = [];
const matchedList: string[] = [];
const firstNameMatches: string[] = [];

for (const [phone, info] of Object.entries(phoneIndex) as [string, any][]) {
  if (!info.name) continue;

  const nameLower = info.name.toLowerCase().trim();
  const firstName = nameLower.split(" ")[0];

  // Try full name first, then unique first names only
  let match = fullNameToCompany[nameLower];
  let matchType = "full";

  if (!match && uniqueFirstNames[firstName]) {
    match = uniqueFirstNames[firstName];
    matchType = "first-name";
  }

  if (match) {
    matched++;
    info.company = match.company;
    info.group = match.group;
    const note = matchType === "first-name" ? " [first-name match]" : "";
    matchedList.push(`${info.name} -> ${match.company} (Group ${match.group})${note}`);
    if (matchType === "first-name") {
      firstNameMatches.push(`${info.name} -> ${match.company}`);
    }
  } else {
    unmatched++;
    unmatchedNames.push(info.name);
  }
}

console.log("");
console.log("Of our 85 identified names:");
console.log(`  Matched to company: ${matched}`);
console.log(`  No company match: ${unmatched}`);

console.log("");
console.log("Matched:");
matchedList.forEach((m) => console.log(`  ${m}`));

console.log("");
console.log("Unmatched names:");
unmatchedNames.forEach((n) => console.log(`  ${n}`));

if (firstNameMatches.length > 0) {
  console.log("");
  console.log("⚠️  First-name matches (review these):");
  firstNameMatches.forEach((m) => console.log(`  ${m}`));
}

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("");
console.log("Updated phone-index.json");
