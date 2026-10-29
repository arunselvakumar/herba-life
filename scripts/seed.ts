import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { role, user } from "../src/db/schema";
import { DEFAULT_ROLES } from "../src/db/access-seed";
import { auth } from "../src/lib/auth";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: string;
};

/**
 * Local development accounts. Public sign-up is disabled, so the first
 * administrator has to come from here; everyone else is created from
 * Team → Users inside the app.
 */
const SEED_USERS: readonly SeedUser[] = [
  {
    name: "Admin User",
    email: "admin@herbalife.local",
    password: "Herbalife2026!",
    role: "Administrator",
  },
];

async function ensureRoles(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const seed of DEFAULT_ROLES) {
    const existing = await db.query.role.findFirst({ where: eq(role.name, seed.name) });
    if (existing) {
      ids.set(seed.name, existing.id);
      continue;
    }
    const [created] = await db
      .insert(role)
      .values({ name: seed.name, description: seed.description, isSystem: seed.isSystem, permissions: seed.permissions })
      .returning({ id: role.id });
    if (created) ids.set(seed.name, created.id);
    console.log(`✓ created role ${seed.name}`);
  }
  return ids;
}

async function main(): Promise<void> {
  const ctx = await auth.$context;
  const roles = await ensureRoles();

  for (const seed of SEED_USERS) {
    const existing = await db.query.user.findFirst({
      where: eq(user.email, seed.email),
    });

    if (existing) {
      console.log(`• ${seed.email} already exists, skipping`);
      continue;
    }

    const roleId = roles.get(seed.role);
    if (!roleId) throw new Error(`Unknown role ${seed.role}`);

    // Go through Better Auth's internal adapter so the password hash and the
    // credential account row match exactly what the sign-in endpoint expects.
    const created = await ctx.internalAdapter.createUser(
      {
        name: seed.name,
        email: seed.email,
        emailVerified: true,
        roleId,
        isActive: true,
      },
      { method: "email-password" },
    );

    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: await ctx.password.hash(seed.password),
    });

    console.log(`✓ created ${seed.email} (${seed.role})`);
  }
}

main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
