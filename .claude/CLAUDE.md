@/.github/copilot-instructions.md
@/.

<!-- Everything below create by /init (assisted by existing copilot-instructions.md)-->
<!-- TODO: Take this file as guidance and make sure these things appear in copilot instructions-->

<!--
## Project

Customer Stories Platform (CSP) — a multi-tenant B2B SaaS at customerstories.net. Each company account gets a custom subdomain (e.g., `acme.customerstories.net`); all accounts share a single PostgreSQL database. The platform lets "Curators" collect, publish, and promote customer success stories.

Stack: Ruby 3.4.3 / Rails 7.2.2.1 / PostgreSQL / TypeScript + Hotwire (Stimulus + Turbo). Hosted on Render (app) and Neon (database).

## Commands

**Development server** (Procfile.dev — run with `foreman start -f Procfile.dev`):
- `yarn watch:js` — tsc + esbuild in watch mode for all JS entry points
- `yarn watch:css` — sass in watch mode for all CSS entry points

**Build (production-style):**
```
yarn build        # tsc + esbuild for all JS entry points
yarn build:css    # sass for all CSS entry points
```

**TypeScript compile only:** `npx tsc`

**Tests:**
```
bundle exec rspec                          # all Ruby specs
bundle exec rspec spec/path/to/file_spec.rb  # single spec file
yarn test                                  # all Vitest tests (--run --reporter verbose)
```

**Lint:**
```
bundle exec rubocop    # Ruby — must follow .rubocop.yml
```

## Asset Pipeline

TypeScript has a two-step build: `tsc` compiles `app/typescript/src/` → `app/typescript/emit/`, then `esbuild` bundles the emit output → `app/assets/builds/`. Never edit files in `emit/` or `builds/` directly.

Entry points and their output locations:
- `app.ts` → `app/assets/builds/app/bundle.js`
- `landing.ts` → `app/assets/builds/landing/bundle.js`
- `stories/{index,index2,show}.ts` → `app/assets/builds/stories/`
- `adwords_ads/preview.ts` → `app/assets/builds/app/ads_preview/bundle.js`

Custom per-account stylesheets live in `app/assets/stylesheets/custom/[account_subdomain]/`.

## TypeScript Configuration

- `tsconfig.json` — root config; compiles `app/typescript/src/**` → `app/typescript/emit/`; excludes tests
- `app/typescript/test/tsconfig.json` — shim for tsserver directory traversal only (one line)
- `app/typescript/test/tsconfig.test.json` — actual test config (extends root)
- `vitest.config.ts` — points `typecheck.tsconfig` at `tsconfig.test.json`; uses jsdom environment
- Custom type augmentations in `app/typescript/types/`

## Key Architectural Patterns

- **Stimulus controllers** in `app/typescript/src/controllers/` handle all interactive UI. Register in `controllers/application.ts`.
- **Service objects** in `app/services/` wrap external API calls (Google Ads, AWS, etc.).
- **Website plugin** code (embeddable on customer sites): `app/assets/javascripts/plugins/` and `app/assets/stylesheets/views/plugins/`.
- Views use Slim templates (`slim-rails`). ViewComponent is available for component-style views.
- Authentication via Devise + Doorkeeper (OAuth). `pretender` gem allows admin impersonation.

## Dependency Constraints

From `package.json` notes — do not upgrade:
- **jQuery**: stay on 3.x; 4.0.0 breaks multiple libraries
- **bootstrap-switch**: stay on 3.3.4; last version compatible with Bootstrap 3

## Research Behavior

Limit tool calls (including parallel calls) to **5 steps per turn**. If a task requires more, report findings and ask for permission to continue or further clarification to narrow scope.

## Ruby Style

All Ruby code must pass `bundle exec rubocop` per `.rubocop.yml` (inherits `.rubocop_todo.yml`). Line length max is 100. Migrations and `db/schema.rb` are excluded from RuboCop.
-->