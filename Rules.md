# Backend Architecture Rules

# Core Principles

1. **Feature-Based Modules**
2. **Strict Layered Architecture**
3. **Repository Pattern**
4. **Centralized Validation**
5. **Single Source of Truth for Types**
6. **Consistent API Responses**
7. **Centralized Error Handling**

---

# Layer Architecture

Every feature follows this exact flow:

```txt
Controller → Service → Repository → Database
```

No layer may skip another layer.

---

# Layer Responsibilities

| Layer      | Responsibility                               |
| ---------- | -------------------------------------------- |
| Controller | Parse request, validate input, send response |
| Service    | Business logic                               |
| Repository | Database access                              |
| Validator  | Input validation schemas                     |
| Types      | Shared and inferred types                    |

---

# Project Structure

```txt
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── payments/
│   └── notifications/
│
├── shared/
│   ├── errors/
│   ├── response/
│   ├── constants/
│   └── types/
│
├── middleware/
│
├── lib/
│
└── utils/
```

---

# Module Structure

Each feature module contains:

```txt
feature/
├── feature.controller.ts
├── feature.routes.ts
├── feature.service.ts
├── feature.repository.ts
├── feature.validator.ts
└── feature.types.ts
```

---

# Module Naming & Routing

- Modules must represent domain features, not roles. Examples: `teachers`, `students`, `classes`, `subjects`, `attendance`, `exams`, `marks`, `resources`, `reports`, `auth`, `users`.
- Do NOT create modules named after roles (for example, `admin/`). Role restrictions belong in RBAC policies and service-layer checks or dedicated `roles`/`permissions` modules.
- Use resource-based canonical routes: `/api/teachers`, `/api/classes`, `/api/students`, etc. Keep routes predictable and RESTful.

Migration & Deprecation Guidance

- When migrating from a role-based route (e.g. `/api/admin/teachers`) to a resource route (`/api/teachers`):
  - Add the canonical `/api/<resource>` route first and implement access control in the service layer.
  - Support the legacy alias only temporarily. While it exists, respond with a deprecation header and log accesses for telemetry (example headers: `Deprecation: true`, `Sunset: <RFC-1123 date>`).
  - Update all clients (frontend DAL, external integrations) and documentation to use the canonical route.
  - After a transition window, remove the alias mount and delete any role-named module files that no longer serve a domain purpose.

Example deprecation header (send from the alias middleware):

```
Deprecation: true
Sunset: Tue, 29 Jun 2026 00:00:00 GMT
```

Benefits:

- Keeps the codebase domain-driven and easier to navigate.
- Prevents duplication of concerns (role checks live in one place — auth/roles + service guards).
- Simplifies client APIs and long-term maintenance.

---

# Controller Rules

Controllers should only:

- Parse requests
- Validate input
- Call services
- Return responses

Controllers should NOT:

- Access the database
- Contain business logic
- Handle transactions

```ts
// ✅ GOOD
const input = createSchema.parse(req.body);

const result = await service.create(input);

return ok(res, result);
```

```ts
// ❌ BAD
const item = await prisma.item.create(...);
```

---

# Service Rules

Services contain business logic only.

## Services May

- Coordinate repositories
- Handle permissions
- Handle calculations
- Handle workflows

## Services May NOT

- Access HTTP objects
- Send responses
- Access the database directly

```ts
// ✅ GOOD
const existingUser = await repository.findByEmail(email);
```

---

# Repository Rules

Repositories are the only layer allowed to access the database.

```ts
// ✅ GOOD
export async function findById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}
```

```ts
// ❌ BAD
export class UserService {
  async getUser() {
    return db.user.findUnique(...);
  }
}
```

---

# Validation Rules

Validation belongs in controllers.

Use schema validation as the single source of truth.

```ts
// ✅ GOOD
const input = createSchema.parse(req.body);
```

Never pass raw request data into services.

---

# Types Rules

## Input Types

Infer input types from validation schemas whenever possible.

```ts
export type CreateInput = z.infer<typeof createSchema>;
```

Avoid duplicating schema definitions manually.

---

## Database Types

Use database-generated types inside repositories.

Avoid recreating database models manually.

---

# Response Rules

All responses should follow a consistent structure.

## Success

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "...",
  "code": "...",
  "details": []
}
```

---

# Response Helpers

Use centralized response helpers.

```ts
return ok(res, data);

return created(res, data);

return noContent(res);
```

Never manually structure API responses repeatedly.

---

# Error Handling

Use centralized error middleware.

Throw typed application errors.

```ts
throw new UnauthorizedError();

throw new ConflictError("Already exists");
```

Never manually format errors in controllers.

---

# Transactions

Transactions belong in repositories.

```ts
return db.transaction(async () => {
  ...
});
```

Services should not manage database transactions directly.

---

# Naming Conventions

## Files

Use kebab-case.

```txt
auth.service.ts
user.repository.ts
payment.controller.ts
```

---

## Classes

Use PascalCase.

```ts
AuthService;
UserController;
PaymentRepository;
```

---

## Functions

Use camelCase.

```ts
findUserByEmail;
createPayment;
verifyAccess;
```

---

# Data Flow

```txt
Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

Never skip layers.
