import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberPackage, packagePlan, type PackagePlan } from "@/db/schema";

export type PlanRow = PackagePlan & { enrolments: number; activeEnrolments: number };

export async function listPlans(): Promise<PlanRow[]> {
  const rows = await db
    .select({
      plan: packagePlan,
      enrolments: count(memberPackage.id),
      activeEnrolments: sql<number>`count(*) filter (where ${memberPackage.status} = 'active')`.mapWith(Number),
    })
    .from(packagePlan)
    .leftJoin(memberPackage, eq(memberPackage.planId, packagePlan.id))
    .groupBy(packagePlan.id)
    .orderBy(asc(packagePlan.sortOrder), asc(packagePlan.durationDays), asc(packagePlan.name));
  return rows.map((r) => ({ ...r.plan, enrolments: r.enrolments, activeEnrolments: r.activeEnrolments }));
}

/** Plans members can currently be enrolled in, shortest first. */
export async function listActivePlans(): Promise<PackagePlan[]> {
  return db.query.packagePlan.findMany({
    where: eq(packagePlan.isActive, true),
    orderBy: [asc(packagePlan.sortOrder), asc(packagePlan.durationDays), asc(packagePlan.name)],
  });
}

export async function getPlan(id: string): Promise<PackagePlan | null> {
  const row = await db.query.packagePlan.findFirst({ where: eq(packagePlan.id, id) });
  return row ?? null;
}
