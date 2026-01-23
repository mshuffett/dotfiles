#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { $ } from "bun";
import { existsSync, cpSync, readdirSync, statSync } from "fs";
import { join, dirname, basename } from "path";

// Colors
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

async function findGitRoot(): Promise<string | null> {
  const { stdout, exitCode } = await $`git rev-parse --show-toplevel`.quiet().nothrow();
  if (exitCode !== 0) return null;
  return stdout.toString().trim();
}

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await $`git rev-parse --abbrev-ref HEAD`.quiet();
  return stdout.toString().trim();
}

function copyEnvFiles(source: string, dest: string): number {
  let count = 0;

  // Copy root .env files
  for (const file of readdirSync(source)) {
    if (file.startsWith(".env")) {
      const srcPath = join(source, file);
      const destPath = join(dest, file);
      if (statSync(srcPath).isFile()) {
        cpSync(srcPath, destPath);
        count++;
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
            count++;
          }
        }
      }
    }
  }

  return count;
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
      console.error(red("✗ Not in a git repository"));
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
      console.error(red("✗ Worktree name required\n"));
      console.error(dim("Usage:"));
      console.error(`  wt ${cyan("<name>")}            Create and enter worktree`);
      console.error(`  wt ${cyan("<name>")} -n         Create without entering`);
      console.error(`  wt ${cyan("<name>")} -b ${cyan("<branch>")}  Create from specific branch`);
      console.error(`  wt -l                List worktrees`);
      console.error(`  wt -r ${cyan("<name>")}         Remove worktree`);
      process.exit(1);
    }

    // Sanitize name for directory (replace / with -)
    const dirName = args.name.replace(/\//g, "-");
    const worktreePath = join(worktreesDir, dirName);

    // Remove worktree
    if (args.r) {
      if (!existsSync(worktreePath)) {
        console.error(red(`✗ Worktree '${dirName}' not found at ${worktreePath}`));
        process.exit(1);
      }
      process.stdout.write(dim("Removing worktree..."));
      await $`git worktree remove ${worktreePath}`.quiet();
      console.log(green(" done"));
      return;
    }

    // Create worktree
    if (existsSync(worktreePath)) {
      console.error(red(`✗ Worktree already exists at ${worktreePath}`));
      process.exit(1);
    }

    const baseBranch = args.b || await getCurrentBranch();
    const branchName = args.name; // Keep original name with slashes for branch

    console.log(bold("Creating worktree\n"));
    console.log(`  ${dim("path")}    ${cyan(worktreePath)}`);
    console.log(`  ${dim("branch")}  ${green(branchName)}`);
    console.log(`  ${dim("base")}    ${baseBranch}`);
    console.log();

    // Create the worktree with new branch from base
    process.stdout.write(dim("Creating worktree..."));
    await $`git worktree add ${worktreePath} -b ${branchName} ${baseBranch}`.quiet();
    console.log(green(" done"));

    // Copy .env files
    process.stdout.write(dim("Copying .env files..."));
    const envCount = copyEnvFiles(gitRoot, worktreePath);
    console.log(green(` ${envCount} copied`));

    // Install dependencies
    process.stdout.write(dim("Installing dependencies..."));
    const installResult = await $`cd ${worktreePath} && pnpm install`.quiet().nothrow();
    if (installResult.exitCode !== 0) {
      console.log(yellow(" failed (run manually)"));
    } else {
      console.log(green(" done"));
    }

    console.log(bold(green("\n✓ Ready")));

    if (args.n) {
      console.log(dim(`\ncd ${worktreePath}`));
    } else {
      console.log(dim("\nEntering worktree (exit to return)...\n"));
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
