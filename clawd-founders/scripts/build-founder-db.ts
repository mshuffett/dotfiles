import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { parse } from "csv-parse/sync";

// Utility: slugify company name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Utility: normalize phone
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Utility: extract company name from description
function extractCompanyName(desc: string): string {
  // Try to get first word/phrase before common separators
  const match = desc.match(/^([A-Za-z0-9\s]+?)(?:\s*[-–—:|,]|\s+is\s|\s+builds?\s|\s+provides?\s)/i);
  if (match) return match[1].trim();
  // Fallback: first 2-3 words
  const words = desc.split(/\s+/).slice(0, 3).join(" ");
  return words;
}

// Load all data sources
const whatsappNumbers = readFileSync("/Users/michael/clawd-founders/founders.txt", "utf-8")
  .split("\n")
  .map((n) => normalizePhone(n.trim()))
  .filter(Boolean);

const notion = parse(readFileSync("/Users/michael/clawd-founders/data/notion-export.csv", "utf-8"), {
  columns: true,
  bom: true,
});

const googleSheet = parse(readFileSync("/Users/michael/clawd-founders/data/google-sheet.csv", "utf-8"), {
  columns: true,
  bom: true,
});

console.log(`WhatsApp: ${whatsappNumbers.length} numbers`);
console.log(`Notion: ${notion.length} entries`);
console.log(`Google Sheet: ${googleSheet.length} companies\n`);

// Build company database from Google Sheet
interface Company {
  name: string;
  slug: string;
  group: number | null;
  demoGoal: string;
  goals: { period: string; goal: string; progress: string }[];
  founders: {
    name: string;
    phone: string;
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
    inWhatsApp: boolean;
  }[];
}

const companies = new Map<string, Company>();

// First, populate from Google Sheet
for (const row of googleSheet) {
  const rawName = row["Company"] || "";
  if (!rawName.trim()) continue;

  // Extract just the company name (remove founder names in parens)
  const companyName = rawName.replace(/\s*\([^)]+\)\s*/g, "").trim();
  const slug = slugify(companyName);

  // Parse group number
  const groupStr = row["Group"] || "";
  const group = groupStr ? parseInt(groupStr, 10) : null;

  // Goals columns
  const goals: Company["goals"] = [];
  const goalCols = [
    ["[01/07/26]  - Two Week Goals", "Progress / Notes 1", "01/07/26"],
    ["[01/21/26]  - Two Week Goals", "Progress / Notes 2", "01/21/26"],
    ["[02/04/26]  - Two Week Goals", "Progress / Notes 3", "02/04/26"],
    ["[02/18/26]  - Two Week Goals", "Progress / Notes 4", "02/18/26"],
  ];

  for (const [goalCol, progressCol, period] of goalCols) {
    const goal = row[goalCol] || "";
    const progress = row[progressCol] || "";
    if (goal || progress) {
      goals.push({ period, goal, progress });
    }
  }

  companies.set(slug, {
    name: companyName,
    slug,
    group,
    demoGoal: row["Demo Day Goal"] || "",
    goals,
    founders: [],
  });
}

console.log(`Initialized ${companies.size} companies from Google Sheet\n`);

// Match Notion entries to companies
let notionMatched = 0;
let notionUnmatched = 0;

for (const row of notion) {
  const name = row["Name"] || "";
  const companyDesc = row["What's your current idea / company?"] || "";
  const phone = normalizePhone(row["WhatsApp phone number:"] || "");
  const email = row["Email address:"] || "";
  const batch = row["What YC batch were you in?"] || "";
  const location = row["Where are you based?"] || "";
  const stage = row["What stage are you at?"] || "";
  const fitScore = row["Fit Score"] || "";
  const fitTier = row["Fit Tier"] || "";
  const inSF = row["In SF?"] || "";
  const notes = row["Research Notes"] || "";
  const hasCofounder = row["Do you have co-founders?"] || "";
  const cofounderLinks = row["If yes, links to co-founder Linkedin or Bookface profiles:"] || "";

  if (!name) continue;

  // Extract company name from description
  const extractedCompany = extractCompanyName(companyDesc);
  const slug = slugify(extractedCompany);

  // Try to find matching company
  let matchedCompany: Company | undefined;

  // Exact slug match
  if (companies.has(slug)) {
    matchedCompany = companies.get(slug);
  }

  // Try partial match
  if (!matchedCompany) {
    for (const [key, company] of companies) {
      const companyLower = company.name.toLowerCase();
      const extractedLower = extractedCompany.toLowerCase();
      if (
        companyLower.includes(extractedLower) ||
        extractedLower.includes(companyLower) ||
        key.includes(slug) ||
        slug.includes(key)
      ) {
        matchedCompany = company;
        break;
      }
    }
  }

  // Create founder entry
  const founder = {
    name,
    phone,
    email,
    batch,
    location,
    stage,
    fitScore,
    fitTier,
    inSF,
    notes,
    hasCofounder,
    cofounderLinks,
    inWhatsApp: phone ? whatsappNumbers.includes(phone) : false,
  };

  if (matchedCompany) {
    matchedCompany.founders.push(founder);
    notionMatched++;
  } else {
    // Create new company from Notion
    const newSlug = slug || slugify(name);
    const newCompany: Company = {
      name: extractedCompany || name,
      slug: newSlug,
      group: null,
      demoGoal: "",
      goals: [],
      founders: [founder],
    };
    companies.set(newSlug, newCompany);
    notionUnmatched++;
  }
}

console.log(`Notion matched: ${notionMatched}, created new: ${notionUnmatched}\n`);

// Summary
let companiesWithFounders = 0;
let foundersInWhatsApp = 0;
let foundersWithPhone = 0;

for (const company of companies.values()) {
  if (company.founders.length > 0) companiesWithFounders++;
  for (const f of company.founders) {
    if (f.phone) foundersWithPhone++;
    if (f.inWhatsApp) foundersInWhatsApp++;
  }
}

console.log("=== SUMMARY ===");
console.log(`Total companies: ${companies.size}`);
console.log(`Companies with founder data: ${companiesWithFounders}`);
console.log(`Founders with phone: ${foundersWithPhone}`);
console.log(`Founders in WhatsApp batch: ${foundersInWhatsApp}`);
console.log("");

// Check unmatched WhatsApp numbers
const matchedPhones = new Set<string>();
for (const company of companies.values()) {
  for (const f of company.founders) {
    if (f.phone) matchedPhones.add(f.phone);
  }
}

const unmatchedWhatsApp = whatsappNumbers.filter((p) => !matchedPhones.has(p));
console.log(`WhatsApp numbers not matched: ${unmatchedWhatsApp.length}`);
console.log("Sample unmatched:", unmatchedWhatsApp.slice(0, 10).map((p) => "+" + p).join(", "));

// Save database
const output = {
  companies: Array.from(companies.values()),
  unmatchedWhatsAppPhones: unmatchedWhatsApp.map((p) => "+" + p),
  summary: {
    totalCompanies: companies.size,
    companiesWithFounders,
    foundersWithPhone,
    foundersInWhatsApp,
    unmatchedWhatsApp: unmatchedWhatsApp.length,
  },
};

writeFileSync("/Users/michael/clawd-founders/data/founders-db.json", JSON.stringify(output, null, 2));
console.log("\nSaved to data/founders-db.json");
