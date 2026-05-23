#!/usr/bin/env python3
"""Send a message to Michael's OpenClaw ("puffin") agent and print its reply.

Why this is indirect: the bot's public OpenAI-compatible endpoint
(http://34.236.245.154/v1/chat/completions, the puffin wrapper on port 80) is
currently broken — it hangs on every completion. The gateway *behind* it is
healthy, but it only listens on 127.0.0.1:18789 inside the container, and its
auth token is regenerated on every restart. So we:

  1. SSM -> on the host, read the CURRENT gateway token from its startup log line
     (`... gateway run ... --token <hex>`).
  2. Pipe the chat payload into `docker exec -i puffin-openclaw-1 curl ...` so the
     request hits the gateway directly with the right token.
  3. Parse the OpenAI-style response and print the assistant's text.

Requires: aws CLI with creds for account 636160605813, and the custom SSM
document `PuffinRunShell` (created because this account has AWS-managed SSM docs
stripped). Region us-east-1.
"""
import argparse, base64, json, subprocess, sys, time

INSTANCE = "i-02cef0acfa720d57b"
REGION = "us-east-1"
DOC = "PuffinRunShell"
CONTAINER = "puffin-openclaw-1"


def ssm_run(host_script, timeout=150):
    """Run a shell script on the instance via SSM; return StandardOutputContent."""
    b64 = base64.b64encode(host_script.encode()).decode()
    wrapper = f'sh -c "echo {b64} | base64 -d | sh"'
    params = json.dumps({"commands": [wrapper]})
    r = subprocess.run(
        ["aws", "ssm", "send-command", "--region", REGION, "--instance-ids", INSTANCE,
         "--document-name", DOC, "--parameters", params,
         "--query", "Command.CommandId", "--output", "text"],
        capture_output=True, text=True)
    cid = r.stdout.strip()
    if not cid or " " in cid:
        sys.exit(f"SSM send-command failed: {r.stderr or r.stdout}")
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(4)
        inv = subprocess.run(
            ["aws", "ssm", "get-command-invocation", "--region", REGION,
             "--command-id", cid, "--instance-id", INSTANCE,
             "--query", "{S:Status,O:StandardOutputContent,E:StandardErrorContent}",
             "--output", "json"], capture_output=True, text=True)
        try:
            d = json.loads(inv.stdout)
        except Exception:
            continue
        if d.get("S") in ("Success", "Failed", "Cancelled", "TimedOut"):
            return d
    return {"S": "PollTimeout", "O": "", "E": "poll timed out"}


def main():
    ap = argparse.ArgumentParser(description="Message the OpenClaw agent, print its reply.")
    ap.add_argument("message", help="the message to send to the agent")
    ap.add_argument("--agent", default="openclaw/default",
                    help="agent/model id (e.g. openclaw/michael, openclaw/default)")
    ap.add_argument("--timeout", type=int, default=150)
    ap.add_argument("--raw", action="store_true", help="print full JSON, not just the text")
    a = ap.parse_args()

    payload = json.dumps({"model": a.agent, "stream": False,
                          "messages": [{"role": "user", "content": a.message}]})
    pb64 = base64.b64encode(payload.encode()).decode()
    host_script = (
        f'TOK=$(docker logs {CONTAINER} 2>&1 | grep -oE -- "--token [a-f0-9]+" | tail -1 | awk \'{{print $2}}\')\n'
        f'echo {pb64} | base64 -d | docker exec -i {CONTAINER} curl -s -m 110 '
        f'http://127.0.0.1:18789/v1/chat/completions '
        f'-H "Authorization: Bearer $TOK" -H "content-type: application/json" --data @-\n'
    )
    res = ssm_run(host_script, timeout=a.timeout)
    out = (res.get("O") or "").strip()
    if res.get("S") != "Success" or not out:
        sys.exit(f"FAILED (status={res.get('S')}): {res.get('E') or out or 'no output'}")
    # extract the JSON object from the output
    start = out.find("{")
    try:
        obj = json.loads(out[start:])
    except Exception:
        print(out)
        return
    if a.raw:
        print(json.dumps(obj, indent=2))
        return
    try:
        print(obj["choices"][0]["message"]["content"].strip())
    except Exception:
        print(json.dumps(obj, indent=2))


if __name__ == "__main__":
    main()
