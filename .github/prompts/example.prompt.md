---
name: example
agent: agent
description: Describe when to use this prompt
---
<!-- agent: /ask|agent|plan/ (or invoke this file from a chat window in the preferred mode) -->

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

<!-- Define the prompt content here. You can include instructions, examples, and any other relevant information to guide the AI's responses. -->

## Context
<!-- What already exists, what files are relevant, what the end state should be -->
<!-- Use #file: references here -->

## Constraints
<!-- What NOT to do, patterns to follow, things to preserve -->
<!-- e.g. "Don't auto-create users — preserve the sign_up_code gate" -->

## Steps
<!-- Ordered, specific, dependency-aware -->
<!-- "Before doing X, read Y to understand the existing pattern" -->

## Verification
<!-- How to confirm it worked — specific, not generic -->
<!-- e.g. "Run bin/rails routes | grep hubspot to confirm callback route exists" -->