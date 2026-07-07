## Project
- Goals, Motivation, Scope, Audience, Key Deliverables, Functional Requirements
- Architectural patterns and conventions, naming conventions, code org principles
- Important gem dependencies that shape architectural patterns

## Languages, frameworks

## Services, integrations
- TODO: Define a service object

## Directory structure

## CI/CD

## Coding practices

## Research behavior
- This is meant to prevent reasoning loops:
  - Limit tool calls (including parallel calls) to 5 steps per turn. If the task requires more, report your findings and ask for (a) permission to continue and/or (b) further clarification if needed to narrow the scope.

## Communication style
- There were all moved to user memory: ryan-preferences.md

- Context can be provided implicitly, e.g. asking Copilot to save a set of files as context in session memory. In such cases the Copilot Chat UI won't show the attachments, so ask it to report them:
  - Conclude all responses with a listing of all files that were read in formulating the response. If all files in a given directory were read, report the directory only.