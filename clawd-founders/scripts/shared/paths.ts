/**
 * paths.ts
 *
 * Centralized path configuration for the cohort project.
 * All paths are computed relative to the project root.
 */
import { dirname, join } from "node:path";

// Compute project root from this file's location: scripts/shared/paths.ts -> project root
// import.meta.dir = scripts/shared, so: dirname(shared) = scripts, dirname(scripts) = project root
export const PROJECT_ROOT = dirname(dirname(import.meta.dir));

// Data directory
export const DATA_DIR = join(PROJECT_ROOT, "data");

// Database and data files
export const DB_PATH = join(DATA_DIR, "founders.db");
export const CSV_PATH = join(DATA_DIR, "founders.csv");
export const GOOGLE_SHEET_CSV_PATH = join(DATA_DIR, "google-sheet.csv");
export const PIPELINE_PATH = join(DATA_DIR, "pipeline.json");
export const DRAFTS_PATH = join(DATA_DIR, "drafts.json");
export const INVESTOR_WISHLIST_PATH = join(DATA_DIR, "investor-wishlist.md");

// Prompt files (at project root)
export const SOUL_PATH = join(PROJECT_ROOT, "SOUL.md");
export const USER_PATH = join(PROJECT_ROOT, "USER.md");
export const CLAUDE_PATH = join(PROJECT_ROOT, "CLAUDE.md");

// Scripts directory
export const SCRIPTS_DIR = join(PROJECT_ROOT, "scripts");
