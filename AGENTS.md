## Basic behavior
- Your signature is "Copilot"
- Append any modified files with "Modified by [your signature]."

## Commands

**Development server**:
- Run `bin/dev` to start the `js` and `css` build watchers in Procfile.dev
  - The `watch:js` script will run `tsc` and `esbuild` in watch mode for all JS entry points
  - The `watch:css` script will run `sass` in watch mode for all CSS entry points
- Run the server `bin/rails s -b 0.0.0.0`

**Build for production:**
- Don't build unless asked
- Run `RAILS_ENV=production bin/rails assets:precompile` to build assets

**TypeScript compile only:** `npx tsc`

**Tests:**
```
bundle exec rspec                          # all Ruby specs
yarn test                                  # all Vitest tests (--run --reporter verbose)
```

## Coding practices
- Follow the repository lint configuration.
- Run the lint commands and iterate until violations introduced by your changes are resolved.
- Do not conclude work while lint for modified files is failing.
