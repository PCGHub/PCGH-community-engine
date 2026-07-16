# app/auth/ — Authentication Service (Infrastructure)

Per `docs/authentication-architecture.md`: Supabase client wrapper, session resolver (`identity.current_user_id()`), role resolver (`identity.is_admin()`, `identity.user_roles`), and the auth middleware entry point. Owns no business schema. RLS remains the final authorization boundary — this layer is advisory (UX, defense in depth).
