#!/usr/bin/env bun
import Database from "bun:sqlite";
import { readFileSync, writeFileSync } from "fs";

const wacliDb = new Database("/Users/michael/.wacli/wacli.db", { readonly: true });
const sessionDb = new Database("/Users/michael/.wacli/session.db", { readonly: true });
const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));

// Get LID to phone mapping
const lidMap: Record<string, string> = {};
const lidRows = sessionDb.query("SELECT lid, pn FROM whatsmeow_lid_map").all() as any[];
for (const row of lidRows) {
  lidMap[row.lid] = row.pn;
}

const groups: Record<string, string> = {
  "120363405702485762@g.us": "Group 1",
  "120363407403094234@g.us": "Group 3",
  "120363425930864584@g.us": "Group 4",
};

// Get unique senders from messages in each group
const phoneToGroup: Record<string, string> = {};

for (const [groupJid, groupName] of Object.entries(groups)) {
  const senders = wacliDb
    .query("SELECT DISTINCT sender_jid FROM messages WHERE chat_jid = ? AND sender_jid IS NOT NULL")
    .all(groupJid) as any[];

  for (const s of senders) {
    const jid = s.sender_jid;
    if (!jid) continue;

    let phone: string | null = null;
    if (jid.endsWith("@lid")) {
      const lid = jid.replace("@lid", "");
      phone = lidMap[lid] || null;
    } else if (jid.endsWith("@s.whatsapp.net")) {
      phone = jid.replace("@s.whatsapp.net", "");
    }

    if (phone && phoneIndex[phone]) {
      if (!phoneToGroup[phone]) {
        phoneToGroup[phone] = groupName;
      }
    }
  }
}

console.log("=== Members identified from messages ===");
const byGroup: Record<string, string[]> = { "Group 1": [], "Group 3": [], "Group 4": [] };

for (const [phone, group] of Object.entries(phoneToGroup)) {
  const info = phoneIndex[phone];
  const name = info.name || "UNKNOWN";
  byGroup[group].push(`${name} (+${phone})`);
  phoneIndex[phone].subgroup = group;
}

for (const [group, members] of Object.entries(byGroup)) {
  console.log(`\n${group} (${members.length} members):`);
  members.forEach((m) => console.log(`  ${m}`));
}

// Count summary
let inSubgroup = 0;
let unknownInSubgroup = 0;
const unknownList: string[] = [];

for (const [phone, info] of Object.entries(phoneIndex) as [string, any][]) {
  if (info.subgroup) {
    inSubgroup++;
    if (!info.name) {
      unknownInSubgroup++;
      unknownList.push(`+${phone} (${info.subgroup})`);
    }
  }
}

console.log("\n=== Summary ===");
console.log(`Total with subgroup assignment: ${inSubgroup}`);
console.log(`Unknown but in subgroup: ${unknownInSubgroup}`);

if (unknownList.length > 0) {
  console.log("\nUnknown members in subgroups (should ask them):");
  unknownList.forEach((u) => console.log(`  ${u}`));
}

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("\nUpdated phone-index.json");

sessionDb.close();
wacliDb.close();
