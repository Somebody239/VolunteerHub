# Database Schema — VolunteerHub (Full Structure)

This document consolidates the PostgreSQL introspection results you provided. It exports the full structure in a human- and machine-readable format to keep the schema up to date.

**Last Updated:** Based on database introspection and trigger analysis

Sections
- Tables present (by schema)
- Columns (per table) — dumped below; see JSON blocks for complete details
- Primary keys
- Foreign keys
- Indexes
- Views
- Table sizes
- Constraints
- Database Triggers and Functions
- Notes and next steps

Tables present (by schema)
- auth: audit_log_entries, flow_state, identities, instances, mfa_amr_claims, mfa_challenges, mfa_factors, oauth_authorizations, oauth_clients, oauth_consents, one_time_tokens, refresh_tokens, saml_providers, saml_relay_states, schema_migrations, sessions, sso_domains, sso_providers, users
- public: applications, external_applications, gamification, opportunities, organizations, profiles, reports, saved_opportunities, user_badges, user_onboarding, user_progress_history, user_quests, verification_requests
- realtime: messages, schema_migrations, subscription
- storage: buckets, buckets_analytics, migrations, objects, prefixes, s3_multipart_uploads, s3_multipart_uploads_parts
- supabase_migrations: schema_migrations
- vault: secrets
- extensions: pg_stat_statements, pg_stat_statements_info
- vault (views): decrypted_secrets

- public.organizations (table)
```json
[
  { "table_schema": "public", "table_name": "organizations", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "name", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "location", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "website", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "about", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "role", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "verified", "data_type": "boolean", "is_nullable": "YES", "column_default": "false" },
  { "table_schema": "public", "table_name": "organizations", "column_name": "categories", "data_type": "ARRAY", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": "now()" },
  { "table_schema": "public", "table_name": "organizations", "column_name": "mission", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "safety_notes", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "accessibility_notes", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "verification_policy", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "organizations", "column_name": "public_preview_enabled", "data_type": "boolean", "is_nullable": "YES", "column_default": "true" }
]
```

Constraints
Primary key: `public.organizations.id`
Foreign key: `organizations_id_fkey` on (id) referencing `auth.users(id)`

- public.user_onboarding (table)
```json
[
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": "gen_random_uuid()" },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "intended_role", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "onboarding_completed", "data_type": "boolean", "is_nullable": "YES", "column_default": "false" },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "onboarding_skipped", "data_type": "boolean", "is_nullable": "YES", "column_default": "false" },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "tags", "data_type": "text[]", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "preferred_location", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "min_age", "data_type": "integer", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "max_age", "data_type": "integer", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "max_distance_km", "data_type": "integer", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "completed_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "skipped_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": "now()" },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": "now()" }
]
```

Constraints
Primary key: `public.user_onboarding.id`
Foreign key: `user_onboarding_user_id_fkey` on (user_id) referencing `auth.users(id)` ON DELETE CASCADE
 
Onboarding per role
- Students: onboarding fields like `preferred_location`, `min_age`, `max_age`, and `max_distance_km` are optional and will be left null unless explicitly provided. The app should not require organization-related fields for students.
- Organizers: fields such as `preferred_location` can be used to describe the organization’s location, while student-specific fields like school are not applicable. The UI should prompt for organization-related data as needed.
- Constraints
- Primary key: `public.user_onboarding.id`
- Foreign key: `user_onboarding_user_id_fkey` on (user_id) referencing `auth.users(id)` ON DELETE CASCADE

- public.opportunities (table) — updated to match live DB
```json
[
  { "table_schema": "public", "table_name": "opportunities", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": "gen_random_uuid()" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "organizer_id", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "title", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "description", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "category", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "tags", "data_type": "ARRAY", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "address", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "dates", "data_type": "ARRAY", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "times", "data_type": "ARRAY", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "application_type", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "is_active", "data_type": "boolean", "is_nullable": "YES", "column_default": "true" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "start_dt", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "end_dt", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "slots", "data_type": "integer", "is_nullable": "YES", "column_default": null },
  { "table_schema": " public", "table_name": "opportunities", "column_name": "fcfs", "data_type": "boolean", "is_nullable": "YES", "column_default": "false" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "location", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "apply_url", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "contact_email", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "is_deleted", "data_type": "boolean", "is_nullable": "YES", "column_default": "false" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "application_open", "data_type": "boolean", "is_nullable": "YES", "column_default": "true" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "internal_application_enabled", "data_type": "boolean", "is_nullable": "YES", "column_default": "true" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "application_form", "data_type": "jsonb", "is_nullable": "NO", "column_default": "'[]'::jsonb" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "min_age", "data_type": "integer", "is_nullable": "YES", "column_default": null },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "max_age", "data_type": "integer", "is_nullable": "YES", "column_default": null }
]
```
Constraints
- Primary key: `public.opportunities.id`
- Foreign key: `opportunities_organizer_id_fkey` on (organizer_id) referencing `public.organizations(id)` ON DELETE CASCADE

- Columns (per table) — full dump
```json
[
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "instance_id", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "payload", "data_type": "json", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "ip_address", "data_type": "character varying", "is_nullable": "NO", "column_default": "''::character varying" },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "user_id", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "auth_code", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "code_challenge_method", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "code_challenge", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "provider_type", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "provider_access_token", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "provider_refresh_token", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "authentication_method", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "auth_code_issued_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "provider_id", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "identity_data", "data_type": "jsonb", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "provider", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "last_sign_in_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "email", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "identities", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": "gen_random_uuid()" },
  { "table_schema": "auth", "table_name": "instances", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "instances", "column_name": "uuid", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "instances", "column_name": "raw_base_config", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "instances", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "instances", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "session_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "authentication_method", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "factor_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "verified_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "ip_address", "data_type": "inet", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "otp_code", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "web_authn_session_data", "data_type": "jsonb", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "friendly_name", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "factor_type", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "status", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "secret", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "phone", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "last_challenged_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "web_authn_credential", "data_type": "jsonb", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "web_authn_aaguid", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "last_webauthn_challenge_data", "data_type": "jsonb", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "authorization_id", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "client_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "user_id", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "redirect_uri", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "scope", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "state", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "resource", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "code_challenge", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "code_challenge_method", "data_type": "USER-DEFINED", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "response_type", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": "'code'::auth.oauth_response_type" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "status", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "authorization_code", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "expires_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "(now() + '00:03:00'::interval)" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "approved_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "client_secret_hash", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "registration_type", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "redirect_uris", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "grant_types", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "client_name", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "client_uri", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "logo_uri", "data_type": "text", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "updated_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "deleted_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "client_type", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": "'confidential'::auth.oauth_client_type" },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "client_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "scopes", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "granted_at", "data_type": "timestamp with time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "revoked_at", "data_type": "timestamp with time zone", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "token_type", "data_type": "USER-DEFINED", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "token_hash", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "relates_to", "data_type": "text", "is_nullable": "NO", "column_default": null },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "created_at", "data_type": "timestamp without time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "updated_at", "data_type": "timestamp without time zone", "is_nullable": "NO", "column_default": "now()" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "column_name": "instance_id", "data_type": "uuid", "is_nullable": "YES", "column_default": null },
  { "table_schema": "auth", "table_name": "refresh_tokens", "column_name": "id", "data_type": "bigint", "is_nullable": "NO", "column_default": "nextval('auth.refresh_tokens_id_seq'::regclass)" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "column_name": "token", "data_type": "character varying", "is_nullable": "YES", "column_default": null }
]
```

Primary keys
```json
[
  { "table_schema": "auth", "table_name": "audit_log_entries", "column_name": "id" },
  { "table_schema": "auth", "table_name": "flow_state", "column_name": "id" },
  { "table_schema": "auth", "table_name": "identities", "column_name": "id" },
  { "table_schema": "auth", "table_name": "instances", "column_name": "id" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "column_name": "id" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "column_name": "id" },
  { "table_schema": "auth", "table_name": "mfa_factors", "column_name": "id" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "column_name": "id" },
  { "table_schema": "auth", "table_name": "oauth_clients", "column_name": "id" },
  { "table_schema": "auth", "table_name": "oauth_consents", "column_name": "id" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "column_name": "id" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "column_name": "id" },
  { "table_schema": "auth", "table_name": "saml_providers", "column_name": "id" },
  { "table_schema": "auth", "table_name": "saml_relay_states", "column_name": "id" },
  { "table_schema": "auth", "table_name": "sessions", "column_name": "id" },
  { "table_schema": "auth", "table_name": "sso_domains", "column_name": "id" },
  { "table_schema": "auth", "table_name": "sso_providers", "column_name": "id" },
  { "table_schema": "auth", "table_name": "users", "column_name": "id" },
  { "table_schema": "public", "table_name": "applications", "column_name": "id" },
  { "table_schema": "public", "table_name": "external_applications", "column_name": "id" },
  { "table_schema": "public", "table_name": "gamification", "column_name": "id" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "id" },
  { "table_schema": "public", "table_name": "organizations", "column_name": "id" },
  { "table_schema": "public", "table_name": "profiles", "column_name": "id" },
  { "table_schema": "public", "table_name": "reports", "column_name": "id" },
  { "table_schema": "public", "table_name": "saved_opportunities", "column_name": "id" },
  { "table_schema": "public", "table_name": "user_badges", "column_name": "id" },
  { "table_schema": "public", "table_name": "user_onboarding", "column_name": "id" },
  { "table_schema": "public", "table_name": "user_progress_history", "column_name": "id" },
  { "table_schema": "public", "table_name": "user_quests", "column_name": "id" },
  { "table_schema": "public", "table_name": "verification_requests", "column_name": "id" },
  { "table_schema": "realtime", "table_name": "messages", "column_name": "id" },
  { "table_schema": "realtime", "table_name": "messages", "column_name": "inserted_at" },
  { "table_schema": "realtime", "table_name": "schema_migrations", "column_name": "version" },
  { "table_schema": "realtime", "table_name": "subscription", "column_name": "id" },
  { "table_schema": "storage", "table_name": "buckets", "column_name": "id" },
  { "table_schema": "storage", "table_name": "buckets_analytics", "column_name": "id" },
  { "table_schema": "storage", "table_name": "objects", "column_name": "id" },
  { "table_schema": "storage", "table_name": "prefixes", "column_name": "bucket_id" },
  { "table_schema": "storage", "table_name": "prefixes", "column_name": "level" },
  { "table_schema": "storage", "table_name": "prefixes", "column_name": "name" },
  { "table_schema": "storage", "table_name": "s3_multipart_uploads", "column_name": "id" },
  { "table_schema": "storage", "table_name": "s3_multipart_uploads_parts", "column_name": "id" },
  { "table_schema": "supabase_migrations", "table_name": "schema_migrations", "column_name": "version" },
  { "table_schema": "vault", "table_name": "secrets", "column_name": "id" }
]
```

Foreign keys
```json
[
  { "table_schema": "public", "table_name": "applications", "column_name": "opportunity_id", "foreign_table_schema": "public", "foreign_table_name": "opportunities", "foreign_column_name": "id", "update_rule": "NO ACTION", "delete_rule": "CASCADE" },
  { "table_schema": "public", "table_name": "applications", "column_name": "student_id", "foreign_table_schema": "public", "foreign_table_name": "profiles", "foreign_column_name": "user_id", "update_rule": "NO ACTION", "delete_rule": "CASCADE" },
  { "table_schema": "public", "table_name": "gamification", "column_name": "student_id", "foreign_table_schema": "public", "foreign_table_name": "profiles", "foreign_column_name": "user_id", "update_rule": "NO ACTION", "delete_rule": "CASCADE" },
  { "table_schema": "public", "table_name": "opportunities", "column_name": "organizer_id", "foreign_table_schema": "public", "foreign_table_name": "organizations", "foreign_column_name": "id", "update_rule": "NO ACTION", "delete_rule": "CASCADE" },
  { "table_schema": "public", "table_name": "verification_requests", "column_name": "application_id", "foreign_table_schema": "public", "foreign_table_name": "external_applications", "foreign_column_name": "id", "update_rule": "NO ACTION", "delete_rule": "CASCADE" }
]
```

Indexes
```json
[
  { "schemaname": "auth", "indexname": "amr_id_pk", "indexdef": "CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)" },
  { "schemaname": "auth", "indexname": "audit_log_entries_pkey", "indexdef": "CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)" },
  { "schemaname": "auth", "indexname": "audit_logs_instance_id_idx", "indexdef": "CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "confirmation_token_idx", "indexdef": "CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "email_change_token_current_idx", "indexdef": "CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "email_change_token_new_idx", "indexdef": "CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "factor_id_created_at_idx", "indexdef": "CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)" },
  { "schemaname": "auth", "indexname": "flow_state_created_at_idx", "indexdef": "CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "flow_state_pkey", "indexdef": "CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)" },
  { "schemaname": "auth", "indexname": "identities_email_idx", "indexdef": "CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)" },
  { "schemaname": "auth", "indexname": "identities_pkey", "indexdef": "CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)" },
  { "schemaname": "auth", "indexname": "identities_provider_id_provider_unique", "indexdef": "CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)" },
  { "schemaname": "auth", "indexname": "identities_user_id_idx", "indexdef": "CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "idx_auth_code", "indexdef": "CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)" },
  { "schemaname": "auth", "indexname": "idx_user_id_auth_method", "indexdef": "CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)" },
  { "schemaname": "auth", "indexname": "instances_pkey", "indexdef": "CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_amr_claims_session_id_authentication_method_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)" },
  { "schemaname": "auth", "indexname": "mfa_challenge_created_at_idx", "indexdef": "CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "mfa_challenges_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_factors_last_challenged_at_key", "indexdef": "CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)" },
  { "schemaname": "auth", "indexname": "mfa_factors_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_factors_user_friendly_name_unique", "indexdef": "CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)" },
  { "schemaname": "auth", "indexname": "mfa_factors_user_id_idx", "indexdef": "CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "oauth_auth_pending_exp_idx", "indexdef": "CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_authorization_code_key", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_authorization_code_key ON auth.oauth_authorizations USING btree (authorization_code)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_authorization_id_key", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_authorization_id_key ON auth.oauth_authorizations USING btree (authorization_id)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_pkey ON auth.oauth_authorizations USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_clients_deleted_at_idx", "indexdef": "CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)" },
  { "schemaname": "auth", "indexname": "oauth_clients_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_clients_pkey ON auth.oauth_clients USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_active_client_idx", "indexdef": "CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL)" },
  { "schemaname": "auth", "indexname": "oauth_consents_active_user_client_idx", "indexdef": "CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL)" },
  { "schemaname": "auth", "indexname": "oauth_consents_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_consents_pkey ON auth.oauth_consents USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_user_client_unique", "indexdef": "CREATE UNIQUE INDEX oauth_consents_user_client_unique ON auth.oauth_consents USING btree (user_id, client_id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_user_order_idx", "indexdef": "CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_pkey", "indexdef": "CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_relates_to_hash_idx", "indexdef": "CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_token_hash_hash_idx", "indexdef": "CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_user_id_token_type_key", "indexdef": "CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)" },
  { "schemaname": "auth", "indexname": "reauthentication_token_idx", "indexdef": "CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "recovery_token_idx", "indexdef": "CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_instance_id_idx", "indexdef": "CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_instance_id_user_id_idx", "indexdef": "CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_parent_idx", "indexdef": "CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_pkey", "indexdef": "CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_session_id_revoked_idx", "indexdef": "CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_token_unique", "indexdef": "CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_updated_at_idx", "indexdef": "CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)" },
  { "schemaname": "auth", "indexname": "saml_providers_entity_id_key", "indexdef": "CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)" },
  { "schemaname": "auth", "indexname": "saml_providers_pkey", "indexdef": "CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)" },
  { "schemaname": "auth", "indexname": "saml_providers_sso_provider_id_idx", "indexdef": "CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_created_at_idx", "indexdef": "CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_for_email_idx", "indexdef": "CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_pkey", "indexdef": "CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_sso_provider_id_idx", "indexdef": "CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "schema_migrations_pkey", "indexdef": "CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)" },
  { "schemaname": "auth", "indexname": "sessions_not_after_idx", "indexdef": "CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)" },
  { "schemaname": "auth", "indexname": "sessions_oauth_client_id_idx", "indexdef": "CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id)" },
  { "schemaname": "auth", "indexname": "sessions_pkey", "indexdef": "CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)" },
  { "schemaname": "auth", "indexname": "sessions_user_id_idx", "indexdef": "CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "sso_domains_domain_idx", "indexdef": "CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))" },
  { "schemaname": "auth", "indexname": "sso_domains_pkey", "indexdef": "CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)" },
  { "schemaname": "auth", "indexname": "sso_domains_sso_provider_id_idx", "indexdef": "CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "sso_providers_pkey", "indexdef": "CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)" },
  { "schemaname": "auth", "indexname": "sso_providers_resource_id_idx", "indexdef": "CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))" },
  { "schemaname": "auth", "indexname": "sso_providers_resource_id_pattern_idx", "indexdef": "CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)" },
  { "schemaname": "auth", "indexname": "unique_phone_factor_per_user", "indexdef": "CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)" },
  { "schemaname": "auth", "indexname": "user_id_created_at_idx", "indexdef": "CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)" },
  { "schemaname": "auth", "indexname": "users_email_partial_key", "indexdef": "CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)" },
  { "schemaname": "auth", "indexname": "users_instance_id_email_idx", "indexdef": "CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))" },
  { "schemaname": "auth", "indexname": "users_instance_id_idx", "indexdef": "CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "users_is_anonymous_idx", "indexdef": "CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)" },
  { "schemaname": "auth", "indexname": "users_phone_key", "indexdef": "CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)" },
  { "schemaname": "auth", "indexname": "users_pkey", "indexdef": "CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)" },
  { "schemaname": "public", "indexname": "applications_opportunity_id_student_id_key", "indexdef": "CREATE UNIQUE INDEX applications_opportunity_id_student_id_key ON public.applications USING btree (opportunity_id, student_id)" },
  { "schemaname": "public", "indexname": "applications_pkey", "indexdef": "CREATE UNIQUE INDEX applications_pkey ON public.applications USING btree (id)" },
  { "schemaname": "public", "indexname": "external_applications_pkey", "indexdef": "CREATE UNIQUE INDEX external_applications_pkey ON public.external_applications USING btree (id)" },
  { "schemaname": "public", "indexname": "gamification_pkey", "indexdef": "CREATE UNIQUE INDEX gamification_pkey ON public.gamification USING btree (id)" },
  { "schemaname": "public", "indexname": "gamification_student_id_key", "indexdef": "CREATE UNIQUE INDEX gamification_student_id_key ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_applications_opportunity_id", "indexdef": "CREATE INDEX idx_applications_opportunity_id ON public.applications USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_applications_student_id", "indexdef": "CREATE INDEX idx_applications_student_id ON public.applications USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_apps_created_at", "indexdef": "CREATE INDEX idx_apps_created_at ON public.applications USING btree (created_at DESC)" },
  { "schemaname": "public", "indexname": "idx_apps_opportunity_id", "indexdef": "CREATE INDEX idx_apps_opportunity_id ON public.applications USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_apps_opportunity_status", "indexdef": "CREATE INDEX idx_apps_opportunity_status ON public.applications USING btree (opportunity_id, status)" },
  { "schemaname": "public", "indexname": "idx_apps_student_id", "indexdef": "CREATE INDEX idx_apps_student_id ON public.applications USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_external_applications_status", "indexdef": "CREATE INDEX idx_external_applications_status ON public.external_applications USING btree (status)" },
  { "schemaname": "public", "indexname": "idx_external_applications_user_id", "indexdef": "CREATE INDEX idx_external_applications_user_id ON public.external_applications USING btree (user_id)" },
  { "schemaname": "public", "indexname": "idx_gamification_student_id", "indexdef": "CREATE INDEX idx_gamification_student_id ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_gamification_user_id", "indexdef": "CREATE INDEX idx_gamification_user_id ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_opps_created_at", "indexdef": "CREATE INDEX idx_opps_created_at ON public.opportunities USING btree (created_at DESC)" },
  { "schemaname": "public", "indexname": "idx_opps_end_dt", "indexdef": "CREATE INDEX idx_opps_end_dt ON public.opportunities USING btree (end_dt)" },
  { "schemaname": "public", "indexname": "idx_opps_organizer_id", "indexdef": "CREATE INDEX idx_opps_organizer_id ON public.opportunities USING btree (organizer_id)" },
  { "schemaname": "public", "indexname": "idx_opps_start", "indexdef": "CREATE INDEX idx_opps_start ON public.opportunities USING btree (start_dt)" },
  { "schemaname": "public", "indexname": "idx_opps_start_dt", "indexdef": "CREATE INDEX idx_opps_start_dt ON public.opportunities USING btree (start_dt)" },
  { "schemaname": "public", "indexname": "idx_profiles_full_name", "indexdef": "CREATE INDEX idx_profiles_full_name ON public.profiles USING btree (full_name)" },
  { "schemaname": "public", "indexname": "idx_profiles_user_id", "indexdef": "CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id)" },
  { "schemaname": "public", "indexname": "idx_reports_opportunity_id", "indexdef": "CREATE INDEX idx_reports_opportunity_id ON public.reports USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_reports_reported_at", "indexdef": "CREATE INDEX idx_reports_reported_at ON public.reports USING btree (reported_at)" },
  { "schemaname": "public", "indexname": "idx_reports_reporter_user_id", "indexdef": "CREATE INDEX idx_reports_reporter_user_id ON public.reports USING btree (reporter_user_id)" },
  { "schemaname": "public", "indexname": "idx_reports_status", "indexdef": "CREATE INDEX idx_reports_status ON public.reports USING btree (status)" },
  { "schemaname": "public", "indexname": "idx_saved_opportunities_opportunity_id", "indexdef": "CREATE INDEX idx_saved_opportunities_opportunity_id ON public.saved_opportunities USING btree (opportunity_id)" }
]
```

Views
```json
[
  { "table_schema": "extensions", "table_name": "pg_stat_statements", "view_definition": " SELECT userid, ... " },
  { "table_schema": "extensions", "table_name": "pg_stat_statements_info", "view_definition": " SELECT dealloc,\\n    stats_reset\\n   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);" },
  { "table_schema": "public", "table_name": "opportunity_ratings", "view_definition": "SELECT opportunity_id, avg(star_rating)::numeric(10,2) AS avg_rating, count(star_rating) AS ratings_count FROM public.applications WHERE star_rating IS NOT NULL GROUP BY opportunity_id" },
  { "table_schema": "vault", "table_name": "decrypted_secrets", "view_definition": null }
]
```

Table sizes
```json
[
  { "schema": "auth", "table_name": "audit_log_entries", "total_bytes": 270336 },
  { "schema": "auth", "table_name": "users", "total_bytes": 253952 },
  { "schema": "public", "table_name": "opportunities", "total_bytes": 180224 },
  { "schema": "auth", "table_name": "refresh_tokens", "total_bytes": 172032 },
  { "schema": "public", "table_name": "applications", "total_bytes": 147456 },
  { "schema": "auth", "table_name": "sessions", "total_bytes": 139264 },
  { "schema": "auth", "table_name": "identities", "total_bytes": 122880 },
  { "schema": "auth", "table_name": "one_time_tokens", "total_bytes": 114688 },
  { "schema": "public", "table_name": "verification_requests", "total_bytes": 98304 },
  { "schema": "public", "table_name": "user_quests", "total_bytes": 81920 },
  { "schema": "public", "table_name": "user_badges", "total_bytes": 81920 },
  { "schema": "public", "table_name": "saved_opportunities", "total_bytes": 81920 },
  { "schema": "public", "table_name": "gamification", "total_bytes": 81920 },
  { "schema": "auth", "table_name": "mfa_amr_claims", "total_bytes": 81920 },
  { "schema": "public", "table_name": "profiles", "total_bytes": 81920 },
  { "schema": "public", "table_name": "user_onboarding", "total_bytes": 81920 },
  { "schema": "storage", "table_name": "objects", "total_bytes": 65536 },
  { "schema": "public", "table_name": "external_applications", "total_bytes": 65536 },
  { "schema": "auth", "table_name": "mfa_factors", "total_bytes": 57344 },
  { "schema": "public", "table_name": "reports", "total_bytes": 49152 },
  { "schema": "auth", "table_name": "oauth_consents", "total_bytes": 49152 },
  { "schema": "supabase_migrations", "table_name": "schema_migrations", "total_bytes": 49152 },
  { "schema": "public", "table_name": "user_progress_history", "total_bytes": 49152 },
  { "schema": "storage", "table_name": "migrations", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "saml_relay_states", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "flow_state", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "oauth_authorizations", "total_bytes": 40960 },
  { "schema": "realtime", "table_name": "subscription", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "sso_domains", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "sso_providers", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "saml_providers", "total_bytes": 32768 },
  { "schema": "public", "table_name": "organizations", "total_bytes": 32768 },
  { "schema": "vault", "table_name": "secrets", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "oauth_clients", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "schema_migrations", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "prefixes", "total_bytes": 24576 },
  { "schema": "realtime", "table_name": "schema_migrations", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "buckets", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "mfa_challenges", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "s3_multipart_uploads", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "instances", "total_bytes": 16384 },
  { "schema": "storage", "table_name": "buckets_analytics", "total_bytes": 16384 },
  { "schema": "storage", "table_name": "s3_multipart_uploads_parts", "total_bytes": 16384 }
]
```

Constraints
```json
[
  { "table_schema": "auth", "table_name": "audit_log_entries", "constraint_type": "CHECK", "constraint_name": "16494_16525_5_not_null" },
  { "table_schema": "auth", "table_name": "audit_log_entries", "constraint_type": "CHECK", "constraint_name": "16494_16525_2_not_null" },
  { "table_schema": "auth", "table_name": "audit_log_entries", "constraint_type": "PRIMARY KEY", "constraint_name": "audit_log_entries_pkey" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_4_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_6_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_5_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_1_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_3_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "CHECK", "constraint_name": "16494_16927_11_not_null" },
  { "table_schema": "auth", "table_name": "flow_state", "constraint_type": "PRIMARY KEY", "constraint_name": "flow_state_pkey" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "CHECK", "constraint_name": "16494_16725_3_not_null" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "CHECK", "constraint_name": "16494_16725_1_not_null" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "CHECK", "constraint_name": "16494_16725_2_not_null" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "CHECK", "constraint_name": "16494_16725_4_not_null" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "CHECK", "constraint_name": "16494_16725_9_not_null" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "FOREIGN KEY", "constraint_name": "identities_user_id_fkey" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "PRIMARY KEY", "constraint_name": "identities_pkey" },
  { "table_schema": "auth", "table_name": "identities", "constraint_type": "UNIQUE", "constraint_name": "identities_provider_id_provider_unique" },
  { "table_schema": "auth", "table_name": "instances", "constraint_type": "CHECK", "constraint_name": "16494_16518_1_not_null" },
  { "table_schema": "auth", "table_name": "instances", "constraint_type": "PRIMARY KEY", "constraint_name": "instances_pkey" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "CHECK", "constraint_name": "16494_16814_3_not_null" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "CHECK", "constraint_name": "16494_16814_2_not_null" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "CHECK", "constraint_name": "16494_16814_4_not_null" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "CHECK", "constraint_name": "16494_16814_1_not_null" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "CHECK", "constraint_name": "16494_16814_5_not_null" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "FOREIGN KEY", "constraint_name": "mfa_amr_claims_session_id_fkey" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "PRIMARY KEY", "constraint_name": "amr_id_pk" },
  { "table_schema": "auth", "table_name": "mfa_amr_claims", "constraint_type": "UNIQUE", "constraint_name": "mfa_amr_claims_session_id_authentication_method_pkey" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "CHECK", "constraint_name": "16494_16802_3_not_null" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "CHECK", "constraint_name": "16494_16802_5_not_null" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "CHECK", "constraint_name": "16494_16802_1_not_null" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "CHECK", "constraint_name": "16494_16802_2_not_null" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "FOREIGN KEY", "constraint_name": "mfa_challenges_auth_factor_id_fkey" },
  { "table_schema": "auth", "table_name": "mfa_challenges", "constraint_type": "PRIMARY KEY", "constraint_name": "mfa_challenges_pkey" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_2_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_4_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_5_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_6_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_7_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "CHECK", "constraint_name": "16494_16789_1_not_null" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "FOREIGN KEY", "constraint_name": "mfa_factors_user_id_fkey" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "PRIMARY KEY", "constraint_name": "mfa_factors_pkey" },
  { "table_schema": "auth", "table_name": "mfa_factors", "constraint_type": "UNIQUE", "constraint_name": "mfa_factors_last_challenged_at_key" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_scope_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_code_challenge_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_redirect_uri_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_5_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_resource_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_12_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_14_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_1_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_expires_at_future" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_authorization_code_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_2_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_6_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_3_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_11_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "16494_54825_15_not_null" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "CHECK", "constraint_name": "oauth_authorizations_state_length" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "FOREIGN KEY", "constraint_name": "oauth_authorizations_user_id_fkey" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "FOREIGN KEY", "constraint_name": "oauth_authorizations_client_id_fkey" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "PRIMARY KEY", "constraint_name": "oauth_authorizations_pkey" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "UNIQUE", "constraint_name": "oauth_authorizations_authorization_code_key" },
  { "table_schema": "auth", "table_name": "oauth_authorizations", "constraint_type": "UNIQUE", "constraint_name": "oauth_authorizations_authorization_id_key" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_13_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "oauth_clients_logo_uri_length" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "oauth_clients_client_uri_length" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "oauth_clients_client_name_length" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_11_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_10_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_6_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_1_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_4_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "CHECK", "constraint_name": "16494_17159_5_not_null" },
  { "table_schema": "auth", "table_name": "oauth_clients", "constraint_type": "PRIMARY KEY", "constraint_name": "oauth_clients_pkey" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "16494_54858_1_not_null" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "16494_54858_2_not_null" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "oauth_consents_scopes_length" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "oauth_consents_scopes_not_empty" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "16494_54858_3_not_null" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "oauth_consents_revoked_after_granted" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "16494_54858_4_not_null" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "CHECK", "constraint_name": "16494_54858_5_not_null" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "FOREIGN KEY", "constraint_name": "oauth_consents_user_id_fkey" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "FOREIGN KEY", "constraint_name": "oauth_consents_client_id_fkey" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "PRIMARY KEY", "constraint_name": "oauth_consents_pkey" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "UNIQUE", "constraint_name": "oauth_consents_user_client_unique" },
  { "table_schema": "auth", "table_name": "oauth_consents", "constraint_type": "FOREIGN KEY", "constraint_name": "oauth_consents_user_id_fkey" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_4_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_5_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_6_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_2_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "one_time_tokens_token_hash_check" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_7_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_1_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16977_3_not_null" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "FOREIGN KEY", "constraint_name": "one_time_tokens_user_id_fkey" },
  { "table_schema": "auth", "table_name": "one_time_tokens", "constraint_type": "PRIMARY KEY", "constraint_name": "one_time_tokens_pkey" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "constraint_type": "CHECK", "constraint_name": "16494_16507_2_not_null" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "constraint_type": "FOREIGN KEY", "constraint_name": "refresh_tokens_session_id_fkey" },
  { "table_schema": "auth", "table_name": "refresh_tokens", "constraint_type": "PRIMARY KEY", "constraint_name": "refresh_tokens_pkey" }
]
```

Indexes overview (as listed by pg_indexes)
```json
[
  { "schemaname": "auth", "indexname": "amr_id_pk", "indexdef": "CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)" },
  { "schemaname": "auth", "indexname": "audit_log_entries_pkey", "indexdef": "CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)" },
  { "schemaname": "auth", "indexname": "audit_logs_instance_id_idx", "indexdef": "CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "confirmation_token_idx", "indexdef": "CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "email_change_token_current_idx", "indexdef": "CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "email_change_token_new_idx", "indexdef": "CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "factor_id_created_at_idx", "indexdef": "CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)" },
  { "schemaname": "auth", "indexname": "flow_state_created_at_idx", "indexdef": "CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "flow_state_pkey", "indexdef": "CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)" },
  { "schemaname": "auth", "indexname": "identities_email_idx", "indexdef": "CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)" },
  { "schemaname": "auth", "indexname": "identities_pkey", "indexdef": "CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)" },
  { "schemaname": "auth", "indexname": "identities_provider_id_provider_unique", "indexdef": "CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)" },
  { "schemaname": "auth", "indexname": "identities_user_id_idx", "indexdef": "CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "idx_auth_code", "indexdef": "CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)" },
  { "schemaname": "auth", "indexname": "idx_user_id_auth_method", "indexdef": "CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)" },
  { "schemaname": "auth", "indexname": "instances_pkey", "indexdef": "CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_amr_claims_session_id_authentication_method_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)" },
  { "schemaname": "auth", "indexname": "mfa_challenge_created_at_idx", "indexdef": "CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "mfa_challenges_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_factors_last_challenged_at_key", "indexdef": "CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)" },
  { "schemaname": "auth", "indexname": "mfa_factors_pkey", "indexdef": "CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)" },
  { "schemaname": "auth", "indexname": "mfa_factors_user_friendly_name_unique", "indexdef": "CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)" },
  { "schemaname": "auth", "indexname": "mfa_factors_user_id_idx", "indexdef": "CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "oauth_auth_pending_exp_idx", "indexdef": "CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_authorization_code_key", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_authorization_code_key ON auth.oauth_authorizations USING btree (authorization_code)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_authorization_id_key", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_authorization_id_key ON auth.oauth_authorizations USING btree (authorization_id)" },
  { "schemaname": "auth", "indexname": "oauth_authorizations_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_authorizations_pkey ON auth.oauth_authorizations USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_clients_deleted_at_idx", "indexdef": "CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)" },
  { "schemaname": "auth", "indexname": "oauth_clients_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_clients_pkey ON auth.oauth_clients USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_active_client_idx", "indexdef": "CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL)" },
  { "schemaname": "auth", "indexname": "oauth_consents_active_user_client_idx", "indexdef": "CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL)" },
  { "schemaname": "auth", "indexname": "oauth_consents_pkey", "indexdef": "CREATE UNIQUE INDEX oauth_consents_pkey ON auth.oauth_consents USING btree (id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_user_client_unique", "indexdef": "CREATE UNIQUE INDEX oauth_consents_user_client_unique ON auth.oauth_consents USING btree (user_id, client_id)" },
  { "schemaname": "auth", "indexname": "oauth_consents_user_order_idx", "indexdef": "CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_pkey", "indexdef": "CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_relates_to_hash_idx", "indexdef": "CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_token_hash_hash_idx", "indexdef": "CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)" },
  { "schemaname": "auth", "indexname": "one_time_tokens_user_id_token_type_key", "indexdef": "CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)" },
  { "schemaname": "auth", "indexname": "reauthentication_token_idx", "indexdef": "CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "recovery_token_idx", "indexdef": "CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_instance_id_idx", "indexdef": "CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_instance_id_user_id_idx", "indexdef": "CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_parent_idx", "indexdef": "CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_pkey", "indexdef": "CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_session_id_revoked_idx", "indexdef": "CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_token_unique", "indexdef": "CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)" },
  { "schemaname": "auth", "indexname": "refresh_tokens_updated_at_idx", "indexdef": "CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)" },
  { "schemaname": "auth", "indexname": "saml_providers_entity_id_key", "indexdef": "CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)" },
  { "schemaname": "auth", "indexname": "saml_providers_pkey", "indexdef": "CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)" },
  { "schemaname": "auth", "indexname": "saml_providers_sso_provider_id_idx", "indexdef": "CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_created_at_idx", "indexdef": "CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_for_email_idx", "indexdef": "CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_pkey", "indexdef": "CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)" },
  { "schemaname": "auth", "indexname": "saml_relay_states_sso_provider_id_idx", "indexdef": "CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "schema_migrations_pkey", "indexdef": "CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)" },
  { "schemaname": "auth", "indexname": "sessions_not_after_idx", "indexdef": "CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)" },
  { "schemaname": "auth", "indexname": "sessions_oauth_client_id_idx", "indexdef": "CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id)" },
  { "schemaname": "auth", "indexname": "sessions_pkey", "indexdef": "CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)" },
  { "schemaname": "auth", "indexname": "sessions_user_id_idx", "indexdef": "CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)" },
  { "schemaname": "auth", "indexname": "sso_domains_domain_idx", "indexdef": "CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))" },
  { "schemaname": "auth", "indexname": "sso_domains_pkey", "indexdef": "CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)" },
  { "schemaname": "auth", "indexname": "sso_domains_sso_provider_id_idx", "indexdef": "CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)" },
  { "schemaname": "auth", "indexname": "sso_providers_pkey", "indexdef": "CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)" },
  { "schemaname": "auth", "indexname": "sso_providers_resource_id_idx", "indexdef": "CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))" },
  { "schemaname": "auth", "indexname": "sso_providers_resource_id_pattern_idx", "indexdef": "CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)" },
  { "schemaname": "auth", "indexname": "unique_phone_factor_per_user", "indexdef": "CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)" },
  { "schemaname": "auth", "indexname": "user_id_created_at_idx", "indexdef": "CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)" },
  { "schemaname": "auth", "indexname": "users_email_partial_key", "indexdef": "CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)" },
  { "schemaname": "auth", "indexname": "users_instance_id_email_idx", "indexdef": "CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))" },
  { "schemaname": "auth", "indexname": "users_instance_id_idx", "indexdef": "CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)" },
  { "schemaname": "auth", "indexname": "users_is_anonymous_idx", "indexdef": "CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)" },
  { "schemaname": "auth", "indexname": "users_phone_key", "indexdef": "CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)" },
  { "schemaname": "auth", "indexname": "users_pkey", "indexdef": "CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)" },
  { "schemaname": "public", "indexname": "applications_opportunity_id_student_id_key", "indexdef": "CREATE UNIQUE INDEX applications_opportunity_id_student_id_key ON public.applications USING btree (opportunity_id, student_id)" },
  { "schemaname": "public", "indexname": "applications_pkey", "indexdef": "CREATE UNIQUE INDEX applications_pkey ON public.applications USING btree (id)" },
  { "schemaname": "public", "indexname": "external_applications_pkey", "indexdef": "CREATE UNIQUE INDEX external_applications_pkey ON public.external_applications USING btree (id)" },
  { "schemaname": "public", "indexname": "gamification_pkey", "indexdef": "CREATE UNIQUE INDEX gamification_pkey ON public.gamification USING btree (id)" },
  { "schemaname": "public", "indexname": "gamification_student_id_key", "indexdef": "CREATE UNIQUE INDEX gamification_student_id_key ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_applications_opportunity_id", "indexdef": "CREATE INDEX idx_applications_opportunity_id ON public.applications USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_applications_student_id", "indexdef": "CREATE INDEX idx_applications_student_id ON public.applications USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_apps_created_at", "indexdef": "CREATE INDEX idx_apps_created_at ON public.applications USING btree (created_at DESC)" },
  { "schemaname": "public", "indexname": "idx_apps_opportunity_id", "indexdef": "CREATE INDEX idx_apps_opportunity_id ON public.applications USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_apps_opportunity_status", "indexdef": "CREATE INDEX idx_apps_opportunity_status ON public.applications USING btree (opportunity_id, status)" },
  { "schemaname": "public", "indexname": "idx_apps_student_id", "indexdef": "CREATE INDEX idx_apps_student_id ON public.applications USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_external_applications_status", "indexdef": "CREATE INDEX idx_external_applications_status ON public.external_applications USING btree (status)" },
  { "schemaname": "public", "indexname": "idx_external_applications_user_id", "indexdef": "CREATE INDEX idx_external_applications_user_id ON public.external_applications USING btree (user_id)" },
  { "schemaname": "public", "indexname": "idx_gamification_student_id", "indexdef": "CREATE INDEX idx_gamification_student_id ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_gamification_user_id", "indexdef": "CREATE INDEX idx_gamification_user_id ON public.gamification USING btree (student_id)" },
  { "schemaname": "public", "indexname": "idx_opps_created_at", "indexdef": "CREATE INDEX idx_opps_created_at ON public.opportunities USING btree (created_at DESC)" },
  { "schemaname": "public", "indexname": "idx_opps_end_dt", "indexdef": "CREATE INDEX idx_opps_end_dt ON public.opportunities USING btree (end_dt)" },
  { "schemaname": "public", "indexname": "idx_opps_organizer_id", "indexdef": "CREATE INDEX idx_opps_organizer_id ON public.opportunities USING btree (organizer_id)" },
  { "schemaname": "public", "indexname": "idx_opps_start", "indexdef": "CREATE INDEX idx_opps_start ON public.opportunities USING btree (start_dt)" },
  { "schemaname": "public", "indexname": "idx_opps_start_dt", "indexdef": "CREATE INDEX idx_opps_start_dt ON public.opportunities USING btree (start_dt)" },
  { "schemaname": "public", "indexname": "idx_profiles_full_name", "indexdef": "CREATE INDEX idx_profiles_full_name ON public.profiles USING btree (full_name)" },
  { "schemaname": "public", "indexname": "idx_profiles_user_id", "indexdef": "CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id)" },
  { "schemaname": "public", "indexname": "idx_reports_opportunity_id", "indexdef": "CREATE INDEX idx_reports_opportunity_id ON public.reports USING btree (opportunity_id)" },
  { "schemaname": "public", "indexname": "idx_reports_reported_at", "indexdef": "CREATE INDEX idx_reports_reported_at ON public.reports USING btree (reported_at)" },
  { "schemaname": "public", "indexname": "idx_reports_reporter_user_id", "indexdef": "CREATE INDEX idx_reports_reporter_user_id ON public.reports USING btree (reporter_user_id)" },
  { "schemaname": "public", "indexname": "idx_reports_status", "indexdef": "CREATE INDEX idx_reports_status ON public.reports USING btree (status)" },
  { "schemaname": "public", "indexname": "idx_saved_opportunities_opportunity_id", "indexdef": "CREATE INDEX idx_saved_opportunities_opportunity_id ON public.saved_opportunities USING btree (opportunity_id)" }
]
```

Views
```json
[
  { "table_schema": "extensions", "table_name": "pg_stat_statements", "view_definition": " SELECT userid,\\n    dbid,\\n    toplevel,\\n    queryid,\\n    query,\\n    plans,\\n    total_plan_time,\\n    min_plan_time,\\n    max_plan_time,\\n    mean_plan_time,\\n    stddev_plan_time,\\n    calls,\\n    total_exec_time,\\n    min_exec_time,\\n    max_exec_time,\\n    mean_exec_time,\\n    stddev_exec_time,\\n    rows,\\n    shared_blks_hit,\\n    shared_blks_read,\\n    shared_blks_dirtied,\\n    shared_blks_written,\\n    local_blks_hit,\\n    local_blks_read,\\n    local_blks_dirtied,\\n    local_blks_written,\\n    temp_blks_read,\\n    temp_blks_written,\\n    shared_blk_read_time,\\n    shared_blk_write_time,\\n    local_blk_read_time,\\n    local_blk_write_time,\\n    temp_blk_read_time,\\n    temp_blk_write_time,\\n    wal_records,\\n    wal_fpi,\\n    wal_bytes,\\n    jit_functions,\\n    jit_generation_time,\\n    jit_inlining_count,\\n    jit_inlining_time,\\n    jit_optimization_count,\\n    jit_optimization_time,\\n    jit_emission_count,\\n    jit_emission_time,\\n    jit_deform_count,\\n    jit_deform_time,\\n    stats_since,\\n    minmax_stats_since\\n   FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since);\" },
  { "table_schema": "extensions", "table_name": "pg_stat_statements_info", "view_definition": " SELECT dealloc,\\n    stats_reset\\n   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);" },
  { "table_schema": "vault", "table_name": "decrypted_secrets", "view_definition": null }
]
```

Table sizes
```json
[
  { "schema": "auth", "table_name": "audit_log_entries", "total_bytes": 270336 },
  { "schema": "auth", "table_name": "users", "total_bytes": 253952 },
  { "schema": "public", "table_name": "opportunities", "total_bytes": 180224 },
  { "schema": "auth", "table_name": "refresh_tokens", "total_bytes": 172032 },
  { "schema": "public", "table_name": "applications", "total_bytes": 147456 },
  { "schema": "auth", "table_name": "sessions", "total_bytes": 139264 },
  { "schema": "auth", "table_name": "identities", "total_bytes": 122880 },
  { "schema": "auth", "table_name": "one_time_tokens", "total_bytes": 114688 },
  { "schema": "public", "table_name": "verification_requests", "total_bytes": 98304 },
  { "schema": "public", "table_name": "user_quests", "total_bytes": 81920 },
  { "schema": "public", "table_name": "user_badges", "total_bytes": 81920 },
  { "schema": "public", "table_name": "saved_opportunities", "total_bytes": 81920 },
  { "schema": "public", "table_name": "gamification", "total_bytes": 81920 },
  { "schema": "auth", "table_name": "mfa_amr_claims", "total_bytes": 81920 },
  { "schema": "public", "table_name": "profiles", "total_bytes": 81920 },
  { "schema": "public", "table_name": "user_onboarding", "total_bytes": 81920 },
  { "schema": "storage", "table_name": "objects", "total_bytes": 65536 },
  { "schema": "public", "table_name": "external_applications", "total_bytes": 65536 },
  { "schema": "auth", "table_name": "mfa_factors", "total_bytes": 57344 },
  { "schema": "public", "table_name": "reports", "total_bytes": 49152 },
  { "schema": "auth", "table_name": "oauth_consents", "total_bytes": 49152 },
  { "schema": "supabase_migrations", "table_name": "schema_migrations", "total_bytes": 49152 },
  { "schema": "public", "table_name": "user_progress_history", "total_bytes": 49152 },
  { "schema": "storage", "table_name": "migrations", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "saml_relay_states", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "flow_state", "total_bytes": 40960 },
  { "schema": "auth", "table_name": "oauth_authorizations", "total_bytes": 40960 },
  { "schema": "realtime", "table_name": "subscription", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "sso_domains", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "sso_providers", "total_bytes": 32768 },
  { "schema": "auth", "table_name": "saml_providers", "total_bytes": 32768 },
  { "schema": "public", "table_name": "organizations", "total_bytes": 32768 },
  { "schema": "vault", "table_name": "secrets", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "oauth_clients", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "schema_migrations", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "prefixes", "total_bytes": 24576 },
  { "schema": "realtime", "table_name": "schema_migrations", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "buckets", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "mfa_challenges", "total_bytes": 24576 },
  { "schema": "storage", "table_name": "s3_multipart_uploads", "total_bytes": 24576 },
  { "schema": "auth", "table_name": "instances", "total_bytes": 16384 },
  { "schema": "storage", "table_name": "buckets_analytics", "total_bytes": 16384 },
  { "schema": "storage", "table_name": "s3_multipart_uploads_parts", "total_bytes": 16384 }
]
```

Database Triggers and Functions

**Trigger: `on_user_insert`**
- **Table:** `auth.users`
- **Event:** AFTER INSERT
- **Function:** `insert_organization()`
- **Purpose:** Automatically creates an organization record when a user with role='organization' signs up
- **Behavior:** 
  - Checks `raw_user_meta_data->>'role'` to determine if user is an organization
  - Creates organization record with name from `raw_user_meta_data->>'name'` or generates a default
  - Sets `verified = TRUE` for organizations created through the signup flow
  - Only runs for organization role users

**Function: `insert_organization()`**
```sql
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'organization' THEN
    INSERT INTO public.organizations (id, name, verified, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Organization ' || NEW.id::text),
      TRUE,  -- Set verified to TRUE for organizations created through signup
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
```

**Other Triggers:**
- `trg_sync_profiles_user_id`: Syncs `user_id` with `id` in profiles table
- `update_user_onboarding_updated_at`: Auto-updates `updated_at` in user_onboarding
- `update_user_quests_updated_at`: Auto-updates `updated_at` in user_quests

Notes
- The JSON blocks include the exact outputs you pasted and are preserved here for fidelity.
- The `insert_organization()` trigger function has been updated to only create organization records for users with role='organization' in their user_metadata.
- Organization name is read from `raw_user_meta_data->>'name'` during signup.
- Organizations created through the signup flow are automatically set to `verified = TRUE`.
- If you want, I can also export a machine-readable JSON/YAML snapshot to accompany this Markdown file.

Update — Onboarding tags storage (Nov 9, 2025)
- The application no longer attempts to store `onboarding_tags` on `public.profiles` or `public.organizations`.
- Onboarding tags are stored exclusively in `public.user_onboarding.tags` (type `text[]`).
- For students, the UI also writes a deduplicated CSV of tags into `public.profiles.interests` for personalization. This column is optional and can be added if missing.
- For students, only a single `age` is collected and persisted by setting both `min_age` and `max_age` in `public.user_onboarding`. Distance and preferred location are not collected during onboarding (students can filter later).

**Internal vs External Opportunities**
- **Internal**: An opportunity has `internal_application_enabled = TRUE`. These are opportunities managed by organizers through the platform (have an `organizer_id`).
- **External**: An opportunity has `internal_application_enabled = FALSE`. These are opportunities without an organizer (no `organizer_id`).
- The `internal_application_enabled` field is set automatically based on whether the opportunity has an `organizer_id`:
  - Jobs with `organizer_id` (not null) → `internal_application_enabled = TRUE`
  - Jobs without `organizer_id` (null) → `internal_application_enabled = FALSE`
- The `application_open` field is used for internal opportunities to control whether applications are accepted.

**Migration Notes**
- The `link` column has been merged into `apply_url`. All data from `link` has been transferred to `apply_url` where `apply_url` was null or empty, and the `link` column has been dropped.
- The `min_age` field has been extracted from the `requirements` field using regex pattern matching for the first number found.
- The `requirements` column has been removed after data was moved to `min_age`.
- The `internal_application_enabled` field is now automatically set based on `organizer_id`:
  - Jobs with `organizer_id` → `internal_application_enabled = TRUE`
  - Jobs without `organizer_id` → `internal_application_enabled = FALSE`

Next steps
  - I can generate a small Node or Python script to automatically query the database catalogs and write this file in a consistent format, so you can refresh with a single command.
- Do you want me to convert this into a JSON export as docs/DB_SCHEMA.json as well?
