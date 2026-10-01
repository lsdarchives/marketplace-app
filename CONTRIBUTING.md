# Contributing

## Development Workflow

Use:

**Understand → Design → Implement → Test → Review → Commit → Next Phase**

## Branches

- `main` is the stable integration branch.
- Use focused branches such as `feat/authentication`, `feat/listings`, `feat/auction-engine`, `fix/bid-validation`, or `chore/project-foundation`.

## Commits

Use conventional prefixes:

- `feat:` new functionality
- `fix:` bug fixes
- `chore:` tooling or maintenance
- `docs:` documentation
- `test:` tests
- `refactor:` restructuring
- `perf:` performance
- `security:` security-related changes

## Pull Requests

Explain what changed, why it changed, how it was tested, and any security or architectural implications.

## Security

Never commit credentials or secrets. If a secret is accidentally exposed, treat it as compromised and rotate it immediately.