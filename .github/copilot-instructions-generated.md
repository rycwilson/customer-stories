# Copilot Instructions for Customer Stories Platform (CSP)

## Project Overview
- Multi-tenant B2B SaaS platform for customer success stories, built with Ruby on Rails (backend) and TypeScript (frontend).
- Major features: crowdsourcing, curation, publishing, promotion, analytics, and website plugins.
- Key models: `Visitor`, `VisitorSession`, `VisitorAction`, `PageView`, `StoryShare`, `AdwordsCampaign`, `AdwordsAdGroup`, `AdwordsAd`, `AdwordsImage`.

## Architecture & Data Flow
- Rails app structure: business logic in `app/models`, controllers in `app/controllers`, views in `app/views`.
- Frontend assets: TypeScript sources in `app/typescript`, compiled JS/CSS in `app/assets/builds`.
- API integrations: AWS S3/Cloudfront (asset storage/delivery), AWS SES (email), Zapier (automation), Google Ads (ad data).
- Website plugin code and overlays: see `app/assets/javascripts/plugins/` and `app/assets/stylesheets/views/plugins/`.

## Developer Workflows
- **Build assets:**
  - JS: `yarn build:landing-js`, `yarn build:app-js`, `yarn build:stories-js`, etc.
  - CSS: `yarn build:landing-css`, `yarn build:app-css`, `yarn build:stories-css`, etc.
  - Full build: `yarn build` (see `package.json` for details).
- **Watch mode:**
  - JS/CSS: `yarn watch:js` (uses `concurrently` for multiple watch tasks).
- **Testing:**
  - Rails: RSpec (see `spec/` directory).
  - TypeScript: Vitest (see `test` script in `package.json`).
  - JS: Jest (see `jest.config.js`).
- **Debugging:**
  - Use browser dev tools for frontend; Rails logs in `log/` for backend.

## Conventions & Patterns
- **Service objects** for API integrations: see `app/services/`.
- **Frontend plugin architecture:** overlays and plugins are modular, scoped via CSS classes (see `_main.scss` in plugins).
- **Asset pipeline:** custom build scripts (`sass-build.sh`, esbuild commands) for JS/CSS bundling.
- **Naming:**
  - Ruby: snake_case for files, methods, variables.
  - TypeScript/JS: camelCase for variables/functions, PascalCase for classes.
- **Error handling:**
  - Rails: raise exceptions for unexpected errors.
  - JS/TS: use try/catch and bootoast for user notifications.

## Integration Points & External Dependencies
- **AWS S3/Cloudfront:** asset storage/delivery; see README for bucket policies and Cloudfront setup.
- **AWS SES:** email delivery; credentials managed via Rails credentials.
- **Zapier:** automation workflows; see README for integration details.
- **Google Ads:** ad campaign data; models in `app/models`.

## Communication Preferences (for Copilot Chat)
- Prefer concise, direct answers with Markdown formatting.
- Provide step-by-step reasoning for explanations.
- Reference key files/directories when describing patterns.
- Ask clarifying questions if requirements are ambiguous.

---
Contains AI-generated edits.
