#!/usr/bin/env bun
/**
 * Extract training data for style tuning from WhatsApp message history.
 * Produces input/output pairs with conversation context.
 */

import { execSync } from "node:child_process";

interface Message {
  ChatJID: string;
  ChatName: string;
  MsgID: string;
  SenderJID: string;
  Timestamp: string;
  FromMe: boolean;
  Text: string;
  MediaType: string;
}

interface TrainingExample {
  // Context about the conversation
  chat_name: string;
  chat_jid: string;
  sender_name: string;
  timestamp: string;

  // Conversation history leading up to the reply
  conversation_history: Array<{
    from: "them" | "me";
    text: string;
    timestamp: string;
  }>;

  // The message being replied to
  input_message: string;

  // Michael's reply
  output_reply: string;
}

function runWacli(args: string): unknown {
  const result = execSync(`wacli ${args} --json`, {
    encoding: "utf-8",
    timeout: 30000,
  });
  const parsed = JSON.parse(result);
  if (!parsed.success) {
    throw new Error(parsed.error || "wacli command failed");
  }
  return parsed.data;
}

function getMyMessages(limit: number): Message[] {
  const data = runWacli(`messages list --limit ${limit}`) as {
    messages: Message[];
  };
  return data.messages.filter((m) => m.FromMe && m.Text.length > 0);
}

function getContext(
  chatJid: string,
  msgId: string,
  before = 10
): Message[] {
  const data = runWacli(
    `messages context --chat "${chatJid}" --id "${msgId}" --before ${before} --after 0`
  ) as Message[];
  return data;
}

function buildTrainingExample(
  myMessage: Message,
  contextMessages: Message[]
): TrainingExample | null {
  // Find messages before mine (excluding my message)
  const priorMessages = contextMessages
    .filter((m) => m.MsgID !== myMessage.MsgID)
    .filter((m) => new Date(m.Timestamp) < new Date(myMessage.Timestamp))
    .filter((m) => m.Text.length > 0)
    .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());

  if (priorMessages.length === 0) {
    // No context, skip (I initiated the conversation)
    return null;
  }

  // The most recent message from them is what I'm replying to
  const theirMessages = priorMessages.filter((m) => !m.FromMe);
  if (theirMessages.length === 0) {
    return null;
  }

  const inputMessage = theirMessages[theirMessages.length - 1];

  // Build conversation history
  const conversationHistory = priorMessages.map((m) => ({
    from: m.FromMe ? ("me" as const) : ("them" as const),
    text: m.Text,
    timestamp: m.Timestamp,
  }));

  return {
    chat_name: myMessage.ChatName,
    chat_jid: myMessage.ChatJID,
    sender_name: inputMessage.ChatName,
    timestamp: myMessage.Timestamp,
    conversation_history: conversationHistory,
    input_message: inputMessage.Text,
    output_reply: myMessage.Text,
  };
}

async function main() {
  const limit = Number(process.argv[2]) || 200;
  console.error(`Fetching up to ${limit} messages...`);

  const myMessages = getMyMessages(limit);
  console.error(`Found ${myMessages.length} messages from me with text`);

  const trainingExamples: TrainingExample[] = [];
  const seen = new Set<string>();

  for (const msg of myMessages) {
    // Skip duplicates (same chat + same reply text)
    const key = `${msg.ChatJID}:${msg.Text}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const context = getContext(msg.ChatJID, msg.MsgID, 10);
      const example = buildTrainingExample(msg, context);
      if (example) {
        trainingExamples.push(example);
      }
    } catch (err) {
      console.error(`Error fetching context for ${msg.MsgID}: ${err}`);
    }
  }

  console.error(`\nExtracted ${trainingExamples.length} training examples`);

  // Output as JSON
  console.log(JSON.stringify(trainingExamples, null, 2));
}

main().catch(console.error);
