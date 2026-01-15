#!/usr/bin/env bun
import { readFileSync } from "fs";

const db = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/founders-db.json", "utf-8"));

const noGoals: { name: string; group: number | null; founders: string[] }[] = [];
const hasGoals: { name: string; group: number | null }[] = [];

for (const company of db.companies) {
  const founderNames = (company.founders || [])
    .map((f: any) => f.name)
    .filter(Boolean);

  if (!company.goals || company.goals.length === 0) {
    noGoals.push({ name: company.name, group: company.group, founders: founderNames });
  } else {
    hasGoals.push({ name: company.name, group: company.group });
  }
}

console.log(`=== Companies WITHOUT 2-week goals (${noGoals.length}) ===`);
noGoals.sort((a, b) => (a.group || 99) - (b.group || 99));
for (const c of noGoals) {
  const founders = c.founders.length > 0 ? ` - ${c.founders.join(", ")}` : "";
  console.log(`  Group ${c.group || "?"}: ${c.name}${founders}`);
}

console.log("");
console.log(`=== Companies WITH goals (${hasGoals.length}) ===`);
hasGoals.sort((a, b) => (a.group || 99) - (b.group || 99));
for (const c of hasGoals) {
  console.log(`  Group ${c.group || "?"}: ${c.name}`);
}
