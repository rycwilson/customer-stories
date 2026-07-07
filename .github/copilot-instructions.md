## Project
- Customer Stories (CSP) is a SaaS platform (customerstories.net) for B2B marketing automation. It provides registered users ("Curators") within a Company account with tools to curate, publish, and promote the company's customer success stories. 
- The most likely users of CSP:
  - Those involved with a company's Customer Reference Program
  - TThose with a Customer Success focus
- The architecture is multi-tenant with Company accounts given a custom subdomain e.g. acme.customerstories.net. A single database is shared amongst all accounts. 
- A Company account dashboard includes:
  - Sales CRM integration
  - Survey templates for story contributors (roles such as customer, partner, sales)
  - Story composition controls (third-party video integration, image uploader, HTML editor, highlighted testimonials)
  - Story promotion controls (with underlying Google Ads connection)
  - Story visitor analytics
  - Plugin generator for publishing stories on the company's own website
  - Story tags controls
  - Call-to-action (CTA) element controls
  - User and company profile management

## Stack
- Back End: Ruby 3.4.3; Rails 7.2.2.1; PostgreSQL; server hosted on Render; database hosted on Neon
- Front End: TypeScript; Hotwire (Turbo + Stimulus)
- Tests: RSpec/Capybara/FactoryBot; Vitest
- AWS S3/Cloudfront for static assets and user uploads
- AWS SES for email delivery

## Integrations
- Zapier for importing CRM data
- Google Ads for story promotion

## Directory structure
- Typical Rails structure
- TypeScript sources in `app/typescript`
- Compiled assets in `app/assets/builds`
- Custom stylesheets (for a given company/account) in `app/assets/stylesheets/custom/[account_subdomain]`

## Communication style
- Prefer concise, direct answers
- Avoid sycophancy, favor objectiveness
- Ask clarifying questions when needed
- Use Markdown formatting for explanations and examples
- IGNORE: Conclude all responses with a listing of all files that were read in formulating the response. If all files in a given directory or repository were read, report the directory or repository only.
- IGNORE: Conclude all responses with "Ok then!" 
- Conclude all responses with "My name is Copilot Chat."
