#!/usr/bin/env bun
// Merges all contact sources to build the most complete phone-to-name mapping

import Database from "bun:sqlite";
import { readFileSync, writeFileSync, existsSync } from "fs";

const FOUNDERS_DIR = "/Users/michael/clawd-founders";
const WACLI_SESSION_DB = "/Users/michael/.wacli/session.db";
const WACLI_DB = "/Users/michael/.wacli/wacli.db";

// Load the 103 batch phone numbers
const foundersFile = readFileSync(`${FOUNDERS_DIR}/founders.txt`, "utf-8");
const batchPhones = new Set(
  foundersFile
    .split("\n")
    .map((line) => line.trim().replace(/^\+/, ""))
    .filter(Boolean)
);

console.log(`Loaded ${batchPhones.size} batch phone numbers`);

// Initialize result map: phone -> { name, source }
const phoneIndex: Record<string, { name: string | null; company: string | null; source: string }> = {};

// Initialize all batch phones
for (const phone of batchPhones) {
  phoneIndex[phone] = { name: null, company: null, source: "unknown" };
}

// Source 1: Existing phone-index.json
const existingPath = `${FOUNDERS_DIR}/data/phone-index.json`;
if (existsSync(existingPath)) {
  const existing = JSON.parse(readFileSync(existingPath, "utf-8"));
  let count = 0;
  for (const [phone, data] of Object.entries(existing) as [string, any][]) {
    if (batchPhones.has(phone) && data.name) {
      phoneIndex[phone] = { name: data.name, company: data.company || null, source: "existing" };
      count++;
    }
  }
  console.log(`Source 1 (existing phone-index): ${count} names`);
}

// Source 2: Notion CSV export (has name and phone columns)
// Uses proper CSV parsing to handle quoted fields with commas
const notionCsvPath = `${FOUNDERS_DIR}/data/notion-export.csv`;
if (existsSync(notionCsvPath)) {
  const csvContent = readFileSync(notionCsvPath, "utf-8");

  // Proper CSV parsing - handles quoted fields with commas and newlines
  function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            field += '"';
            i++;
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          row.push(field.trim());
          field = "";
        } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
          row.push(field.trim());
          if (row.length > 1 || row[0]) {
            rows.push(row);
          }
          row = [];
          field = "";
          if (char === "\r") i++;
        } else if (char !== "\r") {
          field += char;
        }
      }
    }
    // Handle last field
    row.push(field.trim());
    if (row.length > 1 || row[0]) {
      rows.push(row);
    }
    return rows;
  }

  const rows = parseCSV(csvContent);
  const headers = rows[0];

  // Find column indices
  const nameIdx = headers.findIndex((h) => h === "Name" || h === "\ufeffName");
  const phoneIdx = headers.findIndex((h) => h.includes("WhatsApp phone number"));
  const companyIdx = headers.findIndex((h) => h.includes("current idea / company"));

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const fields = rows[i];
    const name = fields[nameIdx]?.trim();
    let phone = fields[phoneIdx]?.trim() || "";
    const company = fields[companyIdx]?.trim();

    // Normalize phone: remove +, spaces, dashes, parens
    phone = phone.replace(/[\+\s\-\(\)]/g, "");

    if (name && phone && batchPhones.has(phone) && !phoneIndex[phone]?.name) {
      phoneIndex[phone] = { name, company: company || null, source: "notion-csv" };
      count++;
    }
  }
  console.log(`Source 2 (Notion CSV): ${count} new names`);
}

// Source 3: fetched-contacts.json from Go script
const fetchedPath = `${FOUNDERS_DIR}/data/fetched-contacts.json`;
if (existsSync(fetchedPath)) {
  const fetched = JSON.parse(readFileSync(fetchedPath, "utf-8"));
  let count = 0;
  for (const [phone, name] of Object.entries(fetched) as [string, string][]) {
    if (batchPhones.has(phone) && name) {
      // Only update if we don't have a name yet or source is 'unknown'
      if (!phoneIndex[phone]?.name) {
        phoneIndex[phone] = { name, company: null, source: "whatsmeow-fetch" };
        count++;
      }
    }
  }
  console.log(`Source 3 (Go script fetch): ${count} new names`);
}

// Source 4: whatsmeow_contacts table (direct phone lookup)
const sessionDb = new Database(WACLI_SESSION_DB, { readonly: true });

const directContacts = sessionDb.query(`
  SELECT our_jid, their_jid, push_name, full_name, first_name, business_name
  FROM whatsmeow_contacts
  WHERE push_name IS NOT NULL AND push_name <> '' AND push_name <> '-'
`).all() as any[];

let directCount = 0;
for (const row of directContacts) {
  // Extract phone from JID (format: phone@s.whatsapp.net)
  const jid = row.their_jid || "";
  const match = jid.match(/^(\d+)@/);
  if (!match) continue;

  const phone = match[1];
  if (!batchPhones.has(phone)) continue;

  const name = row.push_name || row.full_name || row.first_name || row.business_name;
  if (name && !phoneIndex[phone]?.name) {
    phoneIndex[phone] = { name, company: null, source: "whatsmeow-contacts" };
    directCount++;
  }
}
console.log(`Source 4 (whatsmeow_contacts direct): ${directCount} new names`);

// Source 4: LID mapping - get phones from LID map, then look up names
const lidMap = sessionDb.query(`
  SELECT lid, pn FROM whatsmeow_lid_map
`).all() as any[];

const lidToPhone: Record<string, string> = {};
for (const row of lidMap) {
  if (row.lid && row.pn) {
    // Phone is stored as just the number
    lidToPhone[row.lid] = row.pn;
  }
}
console.log(`LID map has ${Object.keys(lidToPhone).length} entries`);

// Now look up contacts by LID
const lidContacts = sessionDb.query(`
  SELECT their_jid, push_name, full_name, first_name, business_name
  FROM whatsmeow_contacts
  WHERE their_jid LIKE '%@lid'
    AND push_name IS NOT NULL AND push_name <> '' AND push_name <> '-'
`).all() as any[];

let lidCount = 0;
for (const row of lidContacts) {
  const lidJid = row.their_jid || "";
  const lidMatch = lidJid.match(/^(\d+)@lid$/);
  if (!lidMatch) continue;

  const lid = lidMatch[1];
  const phone = lidToPhone[lid];
  if (!phone || !batchPhones.has(phone)) continue;

  const name = row.push_name || row.full_name || row.first_name || row.business_name;
  if (name && !phoneIndex[phone]?.name) {
    phoneIndex[phone] = { name, company: null, source: "whatsmeow-lid" };
    lidCount++;
  }
}
console.log(`Source 5 (LID mapping): ${lidCount} new names`);

sessionDb.close();

// Source 5: wacli.db contacts table (has both phone and LID based entries)
const wacliDb = new Database(WACLI_DB, { readonly: true });

// Get LID-to-phone mapping from wacli.db
const wacliLidMap: Record<string, string> = {};
for (const [lid, phone] of Object.entries(lidToPhone)) {
  wacliLidMap[lid] = phone;
}

const wacliContacts = wacliDb.query(`
  SELECT phone, push_name, full_name, first_name, business_name
  FROM contacts
  WHERE phone IS NOT NULL AND phone <> ''
    AND (push_name IS NOT NULL AND push_name <> ''
      OR full_name IS NOT NULL AND full_name <> ''
      OR first_name IS NOT NULL AND first_name <> ''
      OR business_name IS NOT NULL AND business_name <> '')
`).all() as any[];

let wacliCount = 0;
for (const row of wacliContacts) {
  let phone = row.phone;

  // Check if phone is actually a LID (longer than 15 digits)
  if (phone.length > 15) {
    // Try to map LID to phone
    phone = lidToPhone[phone] || null;
  }

  if (!phone || !batchPhones.has(phone)) continue;

  const name = row.push_name || row.full_name || row.first_name || row.business_name;
  if (name && !phoneIndex[phone]?.name) {
    phoneIndex[phone] = { name, company: null, source: "wacli-db" };
    wacliCount++;
  }
}
console.log(`Source 6 (wacli.db contacts): ${wacliCount} new names`);

// Source 6: Extract sender names from messages (phone@s.whatsapp.net format)
const messageSenders = wacliDb.query(`
  SELECT DISTINCT sender_jid, sender_name
  FROM messages
  WHERE sender_jid LIKE '%@s.whatsapp.net'
    AND sender_name IS NOT NULL
    AND sender_name <> ''
    AND sender_name <> 'me'
`).all() as any[];

let messageCount = 0;
for (const row of messageSenders) {
  const jid = row.sender_jid || "";
  const match = jid.match(/^(\d+)@s\.whatsapp\.net$/);
  if (!match) continue;

  const phone = match[1];
  if (!batchPhones.has(phone)) continue;

  if (row.sender_name && !phoneIndex[phone]?.name) {
    phoneIndex[phone] = { name: row.sender_name, company: null, source: "messages" };
    messageCount++;
  }
}
console.log(`Source 7 (message sender names): ${messageCount} new names`);

// Source 7: Extract sender names from LID-based messages via LID mapping
const lidMessageSenders = wacliDb.query(`
  SELECT DISTINCT sender_jid, sender_name
  FROM messages
  WHERE sender_jid LIKE '%@lid'
    AND sender_name IS NOT NULL
    AND sender_name <> ''
    AND sender_name <> 'me'
`).all() as any[];

let lidMessageCount = 0;
for (const row of lidMessageSenders) {
  const jid = row.sender_jid || "";
  const lidMatch = jid.match(/^(\d+)@lid$/);
  if (!lidMatch) continue;

  const lid = lidMatch[1];
  const phone = lidToPhone[lid];
  if (!phone || !batchPhones.has(phone)) continue;

  if (row.sender_name && !phoneIndex[phone]?.name) {
    phoneIndex[phone] = { name: row.sender_name, company: null, source: "messages-lid" };
    lidMessageCount++;
  }
}
console.log(`Source 8 (LID message sender names): ${lidMessageCount} new names`);

wacliDb.close();

// Count results
const identified = Object.values(phoneIndex).filter((v) => v.name).length;
const unknown = Object.values(phoneIndex).filter((v) => !v.name).length;

console.log(`\n=== RESULTS ===`);
console.log(`Identified: ${identified} / ${batchPhones.size}`);
console.log(`Unknown: ${unknown}`);

// Show source breakdown
const sources: Record<string, number> = {};
for (const data of Object.values(phoneIndex)) {
  sources[data.source] = (sources[data.source] || 0) + 1;
}
console.log(`\nBy source:`);
for (const [source, count] of Object.entries(sources).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${source}: ${count}`);
}

// Save updated phone-index
writeFileSync(`${FOUNDERS_DIR}/data/phone-index.json`, JSON.stringify(phoneIndex, null, 2));
console.log(`\nSaved to data/phone-index.json`);

// List unknowns
console.log(`\nUnknown phones:`);
for (const [phone, data] of Object.entries(phoneIndex)) {
  if (!data.name) {
    console.log(`  +${phone}`);
  }
}
