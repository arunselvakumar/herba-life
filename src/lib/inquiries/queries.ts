import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { inquiry, inquiryActivity, member, user } from "@/db/schema";
import type { Inquiry, InquiryActivity, Member } from "@/db/schema";
import { OPEN_STATUSES } from "./constants";

type Named = { name: string };
type MemberRef = Pick<Member, "id" | "serialNo" | "firstName" | "lastName">;
const memberRefColumns = { id: true, serialNo: true, firstName: true, lastName: true } as const;

export type InquiryListRow = Inquiry & {
  interestedPlan: Named | null;
  assignedUser: Named | null;
};

export type InquiryFilter = "open" | "due" | "new" | "converted" | "lost" | "all";

export type ListInquiriesParams = {
  q?: string | undefined;
  filter?: InquiryFilter | undefined;
  today: string;
};

const openStatuses = [...OPEN_STATUSES];

/** Open inquiries whose follow-up is due: dated today or earlier, or brand new with no date yet. */
function dueCondition(today: string) {
  return and(
    inArray(inquiry.status, openStatuses),
    or(lte(inquiry.nextFollowUpOn, today), and(eq(inquiry.status, "new"), isNull(inquiry.nextFollowUpOn))),
  );
}

function filterCondition(filter: InquiryFilter, today: string) {
  switch (filter) {
    case "open":
      return inArray(inquiry.status, openStatuses);
    case "due":
      return dueCondition(today);
    case "new":
      return eq(inquiry.status, "new");
    case "converted":
      return eq(inquiry.status, "converted");
    case "lost":
      return eq(inquiry.status, "lost");
    default:
      return undefined;
  }
}

export async function listInquiries({ q, filter = "open", today }: ListInquiriesParams): Promise<InquiryListRow[]> {
  const term = q?.trim();
  const search = term
    ? or(
        ilike(sql`${inquiry.firstName} || ' ' || ${inquiry.lastName}`, `%${term}%`),
        ilike(inquiry.mobile, `%${term}%`),
        ilike(inquiry.email, `%${term}%`),
        /^\d+$/.test(term) ? eq(inquiry.serialNo, Number(term)) : undefined,
      )
    : undefined;

  const isOpenList = filter === "open" || filter === "due" || filter === "new";
  return db.query.inquiry.findMany({
    where: and(search, filterCondition(filter, today)),
    with: {
      interestedPlan: { columns: { name: true } },
      assignedUser: { columns: { name: true } },
    },
    // Working lists put the most urgent follow-up first; history lists are newest first.
    orderBy: isOpenList
      ? [sql`${inquiry.nextFollowUpOn} asc nulls last`, desc(inquiry.inquiredOn), desc(inquiry.serialNo)]
      : [desc(inquiry.inquiredOn), desc(inquiry.serialNo)],
  });
}

export type InquiryDetail = Inquiry & {
  activities: (InquiryActivity & { recordedByUser: Named | null })[];
  interestedPlan: { id: string; name: string; durationDays: number; price: number | null; isActive: boolean } | null;
  assignedUser: Named | null;
  createdByUser: Named | null;
  referredByMember: MemberRef | null;
  convertedMember: MemberRef | null;
};

export async function getInquiry(id: string): Promise<InquiryDetail | null> {
  const row = await db.query.inquiry.findFirst({
    where: eq(inquiry.id, id),
    with: {
      activities: {
        orderBy: [desc(inquiryActivity.occurredOn), desc(inquiryActivity.createdAt)],
        with: { recordedByUser: { columns: { name: true } } },
      },
      interestedPlan: { columns: { id: true, name: true, durationDays: true, price: true, isActive: true } },
      assignedUser: { columns: { name: true } },
      createdByUser: { columns: { name: true } },
      referredByMember: { columns: memberRefColumns },
      convertedMember: { columns: memberRefColumns },
    },
  });
  return row ?? null;
}

/** Members whose mobile matches, so staff can spot a returning member before converting. */
export async function findMembersByMobile(mobile: string | null): Promise<MemberRef[]> {
  const digits = mobile?.replace(/\D/g, "") ?? "";
  if (digits.length < 6) return [];
  return db.query.member.findMany({
    where: eq(sql`regexp_replace(coalesce(${member.mobile}, ''), '\\D', '', 'g')`, digits),
    columns: memberRefColumns,
    limit: 5,
  });
}

/** The inquiry a member was converted from, if any. */
export async function getSourceInquiry(memberId: string): Promise<Pick<Inquiry, "id" | "serialNo" | "inquiredOn" | "source"> | null> {
  const row = await db.query.inquiry.findFirst({
    where: eq(inquiry.convertedMemberId, memberId),
    columns: { id: true, serialNo: true, inquiredOn: true, source: true },
  });
  return row ?? null;
}

export type StaffOption = { id: string; name: string };

export async function listStaff(): Promise<StaffOption[]> {
  return db.query.user.findMany({ columns: { id: true, name: true }, orderBy: [asc(user.name)] });
}

export type MemberOption = MemberRef;

/** Every member, for the "referred by" picker. A branch has tens to hundreds, not thousands. */
export async function listMemberOptions(): Promise<MemberOption[]> {
  return db.query.member.findMany({ columns: memberRefColumns, orderBy: [asc(member.firstName), asc(member.lastName)] });
}

export type InquiryDashboard = {
  open: number;
  due: number;
  newThisMonth: number;
  convertedThisMonth: number;
  dueList: InquiryListRow[];
  recent: InquiryListRow[];
};

export async function getInquiryDashboard(today: string): Promise<InquiryDashboard> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const [[open], [due], [created], [converted], dueList, recent] = await Promise.all([
    db.select({ value: count() }).from(inquiry).where(inArray(inquiry.status, openStatuses)),
    db.select({ value: count() }).from(inquiry).where(dueCondition(today)),
    db.select({ value: count() }).from(inquiry).where(gte(inquiry.inquiredOn, monthStart)),
    db
      .select({ value: count() })
      .from(inquiry)
      .where(and(eq(inquiry.status, "converted"), gte(inquiry.closedAt, new Date(`${monthStart}T00:00:00`)))),
    listInquiries({ filter: "due", today }),
    db.query.inquiry.findMany({
      where: inArray(inquiry.status, openStatuses),
      with: { interestedPlan: { columns: { name: true } }, assignedUser: { columns: { name: true } } },
      orderBy: [desc(inquiry.inquiredOn), desc(inquiry.serialNo)],
      limit: 8,
    }),
  ]);
  return {
    open: open?.value ?? 0,
    due: due?.value ?? 0,
    newThisMonth: created?.value ?? 0,
    convertedThisMonth: converted?.value ?? 0,
    dueList: dueList.slice(0, 8),
    recent,
  };
}
