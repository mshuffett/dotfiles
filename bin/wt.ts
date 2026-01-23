#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { $ } from "bun";
import { existsSync, cpSync, readdirSync, statSync } from "fs";
import { join, dirname, basename } from "path";

async function findGitRoot(): Promise<string | null> {
  const { stdout, exitCode } = await $`git rev-parse --show-toplevel`.quiet().nothrow();
  if (exitCode !== 0) return null;
  return stdout.toString().trim();
}

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await $`git rev-parse --abbrev-ref HEAD`.quiet();
  return stdout.toString().trim();
}

function copyEnvFiles(source: string, dest: string) {
  // Copy root .env files
  for (const file of readdirSync(source)) {
    if (file.startsWith(".env")) {
      const srcPath = join(source, file);
      const destPath = join(dest, file);
      if (statSync(srcPath).isFile()) {
        cpSync(srcPath, destPath);
        console.log(`  Copied ${file}`);
      }
    }
  }

  // Copy .env files from apps/ and packages/
  for (const dir of ["apps", "packages"]) {
    const dirPath = join(source, dir);
    if (!existsSync(dirPath)) continue;

    for (const subdir of readdirSync(dirPath)) {
      const subdirPath = join(dirPath, subdir);
      if (!statSync(subdirPath).isDirectory()) continue;

      for (const file of readdirSync(subdirPath)) {
        if (file.startsWith(".env")) {
          const srcPath = join(subdirPath, file);
          const destPath = join(dest, dir, subdir, file);
          if (statSync(srcPath).isFile()) {
            cpSync(srcPath, destPath);
            console.log(`  Copied ${dir}/${subdir}/${file}`);
          }
        }
      }
    }
  }
}

const main = defineCommand({
  meta: { name: "wt", version: "1.0.0", description: "Git worktree helper" },
  args: {
    name: { type: "positional", description: "Worktree name", required: false },
    n: { type: "boolean", description: "No auto-cd (just print path)" },
    b: { type: "string", description: "Base branch (defaults to current branch)" },
    l: { type: "boolean", description: "List worktrees" },
    r: { type: "boolean", description: "Remove worktree" },
  },
  run: async ({ args }) => {
    const gitRoot = await findGitRoot();
    if (!gitRoot) {
      console.error("Error: Not in a git repository");
      process.exit(1);
    }

    // Use sibling directory to avoid stale CLAUDE.md copies
    const repoName = basename(gitRoot);
    const worktreesDir = join(dirname(gitRoot), `${repoName}.worktrees`);

    // List worktrees
    if (args.l) {
      await $`git worktree list`;
      return;
    }

    // Need name for create/remove
    if (!args.name) {
      console.error("Error: Worktree name required");
      console.error("Usage: wt <name> [-n] [-b <branch>]");
      console.error("       wt -l");
      console.error("       wt -r <name>");
      process.exit(1);
    }

    // Sanitize name for directory (replace / with -)
    const dirName = args.name.replace(/\//g, "-");
    const worktreePath = join(worktreesDir, dirName);

    // Remove worktree
    if (args.r) {
      if (!existsSync(worktreePath)) {
        console.error(`Error: Worktree '${dirName}' not found at ${worktreePath}`);
        process.exit(1);
      }
      console.log(`Removing worktree: ${worktreePath}`);
      await $`git worktree remove ${worktreePath}`;
      console.log("Done!");
      return;
    }

    // Create worktree
    if (existsSync(worktreePath)) {
      console.error(`Error: Worktree already exists at ${worktreePath}`);
      process.exit(1);
    }

    const baseBranch = args.b || await getCurrentBranch();
    const branchName = args.name; // Keep original name with slashes for branch

    console.log(`Creating worktree:`);
    console.log(`  Path: ${worktreePath}`);
    console.log(`  Branch: ${branchName}`);
    console.log(`  Base: ${baseBranch}`);

    // Create the worktree with new branch from base
    await $`git worktree add ${worktreePath} -b ${branchName} ${baseBranch}`;

    // Copy .env files
    console.log("\nCopying environment files...");
    copyEnvFiles(gitRoot, worktreePath);

    // Install dependencies
    console.log("\nInstalling dependencies...");
    const installResult = await $`cd ${worktreePath} && pnpm install`.nothrow();
    if (installResult.exitCode !== 0) {
      console.error("Warning: pnpm install failed");
    }

    console.log("\nWorktree created successfully!");

    if (args.n) {
      console.log(`\nTo enter: cd ${worktreePath}`);
    } else {
      console.log(`\nEntering worktree (exit shell to return)...`);
      // Spawn interactive shell in worktree
      const shell = process.env.SHELL || "/bin/bash";
      const proc = Bun.spawn([shell], {
        cwd: worktreePath,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      });
      await proc.exited;
    }
  },
});

runMain(main);
