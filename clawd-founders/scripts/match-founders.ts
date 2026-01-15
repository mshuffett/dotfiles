import { readFileSync, writeFileSync } from "fs";
import { parse } from "csv-parse/sync";

// Read WhatsApp numbers (the 103 in the batch)
const whatsappNumbers = readFileSync("/Users/michael/clawd-founders/founders.txt", "utf-8")
  .split("\n")
  .map((n) => n.trim().replace(/\D/g, "")) // normalize to digits only
  .filter(Boolean);

console.log(`WhatsApp batch: ${whatsappNumbers.length} numbers\n`);

// Read Notion CSV
const csv = readFileSync("/Users/michael/clawd-founders/data/notion-export.csv", "utf-8");
const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true });

console.log(`Notion export: ${records.length} founders\n`);

// Key columns
const getPhone = (r: Record<string, string>) => r["WhatsApp phone number:"]?.replace(/\D/g, "") || "";
const getName = (r: Record<string, string>) => r["Name"] || "";
const getCompany = (r: Record<string, string>) => r["What's your current idea / company?"] || "";
const getEmail = (r: Record<string, string>) => r["Email address:"] || "";
const getBatch = (r: Record<string, string>) => r["What YC batch were you in?"] || "";
const getLocation = (r: Record<string, string>) => r["Where are you based?"] || "";
const getStage = (r: Record<string, string>) => r["What stage are you at?"] || "";
const getFitScore = (r: Record<string, string>) => r["Fit Score"] || "";
const getFitTier = (r: Record<string, string>) => r["Fit Tier"] || "";
const getInSF = (r: Record<string, string>) => r["In SF?"] || "";
const getNotes = (r: Record<string, string>) => r["Research Notes"] || "";
const hasCofounder = (r: Record<string, string>) => r["Do you have co-founders?"] || "";
const getCofounderLinks = (r: Record<string, string>) =>
  r["If yes, links to co-founder Linkedin or Bookface profiles:"] || "";

// Match
const matched: Array<{
  phone: string;
  name: string;
  company: string;
  email: string;
  batch: string;
  location: string;
  stage: string;
  fitScore: string;
  fitTier: string;
  inSF: string;
  notes: string;
  hasCofounder: string;
  cofounderLinks: string;
}> = [];

const unmatched: string[] = [];
const notionUnmatched: Array<{ name: string; phone: string; company: string }> = [];

// Build lookup from Notion
const notionByPhone = new Map<string, (typeof records)[0]>();
for (const r of records) {
  const phone = getPhone(r);
  if (phone) {
    notionByPhone.set(phone, r);
  }
}

// Match WhatsApp numbers to Notion
for (const waPhone of whatsappNumbers) {
  const r = notionByPhone.get(waPhone);
  if (r) {
    matched.push({
      phone: waPhone,
      name: getName(r),
      company: getCompany(r),
      email: getEmail(r),
      batch: getBatch(r),
      location: getLocation(r),
      stage: getStage(r),
      fitScore: getFitScore(r),
      fitTier: getFitTier(r),
      inSF: getInSF(r),
      notes: getNotes(r),
      hasCofounder: hasCofounder(r),
      cofounderLinks: getCofounderLinks(r),
    });
    notionByPhone.delete(waPhone);
  } else {
    unmatched.push(waPhone);
  }
}

// Remaining Notion entries (not in WhatsApp)
for (const [phone, r] of notionByPhone) {
  notionUnmatched.push({
    name: getName(r),
    phone,
    company: getCompany(r),
  });
}

console.log("=== MATCHED ===");
console.log(`${matched.length} founders matched\n`);

console.log("=== UNMATCHED WHATSAPP NUMBERS ===");
console.log(`${unmatched.length} WhatsApp numbers not in Notion:\n`);
for (const p of unmatched) {
  console.log(`  +${p}`);
}

console.log("\n=== NOTION ENTRIES NOT IN WHATSAPP ===");
console.log(`${notionUnmatched.length} Notion entries not in WhatsApp batch:\n`);
for (const n of notionUnmatched) {
  console.log(`  ${n.name} - +${n.phone} - ${n.company.slice(0, 50)}`);
}

// Save matched data as JSON for next step
writeFileSync(
  "/Users/michael/clawd-founders/data/matched-founders.json",
  JSON.stringify(matched, null, 2)
);

console.log("\n\nSaved matched data to data/matched-founders.json");
