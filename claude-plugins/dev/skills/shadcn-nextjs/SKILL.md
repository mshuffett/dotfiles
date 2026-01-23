---
name: shadcn Next.js Project
description: This skill should be used when the user asks to "create a Next.js project", "scaffold a new Next.js app", "set up a new app with shadcn", "create a project with shadcn/ui", "initialize a Next.js project with shadcn components", or mentions creating new React apps with the nova theme or radix components. Provides the standard project creation workflow using pnpm dlx shadcn create.
version: 0.1.0
---

# shadcn Next.js Project Creation

Create new Next.js projects with shadcn/ui components pre-configured using Michael's preferred preset.

## When to Use

Invoke this skill when creating new Next.js applications that need:
- shadcn/ui component library
- Radix UI primitives
- Nova style with zinc base color
- Lucide icons
- Inter font
- Tailwind CSS configuration

## Project Creation Command

Use this command to scaffold a new Next.js project:

```bash
pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=zinc&theme=zinc&iconLibrary=lucide&font=inter&menuAccent=subtle&menuColor=default&radius=default&template=next" --template next PROJECT_NAME
```

Replace `PROJECT_NAME` with the desired project/directory name.

## Preset Configuration

The preset URL configures:

| Setting | Value | Description |
|---------|-------|-------------|
| base | radix | Radix UI primitives |
| style | nova | Nova design style |
| baseColor | zinc | Zinc color palette |
| theme | zinc | Zinc theme |
| iconLibrary | lucide | Lucide React icons |
| font | inter | Inter font family |
| menuAccent | subtle | Subtle menu accent |
| menuColor | default | Default menu color |
| radius | default | Default border radius |
| template | next | Next.js template |

## Workflow

### Standard Project Creation

1. Navigate to the target directory (e.g., `apps/` in a monorepo)
2. Run the create command with the project name
3. Wait for Next.js project creation and dependency installation
4. Clean up monorepo conflicts if applicable (remove local `pnpm-lock.yaml` and `pnpm-workspace.yaml`)
5. Run `pnpm install` from the monorepo root

### Adding v0 Components

After project creation, add v0-generated components:

```bash
cd PROJECT_NAME
npx shadcn@latest add "URL" --overwrite
```

Use `--overwrite` to replace existing components without prompts.

### Monorepo Integration

When creating in a monorepo:

```bash
# Remove local package manager files
rm pnpm-lock.yaml pnpm-workspace.yaml
rm -rf node_modules

# Install from monorepo root
cd ../..
pnpm install
```

## Adding Components

Add individual shadcn components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card dialog
npx shadcn@latest add --all  # Add all components
```

## File Structure

Created project structure:

```
project-name/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/          # shadcn components
├── lib/
│   └── utils.ts     # cn() utility
├── public/
├── components.json  # shadcn config
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Quick Reference

| Action | Command |
|--------|---------|
| Create project | `pnpm dlx shadcn@latest create --preset "..." --template next NAME` |
| Add component | `npx shadcn@latest add COMPONENT` |
| Add v0 component | `npx shadcn@latest add "URL" --overwrite` |
| Add all components | `npx shadcn@latest add --all` |
| Update components | `npx shadcn@latest diff` |
