#!/usr/bin/env bun
/**
 * fix-company-names.ts
 *
 * Manually maps phone-index entries to correct company names based on:
 * - Founder names from Google Sheet
 * - Group membership
 * - Description hints
 */
import { readFileSync, writeFileSync } from "fs";

const phoneIndex = JSON.parse(readFileSync("/Users/michael/clawd-founders/data/phone-index.json", "utf-8"));

// Manual mappings: phone number or name -> correct company name
// Based on cross-referencing sheet founder names with phone-index names
const nameToCompany: Record<string, string> = {
  // Group 1
  "Justin": "Agent Viz",
  "Hardik": "denormalized",
  "Victor Cheng": "Vly AI",
  "Praneeth": "Superset", // educated guess
  "Maria Day": "Winter Comics", // educated guess
  "Avi": "Deep24", // educated guess

  // Group 2
  "Anton": "Clarum",
  "Milind Sagaram": "Articulate",
  "Allen Naliath": "Friday", // listed in G2 sheet but in G8 phone index - check
  "cadillion": "Assembly HOA", // sb = shreyas?

  // Group 3
  "Vishal": "Vishal AI Healthcare",
  "Soheil Parry": "LunaBill",
  "Albert Jo": "Adapted",
  "Marcus": "DrSwarm", // Group 3 member

  // Group 4
  "Phillip": "AI Expert Clones",
  "Rune Hauge": "Eureka Health", // virtual front desk
  "divij goyal": "Sidepilot",
  "Indrajeet Roy": "skylarq.ai",
  "Mudit": "Flair Labs",

  // Group 5
  "Darwin Lo": "AI Video Studio",
  "Tuyen Truong": "Ottoclip",
  "Abhinav Gopal": "Rubbrband", // cinematic AI videos
  "Peter Pezaris": "Alphie", // invitations
  "Aliona Vozna": "Benchify",
  "Claudio": "Vortex Software",

  // Group 6
  "Wyatt Lansford": "Pally",
  "Jason Mad": "Tweeks.io",
  "Musa": "TypeOS", // cursor for google
  "Connor Engelsberg": "Orvyn", // AI analyst
  "Aidan Pratt": "Wildcard", // in stealth
  "Kaushik Mahorker": "AutoStep",
  "Alex Kolchinski": "ThunderPhone",

  // Group 7
  "Ajay Vasisht": "Irving Technology",
  "Amit Patel": "Pixie",
  "Mohammad Eshan": "GhostEye",
  "Jason He": "Arcimus", // building data
  "Hussein Syed": "MISTASHO", // sourcing firm for engineers

  // Group 8
  "Vamsee Krishna": "10xR",
  "Roy": "NearWave",
  "Nitthin": "UBiosis Health", // airlines in india
  "Emmie Chang": "Marketfit.xyz", // videos for gtm
  "Alex Arevalos - Starling": "MedPiper",
  "Weiting": "35Financial",
  "Ryan Hildebrand": "Yuzu Labs",
  "Sai Satwik": "Yuzu Labs", // same company
  "Nagendra Yadav": "MedPiper",
  "Jaswanth": "UBiosis Health",

  // Group 9
  "topaz": "MCPBundles.com",
  "Dudu Lasry": "Hey Telo", // AI document authoring
  "Jacob": "Vespper",
  "Christopher Grittner": "Tendered",

  // Group 10
  "Noah": "Repacket",
  "Samuel Akinwunmi": "Tau9 Labs", // engineering productivity
  "Sam": "Tau9 Labs",
  "Felipe E.": "Cuanto", // we help latin
  "Tim": "Bilanc",
  "Alexander Harmsen": "Short Story",
};

let updated = 0;
let alreadyCorrect = 0;
let noMatch = 0;

for (const [phone, info] of Object.entries(phoneIndex) as [string, any][]) {
  const name = info.name;
  if (!name) {
    noMatch++;
    continue;
  }

  // Check if we have a mapping for this name
  const correctCompany = nameToCompany[name];
  if (correctCompany) {
    if (info.company === correctCompany) {
      alreadyCorrect++;
    } else {
      console.log(`${name}: "${info.company || '?'}" -> "${correctCompany}"`);
      phoneIndex[phone].company = correctCompany;
      updated++;
    }
  } else {
    // Try partial name match
    let found = false;
    for (const [mappedName, company] of Object.entries(nameToCompany)) {
      if (name.toLowerCase().includes(mappedName.toLowerCase()) ||
          mappedName.toLowerCase().includes(name.toLowerCase())) {
        if (info.company !== company) {
          console.log(`${name} (partial match ${mappedName}): "${info.company || '?'}" -> "${company}"`);
          phoneIndex[phone].company = company;
          updated++;
        } else {
          alreadyCorrect++;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      noMatch++;
    }
  }
}

console.log("\n=== Summary ===");
console.log(`Updated: ${updated}`);
console.log(`Already correct: ${alreadyCorrect}`);
console.log(`No mapping found: ${noMatch}`);

writeFileSync("/Users/michael/clawd-founders/data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("\nSaved to phone-index.json");
