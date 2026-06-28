#!/usr/bin/env bash
# dev-harden.sh — idempotent hardening for the dev box against the 2026-06-27 OOM-livelock.
# Adds swap (the box had 0B → memory spike hard-hung it), earlyoom (kills the hog early
# instead of letting the kernel livelock), and memory-friendly sysctls.
# Safe to re-run. Intended to be run on the box with sudo (it's the `dev` setup_script).
set -euo pipefail

SWAP=/swapfile
SWAP_GB="${SWAP_GB:-16}"

echo "== swap =="
if ! swapon --show=NAME --noheadings | grep -qx "$SWAP"; then
  if [ ! -f "$SWAP" ]; then
    fallocate -l "${SWAP_GB}G" "$SWAP" 2>/dev/null || dd if=/dev/zero of="$SWAP" bs=1M count=$((SWAP_GB*1024)) status=none
  fi
  chmod 600 "$SWAP"
  mkswap "$SWAP" >/dev/null
  swapon "$SWAP"
fi
grep -q "^$SWAP " /etc/fstab || echo "$SWAP none swap sw 0 0" >> /etc/fstab

echo "== sysctl (swappiness/cache pressure) =="
cat >/etc/sysctl.d/99-devbox.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sysctl --system >/dev/null

echo "== earlyoom (userspace early OOM killer) =="
export DEBIAN_FRONTEND=noninteractive
if ! command -v earlyoom >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y -qq earlyoom
fi
# Act when available memory < 6% (and swap < 100%, i.e. effectively on memory);
# prefer killing node/claude/codex agents, avoid core infra. -r logs pressure hourly.
cat >/etc/default/earlyoom <<'EOF'
EARLYOOM_ARGS="-m 6 -s 100 -r 3600 --prefer ^(node|claude|codex|bun)$ --avoid ^(sshd|tmux|systemd|init|dockerd|containerd)$"
EOF
systemctl enable earlyoom >/dev/null 2>&1 || true
systemctl restart earlyoom

echo "== results =="
swapon --show
free -h | awk '/Mem|Swap/'
printf 'earlyoom: '; systemctl is-active earlyoom
sysctl -n vm.swappiness | sed 's/^/swappiness=/'
echo "HARDEN_OK"
