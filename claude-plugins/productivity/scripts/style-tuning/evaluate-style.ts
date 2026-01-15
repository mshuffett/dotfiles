#!/usr/bin/env bun
/**
 * Comprehensive style evaluation for WhatsApp and Email replies.
 *
 * Evaluation Criteria:
 * 1. Link Matching - If context has links, generated should include correct ones
 * 2. Knowledge Utilization - Uses available/knowable information
 * 3. Confidence Calibration - High confidence = right, Low confidence = uncertain OK
 * 4. Option Count - Multiple options only when uncertainty is warranted
 * 5. Style Match - Matches Michael's overall style patterns
 * 6. Factual Accuracy - No incorrect information
 * 7. Confidence-Error Penalty - Overconfident + wrong = heavily penalized
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

const anthropic = new Anthropic();

// ============================================================================
// Types
// ============================================================================

interface WhatsAppExample {
  chat_name: string;
  conversation_history: Array<{ from: "me" | "them"; text: string; timestamp: string }>;
  input_message: string;
  output_reply: string;
}

interface EmailExample {
  to_name: string | null;
  to_email: string;
  subject: string;
  timestamp: string;
  is_reply: boolean;
  original_message?: string;
  michael_reply: string;
}

interface GeneratedReply {
  options: string[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface EvaluationResult {
  example_id: number;
  input_summary: string;
  actual_reply: string;
  generated: GeneratedReply;
  scores: {
    link_matching: number;        // 0-1: correct links included
    knowledge_utilization: number; // 0-1: used available info
    confidence_calibration: number; // 0-1: confidence matches difficulty
    option_count_appropriate: number; // 0-1: right # of options
    style_match: number;          // 0-1: matches Michael's style
    factual_accuracy: number;     // 0-1: no wrong info
    overall_match: number;        // 0-1: how well best option matches actual
  };
  penalties: {
    overconfident_wrong: number;  // 0-1 penalty for high confidence + wrong
    unnecessary_options: number;  // 0-1 penalty for options when not needed
  };
  final_score: number;
  judge_reasoning: string;
}

// ============================================================================
// Prompts
// ============================================================================

const WHATSAPP_STYLE_PROMPT = `You are generating WhatsApp replies in Michael's style.

Style rules:
- Extremely terse: 1-5 words typical
- Phrases: 'K', 'Yeah', 'I'm down', 'lmk', 'does that work?'
- Scheduling: send cal.com/everythingai/15min (short) or /30min (long)
- No emojis, no formal greetings
- Lowercase OK, ellipsis OK

Confidence levels:
- HIGH: Simple acknowledgments, factual yes/no, scheduling logistics
- MEDIUM: Requests that could go either way, social invitations
- LOW: Needs Michael's opinion, strategic decisions, sensitive topics

If HIGH confidence: Generate 1 best answer
If MEDIUM confidence: Generate 2-3 diverse options (yes/no/clarify)
If LOW confidence: Flag for human review

Respond with JSON:
{
  "options": ["reply1", "reply2?"],
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}`;

const EMAIL_STYLE_PROMPT = `You are generating email content in Michael's style.

## CRITICAL: Determine Email Direction First

### OUTBOUND (is_reply: false, no "Re:" in subject)
Michael is SENDING TO someone (not responding). Generate what Michael would send:
- Cold intros: "Introducing Everything AI", pitches with demos
- Requests: account deletions, agreements
- Don't generate "Thanks for reaching out!" for outbound emails

### INBOUND (is_reply: true, has "Re:" in subject)
Michael is RESPONDING to someone. Use the original_message to understand context.

### Superhuman Automation
If the "to" email is a hash like "...@unsub-ab.mktomail.com" with subject "Unsubscribe":
- This is Superhuman sending unsubscribe ON BEHALF of Michael
- Reply: "This is an unsubscribe request sent from Superhuman on behalf of michael@geteverything.ai"

## Style Rules
- Use "Hey [Name]," (not "Hi" or formal greetings)
- Sign-offs: "Best," or "Thanks" (not elaborate)
- Include relevant links when appropriate
- Professional but warm tone
- Complete sentences, proper grammar
- Reference SPECIFIC details from the thread

Key resources:
- 15-min meeting: https://cal.com/everythingai/15min
- 30-min meeting: https://cal.com/everythingai/30min
- Demo Day: https://luma.com/7wf4iwk5

## Context Usage
- If they mention a specific error → acknowledge that exact error
- If they offer specific times → pick from those times, don't make up new ones
- If they ask for reasons → ask clarifying questions back
- If following up → reference what was discussed

Confidence levels:
- HIGH: Simple acknowledgments, scheduling, standard intro responses, automation
- MEDIUM: Context-dependent replies, negotiations
- LOW: Legal/contractual, sensitive, strategic, financial

If HIGH confidence: Generate 1 best answer
If MEDIUM confidence: Generate 2-3 options
If LOW confidence: Flag for human review

Respond with JSON:
{
  "options": ["reply1", "reply2?"],
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}`;

const JUDGE_PROMPT = `You are evaluating how well a generated reply matches Michael's actual reply.

Score each criterion 0-100:

1. LINK_MATCHING: If the context/actual reply contained links (cal.com, luma.com, etc),
   did the generated reply include the same/equivalent links?
   (100 if links match or no links needed, 0 if missed important links)

2. KNOWLEDGE_UTILIZATION: Did the generated reply use available information from context?
   (100 if used all relevant info, 0 if ignored obvious context)

3. CONFIDENCE_CALIBRATION: Is the confidence level appropriate?
   - High confidence for simple/factual → good
   - Low confidence for complex/opinion → good
   - High confidence for complex/opinion → bad
   (100 if calibration is right, 0 if miscalibrated)

4. OPTION_COUNT_APPROPRIATE: Is the number of options warranted?
   - 1 option for clear-cut cases → good
   - Multiple options for uncertain cases → good
   - Multiple options for simple cases → bad
   (100 if count is appropriate, 0 if wrong)

5. STYLE_MATCH: Does the reply match Michael's style patterns?
   - For WhatsApp: terse, casual, specific phrases
   - For email: "Hey [Name],", sign-offs, links
   (100 if style matches, 0 if wrong style)

6. FACTUAL_ACCURACY: Does the reply contain incorrect information?
   (100 if no errors, 0 if contains wrong facts)

7. OVERALL_MATCH: How well does the best generated option match the actual reply's intent?
   (100 if same intent/content, 0 if completely different)

PENALTIES (0-100, will be subtracted):
- OVERCONFIDENT_WRONG: If confidence was "high" but the reply was wrong/inappropriate
- UNNECESSARY_OPTIONS: If multiple options were generated for a simple case

Respond with JSON:
{
  "scores": {
    "link_matching": 0-100,
    "knowledge_utilization": 0-100,
    "confidence_calibration": 0-100,
    "option_count_appropriate": 0-100,
    "style_match": 0-100,
    "factual_accuracy": 0-100,
    "overall_match": 0-100
  },
  "penalties": {
    "overconfident_wrong": 0-100,
    "unnecessary_options": 0-100
  },
  "reasoning": "Brief explanation of scores"
}`;

// ============================================================================
// RAG Helpers
// ============================================================================

interface SimilarEmail {
  id: string;
  score: number;
  content: string;
}

function getSimilarEmails(query: string, n: number = 3): SimilarEmail[] {
  try {
    const result = execSync(
      `llm similar michael-emails -c ${JSON.stringify(query)} -n ${n}`,
      { encoding: "utf-8", timeout: 30000 }
    );
    // Each line is a JSON object
    return result
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function formatSimilarEmailsForPrompt(emails: SimilarEmail[]): string {
  if (emails.length === 0) return "";

  return `
## Similar emails from Michael's history (use as style/content reference):

${emails.map((e, i) => `### Example ${i + 1} (similarity: ${(e.score * 100).toFixed(0)}%)
${e.content}
`).join("\n")}
---
`;
}

// ============================================================================
// Core Functions
// ============================================================================

async function generateReply(
  type: "whatsapp" | "email",
  context: string,
  useRag: boolean = true
): Promise<GeneratedReply> {
  let systemPrompt = type === "whatsapp" ? WHATSAPP_STYLE_PROMPT : EMAIL_STYLE_PROMPT;

  // For emails, fetch similar examples via RAG
  if (type === "email" && useRag) {
    const similarEmails = getSimilarEmails(context, 3);
    if (similarEmails.length > 0) {
      systemPrompt = systemPrompt + "\n\n" + formatSimilarEmailsForPrompt(similarEmails);
    }
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: context }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        options: Array.isArray(parsed.options) ? parsed.options : [parsed.options || text],
        confidence: parsed.confidence || "medium",
        reasoning: parsed.reasoning || "",
      };
    }
  } catch {
    // Fallback
  }

  return {
    options: [text],
    confidence: "medium",
    reasoning: "Failed to parse structured response",
  };
}

async function judgeReply(
  type: "whatsapp" | "email",
  context: string,
  actualReply: string,
  generated: GeneratedReply
): Promise<{
  scores: EvaluationResult["scores"];
  penalties: EvaluationResult["penalties"];
  reasoning: string;
}> {
  const judgeContext = `
Type: ${type}
Context/Input: ${context}
Actual Reply: ${actualReply}
Generated Options: ${JSON.stringify(generated.options)}
Generated Confidence: ${generated.confidence}
Generated Reasoning: ${generated.reasoning}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: JUDGE_PROMPT,
    messages: [{ role: "user", content: judgeContext }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        scores: {
          link_matching: (parsed.scores?.link_matching || 50) / 100,
          knowledge_utilization: (parsed.scores?.knowledge_utilization || 50) / 100,
          confidence_calibration: (parsed.scores?.confidence_calibration || 50) / 100,
          option_count_appropriate: (parsed.scores?.option_count_appropriate || 50) / 100,
          style_match: (parsed.scores?.style_match || 50) / 100,
          factual_accuracy: (parsed.scores?.factual_accuracy || 50) / 100,
          overall_match: (parsed.scores?.overall_match || 50) / 100,
        },
        penalties: {
          overconfident_wrong: (parsed.penalties?.overconfident_wrong || 0) / 100,
          unnecessary_options: (parsed.penalties?.unnecessary_options || 0) / 100,
        },
        reasoning: parsed.reasoning || text,
      };
    }
  } catch {
    // Fallback
  }

  return {
    scores: {
      link_matching: 0.5,
      knowledge_utilization: 0.5,
      confidence_calibration: 0.5,
      option_count_appropriate: 0.5,
      style_match: 0.5,
      factual_accuracy: 0.5,
      overall_match: 0.5,
    },
    penalties: {
      overconfident_wrong: 0,
      unnecessary_options: 0,
    },
    reasoning: "Failed to parse judge response",
  };
}

function calculateFinalScore(
  scores: EvaluationResult["scores"],
  penalties: EvaluationResult["penalties"]
): number {
  // Weighted average of scores
  const weights = {
    link_matching: 0.1,
    knowledge_utilization: 0.15,
    confidence_calibration: 0.15,
    option_count_appropriate: 0.1,
    style_match: 0.15,
    factual_accuracy: 0.15,
    overall_match: 0.2,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += scores[key as keyof typeof scores] * weight;
  }

  // Apply penalties
  score -= penalties.overconfident_wrong * 0.3;  // Heavy penalty
  score -= penalties.unnecessary_options * 0.1;

  return Math.max(0, Math.min(1, score));
}

// ============================================================================
// Evaluation Runner
// ============================================================================

async function evaluateWhatsApp(holdoutCount: number = 10): Promise<EvaluationResult[]> {
  const dataPath = `${process.env.HOME}/.dotfiles/claude-plugins/productivity/skills/whatsapp-reply-style/training-data.json`;

  if (!existsSync(dataPath)) {
    console.error("WhatsApp training data not found at:", dataPath);
    return [];
  }

  const data: WhatsAppExample[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  const holdout = data.slice(-holdoutCount);
  const results: EvaluationResult[] = [];

  for (let i = 0; i < holdout.length; i++) {
    const ex = holdout[i];
    const context = `Chat: ${ex.chat_name}
History:
${ex.conversation_history.slice(-5).map(m => `${m.from === "me" ? "Michael" : "Them"}: ${m.text}`).join("\n")}

Reply to: ${ex.input_message}`;

    console.error(`[WhatsApp ${i + 1}/${holdout.length}] Evaluating...`);

    const generated = await generateReply("whatsapp", context);
    const { scores, penalties, reasoning } = await judgeReply(
      "whatsapp",
      context,
      ex.output_reply,
      generated
    );

    results.push({
      example_id: i,
      input_summary: ex.input_message.slice(0, 50) + "...",
      actual_reply: ex.output_reply,
      generated,
      scores,
      penalties,
      final_score: calculateFinalScore(scores, penalties),
      judge_reasoning: reasoning,
    });
  }

  return results;
}

async function evaluateEmail(holdoutCount: number = 10): Promise<EvaluationResult[]> {
  const dataPath = `${process.env.HOME}/.dotfiles/claude-plugins/productivity/skills/email-reply-style/training-data.json`;

  if (!existsSync(dataPath)) {
    console.error("Email training data not found at:", dataPath);
    return [];
  }

  const rawData = readFileSync(dataPath, "utf-8");
  // Filter out non-JSON lines (from extraction script output)
  const jsonStart = rawData.indexOf("[");
  if (jsonStart === -1) {
    console.error("No JSON array found in email training data");
    return [];
  }

  const data: EmailExample[] = JSON.parse(rawData.slice(jsonStart));
  const holdout = data.slice(-holdoutCount);
  const results: EvaluationResult[] = [];

  for (let i = 0; i < holdout.length; i++) {
    const ex = holdout[i];

    // Skip very short replies (like "Thanks") for more interesting evaluation
    if (ex.michael_reply.length < 10 && i < holdout.length - 3) {
      continue;
    }

    const context = `To: ${ex.to_email}${ex.to_name ? ` (${ex.to_name})` : ""}
Subject: ${ex.subject}
is_reply: ${ex.is_reply}
${ex.is_reply && ex.original_message ? `Original message:\n${ex.original_message.slice(0, 1000)}${ex.original_message.length > 1000 ? "..." : ""}` : "[OUTBOUND - No prior message, Michael is initiating]"}

Write ${ex.is_reply ? "a reply" : "an email"}.`;

    console.error(`[Email ${i + 1}/${holdout.length}] Evaluating...`);

    const generated = await generateReply("email", context);
    const { scores, penalties, reasoning } = await judgeReply(
      "email",
      context,
      ex.michael_reply,
      generated
    );

    results.push({
      example_id: i,
      input_summary: `To: ${ex.to_name || ex.to_email} Re: ${ex.subject.slice(0, 30)}`,
      actual_reply: ex.michael_reply.slice(0, 200) + (ex.michael_reply.length > 200 ? "..." : ""),
      generated,
      scores,
      penalties,
      final_score: calculateFinalScore(scores, penalties),
      judge_reasoning: reasoning,
    });
  }

  return results;
}

function printResults(type: string, results: EvaluationResult[]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${type.toUpperCase()} EVALUATION RESULTS`);
  console.log(`${"=".repeat(60)}\n`);

  for (const r of results) {
    console.log(`--- Example ${r.example_id + 1} ---`);
    console.log(`Input: ${r.input_summary}`);
    console.log(`Actual: ${r.actual_reply.slice(0, 100)}${r.actual_reply.length > 100 ? "..." : ""}`);
    console.log(`Generated (${r.generated.confidence}): ${r.generated.options[0]?.slice(0, 100) || "N/A"}`);
    console.log(`Final Score: ${(r.final_score * 100).toFixed(1)}%`);
    console.log(`Breakdown:`);
    console.log(`  Link Match: ${(r.scores.link_matching * 100).toFixed(0)}%`);
    console.log(`  Knowledge: ${(r.scores.knowledge_utilization * 100).toFixed(0)}%`);
    console.log(`  Confidence Cal: ${(r.scores.confidence_calibration * 100).toFixed(0)}%`);
    console.log(`  Option Count: ${(r.scores.option_count_appropriate * 100).toFixed(0)}%`);
    console.log(`  Style Match: ${(r.scores.style_match * 100).toFixed(0)}%`);
    console.log(`  Factual: ${(r.scores.factual_accuracy * 100).toFixed(0)}%`);
    console.log(`  Overall Match: ${(r.scores.overall_match * 100).toFixed(0)}%`);
    if (r.penalties.overconfident_wrong > 0) {
      console.log(`  PENALTY (overconfident): -${(r.penalties.overconfident_wrong * 30).toFixed(0)}%`);
    }
    console.log(`Judge: ${r.judge_reasoning.slice(0, 150)}...`);
    console.log();
  }

  // Summary stats
  const avgScore = results.reduce((sum, r) => sum + r.final_score, 0) / results.length;
  const avgScores = {
    link_matching: results.reduce((sum, r) => sum + r.scores.link_matching, 0) / results.length,
    knowledge_utilization: results.reduce((sum, r) => sum + r.scores.knowledge_utilization, 0) / results.length,
    confidence_calibration: results.reduce((sum, r) => sum + r.scores.confidence_calibration, 0) / results.length,
    option_count_appropriate: results.reduce((sum, r) => sum + r.scores.option_count_appropriate, 0) / results.length,
    style_match: results.reduce((sum, r) => sum + r.scores.style_match, 0) / results.length,
    factual_accuracy: results.reduce((sum, r) => sum + r.scores.factual_accuracy, 0) / results.length,
    overall_match: results.reduce((sum, r) => sum + r.scores.overall_match, 0) / results.length,
  };

  console.log(`\n${"=".repeat(40)}`);
  console.log(`SUMMARY - ${type.toUpperCase()}`);
  console.log(`${"=".repeat(40)}`);
  console.log(`Examples evaluated: ${results.length}`);
  console.log(`Average Final Score: ${(avgScore * 100).toFixed(1)}%`);
  console.log(`\nAverage by Criterion:`);
  console.log(`  Link Matching: ${(avgScores.link_matching * 100).toFixed(1)}%`);
  console.log(`  Knowledge Utilization: ${(avgScores.knowledge_utilization * 100).toFixed(1)}%`);
  console.log(`  Confidence Calibration: ${(avgScores.confidence_calibration * 100).toFixed(1)}%`);
  console.log(`  Option Count: ${(avgScores.option_count_appropriate * 100).toFixed(1)}%`);
  console.log(`  Style Match: ${(avgScores.style_match * 100).toFixed(1)}%`);
  console.log(`  Factual Accuracy: ${(avgScores.factual_accuracy * 100).toFixed(1)}%`);
  console.log(`  Overall Match: ${(avgScores.overall_match * 100).toFixed(1)}%`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || "both";
  const holdoutCount = parseInt(args[1] || "10");

  console.error(`Running ${type} evaluation with ${holdoutCount} holdout examples...`);

  if (type === "whatsapp" || type === "both") {
    const whatsappResults = await evaluateWhatsApp(holdoutCount);
    if (whatsappResults.length > 0) {
      printResults("WhatsApp", whatsappResults);
    }
  }

  if (type === "email" || type === "both") {
    const emailResults = await evaluateEmail(holdoutCount);
    if (emailResults.length > 0) {
      printResults("Email", emailResults);
    }
  }
}

main().catch(console.error);
