# Privileged Append: Backend Implementation Plan

This folder contains drop-in SQL and Express snippets to add privileged append controls to metriq-api.

## Summary
- `users.is_privileged` (boolean, default false)
- `submissions.restricted_append` (boolean, default false)
- Enforce on `POST /submission/:id/result` (append)
- Expose `isPrivileged` on `GET /user` and `restrictedAppend` on `GET /submission/:id`
- Admin endpoints to toggle both flags

## Steps
1) Apply SQL migration in metriq-api database (see `migrations/20250829_add_privileged_flags.sql`).
2) Update API serializers to include `isPrivileged` and `restrictedAppend` fields.
3) Add middleware guard to append route (see `snippets/append_guard.js`).
4) Add admin routes to toggle flags (see `snippets/admin_routes.js`).
5) Restart API and verify with the curl examples in each snippet.

## Notes
- Keep existing admin/moderator bypass if you already have roles.
- This change is backward-compatible with existing clients; new fields are additive.
- Frontend (`metriq-app`) already prefers these server flags when present.
