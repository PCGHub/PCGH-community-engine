# app/repositories/

Thin wrappers around calling `api.*` views, functions, and procedures for a given domain. Never construct SQL or query a business schema directly — the `api` schema is already the data-access contract (`docs/domain-architecture.md`, "Repositories").
