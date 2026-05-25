# Project overview
<!-- Goals, Motivation, Scope, Audience, Key Deliverables, Functional Requirements -->
<!-- Architectural patterns and conventions, naming conventions, code org principles -->
<!-- Important gem dependencies that shape architectural patterns -->
- Customer Stories (CSP) is a SaaS platform (customerstories.net) for B2B marketing automation. It provides registered users within a company umbrella account with tools to curate, publish, and promote the company's customer success stories. 

- The target user of CSP is someone who is responsible for a company's Customer Reference Program. It could also be someone with a Customer Success focus. Or both as part of a cross-functional team. Within the context of CSP the user is referred to as a Curator.

- A company account dashboard includes:
  - Sales CRM integration
  - Survey templates for story contributors (roles such as customer, partner, sales)
  - Story composition controls (third-party video integration, image uploader, HTML editor, highlighted testimonials)
  - Story promotion controls (with underlying Google Ads connection)
  - Story visitor analytics
  - Plugin generator for publishing stories on the company's own website
  - Story tags controls
  - Call-to-action (CTA) element controls
  - User and company profile management

- The architecture is multi-tenant with company accounts given a custom subdomain e.g. acme.customerstories.net. A single database is shared amongst all accounts. 

## Languages, frameworks
- Ruby on Rails server
- PostgreSQL database
- TypeScript/Hotwire client
- RSpec/Capybara and Vitest for testing

## Services, integrations
- AWS S3/Cloudfront (asset storage/delivery)
- AWS SES (email delivery)
- Zapier (automation)
- Google Ads API connection

## Directory structure
- Typical Rails structure
- TypeScript sources in `app/typescript`
- Compiled assets in `app/assets/builds`
- Custom stylesheets (for a given company/account) in `app/assets/stylesheets/custom/[account_subdomain]`
  - 

## CI/CD
- build steps (details forthcoming)
- tests (details forthcoming)
- Server hosted on Render
- Database hosted on Neon

## Coding practices

## Research behavior
<!-- This is meant to prevent reasoning loops... -->
- Limit tool calls (including parallel calls) to 5 steps per turn. If the task requires more, report your findings and ask for permission to continue and/or for further clarification to narrow the scope.

## Communication style
- Prefer concise, direct answers
- Use Markdown formatting for explanations and examples
- Ask clarifying questions when needed
- Don't infer requirements or create workarounds unless asked
- Avoid sycophancy, favor objectiveness
