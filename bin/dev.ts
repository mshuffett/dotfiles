#!/usr/bin/env bun
/**
 * dev - Connect to remote dev server via SSH
 *
 * Setup: Add your dev server to ~/.ssh/config:
 *   Host dev
 *     HostName <your-ec2-or-gcp-ip>
 *     User michael
 *     IdentityFile ~/.ssh/your-key
 *
 * Optional: Set DEV_INSTANCE_ID for AWS or DEV_INSTANCE_NAME for GCP
 */
import { defineCommand, runMain } from "citty";
import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const SSH_HOST = process.env.DEV_SSH_HOST || "dev";
const AWS_INSTANCE_ID = process.env.DEV_INSTANCE_ID;
const AWS_REGION = process.env.DEV_AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const AWS_VOLUME_ID = process.env.DEV_VOLUME_ID;
const GCP_INSTANCE_NAME = process.env.DEV_INSTANCE_NAME;
const GCP_ZONE = process.env.DEV_GCP_ZONE || "us-central1-a";

// EBS gp3 IOPS settings (saves ~$90/mo when idle)
const IOPS_HIGH = 16000;
const IOPS_LOW = 3000; // gp3 baseline (free)
const THROUGHPUT_HIGH = 1000;
const THROUGHPUT_LOW = 125; // gp3 baseline (free)

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
const CACHE_FILE = join(homedir(), ".cache", "dev-server-creds-sync");
const SSH_CONFIG = join(homedir(), ".ssh", "config");

async function syncCreds(force = false) {
  const now = Date.now();

  if (!force && existsSync(CACHE_FILE)) {
    const lastSync = parseInt(readFileSync(CACHE_FILE, "utf-8").trim(), 10);
    if (now - lastSync < SYNC_INTERVAL) return;
  }

  console.log("Syncing Claude credentials...");

  const { stdout, exitCode } =
    await $`security find-generic-password -s "Claude Code-credentials" -w`
      .quiet()
      .nothrow();
  if (exitCode !== 0 || !stdout.toString().trim()) {
    console.error("Warning: Could not read credentials from Keychain");
    return;
  }

  const creds = stdout.toString().trim();
  const proc = Bun.spawn(
    [
      "ssh",
      SSH_HOST,
      "bash -c 'mkdir -p ~/.claude && cat > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json'",
    ],
    { stdin: "pipe", stderr: "inherit" }
  );
  proc.stdin.write(creds);
  proc.stdin.end();
  const syncExitCode = await proc.exited;

  if (syncExitCode === 0) {
    mkdirSync(join(homedir(), ".cache"), { recursive: true });
    writeFileSync(CACHE_FILE, now.toString());
    console.log("Credentials synced.");
  } else {
    console.error("Warning: Failed to sync credentials");
  }
}

const main = defineCommand({
  meta: {
    name: "dev",
    version: "2.0.0",
    description: "Connect to remote dev server via SSH",
  },
  args: {
    n: {
      type: "boolean",
      alias: ["no-tmux"],
      description: "SSH without tmux attach",
    },
  },
  subCommands: {
    start: defineCommand({
      meta: { description: "Start the cloud instance (EC2 or GCP)" },
      run: async () => {
        if (AWS_INSTANCE_ID) {
          console.log("Starting EC2 instance...");
          await $`aws ec2 start-instances --instance-ids ${AWS_INSTANCE_ID} --region ${AWS_REGION}`;
          console.log("Waiting for instance to be running...");
          await $`aws ec2 wait instance-running --instance-ids ${AWS_INSTANCE_ID} --region ${AWS_REGION}`;

          // Scale up IOPS for performance
          if (AWS_VOLUME_ID) {
            console.log("Scaling up EBS IOPS...");
            await $`aws ec2 modify-volume --volume-id ${AWS_VOLUME_ID} --iops ${IOPS_HIGH} --throughput ${THROUGHPUT_HIGH} --region ${AWS_REGION}`.quiet().nothrow();
          }

          // Update SSH config with new IP
          const { stdout } = await $`aws ec2 describe-instances --instance-ids ${AWS_INSTANCE_ID} --region ${AWS_REGION} --query 'Reservations[0].Instances[0].PublicIpAddress' --output text`.quiet();
          const newIp = stdout.toString().trim();
          if (newIp && existsSync(SSH_CONFIG)) {
            const config = readFileSync(SSH_CONFIG, "utf-8");
            const updated = config.replace(/(Host dev[\s\S]*?HostName )\S+/, `$1${newIp}`);
            writeFileSync(SSH_CONFIG, updated);
            console.log(`SSH config updated with IP: ${newIp}`);
          }

          console.log("Instance started");
        } else if (GCP_INSTANCE_NAME) {
          console.log("Starting GCE instance...");
          await $`gcloud compute instances start ${GCP_INSTANCE_NAME} --zone=${GCP_ZONE}`;
          console.log("Instance started");
        } else {
          console.error(
            "Set DEV_INSTANCE_ID (AWS) or DEV_INSTANCE_NAME (GCP) to enable start/stop"
          );
          process.exit(1);
        }
      },
    }),
    stop: defineCommand({
      meta: { description: "Stop the cloud instance (save credits)" },
      run: async () => {
        if (AWS_INSTANCE_ID) {
          // Scale down IOPS to save money (~$90/mo)
          if (AWS_VOLUME_ID) {
            console.log("Scaling down EBS IOPS to save costs...");
            await $`aws ec2 modify-volume --volume-id ${AWS_VOLUME_ID} --iops ${IOPS_LOW} --throughput ${THROUGHPUT_LOW} --region ${AWS_REGION}`.quiet().nothrow();
          }

          console.log("Stopping EC2 instance...");
          await $`aws ec2 stop-instances --instance-ids ${AWS_INSTANCE_ID} --region ${AWS_REGION}`;
          console.log("Instance stopped (storage at baseline IOPS)");
        } else if (GCP_INSTANCE_NAME) {
          console.log("Stopping GCE instance...");
          await $`gcloud compute instances stop ${GCP_INSTANCE_NAME} --zone=${GCP_ZONE}`;
          console.log("Instance stopped");
        } else {
          console.error(
            "Set DEV_INSTANCE_ID (AWS) or DEV_INSTANCE_NAME (GCP) to enable start/stop"
          );
          process.exit(1);
        }
      },
    }),
    status: defineCommand({
      meta: { description: "Check server/instance status" },
      run: async () => {
        // Try SSH first
        const { exitCode } =
          await $`ssh -o ConnectTimeout=5 ${SSH_HOST} echo "Connected"`.nothrow();
        if (exitCode === 0) {
          console.log(`✓ SSH to ${SSH_HOST}: reachable`);
        } else {
          console.log(`✗ SSH to ${SSH_HOST}: unreachable`);
        }

        // Check cloud instance status if configured
        if (AWS_INSTANCE_ID) {
          const { stdout } =
            await $`aws ec2 describe-instances --instance-ids ${AWS_INSTANCE_ID} --region ${AWS_REGION} --query 'Reservations[0].Instances[0].State.Name' --output text`.quiet();
          console.log(`  EC2 ${AWS_INSTANCE_ID}: ${stdout.toString().trim()}`);
        } else if (GCP_INSTANCE_NAME) {
          const { stdout } =
            await $`gcloud compute instances describe ${GCP_INSTANCE_NAME} --zone=${GCP_ZONE} --format='get(status)'`.quiet();
          console.log(
            `  GCE ${GCP_INSTANCE_NAME}: ${stdout.toString().trim()}`
          );
        }
      },
    }),
    "sync-creds": defineCommand({
      meta: { description: "Manually sync Claude OAuth credentials" },
      run: () => syncCreds(true),
    }),
    run: defineCommand({
      meta: { description: "Run a command on the server" },
      args: {
        cmd: {
          type: "positional",
          description: "Command to run",
          required: true,
        },
      },
      run: async ({ args }) => {
        await $`ssh ${SSH_HOST} ${args.cmd}`;
      },
    }),
    connect: defineCommand({
      meta: { description: "SSH into the dev server (default action)" },
      args: {
        n: {
          type: "boolean",
          alias: ["no-tmux"],
          description: "SSH without tmux attach",
        },
      },
      run: async ({ args }) => {
        await syncCreds(false);
        if (args.n) {
          await $`ssh -t ${SSH_HOST}`;
        } else {
          await $`ssh -t ${SSH_HOST} "LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 tmux -u new -A -s main"`;
        }
      },
    }),
  },
  run: async ({ args, cmd }) => {
    // Default action when no subcommand - connect to server
    // This avoids citty running this after subcommands complete
    const subcommandUsed = process.argv[2] && ['start', 'stop', 'status', 'sync-creds', 'run', 'connect'].includes(process.argv[2]);
    if (subcommandUsed) return;

    await syncCreds(false);
    if (args.n) {
      await $`ssh -t ${SSH_HOST}`;
    } else {
      await $`ssh -t ${SSH_HOST} "LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 tmux -u new -A -s main"`;
    }
  },
});

runMain(main);
