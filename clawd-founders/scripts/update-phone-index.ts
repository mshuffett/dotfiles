import { readFileSync, writeFileSync } from "fs";
import Database from "bun:sqlite";

// Load existing phone index
const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));
console.log("Existing index entries:", phoneIndex.length);

// Open databases
const wacli = new Database("/Users/michael/.wacli/wacli.db", { readonly: true });
const session = new Database("/Users/michael/.wacli/session.db", { readonly: true });

// Build phone → name map from all sources
const phoneToName = new Map<string, string>();

// Source 1: whatsmeow_contacts (most reliable)
const wmContacts = session
  .query(
    `
  SELECT
    REPLACE(their_jid, '@s.whatsapp.net', '') as phone,
    push_name,
    full_name,
    first_name
  FROM whatsmeow_contacts
  WHERE their_jid LIKE '%@s.whatsapp.net'
`
  )
  .all() as { phone: string; push_name: string; full_name: string; first_name: string }[];

for (const c of wmContacts) {
  const name = c.push_name || c.full_name || c.first_name;
  if (name && !phoneToName.has("+" + c.phone)) {
    phoneToName.set("+" + c.phone, name);
  }
}
console.log("From whatsmeow_contacts:", wmContacts.length);

// Source 2: LID mapping + wacli contacts
const lidMap = new Map<string, string>();
const lidRows = session.query("SELECT lid, pn FROM whatsmeow_lid_map").all() as { lid: string; pn: string }[];
for (const row of lidRows) {
  lidMap.set(row.lid, row.pn);
}

const participants = wacli
  .query(
    `
  SELECT
    REPLACE(gp.user_jid, '@lid', '') as lid,
    c.push_name
  FROM group_participants gp
  LEFT JOIN contacts c ON gp.user_jid = c.jid
  WHERE gp.group_jid = '120363405173397414@g.us'
`
  )
  .all() as { lid: string; push_name: string | null }[];

for (const p of participants) {
  const phone = lidMap.get(p.lid);
  if (phone && p.push_name && !phoneToName.has("+" + phone)) {
    phoneToName.set("+" + phone, p.push_name);
  }
}

// Source 3: wacli contacts table
const wacliContacts = wacli
  .query(
    `
  SELECT phone, push_name, full_name
  FROM contacts
  WHERE phone IS NOT NULL AND length(phone) > 0
    AND (push_name IS NOT NULL OR full_name IS NOT NULL)
`
  )
  .all() as { phone: string; push_name: string; full_name: string }[];

for (const c of wacliContacts) {
  const name = c.push_name || c.full_name;
  if (name && !phoneToName.has("+" + c.phone)) {
    phoneToName.set("+" + c.phone, name);
  }
}

console.log("Total unique phone → name mappings:", phoneToName.size);

// Update phone index - add names where missing
let updated = 0;
for (const entry of phoneIndex) {
  if (!entry.name && phoneToName.has(entry.phone)) {
    entry.name = phoneToName.get(entry.phone);
    updated++;
  }
}

console.log("Updated entries:", updated);

// Count stats
const withName = phoneIndex.filter((e: any) => e.name).length;
const withCompany = phoneIndex.filter((e: any) => e.company).length;
console.log("Total with name now:", withName);
console.log("Total with company:", withCompany);
console.log("Still unknown:", phoneIndex.length - withName);

// Save
writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("\nSaved updated phone-index.json");

session.close();
wacli.close();
