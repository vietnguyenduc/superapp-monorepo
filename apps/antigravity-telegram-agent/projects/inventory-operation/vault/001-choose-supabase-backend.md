# ADR 001: Choose Supabase as Backend

## Status
Accepted

## Context
The Inventory Operation System requires a backend solution for:
- Database storage (PostgreSQL)
- User authentication
- Real-time data synchronization
- Row-level security
- API access

Options considered:
1. Self-hosted PostgreSQL + custom auth service
2. Firebase (Firestore + Auth)
3. AWS (RDS + Cognito + API Gateway)
4. Supabase (PostgreSQL + Auth + Real-time)

## Decision
Choose Supabase as the backend solution.

## Rationale

### Pros of Supabase
- **Managed PostgreSQL:** Full PostgreSQL features without infrastructure overhead
- **Built-in Authentication:** OAuth, email/password, social logins out-of-the-box
- **Row-Level Security (RLS):** Database-level security policies
- **Real-time Subscriptions:** Built-in WebSocket support for real-time updates
- **TypeScript Support:** Auto-generated TypeScript types from database schema
- **RESTful API:** Auto-generated REST API from database tables
- **Free Tier:** Generous free tier for development and small production use
- **Open Source:** Open-source alternative to Firebase

### Cons of Supabase
- **Vendor Lock-in:** Tied to Supabase infrastructure
- **Limited Control:** Less control compared to self-hosted solution
- **Learning Curve:** Requires learning Supabase-specific features

### Why Not Other Options
- **Self-hosted:** Too much infrastructure overhead for team size
- **Firebase:** NoSQL database not suitable for relational data model
- **AWS:** Overkill for current scale, higher complexity and cost

## Consequences

### Positive
- Faster development time with managed services
- Built-in security with RLS policies
- Real-time features without additional infrastructure
- Type-safe database access with auto-generated types
- Lower operational overhead

### Negative
- Migration effort if switching providers in future
- Limited control over database configuration
- Potential cost increases at scale

### Mitigation
- Keep business logic in service layer to minimize vendor-specific code
- Use standard PostgreSQL features to ease migration
- Monitor costs and have migration plan ready

## Alternatives Considered
- **Self-hosted PostgreSQL:** Rejected due to infrastructure overhead
- **Firebase:** Rejected due to NoSQL limitations
- **AWS:** Rejected due to complexity and cost

## References
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
