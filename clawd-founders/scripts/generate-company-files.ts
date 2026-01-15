import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import Database from "bun:sqlite";

// === DATA LOADING ===

// Load founders database (from previous matching script)
const foundersDb = JSON.parse(
  readFileSync("/Users/michael/clawd-founders/data/founders-db.json", "utf-8")
);

// Load WhatsApp batch phones
const batchPhones = new Set(
  readFileSync("/Users/michael/clawd-founders/founders.txt", "utf-8")
    .split("\n")
    .map((p) => p.trim().replace("+", "").replace(/\D/g, ""))
    .filter(Boolean)
);

console.log(`Batch size: ${batchPhones.size} phones`);
console.log(`Companies from DB: ${foundersDb.companies.length}`);

// === ENRICH WITH WHATSAPP NAMES ===

// Query wacli for phone → name mappings from DM history
const wacli = new Database("/Users/michael/.wacli/wacli.db", { readonly: true });

const dmNames = wacli
  .query(
    `
  SELECT DISTINCT
    REPLACE(sender_jid, '@s.whatsapp.net', '') as phone,
    sender_name as name
  FROM messages
  WHERE sender_jid LIKE '%@s.whatsapp.net'
    AND sender_name IS NOT NULL
    AND length(sender_name) > 0
    AND sender_name != 'me'
`
  )
  .all() as { phone: string; name: string }[];

// Also get contacts
const contacts = wacli
  .query(
    `
  SELECT phone, push_name, full_name, first_name
  FROM contacts
  WHERE phone IS NOT NULL AND length(phone) > 0
    AND (push_name IS NOT NULL OR full_name IS NOT NULL OR first_name IS NOT NULL)
`
  )
  .all() as { phone: string; push_name: string; full_name: string; first_name: string }[];

wacli.close();

// Build phone → name map (prefer DM names, then contacts)
const phoneToName = new Map<string, string>();

for (const c of contacts) {
  const name = c.push_name || c.full_name || c.first_name;
  if (name && !phoneToName.has(c.phone)) {
    phoneToName.set(c.phone, name);
  }
}

for (const dm of dmNames) {
  // DM names override contact names (more likely to be accurate)
  if (dm.name && dm.name !== dm.phone) {
    phoneToName.set(dm.phone, dm.name);
  }
}

console.log(`Phone → name mappings: ${phoneToName.size}`);

// === CREATE PHONE → COMPANY INDEX ===

interface PhoneIndex {
  phone: string;
  name: string | null;
  company: string | null;
  companySlug: string | null;
  inBatch: boolean;
  inNotion: boolean;
}

const phoneIndex: PhoneIndex[] = [];

// First, add all batch phones
for (const phone of batchPhones) {
  phoneIndex.push({
    phone: "+" + phone,
    name: phoneToName.get(phone) || null,
    company: null,
    companySlug: null,
    inBatch: true,
    inNotion: false,
  });
}

// Update with company info from founders-db
for (const company of foundersDb.companies) {
  for (const founder of company.founders) {
    if (!founder.phone) continue;

    const phone = founder.phone.replace(/\D/g, "");
    const idx = phoneIndex.findIndex((p) => p.phone === "+" + phone);

    if (idx >= 0) {
      phoneIndex[idx].company = company.name;
      phoneIndex[idx].companySlug = company.slug;
      phoneIndex[idx].inNotion = true;
      // Prefer Notion name over WhatsApp name
      if (founder.name) {
        phoneIndex[idx].name = founder.name;
      }
    }
  }
}

// Stats
const identified = phoneIndex.filter((p) => p.name).length;
const withCompany = phoneIndex.filter((p) => p.company).length;
console.log(`\nPhone index stats:`);
console.log(`  Total batch: ${phoneIndex.length}`);
console.log(`  With name: ${identified}`);
console.log(`  With company: ${withCompany}`);
console.log(`  Unidentified: ${phoneIndex.length - identified}`);

// === GENERATE COMPANY MARKDOWN FILES ===

const foundersDir = "/Users/michael/clawd-founders/founders";
if (!existsSync(foundersDir)) {
  mkdirSync(foundersDir, { recursive: true });
}

let filesCreated = 0;
let filesSkipped = 0;

for (const company of foundersDb.companies) {
  // Only create files for companies with founders or goals
  if (company.founders.length === 0 && company.goals.length === 0 && !company.demoGoal) {
    filesSkipped++;
    continue;
  }

  const lines: string[] = [];

  // Header
  lines.push(`# ${company.name}`);
  lines.push("");

  // Founders
  if (company.founders.length > 0) {
    lines.push("## Founders");
    for (const f of company.founders) {
      const phone = f.phone ? `+${f.phone}` : "no phone";
      const email = f.email || "no email";
      const inWA = f.inWhatsApp ? "✓ in WhatsApp" : "";
      lines.push(`- **${f.name}** - ${phone} - ${email} ${inWA}`);
    }
    lines.push("");
  }

  // Batch Status
  lines.push("## Batch Status");
  if (company.group) {
    lines.push(`- **Group:** ${company.group}`);
  }
  if (company.demoGoal) {
    lines.push(`- **Demo Day Goal:** ${company.demoGoal}`);
  }
  const inWhatsApp = company.founders.some((f: any) => f.inWhatsApp);
  lines.push(`- **In WhatsApp:** ${inWhatsApp ? "Yes" : "No"}`);
  lines.push("");

  // Current Progress (from Google Sheet goals)
  if (company.goals.length > 0) {
    lines.push("## Current Progress");
    for (const g of company.goals) {
      lines.push(`### ${g.period}`);
      if (g.goal) lines.push(`**Goal:** ${g.goal}`);
      if (g.progress) lines.push(`**Progress:** ${g.progress}`);
      lines.push("");
    }
  }

  // Context (from Notion)
  const firstFounder = company.founders[0];
  if (firstFounder) {
    lines.push("## Context");
    if (firstFounder.batch) lines.push(`- **YC Batch:** ${firstFounder.batch}`);
    if (firstFounder.location) lines.push(`- **Location:** ${firstFounder.location}`);
    if (firstFounder.stage) lines.push(`- **Stage:** ${firstFounder.stage}`);
    if (firstFounder.fitScore) lines.push(`- **Fit Score:** ${firstFounder.fitScore}`);
    if (firstFounder.fitTier) lines.push(`- **Fit Tier:** ${firstFounder.fitTier}`);
    if (firstFounder.inSF) lines.push(`- **In SF:** ${firstFounder.inSF}`);
    lines.push("");
  }

  // Research Notes
  const notesFounder = company.founders.find((f: any) => f.notes);
  if (notesFounder?.notes) {
    lines.push("## Research Notes");
    lines.push(notesFounder.notes);
    lines.push("");
  }

  // Interaction Log placeholder
  lines.push("## Interaction Log");
  lines.push("<!-- Agent appends after each conversation -->");
  lines.push("");

  // Write file
  const filePath = `${foundersDir}/${company.slug}.md`;
  writeFileSync(filePath, lines.join("\n"));
  filesCreated++;
}

console.log(`\nCompany files created: ${filesCreated}`);
console.log(`Companies skipped (no data): ${filesSkipped}`);

// === SAVE PHONE INDEX ===

writeFileSync(
  "/Users/michael/clawd-founders/data/phone-index.json",
  JSON.stringify(phoneIndex, null, 2)
);
console.log(`\nSaved phone index to data/phone-index.json`);

// === UNIDENTIFIED PHONES ===

const unidentified = phoneIndex.filter((p) => !p.name);
console.log(`\n=== UNIDENTIFIED BATCH MEMBERS (${unidentified.length}) ===`);
console.log("These will be identified when they DM:");
console.log(unidentified.slice(0, 20).map((p) => p.phone).join(", "));
if (unidentified.length > 20) {
  console.log(`... and ${unidentified.length - 20} more`);
}
