import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Compute paths relative to project root
// dashboard/lib/paths.ts -> dashboard/lib -> dashboard -> project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(dirname(__dirname));
export const DATA_DIR = join(PROJECT_ROOT, "data");

export const PIPELINE_PATH = join(DATA_DIR, "pipeline.json");
export const DRAFTS_PATH = join(DATA_DIR, "drafts.json");
export const DB_PATH = join(DATA_DIR, "founders.db");
export const SCRIPTS_DIR = join(PROJECT_ROOT, "scripts");
export const SOUL_PATH = join(PROJECT_ROOT, "SOUL.md");
