import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { member, memberCheckin, memberPackage, user } from "@/db/schema";
import type { Member, MemberCheckin, MemberPackage } from "@/db/schema";
import { EXPIRING_SOON_DAYS, FOLLOW_UP_INTERVAL_DAYS } from "./constants";
import { addDays } from "./dates";
import { packageState, type PackageState } from "./format";

export type MemberListRow = Member & {
  latestCheckin: MemberCheckin | null;
  currentPackage: MemberPackage | null;
  packageState: PackageState | null;
};

export type MemberFilter = "all" | "active" | "expiring" | "no-package" | "due";

export type ListMembersParams = {
  q?: string | undefined;
  filter?: MemberFilter | undefined;
  today: string;
};

export async function listMembers({ q, filter = "all", today }: ListMembersParams): Promise<MemberListRow[]> {
  const term = q?.trim();
  const rows = await db.query.member.findMany({
    where: term
      ? or(
          ilike(sql`${member.firstName} || ' ' || ${member.lastName}`, `%${term}%`),
          ilike(member.mobile, `%${term}%`),
          ilike(member.email, `%${term}%`),
          /^\d+$/.test(term) ? eq(member.serialNo, Number(term)) : undefined,
        )
      : undefined,
    with: {
      packages: { orderBy: [desc(memberPackage.startDate)] },
      checkins: { orderBy: [desc(memberCheckin.recordedOn)], limit: 1 },
    },
    orderBy: [asc(member.firstName), asc(member.lastName)],
  });

  const list = rows.map((row) => {
    const { packages, checkins, ...rest } = row;
    const current = pickCurrentPackage(packages, today);
    return {
      ...rest,
      latestCheckin: checkins[0] ?? null,
      currentPackage: current,
      packageState: current ? packageState(current, EXPIRING_SOON_DAYS, today) : null,
    } satisfies MemberListRow;
  });

  const dueBefore = addDays(today, -FOLLOW_UP_INTERVAL_DAYS);
  switch (filter) {
    case "active":
      return list.filter((c) => c.packageState === "active" || c.packageState === "expiring");
    case "expiring":
      return list.filter((c) => c.packageState === "expiring");
    case "no-package":
      return list.filter((c) => !c.currentPackage || c.packageState === "expired");
    case "due":
      return list.filter(
        (c) =>
          (c.packageState === "active" || c.packageState === "expiring") &&
          (!c.latestCheckin || c.latestCheckin.recordedOn <= dueBefore),
      );
    default:
      return list;
  }
}

/**
 * The package that matters right now: the latest active one, falling back to
 * the most recent of any status so the list can show "expired on …".
 */
export function pickCurrentPackage(packages: MemberPackage[], today: string): MemberPackage | null {
  const active = packages.filter((p) => p.status === "active");
  const running = active.find((p) => p.startDate <= today && p.endDate >= today);
  return running ?? active[0] ?? packages[0] ?? null;
}

export type MemberDetail = Member & {
  packages: MemberPackage[];
  checkins: (MemberCheckin & { recordedByUser: { name: string } | null })[];
  createdByUser: { name: string } | null;
};

export async function getMember(id: string): Promise<MemberDetail | null> {
  const row = await db.query.member.findFirst({
    where: eq(member.id, id),
    with: {
      packages: { orderBy: [desc(memberPackage.startDate), desc(memberPackage.createdAt)] },
      checkins: {
        orderBy: [desc(memberCheckin.recordedOn), desc(memberCheckin.createdAt)],
        with: { recordedByUser: { columns: { name: true } } },
      },
      createdByUser: { columns: { name: true } },
    },
  });
  return row ?? null;
}

export type DashboardData = {
  totalMembers: number;
  activePackages: number;
  expiringSoon: number;
  checkinsThisMonth: number;
  newMembersThisMonth: number;
  followUpsDue: MemberListRow[];
  expiringPackages: (MemberPackage & { member: Member })[];
  recentCheckins: (MemberCheckin & { member: Member; recordedByUser: { name: string } | null })[];
};

export async function getDashboardData(today: string): Promise<DashboardData> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const expiringEnd = addDays(today, EXPIRING_SOON_DAYS);

  const [[members], [active], [expiring], [checkins], [newMembers], followUps, expiringPackages, recentCheckins] =
    await Promise.all([
      db.select({ value: count() }).from(member),
      db
        .select({ value: count() })
        .from(memberPackage)
        .where(and(eq(memberPackage.status, "active"), lte(memberPackage.startDate, today), gte(memberPackage.endDate, today))),
      db
        .select({ value: count() })
        .from(memberPackage)
        .where(
          and(
            eq(memberPackage.status, "active"),
            gte(memberPackage.endDate, today),
            lte(memberPackage.endDate, expiringEnd),
          ),
        ),
      db.select({ value: count() }).from(memberCheckin).where(gte(memberCheckin.recordedOn, monthStart)),
      db.select({ value: count() }).from(member).where(gte(member.joinedOn, monthStart)),
      listMembers({ filter: "due", today }),
      db.query.memberPackage.findMany({
        where: and(
          eq(memberPackage.status, "active"),
          gte(memberPackage.endDate, today),
          lte(memberPackage.endDate, expiringEnd),
        ),
        with: { member: true },
        orderBy: [asc(memberPackage.endDate)],
        limit: 8,
      }),
      db.query.memberCheckin.findMany({
        with: { member: true, recordedByUser: { columns: { name: true } } },
        orderBy: [desc(memberCheckin.recordedOn), desc(memberCheckin.createdAt)],
        limit: 8,
      }),
    ]);

  return {
    totalMembers: members?.value ?? 0,
    activePackages: active?.value ?? 0,
    expiringSoon: expiring?.value ?? 0,
    checkinsThisMonth: checkins?.value ?? 0,
    newMembersThisMonth: newMembers?.value ?? 0,
    followUpsDue: followUps.slice(0, 8),
    expiringPackages,
    recentCheckins,
  };
}

export async function memberExists(id: string): Promise<boolean> {
  const [row] = await db.select({ id: member.id }).from(member).where(eq(member.id, id)).limit(1);
  return Boolean(row);
}

// Re-exported so pages can resolve staff names without importing the schema.
export { user, inArray };
