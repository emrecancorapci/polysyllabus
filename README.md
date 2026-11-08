# PolySyllabus

A personal study tool that renders structured, Coursera-style courses from validated MDX content — equations, circuit figures, Bode plots, interactive playgrounds, and quizzes, with progress tracked locally.

Course material is produced by a separate pipeline and organized by taxonomy (`category → subCategory → course`, e.g. `Tech → Electronics → DC Circuits` or `Philosophy → Political Philosophy → Communism`). The content format is independent of this frontend; see [`docs/lesson-authoring.md`](docs/lesson-authoring.md).

## Quick start

```sh
pnpm install
pnpm exec playwright install chromium   # once, for build-time Mermaid rendering
pnpm dev
```

| Command          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Dev server (use `astro dev --background`)                |
| `pnpm build`     | Production build (validates all content against schemas) |
| `pnpm preview`   | Serve the built site                                     |
| `pnpm lint`      | ESLint (type-aware) + Biome                              |
| `pnpm format`    | Biome formatting                                         |
| `pnpm typecheck` | `astro check`                                            |

## Documentation

- [`AGENTS.md`](AGENTS.md) — repo conventions for agents and humans
- [`docs/lesson-authoring.md`](docs/lesson-authoring.md) — how courses and lessons are authored
- [`docs/content-components.md`](docs/content-components.md) — the MDX component contract
- [`docs/plan/`](docs/plan/) — sprint plans and status

## Stack

Astro · MDX · React islands · Tailwind CSS · shadcn/ui · KaTeX · Mermaid (build-time) · Observable Plot · mathjs · Zod-validated content
