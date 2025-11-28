## Purpose
Quick, actionable guidance for an AI coding assistant working in this repository.

Focus: be immediately productive — run the system, understand the orchestration, and make small, safe edits that follow project conventions.

## Big-picture architecture (what to know first)
- Entry points:
  - CLI: `src/cli.ts` (`npm run cli` → `tsx src/cli.ts`). Use `create` to run an interactive project generation.
  - Programmatic: `src/index.ts` exports `ProjectManager`, agents, and utilities for tests or automation.
- Orchestration: `src/core/ProjectManager.ts` coordinates the workflow: Requirements → Design → Development → Review → Testing → Finalize. Read this file to understand messaging, revision loops, and save behavior.
- Agents: `src/agents/` contains roles (ProductManager, Designer, Developer, CodeReviewer, Tester). Each agent exposes an `execute(...)` method and returns typed results (see `src/types/index.ts`).
- LLM/service boundary: `src/services/llm.service.ts` is the single place that talks to the LLM (OpenRouter/OpenAI). Keep prompts and model selection here.
- Persistence/output: `src/utils/fileSystem.ts` writes generated projects into `generated-projects/`. Agents produce a `ProjectOutput` (see `src/types/index.ts`) with `files: {path, content}[]` which `FileSystemHelper.createProject` persists.
- Logging: `src/utils/logger.ts` (CommunicationLogger) collects agent messages. Use it to inspect agent conversations and reproduce bugs.

## Key files to inspect for any change
- `src/core/ProjectManager.ts` — primary orchestration and workflow state (revision logic, spinner behavior). Example: review loop uses `maxRevisions` and increments `revisionCount`.
- `src/cli.ts` — interactive entrypoint and helpful examples for command usage and environment checks.
- `src/services/llm.service.ts` — where API calls and model selection happen.
- `src/utils/fileSystem.ts` — how generated files are saved and where paths are rooted (`OUTPUT_DIR` env).
- `src/types/index.ts` — canonical shapes (ProjectRequirements, ProjectOutput, WorkflowState, CodeReviewResult). Use these types when adding/validating data flows.

## Project-specific conventions and gotchas
- Tech-stack defaults are declared in two places: the CLI `ProjectRequirements.techStack` uses PostgreSQL, but `ProjectManager.developmentPhase` uses SQLite in some calls. Pay attention to which techStack value is passed through — prefer values coming from `requirements` when modifying behavior.
- Agents return structured objects (not raw text). For example, Developer returns `ProjectOutput` whose `files` array is used directly by the filesystem helper — never assume file paths or content formats.
- Revision policy: `ProjectManager.maxRevisions` controls review cycles. Changes to review flow must update both the count and user-facing messages.
- Generated projects follow Next.js App Router conventions (see `generated-projects/*` examples). Keep created projects consistent with `README.md` descriptions (App Router, Prisma, Tailwind, etc.).

## How to run (minimal commands)
- Install deps: `npm install`
- Interactive CLI: `npm run cli create` (or `npm run cli create -i "Idea" -r "Reqs"`)
- Check config: `npm run cli config` (validates `OPENROUTER_API_KEY` and shows `OUTPUT_DIR`)
- Dev run (live TypeScript): `npm run dev` (uses `tsx` to run `src/index.ts` in watch mode)
- Build: `npm run build` → `npm start` runs compiled `dist/index.js`

## Environment variables (important)
- `OPENROUTER_API_KEY` — required for LLM calls. `src/cli.ts` and `src/services/llm.service.ts` expect this.
- `DEFAULT_MODEL` — model name (default in README: `openai/gpt-4-turbo`).
- `OUTPUT_DIR` — where generated projects are saved (default: `./generated-projects`).

## Patterns and examples for edits
- When adding/modifying an agent:
  - Add a new file under `src/agents/` implementing an `execute(...)` method.
  - Export it from `src/index.ts` if it should be public.
  - Update `src/types/index.ts` with any new return shapes.
- To change prompts or LLM behavior: edit `src/services/llm.service.ts` only. Keep prompt templates localized and small.
- To add tests or a harness: call `new ProjectManager().createProject(requirements)` with a small `ProjectRequirements` object and a mocked `LLMService`.

## Quick examples (for the assistant)
- Programmatic run example (JS/TS):
  - import { ProjectManager } from './src/core/ProjectManager';
  - const pm = new ProjectManager();
  - await pm.createProject({ idea: 'Todo app', techStack: { frontend:'Next.js', backend:'Next.js API Routes', database:'Postgres', orm:'Prisma' } });
- Look at `generated-projects/contactbook---умная-книга-контактов` for a real generated project structure to match.

## Safety: what to avoid changing without explicit tests
- Low-level persistence in `src/utils/fileSystem.ts` — breaking changes will corrupt output.
- The LLM wrapper interface (`src/services/llm.service.ts`) — altering call/response shapes requires updating many agents.

## Where to look if something fails
- Check `src/utils/logger.ts` output (CommunicationLogger) for agent messages and timestamps.
- Inspect `generated-projects/` for partial outputs and `README.md`/`SETUP.md` inside generated projects.
- `src/core/ProjectManager.ts` shows clear spinner and error messages; read the try/catch blocks for how errors are surfaced.

---
If you'd like, I can (1) add more examples of common edits, (2) merge in any existing internal AGENT.md if you have one, or (3) translate this file to Russian to match repo language. Which would you prefer?
