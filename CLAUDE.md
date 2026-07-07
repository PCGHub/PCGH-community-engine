# PCGH Community Engine

## Project Status

Production Development

Phase 3

Implementation

---

# Project Overview

PCGH (Puricasie Creators Growth Hub) Community Engine is a Creator Discovery and Community Amplification Platform.

PCGH helps creators increase visibility by distributing discovery opportunities across structured communities.

PCGH is NOT:

- Follow-for-follow
- Engagement farming
- Paid engagement
- Click exchange
- Artificial amplification

PCGH focuses on:

- Discovery
- Visibility
- Audience Growth
- Community Participation
- Creator Sustainability

---

# Development Philosophy

Architecture First.

Implementation Second.

Never redesign during implementation.

Implementation must always follow the approved documentation.

If documentation conflicts with code:

Documentation wins.

---

# Documentation Order

Always treat these documents as the source of truth.

docs/

vision.md

business-model.md

architecture.md

system-flow.md

implementation-rules.md

phase-2-roadmap.md

identity-schema.md

economy-schema.md

discovery-schema.md

protection-schema.md

intelligence-schema.md

analytics-schema.md

---

# Database

Database:

Supabase PostgreSQL

Architecture:

Multi-schema

Schemas:

identity

economy

discovery

protection

intelligence

analytics

Future schemas:

notifications

audit

system

ai

---

# Database Rules

Every table must have

id UUID PRIMARY KEY

created_at

updated_at

Use UUID everywhere.

Never use SERIAL.

Foreign keys always reference UUID.

Indexes must exist for:

Foreign Keys

Status columns

Created_at

Search columns

---

# SQL Rules

Write production SQL.

No placeholder SQL.

No TODOs.

No mock tables.

No demo data.

No shortcuts.

---

# Migration Rules

One migration per schema.

Migration names:

001_create_identity.sql

002_create_economy.sql

003_create_discovery.sql

004_create_protection.sql

005_create_intelligence.sql

006_create_analytics.sql

Never modify previous migrations.

Always create new migrations.

---

# Security

Enable Row Level Security.

Create policies.

Least privilege.

No public write access.

Never disable RLS.

---

# Backend

Backend:

Next.js

Supabase

TypeScript

Never use JavaScript.

Always use strict typing.

---

# Frontend

React

TypeScript

Tailwind

Reusable components.

No duplicated UI.

---

# Coding Standards

Readable.

Maintainable.

Modular.

Production quality.

No dead code.

No commented code.

No temporary hacks.

---

# Performance

Optimize queries.

Avoid N+1.

Use indexes.

Paginate large datasets.

Minimize joins.

Prefer RPC when appropriate.

---

# Documentation

Every file created should include:

Purpose

Responsibilities

Relationships

Notes

Future expansion

---

# Testing

Every implementation must compile.

No syntax errors.

No lint errors.

No migration failures.

---

# Git Workflow

Implement

Review

Commit

Push

Never commit broken code.

---

# Role

You are the implementation engineer.

Do not redesign the platform.

Follow the documentation exactly.

If implementation requires clarification, stop and ask.

Never invent business logic.

Never remove approved functionality.

The documentation is the source of truth.
