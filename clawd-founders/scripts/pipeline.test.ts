#!/usr/bin/env bun
/**
 * pipeline.test.ts
 *
 * TDD tests for the agentic outreach pipeline.
 * Run with: bun test scripts/pipeline.test.ts
 */
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { unlink, writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

// We'll import from pipeline.ts once it exists
// import { PipelineState, loadState, saveState, updateFounder, ... } from "./pipeline";

const TEST_DATA_DIR = "/tmp/pipeline-test";
const TEST_PIPELINE_PATH = join(TEST_DATA_DIR, "pipeline.json");
const TEST_DB_PATH = join(TEST_DATA_DIR, "founders.db");

// Mock wacli output for testing
const mockWacliMessages = (messages: Array<{ from: string; timestamp: string; text: string }>) => {
  return JSON.stringify(messages);
};

describe("Pipeline State Management", () => {
  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DATA_DIR, { recursive: true });
    // Clean up any existing test files
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  afterEach(async () => {
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("loads existing pipeline.json", async () => {
    // Given: pipeline.json exists with data
    const existingState = {
      "+14155551234": {
        stage: "in_conversation",
        last_sent: "2026-01-15T10:00:00Z",
        last_received: "2026-01-15T14:30:00Z",
        nps: null,
        needs: null,
        notes: "Asked about switching groups",
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: loadState() called
    const { loadState } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);

    // Then: returns parsed state
    expect(state["+14155551234"]).toBeDefined();
    expect(state["+14155551234"].stage).toBe("in_conversation");
    expect(state["+14155551234"].notes).toBe("Asked about switching groups");
  });

  test("creates empty state if file missing", async () => {
    // Given: no pipeline.json
    expect(existsSync(TEST_PIPELINE_PATH)).toBe(false);

    // When: loadState() called
    const { loadState } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);

    // Then: returns {} and creates file
    expect(state).toEqual({});
    expect(existsSync(TEST_PIPELINE_PATH)).toBe(true);
  });

  test("updates founder entry correctly", async () => {
    // Given: existing state
    const existingState = {
      "+14155551234": {
        stage: "not_contacted",
        last_sent: null,
        last_received: null,
        nps: null,
        needs: null,
        notes: null,
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: updateFounder(phone, {stage: "awaiting_reply"})
    const { loadState, updateFounder, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = updateFounder(state, "+14155551234", {
      stage: "awaiting_reply",
      last_sent: new Date().toISOString(),
    });
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: state has updated entry with timestamp
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155551234"].stage).toBe("awaiting_reply");
    expect(reloaded["+14155551234"].last_sent).toBeTruthy();
  });

  test("preserves other founders when updating one", async () => {
    // Given: state with founders A and B
    const existingState = {
      "+14155551234": { stage: "not_contacted", nps: null, needs: null, notes: "Founder A" },
      "+14155555678": { stage: "in_conversation", nps: 8, needs: null, notes: "Founder B" },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: updateFounder(A, changes)
    const { loadState, updateFounder, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = updateFounder(state, "+14155551234", { stage: "awaiting_reply" });
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: B unchanged
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155555678"].stage).toBe("in_conversation");
    expect(reloaded["+14155555678"].nps).toBe(8);
    expect(reloaded["+14155555678"].notes).toBe("Founder B");
  });

  test("adds new founder to empty state", async () => {
    // Given: empty state
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify({}, null, 2));

    // When: updateFounder for new phone
    const { loadState, updateFounder, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = updateFounder(state, "+14155559999", {
      stage: "awaiting_reply",
      last_sent: "2026-01-17T10:00:00Z",
    });
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: founder added with defaults + updates
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155559999"]).toBeDefined();
    expect(reloaded["+14155559999"].stage).toBe("awaiting_reply");
    expect(reloaded["+14155559999"].last_sent).toBe("2026-01-17T10:00:00Z");
  });
});

describe("History Check & Safety Lock", () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("records last_wa_message_at after check", async () => {
    // This test will use mocked wacli
    // Given: WhatsApp has messages for +1234
    // When: checkHistory(+1234)
    // Then: pipeline.json has last_wa_message_at set

    // For now, mark as TODO - requires wacli mock setup
    expect(true).toBe(true);
  });

  test("normalizes phone numbers consistently", async () => {
    const { normalizePhone } = await import("./pipeline");

    // Various formats should normalize to same value
    expect(normalizePhone("+14155551234")).toBe("14155551234");
    expect(normalizePhone("14155551234")).toBe("14155551234");
    expect(normalizePhone("1-415-555-1234")).toBe("14155551234");
    expect(normalizePhone("+1 (415) 555-1234")).toBe("14155551234");
  });

  test("builds correct JID from phone", async () => {
    const { phoneToJid } = await import("./pipeline");

    expect(phoneToJid("+14155551234")).toBe("14155551234@s.whatsapp.net");
    expect(phoneToJid("14155551234")).toBe("14155551234@s.whatsapp.net");
  });
});

describe("Send Safety Check", () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("requires history check before send", async () => {
    // Given: no last_checked_at in state (never checked)
    const existingState = {
      "+14155551234": {
        stage: "awaiting_reply",
        last_sent: "2026-01-15T10:00:00Z",
        // No last_checked_at - never checked history
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: canSend() called
    const { loadState, canSend } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const result = canSend(state, "+14155551234");

    // Then: returns error "Must check history first"
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("history");
  });

  test("allows send when history recently checked", async () => {
    // Given: last_checked_at is recent (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const existingState = {
      "+14155551234": {
        stage: "awaiting_reply",
        last_sent: "2026-01-15T10:00:00Z",
        last_checked_at: fiveMinutesAgo,
        last_wa_message_at: "2026-01-15T09:00:00Z",
        last_wa_from: "us",
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: canSend() called
    const { loadState, canSend } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const result = canSend(state, "+14155551234");

    // Then: allowed
    expect(result.allowed).toBe(true);
  });

  test("blocks send when history check is stale", async () => {
    // Given: last_checked_at is old (> 10 minutes)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const existingState = {
      "+14155551234": {
        stage: "awaiting_reply",
        last_sent: "2026-01-15T10:00:00Z",
        last_checked_at: twentyMinutesAgo,
        last_wa_message_at: "2026-01-15T09:00:00Z",
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: canSend() called
    const { loadState, canSend } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const result = canSend(state, "+14155551234");

    // Then: blocked due to stale check
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("stale");
  });
});

describe("Status Command", () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("groups founders by stage", async () => {
    // Given: founders at various stages
    const existingState = {
      "+14155551111": { stage: "not_contacted" },
      "+14155552222": { stage: "awaiting_reply", last_sent: "2026-01-15T10:00:00Z" },
      "+14155553333": { stage: "in_conversation" },
      "+14155554444": { stage: "nps_collected", nps: 8 },
      "+14155555555": { stage: "complete" },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: getStatusSummary()
    const { loadState, getStatusSummary } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const summary = getStatusSummary(state);

    // Then: returns grouped by stage
    expect(summary.not_contacted.length).toBe(1);
    expect(summary.awaiting_reply.length).toBe(1);
    expect(summary.in_conversation.length).toBe(1);
    expect(summary.nps_collected.length).toBe(1);
    expect(summary.complete.length).toBe(1);
  });

  test("identifies stale awaiting_reply (> 2 days)", async () => {
    // Given: founder sent 3 days ago, no reply
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const existingState = {
      "+14155551234": {
        stage: "awaiting_reply",
        last_sent: threeDaysAgo,
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: getStatusSummary()
    const { loadState, getStatusSummary } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const summary = getStatusSummary(state);

    // Then: appears in stale list
    expect(summary.stale_awaiting.length).toBe(1);
    expect(summary.stale_awaiting[0].phone).toBe("+14155551234");
  });

  test("shows new messages since last check", async () => {
    // Given: last_checked_at older than last_wa_message_at
    const existingState = {
      "+14155551234": {
        stage: "awaiting_reply",
        last_sent: "2026-01-15T10:00:00Z",
        last_checked_at: "2026-01-15T14:00:00Z",
        last_wa_message_at: "2026-01-15T16:00:00Z",
        last_wa_message: "yeah going well!",
        last_wa_from: "them",
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: getStatusSummary()
    const { loadState, getStatusSummary } = await import("./pipeline");
    const state = await loadState(TEST_PIPELINE_PATH);
    const summary = getStatusSummary(state);

    // Then: appears in "new messages" section
    expect(summary.new_messages.length).toBe(1);
    expect(summary.new_messages[0].message).toBe("yeah going well!");
  });
});

describe("Recording Info", () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("records NPS and advances stage", async () => {
    // Given: founder at in_conversation
    const existingState = {
      "+14155551234": {
        stage: "in_conversation",
        last_sent: "2026-01-15T10:00:00Z",
        nps: null,
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: recordNPS(+1234, 8, "helpful")
    const { loadState, recordNPS, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = recordNPS(state, "+14155551234", 8, "helpful");
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: stage = nps_collected, nps = 8 in state
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155551234"].stage).toBe("nps_collected");
    expect(reloaded["+14155551234"].nps).toBe(8);
    expect(reloaded["+14155551234"].nps_comment).toBe("helpful");
  });

  test("records needs and advances stage", async () => {
    // Given: founder at nps_collected
    const existingState = {
      "+14155551234": {
        stage: "nps_collected",
        nps: 8,
        needs: null,
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: recordNeeds(+1234, "enterprise intros")
    const { loadState, recordNeeds, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = recordNeeds(state, "+14155551234", "enterprise intros");
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: stage = needs_collected, needs set
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155551234"].stage).toBe("needs_collected");
    expect(reloaded["+14155551234"].needs).toBe("enterprise intros");
  });

  test("does not regress stage when recording NPS", async () => {
    // Given: founder already at nps_collected
    const existingState = {
      "+14155551234": {
        stage: "needs_collected",
        nps: 7,
        needs: "some needs",
      },
    };
    await writeFile(TEST_PIPELINE_PATH, JSON.stringify(existingState, null, 2));

    // When: recordNPS called again (correcting score)
    const { loadState, recordNPS, saveState } = await import("./pipeline");
    let state = await loadState(TEST_PIPELINE_PATH);
    state = recordNPS(state, "+14155551234", 9, "actually higher");
    await saveState(TEST_PIPELINE_PATH, state);

    // Then: NPS updated but stage not regressed
    const reloaded = await loadState(TEST_PIPELINE_PATH);
    expect(reloaded["+14155551234"].nps).toBe(9);
    expect(reloaded["+14155551234"].stage).toBe("needs_collected"); // Not regressed
  });
});

describe("Stage Transitions", () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    if (existsSync(TEST_PIPELINE_PATH)) {
      await unlink(TEST_PIPELINE_PATH);
    }
  });

  test("advanceStage moves through correct order", async () => {
    const { advanceStage } = await import("./pipeline");

    expect(advanceStage("not_contacted")).toBe("awaiting_reply");
    expect(advanceStage("awaiting_reply")).toBe("in_conversation");
    expect(advanceStage("in_conversation")).toBe("nps_collected");
    expect(advanceStage("nps_collected")).toBe("needs_collected");
    expect(advanceStage("needs_collected")).toBe("complete");
    expect(advanceStage("complete")).toBe("complete"); // No further advancement
  });

  test("stageOrder returns correct numeric order", async () => {
    const { stageOrder } = await import("./pipeline");

    expect(stageOrder("not_contacted")).toBeLessThan(stageOrder("awaiting_reply"));
    expect(stageOrder("awaiting_reply")).toBeLessThan(stageOrder("in_conversation"));
    expect(stageOrder("in_conversation")).toBeLessThan(stageOrder("nps_collected"));
    expect(stageOrder("nps_collected")).toBeLessThan(stageOrder("needs_collected"));
    expect(stageOrder("needs_collected")).toBeLessThan(stageOrder("complete"));
  });
});
