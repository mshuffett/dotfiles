const DEFAULT_BASH_REASON =
  "The Bash output indicates a command/setup failure that should be fixed before retrying.";
const DEFAULT_BASH_CONTEXT =
  "Bash reported `command not found`, `permission denied`, or a missing file/path. Verify the command, dependency installation, PATH, file permissions, and referenced paths before retrying.";

export function safeString(value) {
  return typeof value === "string" ? value : "";
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

export function tryParseJsonString(value) {
  const text = safeString(value).trim();
  if (!text) return null;
  try {
    return safeObject(JSON.parse(text));
  } catch {
    return null;
  }
}

export function readHookEventName(payload) {
  const value = safeString(
    payload.hook_event_name ?? payload.hookEventName ?? payload.event ?? payload.name,
  ).trim();
  return value || null;
}

export function readToolResponse(payload) {
  const rawToolResponse = payload.tool_response;
  const parsedToolResponse = tryParseJsonString(rawToolResponse) ?? safeObject(rawToolResponse);
  const stdoutText = safeString(parsedToolResponse?.stdout).trim() || safeString(rawToolResponse).trim();
  const stderrText = safeString(parsedToolResponse?.stderr).trim();
  const combined = `${stderrText}\n${stdoutText}`.trim();
  return { stdoutText, stderrText, combined };
}

export function isBenignGlobMiss(text) {
  return /(?:^|\n)(?:zsh|bash)(?::\d+)?: no matches found:/i.test(text);
}

export function isLikelyTargetPathMiss(text) {
  return /(?:^|\n)\s*(?:ls|cat|grep|sed|rg|fd|find|tail|head|awk|cp|mv|rm|touch|wc|bat|eza|git): .*no such file or directory/i.test(
    text,
  );
}

export function isShellInvocationFailure(text) {
  return /(?:^|\n)\s*(?:zsh|bash)(?::\d+)?: .*?(?:command not found|permission denied|no such file or directory)/i.test(
    text,
  );
}

export function rewriteOutput(payload, outputJson) {
  const hookEventName = readHookEventName(payload);
  if (hookEventName !== "PostToolUse" || safeString(payload.tool_name).trim() !== "Bash" || !outputJson) {
    return outputJson;
  }

  const { combined } = readToolResponse(payload);
  if (!combined) return outputJson;

  if (isBenignGlobMiss(combined)) {
    return null;
  }

  if (outputJson.reason !== DEFAULT_BASH_REASON) {
    return outputJson;
  }

  const additionalContext = safeString(outputJson.hookSpecificOutput?.additionalContext);
  if (additionalContext !== DEFAULT_BASH_CONTEXT) {
    return outputJson;
  }

  if (isLikelyTargetPathMiss(combined) && !isShellInvocationFailure(combined)) {
    return {
      ...outputJson,
      reason: "The Bash command referenced a file or path that does not exist. Fix the path or glob before retrying.",
      hookSpecificOutput: {
        ...safeObject(outputJson.hookSpecificOutput),
        additionalContext:
          "Bash reported a missing target path. Check the referenced file, directory, glob, or current working directory before retrying.",
      },
    };
  }

  return {
    ...outputJson,
    hookSpecificOutput: {
      ...safeObject(outputJson.hookSpecificOutput),
      additionalContext:
        "Bash reported command not found, permission denied, or a missing file/path. Verify the command, dependency installation, PATH, file permissions, and referenced paths before retrying.",
    },
  };
}
