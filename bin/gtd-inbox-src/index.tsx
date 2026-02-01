#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { fetchCommand } from "./commands/fetch";
import { classifyCommand } from "./commands/classify";
import { reviewCommand } from "./commands/review";
import { applyCommand } from "./commands/apply";
import { processCommand } from "./commands/process";

const main = defineCommand({
  meta: {
    name: "gtd-inbox",
    description: "GTD Inbox Processor - AI-assisted pipeline for processing inbox items",
    version: "2.0.0",
  },
  subCommands: {
    fetch: fetchCommand,
    classify: classifyCommand,
    review: reviewCommand,
    apply: applyCommand,
    process: processCommand,
  },
});

runMain(main);
