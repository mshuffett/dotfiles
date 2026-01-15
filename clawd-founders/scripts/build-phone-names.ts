import { readFileSync, writeFileSync } from "fs";
import Database from "bun:sqlite";

// Load WhatsApp phones
const allWhatsApp = readFileSync("/Users/michael/clawd-founders/founders.txt", "utf-8")
  .split("\n")
  .map((p) => p.trim().replace("+", ""))
  .filter(Boolean);

// Query wacli DB for sender names
const wacli = new Database("/Users/michael/.wacli/wacli.db", { readonly: true });

// Get all sender names (excluding 'me')
const senderNames = wacli
  .query(
    `
  SELECT
    REPLACE(sender_jid, '@s.whatsapp.net', '') as phone,
    sender_name,
    COUNT(*) as msg_count
  FROM messages
  WHERE sender_name IS NOT NULL
    AND sender_name != ''
    AND sender_name != 'me'
    AND sender_jid LIKE '%@s.whatsapp.net'
  GROUP BY sender_jid
  ORDER BY msg_count DESC
`
  )
  .all() as { phone: string; sender_name: string; msg_count: number }[];

// Build phone→name map
const phoneToName = new Map<string, string>();
for (const row of senderNames) {
  if (!phoneToName.has(row.phone)) {
    phoneToName.set(row.phone, row.sender_name);
  }
}

// Also add contacts
const contacts = wacli
  .query(
    `
  SELECT phone, push_name, full_name
  FROM contacts
  WHERE phone IS NOT NULL AND (push_name IS NOT NULL OR full_name IS NOT NULL)
`
  )
  .all() as { phone: string; push_name: string; full_name: string }[];

for (const c of contacts) {
  if (c.phone && !phoneToName.has(c.phone)) {
    phoneToName.set(c.phone, c.push_name || c.full_name);
  }
}

console.log("=== PHONE → NAME MAPPING ===");
console.log("Total names found:", phoneToName.size);
console.log("");

// Check which WhatsApp batch members we can identify
let identified = 0;
let unidentified = 0;
const results: { phone: string; name: string | null; identified: boolean }[] = [];

for (const phone of allWhatsApp) {
  const name = phoneToName.get(phone) || null;
  if (name) {
    identified++;
    results.push({ phone: "+" + phone, name, identified: true });
  } else {
    unidentified++;
    results.push({ phone: "+" + phone, name: null, identified: false });
  }
}

console.log("WhatsApp batch identified:", identified);
console.log("WhatsApp batch unidentified:", unidentified);
console.log("");

console.log("=== IDENTIFIED ===");
for (const r of results.filter((r) => r.identified).slice(0, 40)) {
  console.log(`  ${r.phone}: ${r.name}`);
}

console.log("");
console.log("=== STILL UNIDENTIFIED ===");
const unidentifiedList = results.filter((r) => !r.identified);
console.log(unidentifiedList.length + " numbers");
console.log(unidentifiedList.slice(0, 15).map((r) => r.phone).join(", "));

// Save mapping
writeFileSync("/Users/michael/clawd-founders/data/phone-names.json", JSON.stringify(results, null, 2));
console.log("");
console.log("Saved to data/phone-names.json");
