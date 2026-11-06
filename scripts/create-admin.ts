import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { role, user } from "../src/db/schema";
import { DEFAULT_ROLES } from "../src/db/access-seed";
import { auth } from "../src/lib/auth";

/**
 * Provisions the first administrator on a fresh (production) database and
 * nothing else: no demo members, no product catalog. Public sign-up is
 * disabled, so this is how the very first account gets in; everyone else is
 * created from Team → Users inside the app.
 *
 *   DATABASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… bun run scripts/create-admin.ts
 *
 * Re-running is safe: existing roles and an existing user are left alone.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  let adminRoleId: string | undefined;
  for (const seed of DEFAULT_ROLES) {
    const existing = await db.query.role.findFirst({ where: eq(role.name, seed.name), columns: { id: true } });
    if (existing) {
      if (seed.isSystem) adminRoleId = existing.id;
      continue;
    }
    const [created] = await db
      .insert(role)
      .values({ name: seed.name, description: seed.description, isSystem: seed.isSystem, permissions: seed.permissions })
      .returning({ id: role.id });
    if (seed.isSystem) adminRoleId = created?.id;
    console.log(`✓ created role ${seed.name}`);
  }
  if (!adminRoleId) throw new Error("No administrator role");

  const existing = await db.query.user.findFirst({ where: eq(user.email, email), columns: { id: true } });
  if (existing) {
    console.log(`• ${email} already exists, skipping`);
    return;
  }

  // Through Better Auth's adapter so the password hash and credential account
  // match what the sign-in endpoint expects.
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    { name, email, emailVerified: true, roleId: adminRoleId, isActive: true },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await ctx.password.hash(password),
  });
  console.log(`✓ created administrator ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
