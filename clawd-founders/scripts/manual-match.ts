#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";

const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));
const db = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/founders-db.json", "utf-8"));

// Build company lookup
const companyLookup: Record<string, { company: string; group: number | null }> = {};
for (const company of db.companies) {
  for (const founder of company.founders || []) {
    if (founder.name) {
      companyLookup[founder.name.toLowerCase().trim()] = {
        company: company.name,
        group: company.group || null,
      };
    }
  }
}

// Manual mapping: WhatsApp name -> founders-db name
const manualMatches: Record<string, string> = {
  // Exact matches
  "abhinav gopal": "abhinav gopal",
  "aidan pratt": "aidan pratt",
  "ajay vasisht": "ajay vasisht",
  "albert jo": "albert jo",
  "amit patel": "amit patel",
  "bala raja": "bala raja",
  "connor engelsberg": "connor engelsberg",
  "darwin lo": "darwin lo",
  "dave schukin": "dave schukin",
  "dudu": "dudu",
  "emmie chang": "emmie chang",
  "hildebrand": "hildebrand",
  "hussein syed": "hussein syed",
  "jakub langr": "jakub langr",
  "james spoor": "james spoor",
  "jason he": "jason he",
  "kiet ho": "kiet ho",
  "milind sagaram": "milind sagaram",
  "mohammad eshan": "mohammad eshan",
  "nalin gupta": "nalin gupta",
  "nitthin nair": "nitthin nair",
  "pablo hansen": "pablo hansen",
  "peter pezaris": "peter pezaris",
  "richard hwang": "richard hwang",
  "rune hauge": "rune hauge",
  "samir sen": "samir sen",
  "samuel akinwunmi": "samuel akinwunmi",
  "sandy suh": "sandy suh",
  "sourav sanyal": "sourav sanyal",
  "tuyen truong": "tuyen truong",
  "wyatt lansford": "wyatt lansford",
  "zain memon": "zain memon",

  // Spelling variations
  "allen nallath": "allen naliath",
  "paul sanglé-ferrière": "paul sangle-ferriere",
  "felipe e.": "felipe echandi",
  "oliver zoy": "oliver zou",
  "aliona vozna": "olena vozna",
  "soheil parry": "suhail parry",

  // First name matches (verified unique)
  "anton": "anton otaner",
  "hardik": "hardik vala",
  "justin": "justin wei",
  "kam": "kam leung",
  "leo": "leo anthias",
  "musa": "musa aqeel",
  "phillip": "phillip",
  "roy": "roy stillwell",
  "tony": "tony lewis",
  "vamsee krishna": "vamsee",
  "victor cheng": "victor",
  "vince": "vince mundy",
  "vishal": "vishal",
  "yura": "yura riphyak",
  "divij goyal": "divij",
  "saurav kumar": "saurav",

  // Nickname matches
  "jason mad": "jason madeano",

  // Noah - there are two in founders-db, matching to Group 10 one
  "noah": "noah stanford",
  "noah (2)": "noah stanford", // Might be duplicate
};

// Clear previous assignments
for (const info of Object.values(phoneIndex) as any[]) {
  delete info.company;
  delete info.group;
}

// Apply matches
let matched = 0;
let unmatched = 0;
const matchedList: string[] = [];
const unmatchedList: string[] = [];

for (const [phone, info] of Object.entries(phoneIndex) as [string, any][]) {
  if (!info.name) continue;

  const nameLower = info.name.toLowerCase().trim();
  const dbName = manualMatches[nameLower];

  if (dbName && companyLookup[dbName]) {
    const match = companyLookup[dbName];
    info.company = match.company;
    info.group = match.group;
    matched++;
    matchedList.push(`${info.name} -> ${match.company} (Group ${match.group})`);
  } else {
    unmatched++;
    unmatchedList.push(info.name);
  }
}

console.log(`Matched: ${matched}`);
console.log(`Unmatched: ${unmatched}`);
console.log("");
console.log("=== Matched ===");
matchedList.forEach((m) => console.log(`  ${m}`));
console.log("");
console.log("=== Unmatched (not in batch or staff) ===");
unmatchedList.forEach((n) => console.log(`  ${n}`));

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("");
console.log("Updated phone-index.json");
