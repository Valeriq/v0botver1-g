# Code Review: Fix Render Build Issues

## Changes
- Updated Dockerfiles for all microservices (`ai-orchestrator`, `core-api`, `gmail-service`, `telegram-bot`, `worker`) to include the shared `tsconfig.service.json`.
- Fixed `services/core-api/tsconfig.json` to correctly extend the shared configuration.
- Verified that all services now pass TypeScript compilation (`tsc --noEmit`).

## Reasoning
The Render logs showed build failures due to missing TypeScript configurations (specifically related to `esModuleInterop` and private identifiers). By ensuring the base configuration is present and correctly inherited, the Docker builds will now succeed.

## Note on Tests
Integration tests were found to be broken due to pre-existing issues (invalid regex in demo tests, path mismatches). These were temporarily investigated but restored to their original state to keep the PR focused on deployment fixes.
