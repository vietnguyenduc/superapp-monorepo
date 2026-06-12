# ADR 002 — TypeScript Strict Mode

## Status

**Accepted**

## Context

Inventory app started with TypeScript but not strict mode. Multiple instances of `any` types in service layer and components caused runtime bugs.

## Decision

**Enable TypeScript strict mode for all new code. Gradually refactor existing `any` types.**

Configuration in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Consequences

### Positive
- Catch type errors at compile time
- Better IDE autocomplete and refactoring
- Self-documenting code via types
- Fewer runtime bugs

### Negative
- Slower initial development
- Need to define types for all database responses
- Some third-party libraries may need type declarations

## Related

- `apps/inventory-operation/src/types/database.types.ts`