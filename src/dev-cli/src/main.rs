use clap::{CommandFactory, Parser, Subcommand};
use clap_complete::{generate, Shell};
use std::fs;
use std::io;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const APP: &str = "dev-server";
const MACHINE: &str = "e827400b0e42e8";
const SYNC_INTERVAL_SECS: u64 = 1800; // 30 minutes

#[derive(Parser)]
#[command(name = "dev")]
#[command(about = "Connect to Fly.io dev server", version, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// SSH without tmux (new shell)
    #[arg(short = 'n', long = "no-tmux", global = true)]
    no_tmux: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the server
    Start,
    /// Stop the server (save credits)
    Stop,
    /// Check server status
    Status,
    /// Manually sync Claude OAuth credentials
    SyncCreds,
    /// Generate shell completions
    Completions {
        /// Shell to generate completions for
        #[arg(value_enum)]
        shell: Shell,
    },
    /// Run arbitrary command on server
    #[command(external_subcommand)]
    Run(Vec<String>),
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Start) => cmd_start(),
        Some(Commands::Stop) => cmd_stop(),
        Some(Commands::Status) => cmd_status(),
        Some(Commands::SyncCreds) => cmd_sync_creds(true),
        Some(Commands::Completions { shell }) => cmd_completions(shell),
        Some(Commands::Run(args)) => cmd_run(&args),
        None => cmd_ssh(cli.no_tmux),
    }
}

fn cmd_start() {
    println!("Starting server...");
    let status = Command::new("fly")
        .args(["machine", "start", MACHINE, "-a", APP])
        .status()
        .expect("Failed to execute fly");

    if status.success() {
        println!("Server started");
    }
}

fn cmd_stop() {
    let status = Command::new("fly")
        .args(["machine", "stop", MACHINE, "-a", APP])
        .status()
        .expect("Failed to execute fly");

    if status.success() {
        println!("Server stopped");
    }
}

fn cmd_status() {
    Command::new("fly")
        .args(["machines", "list", "-a", APP])
        .status()
        .expect("Failed to execute fly");
}

fn cmd_sync_creds(force: bool) {
    let cache_dir = dirs::cache_dir().expect("Could not find cache directory");
    let sync_file = cache_dir.join("dev-server-creds-sync");

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    // Check if we need to sync
    if !force {
        if let Ok(contents) = fs::read_to_string(&sync_file) {
            if let Ok(last_sync) = contents.trim().parse::<u64>() {
                if now - last_sync < SYNC_INTERVAL_SECS {
                    return; // Skip sync, still fresh
                }
            }
        }
    }

    println!("Syncing Claude credentials...");

    // Read credentials from macOS Keychain
    let output = Command::new("security")
        .args(["find-generic-password", "-s", "Claude Code-credentials", "-w"])
        .output();

    let creds = match output {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        _ => {
            eprintln!("Warning: Could not read credentials from Keychain");
            return;
        }
    };

    if creds.is_empty() {
        eprintln!("Warning: Credentials are empty");
        return;
    }

    // Write credentials to server via fly ssh
    let mut child = Command::new("fly")
        .args([
            "ssh", "console",
            "-a", APP,
            "-u", "michael",
            "-C", "bash -c 'cat > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json'",
        ])
        .stdin(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .expect("Failed to spawn fly ssh");

    if let Some(mut stdin) = child.stdin.take() {
        use std::io::Write;
        let _ = stdin.write_all(creds.as_bytes());
    }

    let status = child.wait().expect("Failed to wait on fly ssh");

    if status.success() {
        // Update sync timestamp
        let _ = fs::create_dir_all(&cache_dir);
        let _ = fs::write(&sync_file, now.to_string());
        println!("Credentials synced.");
    } else {
        eprintln!("Warning: Failed to sync credentials");
    }
}

fn cmd_ssh(no_tmux: bool) {
    // Sync credentials before connecting (non-forced)
    cmd_sync_creds(false);

    if no_tmux {
        Command::new("fly")
            .args(["ssh", "console", "-a", APP, "-u", "michael", "--pty"])
            .status()
            .expect("Failed to execute fly ssh");
    } else {
        Command::new("fly")
            .args([
                "ssh", "console",
                "-a", APP,
                "-u", "michael",
                "--pty",
                "-C", "bash -c 'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 exec tmux -u new -A -s main'",
            ])
            .status()
            .expect("Failed to execute fly ssh");
    }
}

fn cmd_run(args: &[String]) {
    let cmd = args.join(" ");
    Command::new("fly")
        .args(["ssh", "console", "-a", APP, "-u", "michael", "-C", &cmd])
        .status()
        .expect("Failed to execute fly ssh");
}

fn cmd_completions(shell: Shell) {
    let mut cmd = Cli::command();
    generate(shell, &mut cmd, "dev", &mut io::stdout());
}
