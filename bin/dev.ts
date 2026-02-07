#!/usr/bin/env bun
/**
 * dev - Multi-profile remote dev server management
 *
 * Profiles stored in ~/.config/dev/profiles.json
 * SSH config managed via marker blocks in ~/.ssh/config
 */
import { defineCommand, runMain } from "citty";
import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// --- Types ---

interface Profile {
  name: string;
  instance_id: string;
  volume_id: string | null;
  region: string;
  ssh_host: string;
  ssh_user: string;
  instance_type: string;
  setup_script: string | null;
  setup_completed: boolean;
}

interface ProfileConfig {
  default_profile: string;
  profiles: Record<string, Profile>;
}

// --- Constants ---

const IOPS_HIGH = 16000;
const IOPS_LOW = 3000;
const THROUGHPUT_HIGH = 1000;
const THROUGHPUT_LOW = 125;
const SYNC_INTERVAL = 30 * 60 * 1000;
const SSH_CONFIG_PATH = join(homedir(), ".ssh", "config");
const CONFIG_DIR = join(homedir(), ".config", "dev");
const CONFIG_FILE = join(CONFIG_DIR, "profiles.json");

// --- Config helpers ---

function loadProfileConfig(): ProfileConfig {
  if (existsSync(CONFIG_FILE)) {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  }

  // Auto-migrate from env vars
  const config: ProfileConfig = {
    default_profile: "default",
    profiles: {
      default: {
        name: "default",
        instance_id: process.env.DEV_INSTANCE_ID || "",
        volume_id: process.env.DEV_VOLUME_ID || null,
        region:
          process.env.DEV_AWS_REGION ||
          process.env.AWS_DEFAULT_REGION ||
          "us-west-2",
        ssh_host: process.env.DEV_SSH_HOST || "dev",
        ssh_user: "michael",
        instance_type: "m7i.xlarge",
        setup_script: null,
        setup_completed: true,
      },
    },
  };

  // Migrate existing SSH config block to marker format
  if (existsSync(SSH_CONFIG_PATH)) {
    const sshConfig = readFileSync(SSH_CONFIG_PATH, "utf-8");
    if (!sshConfig.includes("# dev-managed:")) {
      const lines = sshConfig.split("\n");
      const hostIdx = lines.findIndex((l) => /^Host\s+dev\s*$/.test(l));
      if (hostIdx >= 0) {
        let endIdx = hostIdx + 1;
        while (
          endIdx < lines.length &&
          (lines[endIdx].match(/^[\s\t]/) || lines[endIdx].trim() === "")
        ) {
          endIdx++;
        }
        // Trim trailing blank lines within the block
        while (endIdx > hostIdx + 1 && lines[endIdx - 1].trim() === "") {
          endIdx--;
        }
        const blockLines = lines.slice(hostIdx, endIdx);
        lines.splice(
          hostIdx,
          endIdx - hostIdx,
          "# dev-managed: default",
          ...blockLines,
          "# /dev-managed: default"
        );
        writeFileSync(SSH_CONFIG_PATH, lines.join("\n"));
      }
    }
  }

  saveProfileConfig(config);
  console.log("Migrated existing config to ~/.config/dev/profiles.json");
  return config;
}

function saveProfileConfig(config: ProfileConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

function resolveProfile(name?: string): Profile {
  const config = loadProfileConfig();
  const profileName = name || config.default_profile;
  const profile = config.profiles[profileName];
  if (!profile) {
    console.error(`Unknown profile: ${profileName}`);
    console.error(`Available: ${Object.keys(config.profiles).join(", ")}`);
    process.exit(1);
  }
  return profile;
}

// --- SSH config management ---

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateSshConfig(profile: Profile, ip: string): void {
  const marker = `# dev-managed: ${profile.name}`;
  const endMarker = `# /dev-managed: ${profile.name}`;

  const newBlock = [
    marker,
    `Host ${profile.ssh_host}`,
    `    HostName ${ip}`,
    `    User ${profile.ssh_user}`,
    `    IdentityFile ~/.ssh/dev-server-aws.pem`,
    `    StrictHostKeyChecking no`,
    endMarker,
  ].join("\n");

  if (!existsSync(SSH_CONFIG_PATH)) {
    writeFileSync(SSH_CONFIG_PATH, newBlock + "\n");
    return;
  }

  let config = readFileSync(SSH_CONFIG_PATH, "utf-8");
  const markerRegex = new RegExp(
    `${escapeRegex(marker)}\\n[\\s\\S]*?${escapeRegex(endMarker)}`
  );

  if (markerRegex.test(config)) {
    // Update only HostName within existing marker block
    const match = config.match(markerRegex)!;
    const existingBlock = match[0];
    const updatedBlock = existingBlock.replace(
      /(HostName\s+)\S+/,
      `$1${ip}`
    );
    config = config.replace(markerRegex, updatedBlock);
  } else {
    // Add new block at the top
    config = newBlock + "\n\n" + config;
  }

  writeFileSync(SSH_CONFIG_PATH, config);
}

// --- Helpers ---

async function waitForSsh(
  host: string,
  maxRetries = 30,
  interval = 5000
): Promise<void> {
  console.log("Waiting for SSH to be ready...");
  for (let i = 0; i < maxRetries; i++) {
    const { exitCode } =
      await $`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${host} echo "ready"`
        .quiet()
        .nothrow();
    if (exitCode === 0) {
      console.log("SSH is ready.");
      return;
    }
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  console.error("SSH did not become ready in time.");
  process.exit(1);
}

async function runSetupIfNeeded(profile: Profile): Promise<void> {
  if (!profile.setup_script || profile.setup_completed) return;

  console.log(`Running setup script for "${profile.name}"...`);
  const proc = Bun.spawn(
    ["ssh", profile.ssh_host, profile.setup_script],
    { stdin: "inherit", stdout: "inherit", stderr: "inherit" }
  );
  const exitCode = await proc.exited;

  if (exitCode === 0) {
    const config = loadProfileConfig();
    config.profiles[profile.name].setup_completed = true;
    saveProfileConfig(config);
    console.log("Setup completed successfully.");
  } else {
    console.error("Setup script failed (will retry on next connect).");
    process.exit(1);
  }
}

async function syncCreds(profile: Profile, force = false): Promise<void> {
  const cacheFile = join(
    homedir(),
    ".cache",
    `dev-creds-sync-${profile.name}`
  );
  const now = Date.now();

  if (!force && existsSync(cacheFile)) {
    const lastSync = parseInt(readFileSync(cacheFile, "utf-8").trim(), 10);
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
      profile.ssh_host,
      "bash -c 'mkdir -p ~/.claude && cat > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json'",
    ],
    { stdin: "pipe", stderr: "inherit" }
  );
  proc.stdin.write(creds);
  proc.stdin.end();
  const syncExitCode = await proc.exited;

  if (syncExitCode === 0) {
    mkdirSync(join(homedir(), ".cache"), { recursive: true });
    writeFileSync(cacheFile, now.toString());
    console.log("Credentials synced.");
  } else {
    console.error("Warning: Failed to sync credentials");
  }
}

async function getInstanceIp(
  instanceId: string,
  region: string
): Promise<string> {
  const { stdout } =
    await $`aws ec2 describe-instances --instance-ids ${instanceId} --region ${region} --query 'Reservations[0].Instances[0].PublicIpAddress' --output text`.quiet();
  return stdout.toString().trim();
}

async function getInstanceState(
  instanceId: string,
  region: string
): Promise<string> {
  const { stdout } =
    await $`aws ec2 describe-instances --instance-ids ${instanceId} --region ${region} --query 'Reservations[0].Instances[0].State.Name' --output text`
      .quiet()
      .nothrow();
  return stdout.toString().trim() || "unknown";
}

// --- Subcommands ---

const SUBCOMMANDS = [
  "start",
  "stop",
  "status",
  "sync-creds",
  "run",
  "connect",
  "create",
  "list",
];

const main = defineCommand({
  meta: {
    name: "dev",
    version: "3.0.0",
    description: "Multi-profile remote dev server management",
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
      meta: { description: "Start a dev server instance" },
      args: {
        profile: {
          type: "positional",
          description: "Profile name",
          required: false,
        },
      },
      run: async ({ args }) => {
        const p = resolveProfile(args.profile as string | undefined);
        console.log(`Starting EC2 instance for "${p.name}"...`);
        await $`aws ec2 start-instances --instance-ids ${p.instance_id} --region ${p.region}`;
        console.log("Waiting for instance to be running...");
        await $`aws ec2 wait instance-running --instance-ids ${p.instance_id} --region ${p.region}`;

        if (p.volume_id) {
          console.log("Scaling up EBS IOPS...");
          await $`aws ec2 modify-volume --volume-id ${p.volume_id} --iops ${IOPS_HIGH} --throughput ${THROUGHPUT_HIGH} --region ${p.region}`
            .quiet()
            .nothrow();
        }

        const newIp = await getInstanceIp(p.instance_id, p.region);
        if (newIp) {
          updateSshConfig(p, newIp);
          console.log(`SSH config updated with IP: ${newIp}`);
        }

        console.log("Instance started.");
      },
    }),

    stop: defineCommand({
      meta: { description: "Stop a dev server instance" },
      args: {
        profile: {
          type: "positional",
          description: "Profile name",
          required: false,
        },
      },
      run: async ({ args }) => {
        const p = resolveProfile(args.profile as string | undefined);

        if (p.volume_id) {
          console.log("Scaling down EBS IOPS...");
          await $`aws ec2 modify-volume --volume-id ${p.volume_id} --iops ${IOPS_LOW} --throughput ${THROUGHPUT_LOW} --region ${p.region}`
            .quiet()
            .nothrow();
        }

        console.log(`Stopping EC2 instance for "${p.name}"...`);
        await $`aws ec2 stop-instances --instance-ids ${p.instance_id} --region ${p.region}`;
        console.log("Instance stopped (storage at baseline IOPS).");
      },
    }),

    status: defineCommand({
      meta: { description: "Check instance status" },
      args: {
        profile: {
          type: "positional",
          description: "Profile name",
          required: false,
        },
      },
      run: async ({ args }) => {
        const p = resolveProfile(args.profile as string | undefined);

        const { exitCode } =
          await $`ssh -o ConnectTimeout=5 ${p.ssh_host} echo "Connected"`
            .quiet()
            .nothrow();
        console.log(
          exitCode === 0
            ? `✓ SSH to ${p.ssh_host}: reachable`
            : `✗ SSH to ${p.ssh_host}: unreachable`
        );

        const state = await getInstanceState(p.instance_id, p.region);
        console.log(`  EC2 ${p.instance_id}: ${state}`);
      },
    }),

    "sync-creds": defineCommand({
      meta: { description: "Manually sync Claude OAuth credentials" },
      args: {
        profile: {
          type: "positional",
          description: "Profile name",
          required: false,
        },
      },
      run: async ({ args }) => {
        const p = resolveProfile(args.profile as string | undefined);
        await syncCreds(p, true);
      },
    }),

    run: defineCommand({
      meta: { description: "Run a command on the server" },
      args: {
        profileOrCmd: {
          type: "positional",
          description: "Profile name or command",
          required: true,
        },
        cmd: {
          type: "positional",
          description: "Command (when first arg is profile)",
          required: false,
        },
      },
      run: async ({ args }) => {
        const config = loadProfileConfig();
        let profile: Profile;
        let command: string;

        if (args.cmd) {
          // Two positional args: first is profile, second is command
          profile = resolveProfile(args.profileOrCmd as string);
          command = args.cmd as string;
        } else {
          // One arg: check if it's a known profile name
          const maybeProfile = args.profileOrCmd as string;
          if (config.profiles[maybeProfile]) {
            console.error(
              "Missing command. Usage: dev run [profile] <command>"
            );
            process.exit(1);
          }
          profile = resolveProfile();
          command = maybeProfile;
        }

        await $`ssh ${profile.ssh_host} ${command}`;
      },
    }),

    connect: defineCommand({
      meta: { description: "SSH into the dev server" },
      args: {
        profile: {
          type: "positional",
          description: "Profile name",
          required: false,
        },
        n: {
          type: "boolean",
          alias: ["no-tmux"],
          description: "SSH without tmux attach",
        },
      },
      run: async ({ args }) => {
        const p = resolveProfile(args.profile as string | undefined);
        await runSetupIfNeeded(p);
        await syncCreds(p, false);
        if (args.n) {
          await $`ssh -t ${p.ssh_host}`;
        } else {
          await $`ssh -t ${p.ssh_host} "LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 tmux -u new -A -s main"`;
        }
      },
    }),

    list: defineCommand({
      meta: { description: "List all dev server profiles" },
      run: async () => {
        const config = loadProfileConfig();
        const profiles = Object.values(config.profiles);

        if (profiles.length === 0) {
          console.log("No profiles configured.");
          return;
        }

        console.log(
          "Profile".padEnd(15) +
            "Instance".padEnd(22) +
            "Type".padEnd(14) +
            "State".padEnd(12) +
            "Default"
        );
        console.log("-".repeat(70));

        for (const p of profiles) {
          const state = await getInstanceState(p.instance_id, p.region);
          const isDefault = p.name === config.default_profile ? "  *" : "";
          console.log(
            p.name.padEnd(15) +
              p.instance_id.padEnd(22) +
              p.instance_type.padEnd(14) +
              state.padEnd(12) +
              isDefault
          );
        }
      },
    }),

    create: defineCommand({
      meta: { description: "Create a new dev server instance" },
      args: {
        name: {
          type: "positional",
          description: "Profile name",
          required: true,
        },
        "instance-type": {
          type: "string",
          description: "EC2 instance type",
          default: "m7i.xlarge",
        },
        "volume-size": {
          type: "string",
          description: "EBS volume size in GB",
          default: "100",
        },
        "setup-script": {
          type: "string",
          description: "Script to run on first connect",
        },
      },
      run: async ({ args }) => {
        const name = args.name as string;
        const config = loadProfileConfig();

        if (config.profiles[name]) {
          console.error(`Profile "${name}" already exists.`);
          process.exit(1);
        }

        const instanceType = args["instance-type"] as string;
        const volumeSize = parseInt(args["volume-size"] as string, 10);
        const setupScript = (args["setup-script"] as string) || null;
        const region = "us-west-2";

        console.log(
          `Creating dev server "${name}" (${instanceType}, ${volumeSize}GB gp3)...`
        );

        const blockDeviceMappings = JSON.stringify([
          {
            DeviceName: "/dev/sda1",
            Ebs: { VolumeSize: volumeSize, VolumeType: "gp3" },
          },
        ]);
        const tagSpecs = JSON.stringify([
          {
            ResourceType: "instance",
            Tags: [{ Key: "Name", Value: `dev-${name}` }],
          },
        ]);

        const { stdout: runOutput } =
          await $`aws ec2 run-instances --image-id ami-0cf2b4e024cdb6960 --instance-type ${instanceType} --key-name dev-server-key --security-group-ids sg-0f155dd58de85c2ae --subnet-id subnet-0989be4d1cc95616c --block-device-mappings ${blockDeviceMappings} --tag-specifications ${tagSpecs} --region ${region} --output json`.quiet();

        const result = JSON.parse(runOutput.toString());
        const instanceId = result.Instances[0].InstanceId;
        console.log(
          `Instance ${instanceId} launched. Waiting for running state...`
        );

        await $`aws ec2 wait instance-running --instance-ids ${instanceId} --region ${region}`;

        // Get IP and volume ID
        const { stdout: descOutput } =
          await $`aws ec2 describe-instances --instance-ids ${instanceId} --region ${region} --output json`.quiet();
        const desc = JSON.parse(descOutput.toString());
        const inst = desc.Reservations[0].Instances[0];
        const ip = inst.PublicIpAddress;
        const volumeId = inst.BlockDeviceMappings?.[0]?.Ebs?.VolumeId || null;

        const sshHost = `dev-${name}`;
        const profile: Profile = {
          name,
          instance_id: instanceId,
          volume_id: volumeId,
          region,
          ssh_host: sshHost,
          ssh_user: "ubuntu",
          instance_type: instanceType,
          setup_script: setupScript,
          setup_completed: !setupScript,
        };

        config.profiles[name] = profile;
        saveProfileConfig(config);
        updateSshConfig(profile, ip);

        console.log(`Waiting for SSH on ${sshHost} (${ip})...`);
        await waitForSsh(sshHost);

        console.log(`\nProfile "${name}" created successfully.`);
        console.log(`  Instance: ${instanceId}`);
        console.log(`  IP: ${ip}`);
        console.log(`  SSH: ssh ${sshHost}`);
        if (setupScript) {
          console.log(
            `  Setup script will run on first \`dev connect ${name}\``
          );
        }
      },
    }),
  },

  run: async ({ args }) => {
    const subcommandUsed =
      process.argv[2] && SUBCOMMANDS.includes(process.argv[2]);
    if (subcommandUsed) return;

    const p = resolveProfile();
    await syncCreds(p, false);
    if (args.n) {
      await $`ssh -t ${p.ssh_host}`;
    } else {
      await $`ssh -t ${p.ssh_host} "LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 tmux -u new -A -s main"`;
    }
  },
});

runMain(main);
