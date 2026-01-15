#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";

const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));

const groupFiles = [
  { file: "/tmp/group1.json", name: "Group 1" },
  { file: "/tmp/group3.json", name: "Group 3" },
  { file: "/tmp/group4.json", name: "Group 4" },
];

for (const g of groupFiles) {
  const data = JSON.parse(readFileSync(g.file, "utf-8"));
  if (!data.success) {
    console.log(`${g.name}: FAILED - ${data.error}`);
    continue;
  }

  const participants = data.data.Participants || [];
  console.log(`${g.name} (${participants.length} members):`);

  for (const p of participants) {
    const phoneJid = p.PhoneNumber || "";
    const phone = phoneJid.replace("@s.whatsapp.net", "");

    if (phoneIndex[phone]) {
      phoneIndex[phone].subgroup = g.name;
      const name = phoneIndex[phone].name || "UNKNOWN";
      console.log(`  ${name} (+${phone})`);
    }
  }
  console.log("");
}

// Summary
let inSubgroup = 0;
const unknownInSubgroup: { phone: string; subgroup: string }[] = [];
for (const [phone, info] of Object.entries(phoneIndex) as [string, any][]) {
  if (info.subgroup) {
    inSubgroup++;
    if (!info.name) {
      unknownInSubgroup.push({ phone, subgroup: info.subgroup });
    }
  }
}

console.log("=== Summary ===");
console.log(`Total in subgroups: ${inSubgroup}`);
console.log(`Unknown in subgroups: ${unknownInSubgroup.length}`);
if (unknownInSubgroup.length > 0) {
  console.log("");
  console.log("Unknown members (should ask who they are):");
  unknownInSubgroup.forEach((u) => console.log(`  +${u.phone} (${u.subgroup})`));
}

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("");
console.log("Updated phone-index.json");
