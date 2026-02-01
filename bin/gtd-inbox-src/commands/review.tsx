// gtd-inbox review - TUI for reviewing AI classifications
import { defineCommand } from "citty";
import { render } from "ink";
import React from "react";
import { ReviewApp } from "../components/ReviewApp";
import type { ClassifiedItem } from "../types";

export const reviewCommand = defineCommand({
  meta: {
    name: "review",
    description: "Review AI classifications in TUI",
  },
  args: {
    file: {
      type: "positional",
      description: "Input file (JSONL) or - for stdin",
      required: false,
    },
    output: {
      type: "string",
      alias: "o",
      description: "Output file for decisions (defaults to stdout)",
    },
    resume: {
      type: "boolean",
      description: "Resume previous session",
      default: false,
    },
    copilot: {
      type: "boolean",
      description: "Enable copilot mode (background AI assistance)",
      default: false,
    },
  },
  async run({ args }) {
    const items = await readItems(args.file as string | undefined);

    if (items.length === 0) {
      console.error("No items to review");
      process.exit(1);
    }

    render(
      <ReviewApp
        items={items}
        outputFile={args.output as string | undefined}
        resume={args.resume as boolean}
        copilotMode={args.copilot as boolean}
      />
    );
  },
});

async function readItems(filePath?: string): Promise<ClassifiedItem[]> {
  const items: ClassifiedItem[] = [];
  let content: string;

  if (!filePath || filePath === "-") {
    // Read from stdin
    const chunks: Uint8Array[] = [];
    const reader = Bun.stdin.stream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    content = Buffer.concat(chunks).toString("utf-8");
  } else {
    // Read from file
    const { readFileSync, existsSync } = require("fs");
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    content = readFileSync(filePath, "utf-8");
  }

  // Parse JSONL
  for (const line of content.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line) as ClassifiedItem);
    } catch (e) {
      console.error(`Invalid JSON line: ${line}`);
    }
  }

  return items;
}
