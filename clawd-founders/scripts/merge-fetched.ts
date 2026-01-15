import { readFileSync, writeFileSync } from "fs";

// Load existing phone index
const phoneIndex = JSON.parse(readFileSync("data/phone-index.json", "utf-8"));
console.log("Existing index entries:", phoneIndex.length);

// Load fetched contacts
const fetched = JSON.parse(readFileSync("data/fetched-contacts.json", "utf-8"));
console.log("Fetched contacts:", Object.keys(fetched).length);

// Create phone to name map from fetched
const fetchedMap = new Map<string, string>();
for (const [phone, name] of Object.entries(fetched)) {
  fetchedMap.set("+" + phone, name as string);
}

// Update phone index
let updated = 0;
let alreadyHad = 0;
for (const entry of phoneIndex) {
  if (fetchedMap.has(entry.phone)) {
    if (!entry.name) {
      entry.name = fetchedMap.get(entry.phone);
      updated++;
    } else {
      alreadyHad++;
    }
  }
}

console.log("Updated:", updated);
console.log("Already had name:", alreadyHad);

// Count stats
const withName = phoneIndex.filter((e: any) => e.name).length;
const withCompany = phoneIndex.filter((e: any) => e.company).length;
console.log("Total with name:", withName);
console.log("Total with company:", withCompany);
console.log("Still unknown:", phoneIndex.length - withName);

// Save
writeFileSync("data/phone-index.json", JSON.stringify(phoneIndex, null, 2));
console.log("\nSaved updated phone-index.json");
