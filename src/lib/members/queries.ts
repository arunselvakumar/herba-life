import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { member, memberCheckin, memberPackage, user } from "@/db/schema";
import type { Member, MemberCheckin, MemberPackage } from "@/db/schema";
import { FOLLOW_UP_INTERVAL_DAYS, LOW_VISITS_THRESHOLD } from "./constants";
import { addDays } from "./dates";
import { packageState, pickCurrentPackage, type PackageState } from "./format";
import { inUseOn, usableOn, visitsLeftSql } from "./package-sql";

export type MemberListRow = Member & {
  latestCheckin: MemberCheckin | null;
  currentPackage: MemberPackage | null;
  packageState: PackageState | null;
};

export type MemberFilter = "all" | "active" | "low" | "no-package" | "due";

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
      packageState: current ? packageState(current, LOW_VISITS_THRESHOLD, today) : null,
    } satisfies MemberListRow;
  });

  const dueBefore = addDays(today, -FOLLOW_UP_INTERVAL_DAYS);
  switch (filter) {
    case "active":
      return list.filter((c) => c.packageState === "active" || c.packageState === "low");
    case "low":
      return list.filter((c) => c.packageState === "low");
    case "no-package":
      return list.filter((c) => !c.currentPackage || c.packageState === "used_up");
    case "due":
      return list.filter(
        (c) =>
          (c.packageState === "active" || c.packageState === "low") &&
          (!c.latestCheckin || c.latestCheckin.recordedOn <= dueBefore),
      );
    default:
      return list;
  }
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
  /** Members whose package in use has few visits left: the same people as the "Few visits left" filter. */
  lowPackages: number;
  checkinsThisMonth: number;
  newMembersThisMonth: number;
  followUpsDue: MemberListRow[];
  lowPackageList: (MemberPackage & { member: Member })[];
  recentCheckins: (MemberCheckin & { member: Member; recordedByUser: { name: string } | null })[];
};

export async function getDashboardData(today: string): Promise<DashboardData> {
  const monthStart = `${today.slice(0, 7)}-01`;
  // Only the package a member is taking visits from counts, as in `listMembers`,
  // so this list and the "Few visits left" filter it links to show the same people.
  const runningLow = and(inUseOn(today), lte(visitsLeftSql, LOW_VISITS_THRESHOLD));

  const [[members], [active], [low], [checkins], [newMembers], followUps, lowPackageList, recentCheckins] =
    await Promise.all([
      db.select({ value: count() }).from(member),
      db.select({ value: count() }).from(memberPackage).where(usableOn(today)),
      db.select({ value: count() }).from(memberPackage).where(runningLow),
      db.select({ value: count() }).from(memberCheckin).where(gte(memberCheckin.recordedOn, monthStart)),
      db.select({ value: count() }).from(member).where(gte(member.joinedOn, monthStart)),
      listMembers({ filter: "due", today }),
      db
        .select({ pkg: memberPackage, member })
        .from(memberPackage)
        .innerJoin(member, eq(member.id, memberPackage.memberId))
        .where(runningLow)
        .orderBy(asc(visitsLeftSql), asc(memberPackage.startDate))
        .limit(8),
      db.query.memberCheckin.findMany({
        with: { member: true, recordedByUser: { columns: { name: true } } },
        orderBy: [desc(memberCheckin.recordedOn), desc(memberCheckin.createdAt)],
        limit: 8,
      }),
    ]);

  return {
    totalMembers: members?.value ?? 0,
    activePackages: active?.value ?? 0,
    lowPackages: low?.value ?? 0,
    checkinsThisMonth: checkins?.value ?? 0,
    newMembersThisMonth: newMembers?.value ?? 0,
    followUpsDue: followUps.slice(0, 8),
    lowPackageList: lowPackageList.map((row) => ({ ...row.pkg, member: row.member })),
    recentCheckins,
  };
}

export async function memberExists(id: string): Promise<boolean> {
  const [row] = await db.select({ id: member.id }).from(member).where(eq(member.id, id)).limit(1);
  return Boolean(row);
}

// Re-exported so pages can resolve staff names without importing the schema.
export { user, inArray };
