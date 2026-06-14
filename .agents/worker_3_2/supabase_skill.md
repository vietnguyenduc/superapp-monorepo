# Supabase Skill Instructions Copy
(Copied from c:\Vibecoding\superapp-monorepo\.agents\skills\supabase\SKILL.md)

1. Supabase changes frequently — verify against changelog and current docs before implementing.
2. Verify your work.
3. Recover from errors, don't loop.
4. Exposing tables to the Data API.
5. RLS in exposed schemas.
6. Security checklist.
   - Never use user_metadata claims in JWT-based authorization decisions.
   - Deleting a user does not invalidate existing access tokens.
   - If you use app_metadata or auth.jwt() for authorization, remember JWT claims are not always fresh.
   - Never expose the service_role or secret key in public clients.
   - Views bypass RLS by default.
   - UPDATE requires a SELECT policy.
   - Do not put security definer functions in an exposed schema.
   - Storage upsert requires INSERT + SELECT + UPDATE.
