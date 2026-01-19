import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { PIPELINE_PATH } from "./paths";
import type {
  PipelineState,
  FounderPipelineEntry,
  PipelineStage,
} from "../../scripts/shared/types";

export interface PipelineStatus {
  state: PipelineState;
  summary: {
    not_contacted: number;
    awaiting_reply: number;
    in_conversation: number;
    nps_collected: number;
    needs_collected: number;
    complete: number;
    needs_attention: number;
  };
  founders: Array<{
    phone: string;
    entry: FounderPipelineEntry;
    needs_attention: boolean;
  }>;
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  if (!existsSync(PIPELINE_PATH)) {
    return {
      state: {},
      summary: {
        not_contacted: 0,
        awaiting_reply: 0,
        in_conversation: 0,
        nps_collected: 0,
        needs_collected: 0,
        complete: 0,
        needs_attention: 0,
      },
      founders: [],
    };
  }

  const content = await readFile(PIPELINE_PATH, "utf-8");
  const state: PipelineState = JSON.parse(content);

  const summary = {
    not_contacted: 0,
    awaiting_reply: 0,
    in_conversation: 0,
    nps_collected: 0,
    needs_collected: 0,
    complete: 0,
    needs_attention: 0,
  };

  const founders: PipelineStatus["founders"] = [];

  for (const [phone, entry] of Object.entries(state)) {
    // Count by stage
    const stage = entry.stage as PipelineStage;
    if (stage in summary) {
      summary[stage as keyof typeof summary]++;
    }

    // Check if needs attention (they replied, we haven't responded)
    const needsAttention = entry.last_wa_from === "them" &&
      (entry.stage === "in_conversation" || entry.stage === "awaiting_reply");

    if (needsAttention) {
      summary.needs_attention++;
    }

    founders.push({
      phone,
      entry,
      needs_attention: needsAttention,
    });
  }

  // Sort: needs attention first, then by stage
  founders.sort((a, b) => {
    if (a.needs_attention !== b.needs_attention) {
      return a.needs_attention ? -1 : 1;
    }
    return 0;
  });

  return { state, summary, founders };
}

export async function getFounderPipeline(
  phone: string
): Promise<FounderPipelineEntry | null> {
  const status = await getPipelineStatus();
  return status.state[phone] || null;
}
