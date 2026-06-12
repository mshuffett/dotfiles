#!/usr/bin/env python3
"""
generate_compose.py — Generate docker-compose.yml from codebase analysis.

Usage:
    python3 generate_compose.py <repo-path> [--output <path>] [--dry-run]

Examples:
    python3 generate_compose.py ~/myproject
    python3 generate_compose.py ~/myproject --output docker-compose.test.yml
    python3 generate_compose.py ~/myproject --dry-run
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML is required: pip install pyyaml")
    sys.exit(1)


# ─── Detection helpers ────────────────────────────────────────────────────────

def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def detect_node(root: Path) -> dict | None:
    pkg = root / "package.json"
    if not pkg.exists():
        return None

    data = read_json(pkg)
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
    scripts = data.get("scripts", {})

    # Package manager
    if (root / "bun.lockb").exists():
        install_cmd, pm = "bun install --frozen-lockfile", "bun"
        start_cmd = scripts.get("start", "bun run start")
    elif (root / "pnpm-lock.yaml").exists():
        install_cmd, pm = "pnpm install --frozen-lockfile", "pnpm"
        start_cmd = scripts.get("start", "pnpm start")
    elif (root / "yarn.lock").exists():
        install_cmd, pm = "yarn install --frozen-lockfile", "yarn"
        start_cmd = scripts.get("start", "yarn start")
    else:
        install_cmd, pm = "npm ci", "npm"
        start_cmd = scripts.get("start", "npm start")

    # Framework
    framework = "node"
    if "next" in deps:
        framework = "nextjs"
    elif "express" in deps:
        framework = "express"
    elif "fastify" in deps:
        framework = "fastify"
    elif "@nestjs/core" in deps:
        framework = "nestjs"

    # Datastores
    datastores = []
    pg_clients = {"pg", "postgres", "pgkit", "@vercel/postgres", "psycopg2", "asyncpg"}
    redis_clients = {"redis", "ioredis", "@vercel/kv", "bullmq", "bull"}
    if pg_clients & set(deps.keys()):
        datastores.append("postgres")
    if redis_clients & set(deps.keys()):
        datastores.append("redis")

    # ORM / migrations
    migration_cmd = None
    if "prisma" in deps:
        migration_cmd = "npx prisma migrate deploy"
    elif "sequelize-cli" in deps:
        migration_cmd = "npx sequelize-cli db:migrate"
    elif "typeorm" in deps:
        migration_cmd = "npx typeorm migration:run -d src/data-source.ts"
    elif "drizzle-kit" in deps:
        migration_cmd = "npx drizzle-kit migrate"
    elif "knex" in deps:
        migration_cmd = "npx knex migrate:latest"

    # Workers
    worker_cmd = None
    if "bullmq" in deps or "bull" in deps:
        worker_cmd = scripts.get("worker", None)

    # Node version
    node_version = data.get("engines", {}).get("node", "20")
    node_version = node_version.replace(">=", "").replace("^", "").replace("~", "").split(".")[0].strip()
    if not node_version.isdigit():
        node_version = "20"

    # Port
    port = 3000

    return {
        "runtime": "node",
        "framework": framework,
        "package_manager": pm,
        "install_cmd": install_cmd,
        "start_cmd": start_cmd,
        "datastores": datastores,
        "migration_cmd": migration_cmd,
        "worker_cmd": worker_cmd,
        "node_version": node_version,
        "port": port,
    }


def detect_python(root: Path) -> dict | None:
    has_python = any([
        (root / "requirements.txt").exists(),
        (root / "Pipfile").exists(),
        (root / "pyproject.toml").exists(),
        (root / "uv.lock").exists(),
        (root / "poetry.lock").exists(),
    ])
    if not has_python:
        return None

    # Package manager
    if (root / "uv.lock").exists():
        install_cmd, pm = "uv sync", "uv"
        run_prefix = "uv run"
    elif (root / "poetry.lock").exists():
        install_cmd, pm = "poetry install --no-dev", "poetry"
        run_prefix = "poetry run"
    elif (root / "Pipfile.lock").exists():
        install_cmd, pm = "pipenv install --deploy", "pipenv"
        run_prefix = "pipenv run"
    else:
        install_cmd, pm = "pip install -r requirements.txt", "pip"
        run_prefix = ""

    # Read deps text for detection
    deps_text = ""
    for fname in ["requirements.txt", "Pipfile", "pyproject.toml"]:
        f = root / fname
        if f.exists():
            deps_text += f.read_text().lower()

    # Framework
    framework = "python"
    start_cmd = f"{run_prefix} gunicorn app:app --bind 0.0.0.0:8000".strip()
    if "django" in deps_text:
        framework = "django"
        start_cmd = f"{run_prefix} python manage.py runserver 0.0.0.0:8000".strip()
    elif "fastapi" in deps_text:
        framework = "fastapi"
        start_cmd = f"{run_prefix} uvicorn app.main:app --host 0.0.0.0 --port 8000".strip()
    elif "flask" in deps_text:
        framework = "flask"
        start_cmd = f"{run_prefix} gunicorn wsgi:app --bind 0.0.0.0:8000".strip()

    datastores = []
    if any(k in deps_text for k in ["psycopg2", "psycopg", "asyncpg", "django.db"]):
        datastores.append("postgres")
    if any(k in deps_text for k in ["redis", "aioredis", "celery"]):
        datastores.append("redis")

    migration_cmd = None
    worker_cmd = None
    if framework == "django":
        migration_cmd = "python manage.py migrate"
    elif "alembic" in deps_text:
        migration_cmd = "alembic upgrade head"
    if "celery" in deps_text:
        worker_cmd = "celery -A app worker --loglevel=info"

    # Python version
    python_version = "3.11"
    pv_file = root / ".python-version"
    if pv_file.exists():
        python_version = pv_file.read_text().strip()

    return {
        "runtime": "python",
        "framework": framework,
        "package_manager": pm,
        "install_cmd": install_cmd,
        "start_cmd": start_cmd,
        "datastores": datastores,
        "migration_cmd": migration_cmd,
        "worker_cmd": worker_cmd,
        "python_version": python_version,
        "port": 8000,
    }


def detect_go(root: Path) -> dict | None:
    go_mod = root / "go.mod"
    if not go_mod.exists():
        return None

    content = go_mod.read_text()
    go_version = "1.22"
    for line in content.splitlines():
        if line.startswith("go "):
            go_version = line.split()[1]
            break

    deps_text = content.lower()
    datastores = []
    if any(k in deps_text for k in ["lib/pq", "jackc/pgx", "jackc/pgconn"]):
        datastores.append("postgres")
    if any(k in deps_text for k in ["go-redis", "redigo"]):
        datastores.append("redis")

    return {
        "runtime": "go",
        "framework": "go",
        "package_manager": "go",
        "install_cmd": "go mod download",
        "start_cmd": "./app",
        "datastores": datastores,
        "migration_cmd": None,
        "worker_cmd": None,
        "go_version": go_version,
        "port": 8080,
    }


def analyze_codebase(root: Path) -> dict:
    """Detect runtime, services, and datastores from codebase."""
    # Existing docker-compose check
    existing_compose = (root / "docker-compose.yml").exists() or (root / "compose.yaml").exists()
    existing_dockerfile = (root / "Dockerfile").exists()

    info = detect_node(root) or detect_python(root) or detect_go(root) or {}

    if not info:
        # Try to infer from Dockerfile
        if existing_dockerfile:
            info = {"runtime": "docker", "port": 3000, "datastores": [], "framework": "unknown"}
        else:
            info = {"runtime": "unknown", "port": 3000, "datastores": [], "framework": "unknown"}

    info["has_dockerfile"] = existing_dockerfile
    info["has_compose"] = existing_compose
    info["root"] = str(root)

    # Scan .env.example for additional env var hints
    for env_file in [".env.example", ".env.sample", ".env.template"]:
        ef = root / env_file
        if ef.exists():
            info["env_example_path"] = str(ef)
            break

    return info


# ─── Compose generation ───────────────────────────────────────────────────────

def build_db_service() -> dict:
    return {
        "image": "postgres:16-alpine",
        "environment": {
            "POSTGRES_DB": "app",
            "POSTGRES_USER": "postgres",
            "POSTGRES_PASSWORD": "postgres",
        },
        "volumes": ["postgres_data:/var/lib/postgresql/data"],
        "ports": ["5432:5432"],
        "healthcheck": {
            "test": ["CMD-SHELL", "pg_isready -U postgres"],
            "interval": "5s",
            "timeout": "5s",
            "retries": 5,
            "start_period": "10s",
        },
        "restart": "unless-stopped",
    }


def build_redis_service() -> dict:
    return {
        "image": "redis:7-alpine",
        "ports": ["6379:6379"],
        "healthcheck": {
            "test": ["CMD", "redis-cli", "ping"],
            "interval": "5s",
            "retries": 5,
        },
        "restart": "unless-stopped",
    }


def build_migrate_service(migration_cmd: str, datastores: list) -> dict:
    env = {}
    if "postgres" in datastores:
        env["DATABASE_URL"] = "postgresql://postgres:postgres@db:5432/app"
    svc = {
        "build": ".",
        "command": migration_cmd,
        "environment": env,
        "restart": "no",
    }
    if "postgres" in datastores:
        svc["depends_on"] = {"db": {"condition": "service_healthy"}}
    return svc


def build_app_depends_on(datastores: list, has_migrate: bool) -> dict:
    deps = {}
    if has_migrate:
        deps["migrate"] = {"condition": "service_completed_successfully"}
    elif "postgres" in datastores:
        deps["db"] = {"condition": "service_healthy"}
    if "redis" in datastores:
        deps["redis"] = {"condition": "service_healthy"}
    return deps


def build_app_environment(info: dict) -> dict:
    env = {}
    if "postgres" in info.get("datastores", []):
        env["DATABASE_URL"] = "postgresql://postgres:postgres@db:5432/app"
    if "redis" in info.get("datastores", []):
        env["REDIS_URL"] = "redis://redis:6379"

    runtime = info.get("runtime")
    if runtime == "node":
        env["NODE_ENV"] = "development"
        env["PORT"] = str(info.get("port", 3000))
    elif runtime == "python":
        env["DJANGO_SETTINGS_MODULE"] = "config.settings.local" if info.get("framework") == "django" else ""
        if not env["DJANGO_SETTINGS_MODULE"]:
            del env["DJANGO_SETTINGS_MODULE"]
    return env


def generate_compose(info: dict) -> dict:
    """Build the docker-compose structure from analysis results."""
    services = {}
    volumes = {}
    datastores = info.get("datastores", [])
    has_migrate = bool(info.get("migration_cmd"))

    # Infrastructure services
    if "postgres" in datastores:
        services["db"] = build_db_service()
        volumes["postgres_data"] = None

    if "redis" in datastores:
        services["redis"] = build_redis_service()

    # Migration one-shot
    if has_migrate:
        services["migrate"] = build_migrate_service(info["migration_cmd"], datastores)

    # App service
    app_env = build_app_environment(info)
    app_deps = build_app_depends_on(datastores, has_migrate)
    port = info.get("port", 3000)

    app_service = {
        "build": ".",
        "ports": [f"{port}:{port}"],
        "environment": app_env,
        "healthcheck": {
            "test": ["CMD-SHELL", f"curl -fs http://localhost:{port}/health || exit 1"],
            "interval": "10s",
            "timeout": "5s",
            "retries": 5,
            "start_period": "30s",
        },
        "restart": "unless-stopped",
    }
    if app_deps:
        app_service["depends_on"] = app_deps

    services["app"] = app_service

    # Worker service
    if info.get("worker_cmd"):
        worker_env = {k: v for k, v in app_env.items()}
        services["worker"] = {
            "build": ".",
            "command": info["worker_cmd"],
            "environment": worker_env,
            "depends_on": {
                **({"db": {"condition": "service_healthy"}} if "postgres" in datastores else {}),
                **({"redis": {"condition": "service_healthy"}} if "redis" in datastores else {}),
            },
            "restart": "unless-stopped",
            }

    compose = {
        "services": services,
    }
    if volumes:
        compose["volumes"] = volumes

    return compose


def generate_env_example(info: dict) -> str:
    lines = ["# Auto-generated .env.example — copy to .env and fill in real values", ""]

    datastores = info.get("datastores", [])
    if datastores:
        lines.append("# ── Datastores (auto-wired by docker-compose) ──────────────────────────────")
    if "postgres" in datastores:
        lines.append("DATABASE_URL=postgresql://postgres:postgres@db:5432/app")
    if "redis" in datastores:
        lines.append("REDIS_URL=redis://redis:6379")

    lines.append("")
    lines.append("# ── Secrets — change before use ──────────────────────────────────────────────")
    lines.append("SECRET_KEY=dev-secret-key-change-in-production")
    lines.append("JWT_SECRET=dev-jwt-secret-change-in-production")

    lines.append("")
    lines.append("# ── External API keys — required for full functionality ──────────────────────")
    lines.append("# OPENAI_API_KEY=sk-...")
    lines.append("# STRIPE_SECRET_KEY=sk_test_...")
    lines.append("# SENDGRID_API_KEY=SG....")

    return "\n".join(lines) + "\n"


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate docker-compose.yml from codebase analysis")
    parser.add_argument("repo_path", help="Path to the repository root")
    parser.add_argument("--output", default="docker-compose.yml", help="Output file path (default: docker-compose.yml)")
    parser.add_argument("--dry-run", action="store_true", help="Print to stdout without writing files")
    parser.add_argument("--env-example", action="store_true", help="Also write .env.example")
    args = parser.parse_args()

    root = Path(args.repo_path).resolve()
    if not root.exists():
        print(f"[ERROR] Path does not exist: {root}")
        sys.exit(1)

    print(f"Analyzing: {root}")
    info = analyze_codebase(root)

    print(f"  Runtime:    {info.get('runtime', 'unknown')}")
    print(f"  Framework:  {info.get('framework', 'unknown')}")
    print(f"  Datastores: {info.get('datastores', [])}")
    print(f"  Port:       {info.get('port', '?')}")
    if info.get("migration_cmd"):
        print(f"  Migrations: {info['migration_cmd']}")
    if info.get("worker_cmd"):
        print(f"  Worker:     {info['worker_cmd']}")
    print()

    compose = generate_compose(info)
    compose_yaml = yaml.dump(compose, default_flow_style=False, sort_keys=False, allow_unicode=True)

    if args.dry_run:
        print("# ── docker-compose.yml ──────────────────────────────────────────────────────")
        print(compose_yaml)
        if args.env_example:
            print("# ── .env.example ────────────────────────────────────────────────────────────")
            print(generate_env_example(info))
    else:
        output_path = Path(args.output) if Path(args.output).is_absolute() else root / args.output
        output_path.write_text(compose_yaml)
        print(f"[OK] Written: {output_path}")

        if args.env_example:
            env_path = root / ".env.example"
            if not env_path.exists():
                env_path.write_text(generate_env_example(info))
                print(f"[OK] Written: {env_path}")
            else:
                print(f"[SKIP] .env.example already exists at {env_path}")

        print()
        print("Next steps:")
        print(f"  docker compose config                   # Validate")
        print(f"  docker compose up -d --build --wait     # Start")
        print(f"  curl http://localhost:{info.get('port', 3000)}/health          # Smoke test")


if __name__ == "__main__":
    main()
