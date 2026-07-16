# app/ai/ — AI Service Integration Contract

Per `ADR-016`: the AI Service is a separate, independently deployed Python/FastAPI application — this directory holds the TypeScript-side integration contract for calling it, not its own source code. No shared runtime, process, or codebase with the rest of the Next.js backend. All AI features remain governed by `governance.feature_flags` / `governance.ai_controls` and disabled by default (migration 009 seed data).

The AI Service's own repository location is not yet specified by any approved document — this is a known gap to raise before that service is actually implemented, not something scaffolded here.
