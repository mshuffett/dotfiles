#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";

const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));
const subgroups = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/subgroup-members.json", "utf-8"));

// Clear existing subgroup assignments
for (const info of Object.values(phoneIndex) as any[]) {
  delete info.subgroup;
}

let updated = 0;
let notFound = 0;
const notFoundList: string[] = [];

for (const [groupName, groupData] of Object.entries(subgroups) as [string, any][]) {
  console.log(`\n=== ${groupName} ===`);

  for (const member of groupData.members) {
    if (member.phone) {
      // Normalize phone (remove leading country codes if needed)
      let phone = member.phone;

      // Check if this phone is in our index
      if (phoneIndex[phone]) {
        phoneIndex[phone].subgroup = groupName;
        phoneIndex[phone].name = phoneIndex[phone].name || member.name;
        updated++;
        console.log(`  ✓ ${member.name} (${phone}) -> ${groupName}`);
      } else {
        notFound++;
        notFoundList.push(`${member.name} (${phone}) - ${groupName}`);
        console.log(`  ✗ ${member.name} (${phone}) - NOT IN INDEX`);
      }
    } else {
      // Try to find by name
      let found = false;
      for (const [p, info] of Object.entries(phoneIndex) as [string, any][]) {
        if (info.name && info.name.toLowerCase().includes(member.name.toLowerCase())) {
          phoneIndex[p].subgroup = groupName;
          updated++;
          console.log(`  ✓ ${member.name} (${p}) -> ${groupName} [matched by name]`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`  ? ${member.name} - no phone, couldn't match by name`);
      }
    }
  }
}

console.log("\n=== Summary ===");
console.log(`Updated: ${updated}`);
console.log(`Not found in index: ${notFound}`);

if (notFoundList.length > 0) {
  console.log("\nNot found:");
  notFoundList.forEach(n => console.log(`  ${n}`));
}

// Count by subgroup
const subgroupCounts: Record<string, number> = {};
for (const info of Object.values(phoneIndex) as any[]) {
  if (info.subgroup) {
    subgroupCounts[info.subgroup] = (subgroupCounts[info.subgroup] || 0) + 1;
  }
}

console.log("\nSubgroup membership in phone-index:");
for (const [group, count] of Object.entries(subgroupCounts)) {
  console.log(`  ${group}: ${count}`);
}

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("\nUpdated phone-index.json");
