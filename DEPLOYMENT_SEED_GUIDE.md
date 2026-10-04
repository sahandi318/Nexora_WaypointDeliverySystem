# Nexora Waypoint - Deployment Seed & Environment Guide

This patch adds one idempotent deployment seed command for the five application roles and production environment templates for the backend and frontend.

## Final seed identities

| Role | User ID | Assignment |
|---|---|---|
| Admin | `ADMIN001` | Global / no outlet or depot |
| Store Manager | `SM001` | `OUT001` |
| Dispatcher | `DSP001` | `PELIYAGODA` |
| Loader | `LDR001` | `PELIYAGODA` |
| Driver | `DRV001` | `PELIYAGODA` |

Emails, names, passwords, and assignment codes are configurable through environment variables. Passwords are never hard-coded into the seed script and are never printed.

## Safe deployment order

1. Configure the real backend production environment values using `backend/.env.production.example` as the template.
2. Configure `frontend/.env.production` or equivalent host variables using `frontend/.env.production.example` before building the frontend.
3. Apply the database migrations:

   ```powershell
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

4. On a brand-new production database, make sure the organizer outlet/depot data has already been imported. The account seed deliberately does **not** fabricate organizer data. It expects `OUT001` and the `PELIYAGODA` depot by default.
5. Create/update the five deployment accounts:

   ```powershell
   npm run seed:deployment-accounts
   ```

6. Build the frontend:

   ```powershell
   cd ../frontend
   npm run build
   ```

## Repeat deployment behavior

The seed is safe to run again. Existing accounts keep their current passwords by default while their role/profile/assignment is synchronized.

To intentionally reset the five seed passwords, set:

```text
SEED_RESET_EXISTING_PASSWORDS=true
```

and provide all five password environment values. Set it back to `false` afterward.

`SEED_MUST_CHANGE_PASSWORD=false` is convenient for a competition/demo deployment. For a stricter real production deployment, set it to `true` before first account creation or an intentional password reset.
