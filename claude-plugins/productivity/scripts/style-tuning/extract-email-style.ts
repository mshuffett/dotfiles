#!/usr/bin/env bun
/**
 * Extract training data for email style tuning from sent emails via himalaya.
 */

import { execSync } from "node:child_process";

interface Envelope {
  id: string;
  flags: string[];
  subject: string;
  from: { name: string; addr: string };
  to: { name: string; addr: string };
  date: string;
  has_attachment: boolean;
}

interface EmailTrainingExample {
  to_name: string;
  to_email: string;
  subject: string;
  timestamp: string;

  // The email being replied to (if a reply)
  is_reply: boolean;
  original_message?: string;

  // Michael's reply
  michael_reply: string;
}

function runHimalaya(args: string): string {
  try {
    // Redirect stderr to /dev/null to avoid WARN lines mixing with JSON
    const result = execSync(`himalaya ${args} 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 30000,
    });
    return result;
  } catch (err) {
    console.error(`Error running himalaya: ${err}`);
    return "";
  }
}

function getSentEmails(limit: number): Envelope[] {
  const result = runHimalaya(`envelope list --folder "[Gmail]/Sent Mail" --page-size ${limit} --output json`);
  if (!result.trim()) return [];
  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

function readEmail(id: string): string {
  return runHimalaya(`message read --folder "[Gmail]/Sent Mail" ${id}`);
}

function parseEmailContent(raw: string): { reply: string; original?: string } {
  const lines = raw.split('\n');

  // Find where headers end (first blank line after From/To/Subject)
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '' && i > 0) {
      bodyStart = i + 1;
      break;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();

  // Check if it's a reply (contains "On ... wrote:")
  const wroteMatch = body.match(/^([\s\S]*?)\n\nOn .+? wrote:\n\n([\s\S]*)$/);

  if (wroteMatch) {
    return {
      reply: wroteMatch[1].trim(),
      original: wroteMatch[2].trim().replace(/^>\s*/gm, ''),
    };
  }

  return { reply: body };
}

async function main() {
  const limit = Number(process.argv[2]) || 50;
  console.error(`Fetching up to ${limit} sent emails...`);

  const envelopes = getSentEmails(limit);
  console.error(`Found ${envelopes.length} sent emails`);

  const examples: EmailTrainingExample[] = [];

  for (const env of envelopes) {
    // Skip automated/calendar emails
    if (env.subject.includes('Accepted:') ||
        env.subject.includes('Declined:') ||
        env.subject.includes('Proposed new time:') ||
        env.to.addr.includes('noreply') ||
        env.to.addr.includes('calendar')) {
      continue;
    }

    try {
      const raw = readEmail(env.id);
      if (!raw) continue;

      const { reply, original } = parseEmailContent(raw);

      // Skip very short or empty replies
      if (reply.length < 2) continue;

      examples.push({
        id: env.id,
        to_name: env.to.name,
        to_email: env.to.addr,
        subject: env.subject,
        timestamp: env.date,
        is_reply: env.subject.startsWith('Re:'),
        original_message: original,
        michael_reply: reply,
      });
    } catch (err) {
      console.error(`Error processing ${env.id}: ${err}`);
    }
  }

  console.error(`\nExtracted ${examples.length} training examples`);
  console.log(JSON.stringify(examples, null, 2));
}

main().catch(console.error);
