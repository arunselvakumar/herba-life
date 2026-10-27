import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { user } from "../src/db/schema";
import { auth } from "../src/lib/auth";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff";
};

/**
 * Local development accounts. Public sign-up is disabled, so this is the only
 * way users get created until an admin UI exists.
 */
const SEED_USERS: readonly SeedUser[] = [
  {
    name: "Admin User",
    email: "admin@herbalife.local",
    password: "Herbalife2026!",
    role: "admin",
  },
];

async function main(): Promise<void> {
  const ctx = await auth.$context;

  for (const seed of SEED_USERS) {
    const existing = await db.query.user.findFirst({
      where: eq(user.email, seed.email),
    });

    if (existing) {
      console.log(`• ${seed.email} already exists, skipping`);
      continue;
    }

    // Go through Better Auth's internal adapter so the password hash and the
    // credential account row match exactly what the sign-in endpoint expects.
    const created = await ctx.internalAdapter.createUser(
      {
        name: seed.name,
        email: seed.email,
        emailVerified: true,
        role: seed.role,
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
