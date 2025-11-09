Architecture overview
This document sketches a cleaned-up architectural direction for VolunteerHubV2.

Top-level folders (target structure)
- src/core: domain logic and business rules
- src/api: abstraction layer for backend API calls
- src/ui: reusable components and design-system primitives
- src/client: frontend app (pages, routing, layout)
- src/server: backend routes/controllers (if using a server bundle)
- src/shared: common types and utilities
- src/hooks: custom React hooks
- src/context: React context providers
- src/utils: small helper utilities
- tests: unit/integration tests

Rationale
- Separate concerns: core domain, data access, and UI live in distinct folders to improve testability and maintainability.
- Easier migration to a more modular monorepo later.

Migration notes
- If you decide to move files, do it incrementally to avoid breaking imports. Update import paths accordingly and run lint/tests after each move.


