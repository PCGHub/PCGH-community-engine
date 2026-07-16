# Notification Domain — Models

Owns: no business schema — consumes the event stream (`analytics.analytics_events`) produced by other domains.

Source: `docs/backend-architecture.md` ("Notification Service"), `docs/domain-architecture.md` ("Notification Domain").

Future delivery/template records (email templates, notification templates) are explicitly future scope per `docs/seed-data.md` ("Future Seed Data") and are not created by this scaffold.

No logic here — type definitions only. See `app/services/notification/` for the Notification Application Service.
