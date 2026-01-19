import { join } from "node:path";

// Base data directory for founder data
export const DATA_DIR = "/Users/michael/clawd-founders/data";

export const PIPELINE_PATH = join(DATA_DIR, "pipeline.json");
export const DRAFTS_PATH = join(DATA_DIR, "drafts.json");
export const DB_PATH = join(DATA_DIR, "founders.db");
