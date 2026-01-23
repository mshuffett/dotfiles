#!/usr/bin/env bun
/**
 * init-db.ts
 *
 * Creates and populates the founders SQLite database from CSV.
 * Run this to initialize or reset the database.
 */
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { DB_PATH, CSV_PATH } from "./shared/paths";

// Create or open database
const db = new Database(DB_PATH);

// Create schema
db.exec(`
  -- Founders table (one row per person from CSV)
  CREATE TABLE IF NOT EXISTS founders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    location TEXT,
    linkedin TEXT,
    batch TEXT,
    company TEXT,
    company_brief TEXT,
    subgroup INTEGER,
    bookface TEXT,
    co_founder TEXT,
    repeat_yc BOOLEAN DEFAULT FALSE,
    serial_founder BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone)
  );

  -- Index for phone lookups
  CREATE INDEX IF NOT EXISTS idx_founders_phone ON founders(phone);
  CREATE INDEX IF NOT EXISTS idx_founders_company ON founders(company);
  CREATE INDEX IF NOT EXISTS idx_founders_subgroup ON founders(subgroup);

  -- Interactions table (conversation logs)
  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER REFERENCES founders(id),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    channel TEXT DEFAULT 'whatsapp',  -- whatsapp, telegram, email
    direction TEXT DEFAULT 'inbound', -- inbound, outbound
    summary TEXT NOT NULL,
    sentiment TEXT,  -- positive, neutral, negative
    topics TEXT,     -- comma-separated topics discussed
    raw_message TEXT -- optional: store actual message if useful
  );

  CREATE INDEX IF NOT EXISTS idx_interactions_founder ON interactions(founder_id);
  CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date);

  -- Follow-ups table (action items, reminders)
  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER REFERENCES founders(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    status TEXT DEFAULT 'pending',  -- pending, completed, cancelled
    type TEXT DEFAULT 'reminder',   -- reminder, action_item, check_in
    description TEXT NOT NULL,
    completed_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_followups_founder ON followups(founder_id);
  CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
  CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_date);

  -- Notes table (free-form notes about founders/companies)
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER REFERENCES founders(id),
    company TEXT,  -- can be company-level notes without specific founder
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category TEXT,  -- context, research, personal, goal
    content TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_notes_founder ON notes(founder_id);
  CREATE INDEX IF NOT EXISTS idx_notes_company ON notes(company);

  -- Outreach table (track multi-step outreach state)
  CREATE TABLE IF NOT EXISTS outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER REFERENCES founders(id) UNIQUE,
    campaign TEXT DEFAULT 'goals_checkin',  -- campaign name for grouping
    step TEXT DEFAULT 'not_started',  -- not_started, initial_sent, nps_sent, needs_sent, complete
    initial_sent_at DATETIME,
    initial_response TEXT,  -- their reply to initial message
    nps_sent_at DATETIME,
    nps_score INTEGER,  -- 1-10 score
    nps_response TEXT,  -- their full reply
    needs_sent_at DATETIME,
    needs_response TEXT,  -- what they need (intros, investors, etc.)
    last_nudge_at DATETIME,  -- for tracking follow-up nudges
    nudge_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_outreach_founder ON outreach(founder_id);
  CREATE INDEX IF NOT EXISTS idx_outreach_step ON outreach(step);
  CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach(campaign);
`);

console.log("Schema created/verified");

// Load CSV
const csvContent = readFileSync(CSV_PATH, "utf-8");
interface CSVRow {
  Name: string;
  "Co-Founder": string;
  Location: string;
  Email: string;
  "Phone Number": string;
  Linkedin: string;
  Batch: string;
  Company: string;
  "Company Brief": string;
  Subgroup: string;
  "Bookface Profile": string;
  "Repeat YC Founder": string;
  "Serial Founder (Non-YC)": string;
  Notes: string;
}

const founders: CSVRow[] = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`Loaded ${founders.length} founders from CSV`);

// Clear existing founders (fresh import)
db.exec("DELETE FROM founders");

// Insert founders
const insert = db.prepare(`
  INSERT INTO founders (name, phone, email, location, linkedin, batch, company, company_brief, subgroup, bookface, co_founder, repeat_yc, serial_founder, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
for (const f of founders) {
  const phone = f["Phone Number"] ? `+${f["Phone Number"]}` : null;
  const subgroup = f.Subgroup ? parseInt(f.Subgroup, 10) : null;
  const repeatYC = f["Repeat YC Founder"] === "Yes" ? 1 : 0;
  const serialFounder = f["Serial Founder (Non-YC)"] === "Yes" ? 1 : 0;

  try {
    insert.run(
      f.Name,
      phone,
      f.Email || null,
      f.Location || null,
      f.Linkedin || null,
      f.Batch || null,
      f.Company || null,
      f["Company Brief"] || null,
      subgroup,
      f["Bookface Profile"] || null,
      f["Co-Founder"] || null,
      repeatYC,
      serialFounder,
      f.Notes || null
    );
    inserted++;
  } catch (e) {
    console.error(`Failed to insert ${f.Name}: ${e}`);
  }
}

console.log(`Inserted ${inserted} founders`);

// Show stats
const stats = db.query("SELECT COUNT(*) as count FROM founders").get() as { count: number };
const withPhone = db.query("SELECT COUNT(*) as count FROM founders WHERE phone IS NOT NULL").get() as { count: number };
const bySubgroup = db.query("SELECT subgroup, COUNT(*) as count FROM founders WHERE subgroup IS NOT NULL GROUP BY subgroup ORDER BY subgroup").all();

console.log("\n=== Database Stats ===");
console.log(`Total founders: ${stats.count}`);
console.log(`With phone: ${withPhone.count}`);
console.log("\nBy subgroup:");
for (const row of bySubgroup as { subgroup: number; count: number }[]) {
  console.log(`  Group ${row.subgroup}: ${row.count} founders`);
}

db.close();
console.log(`\nDatabase saved to: ${DB_PATH}`);
