# CLI & TUI Monorepo Skeleton

Monorepo for building CLI (Commander) and TUI (Ink) apps with shared core logic.

## Structure
- `packages/cli`: CLI entry using `commander`.
- `packages/tui`: TUI components using `ink` (React-based).
- `packages/core`: Shared logic & utilities.

## Prerequisites
- Node.js ≥ 18.18
- pnpm ≥ 9

## Install
```bash
pnpm install
```

## Build
```bash
pnpm run build
```

## Run CLI
```bash
node packages/cli/dist/index.js hello YourName
node packages/cli/dist/index.js ui YourName
```

## Dev (watch mode)
```bash
pnpm run dev
```

## Lint / Format
```bash
pnpm run lint
pnpm run format
```
