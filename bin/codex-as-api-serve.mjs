#!/usr/bin/env node

import express from "/Users/michael/.local/share/fnm/node-versions/v24.11.0/installation/lib/node_modules/codex-as-api/node_modules/express/index.js";
import { createApp } from "/Users/michael/.local/share/fnm/node-versions/v24.11.0/installation/lib/node_modules/codex-as-api/dist/index.js";
import fs from "fs";
import os from "os";
import path from "path";

const HOST = process.env.CODEX_AS_API_HOST || "127.0.0.1";
const PORT = parseInt(process.env.CODEX_AS_API_PORT || "18080", 10);

const KNOWN_MODELS = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.3-codex",
  "gpt-5.3-codex-spark",
  "gpt-5.2",
];

function loadDefaultModel() {
  if (process.env.CODEX_AS_API_MODEL) {
    return process.env.CODEX_AS_API_MODEL;
  }

  const configPath = path.join(
    process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
    "config.toml",
  );

  try {
    const text = fs.readFileSync(configPath, "utf8");
    const match = text.match(/^\s*model\s*=\s*["']([^"']+)["']/m);
    if (match) {
      return match[1];
    }
  } catch {
    // fall through
  }

  return "gpt-5.5";
}

function modelList() {
  const defaultModel = loadDefaultModel();
  return [...new Set([defaultModel, ...KNOWN_MODELS])];
}

function modelObject(id) {
  return {
    id,
    object: "model",
    created: Math.floor(Date.now() / 1000),
    owned_by: "openai",
  };
}

const DEFAULT_SYSTEM_INSTRUCTIONS =
  process.env.CODEX_AS_API_SYSTEM_INSTRUCTIONS ||
  "You are a helpful assistant.";

function hasSystemMessage(messages) {
  return (
    Array.isArray(messages) &&
    messages.some(
      (message) =>
        message &&
        message.role === "system" &&
        String(message.content ?? "").trim(),
    )
  );
}

function ensureSystemInstructions(body) {
  if (!body || typeof body !== "object") {
    return body;
  }

  if (Array.isArray(body.messages) && !hasSystemMessage(body.messages)) {
    body.messages = [
      { role: "system", content: DEFAULT_SYSTEM_INSTRUCTIONS },
      ...body.messages,
    ];
  }

  if (
    Array.isArray(body.messages) &&
    (body.system == null ||
      (typeof body.system === "string" && !body.system.trim()))
  ) {
    body.system = DEFAULT_SYSTEM_INSTRUCTIONS;
  }

  return body;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Authorization, Content-Type, Accept, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}

const api = createApp();

api.get("/v1/models", (_req, res) => {
  res.json({
    object: "list",
    data: modelList().map(modelObject),
  });
});

api.get("/v1/models/:model", (req, res) => {
  const models = modelList();
  if (!models.includes(req.params.model)) {
    res.status(404).json({
      error: {
        message: `The model '${req.params.model}' does not exist`,
        type: "invalid_request_error",
        param: "model",
        code: "model_not_found",
      },
    });
    return;
  }

  res.json(modelObject(req.params.model));
});

const app = express();

app.use((req, res, next) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
  if (
    req.method === "POST" &&
    (req.path === "/v1/chat/completions" || req.path === "/v1/messages")
  ) {
    ensureSystemInstructions(req.body);
  }

  next();
});

app.use(api);

app.listen(PORT, HOST, () => {
  console.log(`codex-as-api listening on ${HOST}:${PORT}`);
});
