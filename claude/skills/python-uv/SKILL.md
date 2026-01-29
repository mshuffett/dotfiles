---
description: Use when working with Python projects, installing packages, or creating virtual environments. Use uv instead of pip.
---

# Python with uv

Always use `uv` instead of `pip` for Python package management.

## Virtual Environments

```bash
# Create venv in project root
uv venv

# Activate
source .venv/bin/activate
```

## Installing Packages

```bash
# Install a package
uv pip install <package>

# Install from requirements.txt
uv pip install -r requirements.txt

# Install multiple packages
uv pip install fastapi uvicorn pydantic
```

## Project Setup (with pyproject.toml)

```bash
# Initialize new project
uv init

# Add dependencies
uv add <package>

# Add dev dependencies
uv add --dev pytest ruff

# Sync dependencies
uv sync
```

## Running Scripts

```bash
# Run a script with dependencies
uv run python script.py

# Run with inline dependencies
uv run --with requests python script.py
```

## Why uv?

- 10-100x faster than pip
- Built-in venv management
- Lockfile support
- Drop-in pip replacement

## Acceptance Checks

- [ ] Used `uv venv` instead of `python -m venv`
- [ ] Used `uv pip install` instead of `pip install`
- [ ] Virtual environment created in project root as `.venv`
