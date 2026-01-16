#!/usr/bin/env bun
/**
 * query-db.ts
 *
 * Helper script for querying the founders database.
 * Usage:
 *   bun query-db.ts phone +14155551234
 *   bun query-db.ts company "Superset"
 *   bun query-db.ts subgroup 1
 *   bun query-db.ts interactions +14155551234
 *   bun query-db.ts followups pending
 */
import { Database } from "bun:sqlite";

const DB_PATH = "/Users/michael/clawd-founders/data/founders.db";
const db = new Database(DB_PATH, { readonly: true });

const [command, ...args] = process.argv.slice(2);

function formatFounder(f: any, includeGoals = false) {
  console.log(`\n=== ${f.name} ===`);
  console.log(`Company: ${f.company || "Unknown"}`);
  console.log(`Brief: ${f.company_brief || "N/A"}`);
  console.log(`Phone: ${f.phone || "N/A"}`);
  console.log(`Email: ${f.email || "N/A"}`);
  console.log(`Location: ${f.location || "N/A"}`);
  console.log(`Subgroup: ${f.subgroup || "N/A"}`);
  console.log(`Batch: ${f.batch || "N/A"}`);
  if (f.demo_goal) console.log(`Demo Goal: ${f.demo_goal}`);
  if (f.co_founder) console.log(`Co-founder: ${f.co_founder}`);
  if (f.linkedin) console.log(`LinkedIn: ${f.linkedin}`);
  if (f.notes) console.log(`Notes: ${f.notes}`);

  if (includeGoals && f.company) {
    const goals = db.query(`
      SELECT period, goal, progress FROM goals
      WHERE company = ?
      ORDER BY period ASC
    `).all(f.company) as { period: string; goal: string; progress: string }[];

    if (goals.length > 0) {
      console.log(`\nGoals:`);
      for (const g of goals) {
        console.log(`  [${g.period}] ${g.goal || "(no goal)"}`);
        if (g.progress) console.log(`    Progress: ${g.progress}`);
      }
    }
  }
}

switch (command) {
  case "phone": {
    // Normalize phone - strip + and non-digits for comparison
    const input = args[0];
    const normalized = input.replace(/\D/g, "");
    const founder = db.query(`
      SELECT * FROM founders
      WHERE REPLACE(phone, '+', '') LIKE '%' || ? || '%'
    `).get(normalized);
    if (founder) {
      formatFounder(founder, true);
    } else {
      console.log(`No founder found with phone containing: ${input}`);
    }
    break;
  }

  case "company": {
    const search = args.join(" ");
    const founders = db.query(`
      SELECT * FROM founders
      WHERE company LIKE '%' || ? || '%'
      ORDER BY name
    `).all(search);
    if (founders.length === 0) {
      console.log(`No founders found for company: ${search}`);
    } else {
      console.log(`Found ${founders.length} founder(s) at "${search}":\n`);
      for (const f of founders) {
        formatFounder(f, true);
      }
    }
    break;
  }

  case "goals": {
    const search = args.join(" ");
    if (!search) {
      // Show all companies with goals
      const goals = db.query(`
        SELECT company, period, goal, progress
        FROM goals
        WHERE goal IS NOT NULL AND goal != ''
        ORDER BY company, period
      `).all() as { company: string; period: string; goal: string; progress: string }[];

      let currentCompany = "";
      for (const g of goals) {
        if (g.company !== currentCompany) {
          console.log(`\n=== ${g.company} ===`);
          currentCompany = g.company;
        }
        console.log(`  [${g.period}] ${g.goal}`);
        if (g.progress) console.log(`    Progress: ${g.progress}`);
      }
    } else {
      // Show goals for specific company
      const goals = db.query(`
        SELECT company, period, goal, progress
        FROM goals
        WHERE company LIKE '%' || ? || '%'
        ORDER BY period
      `).all(search) as { company: string; period: string; goal: string; progress: string }[];

      if (goals.length === 0) {
        console.log(`No goals found for company: ${search}`);
      } else {
        console.log(`\n=== Goals for ${goals[0].company} ===\n`);
        for (const g of goals) {
          console.log(`[${g.period}] ${g.goal || "(no goal)"}`);
          if (g.progress) console.log(`  Progress: ${g.progress}`);
        }
      }
    }
    break;
  }

  case "subgroup": {
    const group = parseInt(args[0], 10);
    const founders = db.query(`
      SELECT * FROM founders
      WHERE subgroup = ?
      ORDER BY company, name
    `).all(group);
    console.log(`=== Subgroup ${group} (${founders.length} founders) ===\n`);
    for (const f of founders as any[]) {
      console.log(`${f.name} - ${f.company || "Unknown"} - ${f.phone || "no phone"}`);
    }
    break;
  }

  case "interactions": {
    const phone = args[0];
    const normalized = phone.replace(/\D/g, "");
    const founder = db.query(`
      SELECT id, name FROM founders
      WHERE REPLACE(phone, '+', '') LIKE '%' || ? || '%'
    `).get(normalized) as { id: number; name: string } | null;

    if (!founder) {
      console.log(`No founder found with phone: ${phone}`);
      break;
    }

    const interactions = db.query(`
      SELECT * FROM interactions
      WHERE founder_id = ?
      ORDER BY date DESC
      LIMIT 20
    `).all(founder.id);

    console.log(`=== Interactions with ${founder.name} (${interactions.length}) ===\n`);
    for (const i of interactions as any[]) {
      console.log(`[${i.date}] ${i.direction}: ${i.summary}`);
      if (i.topics) console.log(`  Topics: ${i.topics}`);
    }
    break;
  }

  case "followups": {
    const status = args[0] || "pending";
    const followups = db.query(`
      SELECT f.*, fo.name, fo.company
      FROM followups f
      JOIN founders fo ON f.founder_id = fo.id
      WHERE f.status = ?
      ORDER BY f.due_date ASC
    `).all(status);

    console.log(`=== ${status.toUpperCase()} Follow-ups (${followups.length}) ===\n`);
    for (const fu of followups as any[]) {
      const due = fu.due_date ? `Due: ${fu.due_date}` : "No due date";
      console.log(`- ${fu.name} (${fu.company}): ${fu.description}`);
      console.log(`  ${due} | Type: ${fu.type}`);
    }
    break;
  }

  case "all": {
    const founders = db.query(`
      SELECT * FROM founders ORDER BY subgroup, company, name
    `).all();
    console.log(`=== All Founders (${founders.length}) ===\n`);
    let currentGroup = -1;
    for (const f of founders as any[]) {
      if (f.subgroup !== currentGroup) {
        console.log(`\n--- Subgroup ${f.subgroup ?? "?"} ---`);
        currentGroup = f.subgroup;
      }
      console.log(`${f.name} - ${f.company || "Unknown"} - ${f.phone || "no phone"}`);
    }
    break;
  }

  default:
    console.log(`
Usage:
  bun query-db.ts phone +14155551234     # Find founder by phone (includes goals)
  bun query-db.ts company "Superset"     # Find founders at company (includes goals)
  bun query-db.ts goals                  # Show all company goals
  bun query-db.ts goals "Superset"       # Show goals for specific company
  bun query-db.ts subgroup 1             # List founders in subgroup
  bun query-db.ts interactions +1415...  # Show interaction history
  bun query-db.ts followups pending      # Show pending follow-ups
  bun query-db.ts all                    # List all founders
    `);
}

db.close();
