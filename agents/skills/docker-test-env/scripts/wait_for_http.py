#!/usr/bin/env python3
"""Poll an HTTP endpoint until it responds successfully."""

from __future__ import annotations

import argparse
import sys
import time
import urllib.error
import urllib.request


def main() -> int:
    parser = argparse.ArgumentParser(description="Wait for an HTTP endpoint to become ready.")
    parser.add_argument("url")
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--status", type=int, default=200)
    parser.add_argument("--contains", help="Optional substring expected in the response body")
    args = parser.parse_args()

    deadline = time.time() + args.timeout
    last_error = "no response yet"

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(args.url, timeout=10) as response:
                body = response.read().decode("utf-8", errors="ignore")
                if response.status != args.status:
                    last_error = f"unexpected status {response.status}"
                elif args.contains and args.contains not in body:
                    last_error = "expected response substring not found"
                else:
                    print(f"ready: {args.url}")
                    return 0
        except urllib.error.URLError as exc:
            last_error = str(exc.reason)
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
        time.sleep(args.interval)

    print(f"timeout waiting for {args.url}: {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
